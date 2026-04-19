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

    const membersText = members.length > 0
      ? members.map(m => {
          const role = m.role === 'child' ? 'niño/a (18 meses)' : 'adulto'
          const restr = m.restrictions.length > 0
            ? m.restrictions.map(r => `${r.food} (${r.type})`).join(', ')
            : 'sin restricciones'
          return `- ${m.name} (${role}): ${restr}`
        }).join('\n')
      : '- 2 adultos y 1 niña de 18 meses (sin restricciones configuradas)'

    const schoolMenuText = schoolMenu.length > 0
      ? schoolMenu.map(s => `- ${s.date}: ${s.first_course ?? '-'} / ${s.second_course ?? '-'} (postre: ${s.dessert ?? '-'})`).join('\n')
      : 'No hay menú escolar importado para esta semana.'

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
          content: 'Eres nutricionista experto en alimentación familiar española. Respondes siempre con JSON válido.',
        },
        {
          role: 'user',
          content: `FAMILIA:
${membersText}

COMEDOR ESCOLAR esta semana (lo que come la niña en el cole):
${schoolMenuText}

MIS RECETAS GUARDADAS:
${recipesText}

TAREA: Propón la CENA para los días: ${weekDates.join(', ')}

CRITERIOS:
1. Complementa el cole: si comió legumbres → evita legumbres en cena; si comió carne → prefiere pescado o huevo; si comió pasta → evita pasta
2. Respeta TODAS las restricciones de todos los miembros
3. Apta para bebé de 18 meses: sin picante, sin mariscos enteros, sin frutos secos enteros
4. Variada: no repitas proteína principal dos días seguidos
5. Usa mis recetas guardadas cuando encajen; si no, propón un plato nuevo

Responde con este JSON exacto:
{"plan":[{"date":"YYYY-MM-DD","recipe_name":"Nombre del plato","recipe_id":"el-id-si-es-receta-guardada-o-null","is_new_recipe":false,"notes":"por qué complementa bien (muy breve)"}]}`,
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
