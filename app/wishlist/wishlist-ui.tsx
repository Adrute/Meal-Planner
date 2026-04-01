'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import {
  createWishItem, updateWishItem, deleteWishItem, toggleWishField,
  shareWithUser, unshareWithUser, type WishItemInput,
} from './actions'
import {
  Plus, Trash2, Pencil, Check, X, Loader2,
  Share2, Package, CalendarDays, Sparkles, Link2, ExternalLink,
  ChevronDown, CheckSquare2, ClipboardCopy, MessageCircle,
  Users, UserCheck, Gift, GlobeLock,
} from 'lucide-react'

export type WishItem = {
  id: string
  user_id: string
  name: string
  description: string | null
  type: string
  url: string | null
  price_estimate: number | null
  priority: string
  is_shareable: boolean
  is_purchased: boolean
  created_at: string
}

export type Profile = {
  id: string
  email: string
  display_name: string | null
}

const TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  objeto:      { label: 'Objeto',      icon: <Package      size={12} />, color: 'bg-blue-100 text-blue-700' },
  evento:      { label: 'Evento',      icon: <CalendarDays size={12} />, color: 'bg-purple-100 text-purple-700' },
  experiencia: { label: 'Experiencia', icon: <Sparkles     size={12} />, color: 'bg-amber-100 text-amber-700' },
}

const EMPTY_FORM: WishItemInput = {
  name: '', description: '', type: 'objeto', url: '', price_estimate: '', priority: 'media',
}

function initials(profile: Profile) {
  const name = profile.display_name || profile.email || '?'
  return name.slice(0, 2).toUpperCase()
}

function labelUser(profile: Profile) {
  return profile.display_name || profile.email
}

// ─── Formulario de item ───────────────────────────────────────────────────────

