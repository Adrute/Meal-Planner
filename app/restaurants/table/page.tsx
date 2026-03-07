import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Table as TableIcon } from 'lucide-react'
import TableClient from './TableClient'

export const dynamic = 'force-dynamic'

export default async function TablePage() {
  const supabase = await createClient()

  const { data: restaurants } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false })
  
  // Nos traemos los colores de las etiquetas
  const { data: tagColors } = await supabase.from('tag_colors').select('*')
  const tagColorsMap = Object.fromEntries(tagColors?.map(t => [t.tag, t.color]) || [])

  // Traducción de estados antiguos por si acaso
  const mappedRestaurants = restaurants?.map(r => {
    let st = r.status
    if (st === 'visited' || st === 'approved') st = 'liked'
    return { ...r, status: st }
  }) || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pb-24 animate-in fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/restaurants" className="bg-white p-3 rounded-2xl shadow-sm text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors border border-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 m-0">
          <TableIcon className="text-blue-500" /> Directorio de Locales
        </h1>
      </div>

      <TableClient initialRestaurants={mappedRestaurants} tagColorsMap={tagColorsMap} />
    </div>
  )
}