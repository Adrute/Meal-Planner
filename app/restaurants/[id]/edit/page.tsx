import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import EditRestaurantForm from './EditRestaurantForm'

export const dynamic = 'force-dynamic'

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // 1. Buscamos el restaurante a editar
  const { data: rest } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single()

  // Si alguien escribe una URL rara, le mandamos al mapa
  if (!rest) redirect('/restaurants')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in pb-24">
      
      {/* CABECERA */}
      <div className="flex justify-between items-center mb-8">
        <Link href={`/restaurants/${rest.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-500 transition-colors">
          <ArrowLeft size={16} /> Volver a la Ficha
        </Link>
      </div>

      {/* FORMULARIO CLIENTE */}
      <EditRestaurantForm restaurant={rest} />

    </div>
  )
}