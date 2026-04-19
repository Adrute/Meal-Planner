import Groq from 'groq-sdk'
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
    const buffer = Buffer.from(bytes)

    // Extract text from PDF server-side (no API call needed)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdf = require('pdf-parse')
    const pdfData = await pdf(buffer)

    // Send extracted text to Groq
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
          content: `Analiza este texto de un menú de comedor escolar español y extrae los platos de cada día laborable (lunes a viernes).

TEXTO DEL PDF:
${pdfData.text}

Para cada día laborable, extrae:
- La fecha exacta en formato YYYY-MM-DD (usa el año y mes que aparecen en el documento)
- El primer plato (first_course)
- El segundo plato (second_course)
- El postre (dessert)

Ignora días festivos, vacaciones y días sin datos.

Responde con este JSON exacto:
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
