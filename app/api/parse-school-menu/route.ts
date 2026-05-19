import { extractText, getDocumentProxy } from 'unpdf'
import { NextRequest, NextResponse } from 'next/server'

type MenuItem = { date: string; first_course: string; second_course: string; dessert: string }

const MONTH_MAP: Record<string, number> = {
  ENE:1, FEB:2, MAR:3, ABR:4, MAY:5, JUN:6,
  JUL:7, AGO:8, SEP:9, OCT:10, NOV:11, DIC:12,
  ENERO:1, FEBRERO:2, MARZO:3, ABRIL:4, MAYO:5, JUNIO:6,
  JULIO:7, AGOSTO:8, SEPTIEMBRE:9, OCTUBRE:10, NOVIEMBRE:11, DICIEMBRE:12,
}

function parseCoomedoresBlanco(raw: string): MenuItem[] {
  // 1. Detect year and month
  let year  = new Date().getFullYear()
  let month = new Date().getMonth() + 1

  // Tomar el año MÁS ALTO encontrado (evita capturar "2025" del pie "RD 315/2025" antes de ver "2026")
  const allYears = [...raw.matchAll(/\b(202\d)\b/g)].map(m => parseInt(m[1]))
  if (allYears.length > 0) year = Math.max(...allYears)

  for (const [abbr, n] of Object.entries(MONTH_MAP)) {
    if (new RegExp(`\\b${abbr}\\b`, 'i').test(raw)) { month = n; break }
  }

  // 2. Find start of calendar data (right after the column-header row "JUEVES VIERNES")
  //    This strips the allergen numbers (1 2 3 4 5 6 … 14) and other header noise.
  const calMarker = 'JUEVES VIERNES'
  const calStart  = raw.indexOf(calMarker)
  if (calStart === -1) return []
  const calText = raw.slice(calStart + calMarker.length)

  // 3. Collect all 1-2 digit numbers (1-31) with their positions in calText.
  //    Guardamos también la longitud del match para manejar "08" (2 chars) vs "8" (1 char).
  const numPos: Array<{ idx: number; val: number; len: number }> = []
  for (const m of calText.matchAll(/\b(\d{1,2})\b/g)) {
    const val = parseInt(m[1])
    if (val >= 1 && val <= 31) numPos.push({ idx: m.index!, val, len: m[0].length })
  }

  // 4. Find week headers: 5 consecutive numbers in ascending order,
  //    spanning ≤ 7 days and ≤ 300 characters apart.
  const weekHeaders: Array<{ endIdx: number; days: number[] }> = []
  let ni = 0
  while (ni <= numPos.length - 5) {
    const group = numPos.slice(ni, ni + 5)
    const vals  = group.map(g => g.val)

    let ok = true
    for (let j = 1; j < 5; j++) if (vals[j] <= vals[j - 1]) { ok = false; break }

    if (ok && vals[4] - vals[0] <= 6 && group[4].idx - group[0].idx <= 300) {
      weekHeaders.push({ endIdx: group[4].idx + group[4].len, days: vals })
      ni += 5
    } else {
      ni++
    }
  }

  if (weekHeaders.length === 0) return []

  const results: MenuItem[] = []

  // 5. For each week, extract the text between this header and the next,
  //    strip leading label-noise, then split into meal groups by dessert markers.
  for (let wi = 0; wi < weekHeaders.length; wi++) {
    const { endIdx, days } = weekHeaders[wi]
    const nextStart = wi + 1 < weekHeaders.length ? weekHeaders[wi + 1].endIdx - String(weekHeaders[wi + 1].days[0]).length - 50 : calText.length
    // ↑ rough boundary: start of next header (back-estimated a bit to avoid eating into it)
    const nextHeaderStart = wi + 1 < weekHeaders.length
      ? numPos.find(p => p.idx >= weekHeaders[wi + 1].endIdx - 40 && p.val === weekHeaders[wi + 1].days[0])?.idx ?? calText.length
      : calText.length

    let weekText = calText.slice(endIdx, nextHeaderStart)

    // Strip leading noise between the last day-number and the first food item.
    // Incluye dígitos sueltos (p.ej. el "8" de "08" que puede quedar), etiquetas de menú, nombre del colegio.
    weekText = weekText
      .replace(/^\s*\d{1,2}\s*/, '')  // dígito(s) sueltos al inicio
      .replace(
        /^\s*(?:(?:MENÚ\s+(?:GASTRONÓMICO|SOSTENIBLE|SIN\s+PROTEÍNA\s+ANIMAL)|DÍA\s+DEL\s+CELÍACO|ANDALUCIA|E\.I\.\s+EL\s+COLUMPIO)\s*)*/gi,
        ''
      )

    // 6. Build list of markers (dessert lines and FESTIVO) with positions
    type Marker = { pos: number; end: number; holiday: boolean; dessert: string }
    const markers: Marker[] = []

    for (const m of weekText.matchAll(/\b(YOGUR|FRUTA\s+y\s+LECHE)\s*\(\s*\d+\s*\)/gi)) {
      const dessert = /YOGUR/i.test(m[1]) ? 'YOGUR' : 'FRUTA y LECHE'
      markers.push({ pos: m.index!, end: m.index! + m[0].length, holiday: false, dessert })
    }
    for (const m of weekText.matchAll(/\bFESTIVO\b/gi)) {
      markers.push({ pos: m.index!, end: m.index! + m[0].length, holiday: true, dessert: '' })
    }
    markers.sort((a, b) => a.pos - b.pos)

    // 7. Assign each meal group to its day in order
    let prevEnd = 0
    let dayIdx  = 0

    for (const marker of markers) {
      if (dayIdx >= days.length) break

      if (marker.holiday) {
        dayIdx++
        prevEnd = marker.end
        continue
      }

      const content = weekText.slice(prevEnd, marker.pos).trim()
      prevEnd = marker.end

      if (!content || content.length < 2) { dayIdx++; continue }

      // Split first_course / second_course: each dish ends with an allergen code (N)
      const parts = content
        .split(/\s*\(\s*[\d,\s]+\s*\)/)
        .map(p => p.replace(/\d+\s*Kcal[\d\s,gHCProtLip.,]+/gi, '').trim())
        .filter(p => p.length > 1)

      const date = `${year}-${String(month).padStart(2, '0')}-${String(days[dayIdx]).padStart(2, '0')}`
      results.push({
        date,
        first_course:  parts[0] ?? content,
        second_course: parts[1] ?? '',
        dessert:       marker.dessert,
      })
      dayIdx++
    }
  }

  return results
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File
    if (!file) return NextResponse.json({ error: 'No se recibió PDF' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const pdf   = await getDocumentProxy(new Uint8Array(bytes))
    const { text } = await extractText(pdf, { mergePages: true })

    const menu = parseCoomedoresBlanco(text)

    if (menu.length === 0) {
      return NextResponse.json(
        { error: 'No se detectaron semanas en el PDF. Comprueba que es el menú mensual de Comedores Blanco.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ menu })
  } catch (e) {
    console.error('[parse-school-menu]', e)
    return NextResponse.json({ error: 'Error al procesar el PDF' }, { status: 500 })
  }
}
