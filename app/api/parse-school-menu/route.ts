import { extractText, getDocumentProxy } from 'unpdf'
import { NextRequest, NextResponse } from 'next/server'

// ── Types ────────────────────────────────────────────────────────────────────

type MenuItem = { date: string; first_course: string; second_course: string; dessert: string }

// ── Text helpers ─────────────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  ENE:1, FEB:2, MAR:3, ABR:4, MAY:5, JUN:6,
  JUL:7, AGO:8, SEP:9, OCT:10, NOV:11, DIC:12,
  ENERO:1, FEBRERO:2, MARZO:3, ABRIL:4, MAYO:5, JUNIO:6,
  JULIO:7, AGOSTO:8, SEPTIEMBRE:9, OCTUBRE:10, NOVIEMBRE:11, DICIEMBRE:12,
}

// Lines to discard completely
const NOISE_RX = [
  /^E\.I\./i,
  /^ANDALUC/i,
  /LUNES.*MARTES/i,
  /\d+\s*Kcal/i,
  /^Para consultas/i,
  /^Este men/i,
  /^Todos los men/i,
  /^Se ofrecer/i,
  /^Gluten/i,
  /^Calle /i,
  /^DECLARACI/i,
  /^Telf\./i,
  /^www\./i,
  /^nutrici/i,
  /^Fruta[sy].*verdura/i,
  /^Prote[ií]na/i,
  /^Cereales/i,
  /^Grasas/i,
  /^Productos l/i,
  /comedor.*blanco/i,
  /Alimentando/i,
  /creando futuros/i,
  /planificar/i,
  /^COMEDOR$/i,
  /^CASA$/i,
  /^PRIMEROS PLATOS$/i,
  /^SEGUNDOS PLATOS$/i,
  /^POSTRES$/i,
  /^COCINA/i,
  /^TRADICIONAL/i,
  /^SIN$/i,
  /^PRECOCINADOS/i,
]

const isNoise = (l: string) => NOISE_RX.some(rx => rx.test(l))
const isDesert = (l: string) => /^(FRUTA y LECHE|YOGUR)/i.test(l)
const isHoliday = (l: string) => /^FESTIVO$/i.test(l)
const isCalories = (l: string) => /\d+\s*Kcal/i.test(l)

function cleanAllergens(s: string) {
  return s.replace(/\s*[\(\[]\s*\d+[\d\s,]*[\)\]]/g, '').replace(/\s+/g, ' ').trim()
}

// ── Week-header detection ─────────────────────────────────────────────────────
// A week header is a line that contains exactly 5 day-numbers (1-31) in ascending order
// possibly interleaved with label words like "DÍA DEL CELÍACO".
function extractWeekDays(line: string): number[] | null {
  const nums = [...line.matchAll(/\b(\d{1,2})\b/g)]
    .map(m => parseInt(m[1]))
    .filter(n => n >= 1 && n <= 31)
  if (nums.length !== 5) return null
  // Must be strictly ascending and span ≤ 7 days
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] <= nums[i - 1]) return null
  }
  if (nums[4] - nums[0] > 6) return null
  return nums
}

// ── Main parser ───────────────────────────────────────────────────────────────

function parseCoomedoresBlanco(raw: string): MenuItem[] {
  // 1. Normalise lines: join continuation lines (allergen codes on their own line, etc.)
  const rawLines = raw.split('\n').map(l => l.trim())
  const lines: string[] = []
  for (const l of rawLines) {
    if (!l) continue
    // A line that starts with "(" or is purely an allergen code like "(12)" glues to previous
    if (lines.length > 0 && /^\([\d\s,]+\)$/.test(l)) {
      // skip lone allergen-code lines
      continue
    }
    if (lines.length > 0 && l.startsWith('(') && l.length < 20) {
      lines[lines.length - 1] += ' ' + l
    } else {
      lines.push(l)
    }
  }

  // 2. Detect year and month
  let year = new Date().getFullYear()
  let month = new Date().getMonth() + 1

  for (const l of lines) {
    const yMatch = l.match(/\b(202\d)\b/)
    if (yMatch) year = parseInt(yMatch[1])
    for (const [abbr, n] of Object.entries(MONTHS)) {
      if (new RegExp(`\\b${abbr}\\b`, 'i').test(l)) { month = n; break }
    }
  }

  const results: MenuItem[] = []

  // 3. Walk lines looking for week headers
  let i = 0
  while (i < lines.length) {
    const weekDays = extractWeekDays(lines[i])
    if (!weekDays) { i++; continue }

    i++ // move past header

    // Skip noise lines immediately after header
    while (i < lines.length && isNoise(lines[i])) i++

    // 4. Collect content lines until next week header or end
    const content: string[] = []
    while (i < lines.length) {
      if (extractWeekDays(lines[i])) break   // next week
      if (isCalories(lines[i])) { i++; continue } // skip calorie rows
      if (!isNoise(lines[i])) content.push(lines[i])
      i++
    }

    // 5. Split content into meal groups.
    // Each group ends with a desert line ("FRUTA y LECHE" / "YOGUR") OR "FESTIVO".
    type Group = { lines: string[]; dessert: string } | 'FESTIVO'
    const groups: Group[] = []
    let buf: string[] = []

    for (const l of content) {
      if (isHoliday(l)) {
        if (buf.length > 0) {
          // shouldn't happen, but flush
          groups.push({ lines: buf, dessert: '' })
          buf = []
        }
        groups.push('FESTIVO')
      } else if (isDesert(l)) {
        groups.push({ lines: buf, dessert: cleanAllergens(l) })
        buf = []
      } else {
        buf.push(l)
      }
    }
    // Flush any remaining buffer without a dessert (edge case)
    if (buf.length > 0) groups.push({ lines: buf, dessert: '' })

    // 6. Zip groups → days
    let dayIdx = 0
    for (const group of groups) {
      if (dayIdx >= weekDays.length) break
      const dayNum = weekDays[dayIdx]
      dayIdx++

      if (group === 'FESTIVO') continue

      const foodLines = group.lines
        .filter(l => !isNoise(l))
        .map(cleanAllergens)
        .filter(l => l.length > 2)

      if (foodLines.length === 0) continue

      const date = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      results.push({
        date,
        first_course:  foodLines[0] ?? '',
        second_course: foodLines[1] ?? '',
        dessert:       group.dessert,
      })
    }
  }

  return results
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('pdf') as File
    if (!file) return NextResponse.json({ error: 'No se recibió PDF' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const pdf = await getDocumentProxy(new Uint8Array(bytes))
    const { text } = await extractText(pdf, { mergePages: true })

    const menu = parseCoomedoresBlanco(text)

    if (menu.length === 0) {
      return NextResponse.json(
        { error: 'No se detectaron días en el PDF. Comprueba que es el menú mensual del comedor.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ menu })
  } catch (e) {
    console.error('[parse-school-menu]', e)
    return NextResponse.json({ error: 'Error al procesar el PDF' }, { status: 500 })
  }
}
