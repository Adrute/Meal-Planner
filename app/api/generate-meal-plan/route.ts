import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'

type Member = {
  name: string
  role: 'adult' | 'child'
  restrictions: Array<{ food: string; type: string }>
}

type SchoolItem = {
  date: string
  first_course: string | null
  second_course: string | null
  dessert: string | null
}

type Recipe = { id: string; name: string }

// Maps a school meal description to the protein/food groups it contains
function buildDayContext(date: string, item: SchoolItem | undefined): string {
  if (!item) return `- ${date}: sin menú escolar registrado → propón cena equilibrada`
  const courses = [item.first_course, item.second_course].filter(Boolean).join(' + ')
  return `- ${date}: ${courses} (postre: ${item.dessert ?? '-'})`
}

function buildMembersText(members: Member[]): string {
  if (members.length === 0) {
    return '- 2 adultos y 1 niña de 18 meses (sin restricciones configuradas)'
  }
  return members.map(m => {
    const role = m.role === 'child' ? 'niño/a' : 'adulto'
    if (m.restrictions.length === 0) return `- ${m.name} (${role}): sin restricciones`

    const alergias = m.restrictions.filter(r => r.type === 'alergia').map(r => r.food)
    const intolerancias = m.restrictions.filter(r => r.type === 'intolerancia').map(r => r.food)
    const preferencias = m.restrictions.filter(r => r.type === 'preferencia').map(r => r.food)

    const parts: string[] = []
    if (alergias.length) parts.push(`ALERGIA (nunca usar): ${alergias.join(', ')}`)
    if (intolerancias.length) parts.push(`INTOLERANCIA (evitar siempre): ${intolerancias.join(', ')}`)
    if (preferencias.length) parts.push(`no le gusta: ${preferencias.join(', ')}`)
    return `- ${m.name} (${role}): ${parts.join(' | ')}`
  }).join('\n')
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 })
  }

  try {
    const { weekDates, schoolMenu, recipes, members } = await req.json() as {
      weekDates: string[]
      schoolMenu: SchoolItem[]
      recipes: Recipe[]
      members: Member[]
    }

    const membersText = buildMembersText(members)

    const schoolMenuText = weekDates
      .map(date => {
        const item = schoolMenu.find(s => s.date.slice(0, 10) === date)
        return buildDayContext(date, item)
      })
      .join('\n')

    const recipesText = recipes.length > 0
      ? recipes.map(r => `  - id:${r.id} | ${r.name}`).join('\n')
      : '  (ninguna registrada aún)'

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: 'Eres nutricionista experto en alimentación familiar española. Tu prioridad absoluta es respetar alergias e intolerancias. Respondes siempre con JSON válido.',
        },
        {
          role: 'user',
          content: `MIEMBROS DE LA FAMILIA:
${membersText}

MENÚ DEL COMEDOR ESCOLAR esta semana (lo que comen los niños al mediodía):
${schoolMenuText}

MIS RECETAS GUARDADAS (úsalas cuando encajen):
${recipesText}

TAREA: Propón la CENA para cada día listado arriba.

REGLAS — síguelas en este orden de prioridad:

1. RESTRICCIONES (prioridad máxima, sin excepciones)
   - ALERGIA: ese alimento NUNCA puede aparecer en la cena, ni como ingrediente secundario
   - INTOLERANCIA: ese alimento no debe aparecer en ningún caso
   - Preferencia: intenta evitarlo salvo que no haya alternativa razonable

2. COMPLEMENTAR EL MENÚ DEL COLE (por día)
   Analiza qué grupos de alimentos comió cada niño en el colegio y evita repetirlos en la cena:
   - Huevos/tortilla/revuelto → NO más huevos en cena (tortilla = huevos)
   - Carne (pollo, ternera, cerdo, pavo…) → prefiere pescado, legumbres o huevo en cena
   - Pescado → prefiere carne o huevo en cena
   - Legumbres (lentejas, garbanzos, alubias…) → NO legumbres en cena
   - Pasta/arroz/patata → evita repetir ese mismo carbohidrato en cena
   - Si no hay menú escolar ese día → propón cena equilibrada libremente

3. APTO PARA BEBÉ (si hay niño/a en la familia)
   - Sin picante, sin sal añadida en exceso
   - Sin mariscos enteros, sin frutos secos enteros, sin miel
   - Texturas blandas o fácilmente aplastables

4. VARIEDAD a lo largo de la semana
   - No repitas la misma proteína principal dos días seguidos
   - Alterna entre carnes, pescados, huevos y legumbres

5. RECETAS GUARDADAS
   - Usa una receta guardada si encaja con las reglas anteriores
   - Si no encaja ninguna, propón un plato nuevo sencillo

Responde con este JSON exacto, un objeto por cada fecha:
{"plan":[{"date":"YYYY-MM-DD","recipe_name":"Nombre del plato","recipe_id":"id-si-es-receta-guardada-o-null","is_new_recipe":false,"notes":"en 1 frase: qué comió en el cole y por qué esta cena complementa"}]}`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return NextResponse.json({ error: 'Respuesta vacía de la IA' }, { status: 500 })

    return NextResponse.json(JSON.parse(content))
  } catch (e) {
    console.error('[generate-meal-plan]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
