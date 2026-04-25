'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── PARSERS ──────────────────────────────────────────────────────────────────

function parseDate(dateStr: string): string | null {
  const [day, month, year] = dateStr.split('/')
  if (!day || !month || !year) return null
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function parseConcepto(raw: string): string {
  const concepto = raw
    .replace(/^COMPRA TARJ\. \S+ /i, '')
    .replace(/^ADEUDO RECIBO /i, '')
    .replace(/^ABONO TRANSFERENCIA DE /i, 'Transferencia de ')
    .replace(/^TRANSFERENCIA A /i, 'Transferencia a ')
    .replace(/^TRANSFERENCIA /i, 'Transferencia ')
    .replace(/^PAGO BIZUM /i, 'Bizum ')
    .replace(/^PRESTAMOS ADEUDO CUOTA \S+ \S+/i, 'Préstamo hipotecario')
    .replace(/^IMPUESTOS /i, 'Impuestos ')
    .replace(/^TRIBUTOS .*$/i, 'Tributos')
    .replace(/^TRASPASO .*$/i, 'Traspaso')
    .replace(/^ANUL COMPRA TARJ\. \S+ \S+ /i, 'Anulación ')
    .replace(/^SEGUROS /i, 'Seguros ')
    .replace(/^ESTUDIOS REGLADOS /i, '')
    .trim()
  return concepto.length > 70 ? concepto.substring(0, 70) : concepto
}

function autoCategory(conceptoOriginal: string, importe: number): string {
  if (importe > 0) return 'Ingresos'
  const u = conceptoOriginal.toUpperCase()
  if (/MERCADONA|LIDL|ALDI|CARREF|ALCAMPO|AHORRAMAS|PRIMAPRIX|FOODX/.test(u)) return 'Alimentación'
  if (/RESTAURANTE|JUST EAT|UBER EAT|GLOVO|BURGER|MCDONALDS|RODILLA|VIVE VIDA|APERITIVO|QUN YIN|QUN YING/.test(u)) return 'Alimentación'
  if (/^COMPRA TARJ.*E\.S /.test(u) || /GASOLINERA|REPSOL|CEPSA|\bBP\b|SHELL/.test(u)) return 'Transporte'
  if (/APARCAMIENTO|PARKING|METRO|RENFE|\bTAXI\b|\bUBER\b/.test(u)) return 'Transporte'
  if (/FCIA|FARMACIA/.test(u)) return 'Salud'
  if (/NETFLIX|DISNEY|YOUTUBE|SPOTIFY|WELLHUB|DIGI SPAIN|PAYPAL \*NETFLIX|PAYPAL \*SPOTIFY|GOOGLE YOUTUBE/.test(u)) return 'Suscripciones'
  if (/STARBUCKS|FNAC|CINE|TEATRO|KIWOKO|JUGUET|PIRATAS|TOBOGAN|MOVISTAR ARENA|HOMA TIENDA|WONDERBLY|ARROYOMOLINOS H/.test(u)) return 'Ocio'
  if (/PRESTAMO|PRESTAMOS|HIPOTECA/.test(u)) return 'Deudas'
  if (/AGUA|TOTALENERGIES|VIVA AQUA|CANAL DE ISABEL|IBERDROLA|ENDESA/.test(u)) return 'Hogar'
  if (/\bC\.P\.\b|COMUNIDAD PROP|COMUNIDAD DE PROP/.test(u)) return 'Hogar'
  if (/SEGUROS|CASER|\bSEGURO\b|IMPUESTO|TRIBUTOS|AYUNTAMIENTO/.test(u)) return 'Impuestos y seguros'
  if (/\bHM\b|H&M|PRIMARK|ZARA|MANGO|BERSHKA|PULL&BEAR/.test(u)) return 'Ropa'
  if (/ESTUDIOS|ACADEMIA|COLEGIO|HADALUNA|ESCUELA/.test(u)) return 'Educación'
  if (/TRANSFERENCIA|BIZUM|TRASPASO|ABONO|REVOLUT/.test(u)) return 'Otros'
  return 'Otros'
}

// ─── IMPORTACIÓN ─────────────────────────────────────────────────────────────

export async function importTransactions(lines: string[]) {
  const supabase = await createClient()
  const transactions = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const parts = trimmed.split('|')
    if (parts.length < 5) continue

    const [dateRaw, conceptoRaw, dateValorRaw, importeRaw, saldoRaw, , tarjetaRaw] = parts
    const fecha_operacion = parseDate(dateRaw?.trim())
    const fecha_valor = parseDate(dateValorRaw?.trim())
    const importe = parseFloat(importeRaw?.trim().replace(',', '.'))
    const saldo = parseFloat(saldoRaw?.trim().replace(',', '.'))
    if (!fecha_operacion || isNaN(importe)) continue

    const concepto_original = conceptoRaw?.trim() || ''
    transactions.push({
      fecha_operacion,
      fecha_valor: fecha_valor || null,
      concepto_original,
      concepto: parseConcepto(concepto_original),
      importe,
      saldo: isNaN(saldo) ? null : saldo,
      tarjeta: tarjetaRaw?.trim() || null,
      categoria: autoCategory(concepto_original, importe),
      subcategoria: null as string | null,
    })
  }

  if (transactions.length === 0) return { error: 'No se encontraron transacciones válidas. Revisa que el archivo use | como separador y fechas en formato DD/MM/AAAA.' }

  // Aplicar reglas manuales
  const { data: rules } = await supabase.from('category_rules').select('pattern, categoria, subcategoria')
  if (rules && rules.length > 0) {
    for (const t of transactions) {
      const match = rules.find(r => t.concepto_original.toUpperCase().includes(r.pattern.toUpperCase()))
      if (match) { t.categoria = match.categoria; t.subcategoria = match.subcategoria || null }
    }
  }

  // Insertar en lote — usamos insert normal para detectar errores reales
  const { data: inserted, error: insertError } = await supabase
    .from('bank_transactions')
    .insert(transactions)
    .select('id')

  if (insertError) {
    // Si el error es de duplicado (23505) intentamos upsert ignorando duplicados
    if (insertError.code === '23505') {
      const { data: upserted, error: upsertError } = await supabase
        .from('bank_transactions')
        .upsert(transactions, { onConflict: 'fecha_operacion,importe,concepto_original', ignoreDuplicates: true })
        .select('id')
      if (upsertError) return { error: `Error al guardar: ${upsertError.message}` }
      const count = upserted?.length ?? 0
      const skipped = transactions.length - count
      revalidatePath('/finances'); revalidatePath('/')
      return { success: true, count, skipped }
    }
    return { error: `Error al guardar: ${insertError.message} (código: ${insertError.code})` }
  }

  const count = inserted?.length ?? 0

  // Verificación: contar cuántas filas existen realmente en BD para ese rango de fechas
  const dates = transactions.map(t => t.fecha_operacion).sort()
  const { count: dbCount } = await supabase
    .from('bank_transactions')
    .select('*', { count: 'exact', head: true })
    .gte('fecha_operacion', dates[0])
    .lte('fecha_operacion', dates[dates.length - 1])

  if (count > 0 && (dbCount === 0 || dbCount === null)) {
    return { error: `Se insertaron ${count} filas pero el SELECT devuelve 0. Probable problema de RLS (política de lectura en bank_transactions).` }
  }

  revalidatePath('/finances')
  revalidatePath('/')
  return { success: true, count, skipped: 0 }
}

