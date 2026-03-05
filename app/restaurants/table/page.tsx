import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Table as TableIcon } from 'lucide-react'
import TableClient from './TableClient'

export const dynamic = 'force-dynamic'

export default async function TablePage() {
  const supabase = await createClient()
  const { data: restaurants } = await supabase.from('restaurants').select('*').order('name')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/restaurants" className="bg-white p-3 rounded-2xl shadow-sm text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors border border-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2 m-0">
            <TableIcon className="text-emerald-500" /> Todos los Locales
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Busca, filtra y gestiona tu directorio gastronómico.</p>
        </div>
      </div>
      <TableClient restaurants={restaurants || []} />
    </div>
  )
}