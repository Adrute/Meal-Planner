'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import PDFParser from 'pdf2json'

function extractBillingPeriodMonths(cleanText: string): number {
    // TotalEnergies includes billing period as two DD/MM/YYYY dates separated by " - " or " – "
    const periodMatch = cleanText.match(
        /(\d{2})\/(\d{2})\/(\d{4})\s*[-–]\s*(\d{2})\/(\d{2})\/(\d{4})/
    )
    if (!periodMatch) return 2

    const start = new Date(
        parseInt(periodMatch[3]),
        parseInt(periodMatch[2]) - 1,
        parseInt(periodMatch[1])
    )
    const end = new Date(
        parseInt(periodMatch[6]),
        parseInt(periodMatch[5]) - 1,
        parseInt(periodMatch[4])
    )

    const diffMs = end.getTime() - start.getTime()
    if (diffMs <= 0) return 2

    const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44))
    return diffMonths > 0 ? diffMonths : 2
}

export async function processInvoice(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('pdf') as File | null

    if (!file) return { error: 'No se encontró el archivo.' }

    try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const text = await new Promise<string>((resolve, reject) => {
            const pdfParser = new PDFParser(null, true)
            pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError))
            pdfParser.on('pdfParser_dataReady', () => {
                resolve((pdfParser as any).getRawTextContent())
            })
            pdfParser.parseBuffer(buffer)
        })

        const cleanText = text.replace(/\s+/g, ' ')

        const invoiceMatch = cleanText.match(/(?:N[ºo°]\s+de\s+factura|Factura\s+(?:\w+\s+)?n[ºo°]):\s*([A-Z0-9]+)/i)
        const invoiceNumber = invoiceMatch ? invoiceMatch[1] : `DOC-${Date.now()}`

        const MONTHS: Record<string, string> = {
            enero:'01', febrero:'02', marzo:'03', abril:'04', mayo:'05', junio:'06',
            julio:'07', agosto:'08', septiembre:'09', octubre:'10', noviembre:'11', diciembre:'12',
        }
        const dateLongMatch = cleanText.match(/Fecha\s+de\s+emisi[oó]n:\s*(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i)
        const dateShortMatch = cleanText.match(/Fecha\s*(?:de\s*)?emisi[oó]n:\s*(\d{2})\.(\d{2})\.(\d{4})/i)
        let issueDate = new Date().toISOString().split('T')[0]
        if (dateLongMatch) {
            const day   = dateLongMatch[1].padStart(2, '0')
            const month = MONTHS[dateLongMatch[2].toLowerCase()] ?? '01'
            const year  = dateLongMatch[3]
            issueDate = `${year}-${month}-${day}`
        } else if (dateShortMatch) {
            issueDate = `${dateShortMatch[3]}-${dateShortMatch[2]}-${dateShortMatch[1]}`
        }

        const billingPeriodMonths = extractBillingPeriodMonths(cleanText)

        const elecMatch = cleanText.match(/Electricidad\s+([\d,]+)\s*€/i)
        const elecAmount = elecMatch ? parseFloat(elecMatch[1].replace(',', '.')) : 0

        const gasMatch = cleanText.match(/Gas\s+([\d,]+)\s*€/i)
        const gasAmount = gasMatch ? parseFloat(gasMatch[1].replace(',', '.')) : 0

        const servMatch = cleanText.match(/Servicios\s+([\d,]+)\s*€/i)
        const servAmount = servMatch ? parseFloat(servMatch[1].replace(',', '.')) : 0

        const taxesMatch = cleanText.match(/Tasas e impuestos\s+([\d,]+)\s*€/i)
        const taxesAmount = taxesMatch ? parseFloat(taxesMatch[1].replace(',', '.')) : 0

        const elecKwhMatch = cleanText.match(/(?:Electricidad|Energía).*?([\d,]+)\s*kWh/i) || cleanText.match(/([\d,]+)\s*kWh/i)
        const elecKwh = elecKwhMatch ? parseFloat(elecKwhMatch[1].replace(',', '.')) : 0

        const kwhMatches = [...cleanText.matchAll(/([\d,]+)\s*kWh/gi)]
        const gasKwh = kwhMatches.length > 1 ? parseFloat(kwhMatches[1][1].replace(',', '.')) : 0

        const totalAmount = elecAmount + gasAmount + servAmount + taxesAmount

        if (totalAmount === 0) {
            return { error: `No detecté los importes en ${file.name}` }
        }

        const { error: insertError } = await supabase
            .from('home_invoices')
            .insert([{
                invoice_number: invoiceNumber,
                issue_date: issueDate,
                total_amount: totalAmount,
                elec_amount: elecAmount,
                gas_amount: gasAmount,
                services_amount: servAmount,
                taxes_amount: taxesAmount,
                elec_kwh: elecKwh,
                gas_kwh: gasKwh,
                billing_period_months: billingPeriodMonths,
            }])

        if (insertError) {
            console.error('ERROR DE SUPABASE:', insertError)
            return { error: `Fallo en base de datos para ${file.name}` }
        }

        revalidatePath('/utilities')
        return { success: true, invoiceNumber }

    } catch (error) {
        console.error(`Error leyendo PDF ${file.name}:`, error)
        return { error: `Archivo ilegible: ${file.name}` }
    }
}