// ─── TRANSACCIONES ────────────────────────────────────────────────────────────

export async function updateTransaction(
  id: string,
  concepto: string,
  categoria: string,
  subcategoria: string | null,
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('bank_transactions')
    .update({ concepto, categoria, subcategoria: subcategoria || null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/finances')
  revalidatePath('/finances/categoria', 'layout')
  revalidatePath('/')
  return { success: true }
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()
  await supabase.from('bank_transactions').delete().eq('id', id)
  revalidatePath('/finances')
  revalidatePath('/finances/categoria', 'layout')
  revalidatePath('/')
}

export async function deleteAllTransactions() {
  const supabase = await createClient()
  await supabase.from('bank_transactions').delete().not('id', 'is', null)
  revalidatePath('/finances')
  revalidatePath('/')
}

export async function deleteMonthTransactions(month: string) {
  const supabase = await createClient()
  const [y, m] = month.split('-').map(Number)
  const from = `${month}-01`
  const to   = new Date(y, m, 0).toISOString().split('T')[0] // último día del mes
  await supabase.from('bank_transactions').delete().gte('fecha_operacion', from).lte('fecha_operacion', to)
  revalidatePath('/finances')
  revalidatePath('/')
}

export async function toggleNeedsReview(id: string, value: boolean) {
  const supabase = await createClient()
  await supabase.from('bank_transactions').update({ needs_review: value }).eq('id', id)
  revalidatePath('/finances')
  return { success: true }
}

// ─── REGLAS ───────────────────────────────────────────────────────────────────

export async function createRule(pattern: string, categoria: string, subcategoria: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('category_rules')
    .upsert(
      { pattern: pattern.trim(), categoria, subcategoria: subcategoria || null },
      { onConflict: 'pattern' },
    )
  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}

export async function bulkUpdateCategory(ids: string[], categoria: string, subcategoria: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('bank_transactions')
    .update({ categoria, subcategoria: subcategoria || null })
    .in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/finances')
  revalidatePath('/finances/categoria', 'layout')
  revalidatePath('/')
  return { success: true }
}

export async function deleteRule(id: string) {
  const supabase = await createClient()
  await supabase.from('category_rules').delete().eq('id', id)
  revalidatePath('/finances')
}

export async function reapplyRules() {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('apply_category_rules')
  if (error) return { success: false, count: 0, error: error.message }
  revalidatePath('/finances')
  revalidatePath('/')
  return { success: true, count: data as number }
}

// ─── CATEGORÍAS ───────────────────────────────────────────────────────────────

export async function createCategory(name: string, color: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('transaction_categories')
    .insert({ name: name.trim(), color })
  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('transaction_categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}

export async function createSubcategory(categoryId: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('transaction_subcategories')
    .insert({ category_id: categoryId, name: name.trim() })
  if (error) return { error: error.message }
  revalidatePath('/finances')
  return { success: true }
}

export async function deleteSubcategory(id: string) {
  const supabase = await createClient()
  await supabase.from('transaction_subcategories').delete().eq('id', id)
  revalidatePath('/finances')
}
