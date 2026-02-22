'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import PDFParser from 'pdf2json'

export async function processMultipleInvoices(formData: FormData) {
    const supabase = await createClient()
    const files = formData.getAll('pdfs') as File[]

    if (!files || files.length === 0) return { error: 'No se encontraron archivos.' }

    let processedCount = 0;
    let errorMessages = [];

    for (const file of files) {
        try {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            const text = await new Promise<string>((resolve, reject) => {
                // SOLUCIÓN AL ERROR DE TYPESCRIPT: Usamos true en lugar de 1
                const pdfParser = new PDFParser(null, true);

                pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                pdfParser.on("pdfParser_dataReady", () => {
                    // Extraemos el texto crudo
                    resolve((pdfParser as any).getRawTextContent());
                });

                pdfParser.parseBuffer(buffer);
            });

            const cleanText = text.replace(/\s+/g, ' ');

            // --- EXTRACCIÓN AFINADA PARA TOTALENERGIES ---

            const invoiceMatch = cleanText.match(/Factura\s*nº\s*([A-Z0-9]+)/i)
            const invoiceNumber = invoiceMatch ? invoiceMatch[1] : `DOC-${Date.now()}`

            const dateMatch = cleanText.match(/Fecha\s*emisi[oó]n:\s*(\d{2})\.(\d{2})\.(\d{4})/i)
            let issueDate = new Date().toISOString().split('T')[0]
            if (dateMatch) {
                issueDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`
            }

            // IMPORTES
            const elecMatch = cleanText.match(/Electricidad\s+([\d,]+)\s*€/i)
            const elecAmount = elecMatch ? parseFloat(elecMatch[1].replace(',', '.')) : 0

            const gasMatch = cleanText.match(/Gas\s+([\d,]+)\s*€/i)
            const gasAmount = gasMatch ? parseFloat(gasMatch[1].replace(',', '.')) : 0

            const servMatch = cleanText.match(/Servicios\s+([\d,]+)\s*€/i)
            const servAmount = servMatch ? parseFloat(servMatch[1].replace(',', '.')) : 0

            const taxesMatch = cleanText.match(/Tasas e impuestos\s+([\d,]+)\s*€/i)
            const taxesAmount = taxesMatch ? parseFloat(taxesMatch[1].replace(',', '.')) : 0

            // NUEVO: EXTRACCIÓN DE CONSUMOS (kWh)
            // Buscamos números seguidos de "kWh" cerca de las palabras clave de luz y gas.
            // Si el formato de tu PDF es muy puñetero, ajustaremos esta regla.
            const elecKwhMatch = cleanText.match(/(?:Electricidad|Energía).*?([\d,]+)\s*kWh/i) || cleanText.match(/([\d,]+)\s*kWh/i)
            const elecKwh = elecKwhMatch ? parseFloat(elecKwhMatch[1].replace(',', '.')) : 0

            // Para el gas, asumiendo que el segundo bloque de kWh suele ser el gas
            const kwhMatches = [...cleanText.matchAll(/([\d,]+)\s*kWh/gi)]
            const gasKwh = kwhMatches.length > 1 ? parseFloat(kwhMatches[1][1].replace(',', '.')) : 0

            const totalAmount = elecAmount + gasAmount + servAmount + taxesAmount

            if (totalAmount === 0) {
                errorMessages.push(`No detecté los importes en ${file.name}`);
                continue;
            }

            const invoiceData = {
                invoice_number: invoiceNumber,
                issue_date: issueDate,
                total_amount: totalAmount,
                elec_amount: elecAmount,
                gas_amount: gasAmount,
                services_amount: servAmount,
                taxes_amount: taxesAmount,
                elec_kwh: elecKwh, // Guardamos el consumo de luz
                gas_kwh: gasKwh    // Guardamos el consumo de gas
            }

            // Guardar en Supabase
            const { error: insertError } = await supabase
                .from('home_invoices')
                .insert([invoiceData])

            if (insertError) {
                // Añade esta línea para ver los fallos en la terminal:
                console.error("ERROR DE SUPABASE:", insertError);
                errorMessages.push(`Fallo en base de datos para ${file.name}`);
            } else {
                processedCount++;
            }

        } catch (error) {
            console.error(`Error leyendo PDF ${file.name}:`, error)
            errorMessages.push(`Archivo ilegible: ${file.name}`);
        }
    }

    revalidatePath('/utilities')

    if (errorMessages.length > 0) {
        return { error: `Procesadas ${processedCount}. Errores: ${errorMessages.join(', ')}` }
    }

    return { success: true, count: processedCount }
}