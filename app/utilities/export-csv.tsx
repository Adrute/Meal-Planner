// app/utilities/export-csv.tsx
'use client'

import { Download } from 'lucide-react'

export default function ExportCsvButton({ invoices }: { invoices: any[] }) {
  const handleExport = () => {
    // 1. Definir cabeceras (Usamos punto y coma para que Excel en España lo lea bien)
    const headers = ['Factura', 'Fecha Emision', 'Electricidad', 'Gas Natural', 'Servicios', 'Impuestos', 'Total']
    
    // 2. Mapear datos
    const rows = invoices.map(inv => [
      inv.invoice_number,
      inv.issue_date,
      Number(inv.elec_amount || 0).toFixed(2),
      Number(inv.gas_amount || 0).toFixed(2),
      Number(inv.services_amount || 0).toFixed(2),
      Number(inv.taxes_amount || 0).toFixed(2),
      Number(inv.total_amount || 0).toFixed(2)
    ])

    // 3. Unir todo en formato CSV
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n')

    // 4. Crear el archivo y forzar descarga
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'historico_suministros.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-emerald-600 transition-colors text-sm shadow-sm"
    >
      <Download size={16} />
      Exportar CSV
    </button>
  )
}