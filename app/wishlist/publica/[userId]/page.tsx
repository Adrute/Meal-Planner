import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Gift, Package, CalendarDays, Sparkles, ExternalLink, Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  objeto:      { label: 'Objeto',      icon: <Package      size={12} />, color: 'bg-blue-100 text-blue-700' },
  evento:      { label: 'Evento',      icon: <CalendarDays size={12} />, color: 'bg-purple-100 text-purple-700' },
  experiencia: { label: 'Experiencia', icon: <Sparkles     size={12} />, color: 'bg-amber-100 text-amber-700' },
}

export default async function PublicWishlistPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Perfil del dueño de la lista
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('email, display_name')
    .eq('id', userId)
    .single()

  if (!ownerProfile) notFound()

  // Items que ese usuario ha compartido específicamente con el viewer (RLS filtra automáticamente)
  const { data: items } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('user_id', userId)
    .order('priority')
    .order('created_at', { ascending: false })

  const all = items || []
  const pending = all.filter(i => !i.is_purchased)
  const purchased = all.filter(i => i.is_purchased)
  const ownerName = ownerProfile.display_name || ownerProfile.email

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8 animate-in fade-in">
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <Gift size={32} className="text-pink-500" />
          <h1 className="text-3xl font-black text-slate-900">Lista de deseos</h1>
        </div>
        <p className="text-sm font-bold text-slate-500">{ownerName}</p>
        <p className="text-xs text-slate-400">
          {pending.length === 0 ? '¡Todo conseguido! 🎉' : `${pending.length} ${pending.length === 1 ? 'deseo pendiente' : 'deseos pendientes'}`}
        </p>
      </header>

      {all.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <Sparkles size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400">{ownerName} no ha compartido ningún elemento contigo aún.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pending.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {pending.map(item => {
                const type = TYPE_META[item.type] ?? TYPE_META.objeto
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className={`h-1 w-full ${item.priority === 'alta' ? 'bg-rose-400' : item.priority === 'media' ? 'bg-amber-300' : 'bg-slate-200'}`} />
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md mb-1 ${type.color}`}>
                            {type.icon}{type.label}
                          </span>
                          <h3 className="text-sm font-black text-slate-800 leading-tight">{item.name}</h3>
                        </div>
                        {item.price_estimate && (
                          <span className="text-xs font-bold text-slate-500 shrink-0">~{Number(item.price_estimate).toFixed(0)}€</span>
                        )}
                      </div>
                      {item.description && <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors">
                          <ExternalLink size={11} />Ver enlace
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {purchased.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Check size={13} className="text-emerald-500" /> Ya conseguidos
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {purchased.map(item => (
                  <div key={item.id} className="bg-white rounded-xl border border-slate-100 px-4 py-3 opacity-60">
                    <p className="text-sm font-bold text-slate-500 line-through">{item.name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
