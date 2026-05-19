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
          content: `El siguiente texto ha sido extraído de un PDF de menú mensual de comedor escolar español. El texto proviene de un calendario en tabla (5 columnas = Lunes a Viernes) y puede estar desordenado.

TEXTO DEL PDF:
${text}

REGLAS CRÍTICAS para identificar los días correctamente:

1. ENCABEZADOS DE SEMANA: cada fila del calendario empieza con una línea que contiene los 5 números de día de esa semana, por ejemplo:
   "18 DÍA DEL CELÍACO 19 MENÚ SIN PROTEÍNA ANIMAL 20 21 22 MENÚ SOSTENIBLE"
   - Los NÚMEROS (18, 19, 20, 21, 22) son las fechas del Lunes al Viernes
   - Las etiquetas como "DÍA DEL CELÍACO", "MENÚ GASTRONÓMICO", "MENÚ SIN PROTEÍNA ANIMAL", "MENÚ SOSTENIBLE" son TEMAS especiales del día. NO son platos ni contenido de menú.

2. ASIGNACIÓN DE PLATOS: después del encabezado de semana, los bloques de platos aparecen en el mismo orden que los días (de izquierda a derecha). El primer bloque de platos corresponde al primer día de la semana (Lunes), el segundo al Martes, etc.

3. FESTIVOS: si un día aparece marcado explícitamente como "FESTIVO" o no tiene platos asociados, omítelo.

4. POSTRE: suele ser "FRUTA y LECHE", "YOGUR", o similar. Extráelo como dessert.

Tu tarea: extraer TODOS los días laborables del mes completo.

Para cada día extrae:
- La fecha en formato YYYY-MM-DD (usando el año y mes del encabezado del PDF)
- El primer plato (first_course) — limpia los códigos de alérgenos como (1, 3, 6)
- El segundo plato (second_course) — limpia los códigos de alérgenos
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