function ItemForm({
  initial, onSave, onCancel, isPending,
}: {
  initial: WishItemInput
  onSave: (data: WishItemInput) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [form, setForm] = useState<WishItemInput>(initial)
  const set = (k: keyof WishItemInput, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
      <input
        autoFocus
        placeholder="¿Qué quieres? *"
        value={form.name}
        onChange={e => set('name', e.target.value)}
        className="w-full text-sm font-bold border border-slate-200 bg-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-400"
      />
      <div className="flex gap-3">
        <div className="relative flex-1">
          <select value={form.type} onChange={e => set('type', e.target.value)}
            className="w-full appearance-none text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 cursor-pointer pr-8">
            <option value="objeto">📦 Objeto</option>
            <option value="evento">📅 Evento</option>
            <option value="experiencia">✨ Experiencia</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative flex-1">
          <select value={form.priority} onChange={e => set('priority', e.target.value)}
            className="w-full appearance-none text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 cursor-pointer pr-8">
            <option value="alta">🔴 Alta prioridad</option>
            <option value="media">🟡 Media prioridad</option>
            <option value="baja">⚪ Baja prioridad</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>
      <textarea
        placeholder="Descripción (modelo, talla, preferencias...)"
        value={form.description} onChange={e => set('description', e.target.value)}
        rows={2}
        className="w-full text-sm border border-slate-200 bg-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 resize-none"
      />
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="url" placeholder="Enlace (opcional)" value={form.url} onChange={e => set('url', e.target.value)}
            className="w-full text-sm border border-slate-200 bg-white rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-blue-400" />
        </div>
        <div className="relative w-36">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">~€</span>
          <input type="number" min="0" step="0.01" placeholder="Precio est." value={form.price_estimate} onChange={e => set('price_estimate', e.target.value)}
            className="w-full text-sm border border-slate-200 bg-white rounded-xl pl-8 pr-4 py-2.5 outline-none focus:border-blue-400" />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => form.name.trim() && onSave(form)} disabled={isPending || !form.name.trim()}
          className="flex items-center gap-2 bg-blue-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Guardar
        </button>
        <button onClick={onCancel} className="text-sm font-medium text-slate-400 hover:text-slate-600 px-4 py-2.5 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Selector de usuarios para compartir ─────────────────────────────────────

function UserSharePicker({
  itemId, profiles, sharedWith,
}: {
  itemId: string
  profiles: Profile[]
  sharedWith: string[]
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (userId: string) => {
    const isShared = sharedWith.includes(userId)
    startTransition(() =>
      isShared ? unshareWithUser(itemId, userId) : shareWithUser(itemId, userId)
    )
  }

  if (profiles.length === 0) return null

  const sharedProfiles = profiles.filter(p => sharedWith.includes(p.id))

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
          sharedWith.length > 0
            ? 'bg-violet-100 text-violet-700 border-violet-200'
            : 'text-slate-400 border-slate-200 hover:border-slate-300'
        }`}
      >
        {pending
          ? <Loader2 size={12} className="animate-spin" />
          : sharedWith.length > 0 ? <UserCheck size={12} /> : <Users size={12} />
        }
        {sharedWith.length > 0
          ? sharedProfiles.map(p => initials(p)).join(', ')
          : 'Compartir con...'
        }
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 bg-white rounded-xl border border-slate-100 shadow-xl z-30 min-w-[200px] overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 border-b border-slate-50">
            Compartir con
          </p>
          {profiles.map(p => {
            const isShared = sharedWith.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left ${pending ? 'pointer-events-none opacity-60' : ''}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isShared ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {initials(p)}
                </div>
                <span className="text-xs font-medium text-slate-700 flex-1 truncate">{labelUser(p)}</span>
                {isShared && <Check size={13} className="text-violet-600 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tarjeta de item propio ───────────────────────────────────────────────────

function WishCard({ item, profiles, sharedWith }: {
  item: WishItem
  profiles: Profile[]
  sharedWith: string[]
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const type = TYPE_META[item.type] ?? TYPE_META.objeto

  const handleToggle = (field: 'is_shareable' | 'is_purchased', val: boolean) => {
    startTransition(() => toggleWishField(item.id, field, val))
  }

  const handleSave = (data: WishItemInput) => {
    startTransition(async () => {
      await updateWishItem(item.id, data)
      setIsEditing(false)
    })
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar "${item.name}"?`)) return
    setIsDeleting(true)
    await deleteWishItem(item.id)
  }

  if (isEditing) {
    return (
      <ItemForm
        initial={{ name: item.name, description: item.description ?? '', type: item.type, url: item.url ?? '', price_estimate: item.price_estimate?.toString() ?? '', priority: item.priority }}
        onSave={handleSave} onCancel={() => setIsEditing(false)} isPending={isPending}
      />
    )
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm transition-opacity ${isDeleting ? 'opacity-40' : ''} ${item.is_purchased ? 'opacity-60' : ''}`}>
      <div className={`h-1 w-full rounded-t-2xl ${item.priority === 'alta' ? 'bg-rose-400' : item.priority === 'media' ? 'bg-amber-300' : 'bg-slate-200'}`} />
      <div className="p-4 space-y-3">

        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${type.color}`}>
                {type.icon}{type.label}
              </span>
              {item.is_purchased && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                  <Check size={10} />Conseguido
                </span>
              )}
            </div>
            <h3 className={`text-sm font-black text-slate-800 leading-tight ${item.is_purchased ? 'line-through text-slate-400' : ''}`}>
              {item.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {item.price_estimate && (
              <span className="text-xs font-bold text-slate-500 mr-1">~{item.price_estimate.toFixed(0)}€</span>
            )}
            <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
              <Pencil size={14} />
            </button>
            <button onClick={handleDelete} disabled={isDeleting} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50">
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
          </div>
        </div>

        {item.description && <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>}

        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors">
            <ExternalLink size={11} />Ver enlace
          </a>
        )}

        {/* Toggles + compartir */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-50 flex-wrap">
          <button
            onClick={() => handleToggle('is_purchased', !item.is_purchased)}
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
              item.is_purchased ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'text-slate-400 border-slate-200'
            }`}
          >
            {item.is_purchased ? <CheckSquare2 size={12} /> : <CheckSquare2 size={12} />}
            {item.is_purchased ? 'Conseguido' : 'Marcar conseguido'}
          </button>
          <button
            onClick={() => handleToggle('is_shareable', !item.is_shareable)}
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
              item.is_shareable ? 'bg-green-100 text-green-700 border-green-200' : 'text-slate-400 border-slate-200'
            }`}
          >
            {item.is_shareable ? <Share2 size={12} /> : <GlobeLock size={12} />}
            {item.is_shareable ? 'En WhatsApp' : 'WhatsApp'}
          </button>
          <UserSharePicker itemId={item.id} profiles={profiles} sharedWith={sharedWith} />
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de item compartido conmigo (solo lectura) ────────────────────────

