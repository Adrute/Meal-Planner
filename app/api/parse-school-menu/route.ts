import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File
    if (!file) return NextResponse.json({ error: 'No se recibió PDF' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { apiVersion: 'v1' })

    const result = await model.generateContent([
      { inlineData: { mimeType: 'application/pdf', data: base64 } },
      `Analiza este menú de comedor escolar español. Extrae los platos de cada día laborable (lunes a viernes).
Para cada día, identifica la fecha exacta en formato YYYY-MM-DD (usando el año y mes que aparecen en el PDF), el primer plato, segundo plato y postre.
Ignora días festivos, vacaciones y días sin datos.
Responde ÚNICAMENTE con JSON válido sin markdown ni texto extra:
{"menu":[{"date":"YYYY-MM-DD","first_course":"...","second_course":"...","dessert":"..."}]}`,
    ])

    const text = result.response.text()
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No se pudo procesar el PDF' }, { status: 500 })

    return NextResponse.json(JSON.parse(jsonMatch[0]))
  } catch (e) {
    console.error('[parse-school-menu]', e)
    return NextResponse.json({ error: 'Error al procesar el PDF' }, { status: 500 })
  }
}
