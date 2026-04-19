import { GoogleGenerativeAI } from '@google/generative-ai'
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
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })
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

    const prompt = `Eres nutricionista experto en alimentación familiar española.

FAMILIA:
${membersText}

COMEDOR ESCOLAR esta semana (lo que come la niña en el cole):
${schoolMenuText}

MIS RECETAS GUARDADAS:
${recipesText}

TAREA: Propón la CENA para los días: ${weekDates.join(', ')}

CRITERIOS:
1. Complementa el cole: si comió legumbres de primero → evita legumbres en cena; si comió carne → prefiere pescado o huevo; si comió pasta → evita pasta
2. Respeta TODAS las restricciones de todos los miembros
3. Apta para bebé de 18 meses: sin picante, sin mariscos enteros, sin frutos secos enteros
4. Variada: no repitas proteína principal dos días seguidos
5. Usa mis recetas guardadas cuando encajen; si no, propón un plato nuevo con nombre en español

Responde ÚNICAMENTE con JSON válido sin texto extra ni markdown:
{"plan":[{"date":"YYYY-MM-DD","recipe_name":"Nombre del plato","recipe_id":"el-id-si-es-receta-guardada-o-null","is_new_recipe":false,"notes":"por qué complementa bien (muy breve)"}]}`

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)

    const text = result.response.text()
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No se pudo parsear respuesta IA' }, { status: 500 })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e) {
    console.error('[generate-meal-plan]', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