function SharedItemCard({ item, ownerProfile }: { item: WishItem; ownerProfile?: Profile }) {
  const type = TYPE_META[item.type] ?? TYPE_META.objeto
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${item.is_purchased ? 'opacity-50' : ''}`}>
      <div className={`h-1 w-full ${item.priority === 'alta' ? 'bg-rose-400' : item.priority === 'media' ? 'bg-amber-300' : 'bg-slate-200'}`} />
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md ${type.color}`}>
                {type.icon}{type.label}
              </span>
              {item.is_purchased && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                  <Check size={10} />Conseguido
                </span>
              )}
            </div>
            <h3 className={`text-sm font-black text-slate-800 ${item.is_purchased ? 'line-through text-slate-400' : ''}`}>
              {item.name}
            </h3>
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
}

// ─── Panel de compartir por WhatsApp ─────────────────────────────────────────

function SharePanel({ items }: { items: WishItem[] }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const shareable = items.filter(i => i.is_shareable && !i.is_purchased)

  const buildText = () => {
    const lines = ['🎁 Mi lista de deseos\n']
    for (const item of shareable) {
      const emoji = item.type === 'objeto' ? '📦' : item.type === 'evento' ? '📅' : '✨'
      lines.push(`${emoji} ${item.name}${item.price_estimate ? ` — aprox. ${item.price_estimate.toFixed(0)}€` : ''}`)
      if (item.description) lines.push(`   ${item.description}`)
      if (item.url) lines.push(`   ${item.url}`)
      lines.push('')
    }
    return lines.join('\n')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-2xl hover:border-slate-300 transition-all shadow-sm">
        <Share2 size={16} />
        WhatsApp
        {shareable.length > 0 && (
          <span className="bg-green-100 text-green-700 text-[10px] font-black px-1.5 py-0.5 rounded-full">{shareable.length}</span>
        )}
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl z-20 p-4 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compartir por WhatsApp</p>
          <p className="text-xs text-slate-400">
            {shareable.length === 0
              ? 'Activa "WhatsApp" en los items que quieras incluir.'
              : `${shareable.length} elemento${shareable.length > 1 ? 's' : ''} seleccionado${shareable.length > 1 ? 's' : ''}.`}
          </p>
          <div className="flex gap-2">
            <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildText())}`, '_blank')}
              disabled={shareable.length === 0}
              className="flex items-center gap-2 bg-[#25d366] text-white font-bold text-xs px-3 py-2 rounded-xl hover:bg-[#1fb855] transition-colors disabled:opacity-40 flex-1 justify-center">
              <MessageCircle size={13} />WhatsApp
            </button>
            <button onClick={handleCopy} disabled={shareable.length === 0}
              className="flex items-center gap-2 bg-slate-100 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-40">
              {copied ? <Check size={13} className="text-emerald-600" /> : <ClipboardCopy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function WishlistUI({
  items, userId, profiles, itemShares, sharedWithMe, ownerProfiles,
}: {
  items: WishItem[]
  userId: string
  profiles: Profile[]
  itemShares: Record<string, string[]>
  sharedWithMe: WishItem[]
  ownerProfiles: Profile[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [typeFilter, setTypeFilter] = useState('todos')
  const [showPurchased, setShowPurchased] = useState(false)

  const handleCreate = (data: WishItemInput) => {
    startTransition(async () => {
      await createWishItem(data)
      setShowForm(false)
    })
  }

  const filtered = items.filter(i => {
    if (!showPurchased && i.is_purchased) return false
    if (typeFilter !== 'todos' && i.type !== typeFilter) return false
    return true
  })

  const counts = {
    total: items.filter(i => !i.is_purchased).length,
    objeto: items.filter(i => i.type === 'objeto' && !i.is_purchased).length,
    evento: items.filter(i => i.type === 'evento' && !i.is_purchased).length,
    experiencia: items.filter(i => i.type === 'experiencia' && !i.is_purchased).length,
    purchased: items.filter(i => i.is_purchased).length,
  }

  // Agrupar items compartidos conmigo por dueño
  const sharedByOwner = ownerProfiles.map(owner => ({
    owner,
    items: sharedWithMe.filter((i: WishItem) => i.user_id === owner.id),
  })).filter(g => g.items.length > 0)

  return (
    <div className="space-y-8">

      {/* Acciones */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancelar' : 'Añadir elemento'}
        </button>
        <SharePanel items={items} />
      </div>

      {/* Formulario */}
      {showForm && (
        <ItemForm initial={EMPTY_FORM} onSave={handleCreate} onCancel={() => setShowForm(false)} isPending={isPending} />
      )}

      {/* Mi lista */}
      {items.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
          <Gift size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-medium">Tu lista de deseos está vacía.<br />Añade lo primero que quieras.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            {(['todos', 'objeto', 'evento', 'experiencia'] as const).map(t => {
              const labels = { todos: 'Todos', objeto: '📦 Objetos', evento: '📅 Eventos', experiencia: '✨ Experiencias' }
              const count = t === 'todos' ? counts.total : counts[t]
              return (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all ${typeFilter === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  {labels[t]} {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                </button>
              )
            })}
            {counts.purchased > 0 && (
              <button onClick={() => setShowPurchased(v => !v)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-all ml-auto ${showPurchased ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                <Check size={11} className="inline mr-1" />Conseguidos ({counts.purchased})
              </button>
            )}
          </div>

          {filtered.length === 0
            ? <p className="text-sm text-slate-400 text-center py-8">No hay elementos en esta categoría.</p>
            : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered
                  .sort((a, b) => ({ alta: 0, media: 1, baja: 2 }[a.priority as 'alta' | 'media' | 'baja'] ?? 1) - ({ alta: 0, media: 1, baja: 2 }[b.priority as 'alta' | 'media' | 'baja'] ?? 1))
                  .map(item => (
                    <WishCard
                      key={item.id}
                      item={item}
                      profiles={profiles}
                      sharedWith={itemShares[item.id] ?? []}
                    />
                  ))
                }
              </div>
            )
          }
        </div>
      )}

      {/* Compartido conmigo */}
      <section className="space-y-5 pt-6 border-t border-slate-200">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <UserCheck size={14} className="text-violet-500" />
          Compartido conmigo
        </h2>

        {sharedByOwner.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
            <UserCheck size={28} className="mx-auto text-slate-200 mb-3" />
            <p className="text-sm text-slate-400 font-medium">Nadie ha compartido elementos contigo aún.</p>
            <p className="text-xs text-slate-300 mt-1">Cuando alguien comparta algo contigo aparecerá aquí.</p>
          </div>
        ) : (
          sharedByOwner.map(({ owner, items: ownerItems }) => (
            <div key={owner.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-[11px] font-black text-violet-700">
                  {initials(owner)}
                </div>
                <span className="text-sm font-bold text-slate-600">{labelUser(owner)}</span>
                <span className="text-xs text-slate-400">{ownerItems.length} elemento{ownerItems.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ownerItems.map((item: WishItem) => (
                  <SharedItemCard key={item.id} item={item} ownerProfile={owner} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
