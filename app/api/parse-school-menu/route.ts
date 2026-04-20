import Groq from 'groq-sdk'
import { extractText, getDocumentProxy } from 'unpdf'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File
    if (!file) return NextResponse.json({ error: 'No se recibió PDF' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const pdf = await getDocumentProxy(new Uint8Array(bytes))
    const { text } = await extractText(pdf, { mergePages: true })

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        {
          role: 'system',
          content: 'Eres un extractor de datos de menús escolares españoles. Respondes siempre con JSON válido.',
        },
        {
          role: 'user',
          content: `El siguiente texto ha sido extraído de un PDF de menú mensual de comedor escolar español. El texto puede estar desordenado porque proviene de un layout de tabla/calendario.

TEXTO DEL PDF:
${text}

Tu tarea: extraer los platos de TODOS los días laborables del mes completo (normalmente 18-23 días repartidos en 4 semanas). NO te detengas tras la primera semana.

Pasos:
1. Identifica el año y mes en el encabezado (ej: "2026 ABR" = abril 2026, "2026 MAY" = mayo 2026)
2. Busca TODOS los números de día que aparezcan (6, 7, 8, 9, 10, 13, 14... hasta el final del mes)
3. Para cada número de día asocia los platos que aparezcan a su lado o cerca
4. Ignora días festivos o vacaciones (cuando el texto lo indique explícitamente)

Para cada día laborable del mes, extrae:
- La fecha en formato YYYY-MM-DD
- El primer plato (first_course)
- El segundo plato (second_course)
- El postre (dessert)

Responde ÚNICAMENTE con JSON válido, sin texto extra:
{"menu":[{"date":"YYYY-MM-DD","first_course":"...","second_course":"...","dessert":"..."}]}`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) return NextResponse.json({ error: 'Respuesta vacía de la IA' }, { status: 500 })

    return NextResponse.json(JSON.parse(content))
  } catch (e) {
    console.error('[parse-school-menu]', e)
    return NextResponse.json({ error: 'Error al procesar el PDF' }, { status: 500 })
  }
}
