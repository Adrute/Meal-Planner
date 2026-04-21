'use client'

import { useState, useTransition } from 'react'
import { createUser, deleteUser, updateUserDisplayName, updateUserPermissions } from './user-actions'
import { UserPlus, Trash2, Loader2, Check, X, Pencil, ShieldCheck, ChevronDown } from 'lucide-react'

type Profile = { id: string; email: string; display_name: string | null; permissions: string[] | null }

const PERMISSIONS = [
  { key: 'meals',       label: 'Comidas'          },
  { key: 'recipes',     label: 'Recetas'          },
  { key: 'shopping',    label: 'Compra'           },
  { key: 'finances',    label: 'Finanzas'         },
  { key: 'utilities',   label: 'Suministros'      },
  { key: 'services',    label: 'Bonos'            },
  { key: 'restaurants', label: 'Restaurantes'     },
  { key: 'wishlist',    label: 'Lista de deseos'  },
  { key: 'health',      label: 'Salud'            },
]

function UserRow({ profile, isCurrentUser }: { profile: Profile; isCurrentUser: boolean }) {
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPermissions, setShowPermissions] = useState(false)
  const [perms, setPerms] = useState<string[]>(profile.permissions ?? [])
  const [isSavingPerms, startPermsTransition] = useTransition()

  const handleSaveName = () => {
    startTransition(async () => {
      await updateUserDisplayName(profile.id, displayName)
      setIsEditing(false)
    })
  }

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar el usuario "${profile.email}"? Esta acción no se puede deshacer.`)) return
    setIsDeleting(true)
    const res = await deleteUser(profile.id)
    if (res?.error) { alert(res.error); setIsDeleting(false) }
  }

  const togglePerm = (key: string) => {
    setPerms(prev => prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key])
  }

  const handleSavePerms = () => {
    startPermsTransition(async () => {
      await updateUserPermissions(profile.id, perms)
    })
  }

  const permsChanged = JSON.stringify([...perms].sort()) !== JSON.stringify([...(profile.permissions ?? [])].sort())

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm transition-opacity ${isDeleting ? 'opacity-40' : ''}`}>
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${isCurrentUser ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {(profile.display_name || profile.email).slice(0, 2).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 truncate">{profile.email}</p>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                autoFocus
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Nombre para mostrar"
                className="text-sm font-bold border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400 flex-1"
              />
              <button onClick={handleSaveName} disabled={isPending} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50">
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </button>
              <button onClick={() => { setDisplayName(profile.display_name || ''); setIsEditing(false) }} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-slate-700">{profile.display_name || <span className="text-slate-400 font-normal italic">Sin nombre</span>}</p>
              {isCurrentUser && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={10} />Admin
                </span>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        {!isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowPermissions(v => !v)}
              className={`p-2 rounded-xl transition-all text-xs font-bold flex items-center gap-1 ${showPermissions ? 'bg-blue-50 text-blue-600' : 'text-slate-300 hover:text-blue-500 hover:bg-blue-50'}`}
              title="Permisos"
            >
              <ChevronDown size={15} className={`transition-transform ${showPermissions ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={() => setIsEditing(true)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all">
              <Pencil size={15} />
            </button>
            {!isCurrentUser && (
              <button onClick={handleDelete} disabled={isDeleting} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50">
                {isDeleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Permissions panel */}
      {showPermissions && (
        <div className="px-4 pb-4 border-t border-slate-50 pt-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Acceso a pantallas</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {PERMISSIONS.map(p => {
              const active = perms.includes(p.key)
              return (
                <button
                  key={p.key}
                  onClick={() => togglePerm(p.key)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                    active
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>
          {permsChanged && (
            <button
              onClick={handleSavePerms}
              disabled={isSavingPerms}
              className="flex items-center gap-2 bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSavingPerms ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Guardar permisos
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function NewUserForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ email: '', password: '', displayName: '' })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!form.email || !form.password) return
    setError(null)
    startTransition(async () => {
      const res = await createUser(form.email, form.password, form.displayName)
      if (res?.error) { setError(res.error) }
      else { onDone() }
    })
  }

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3">
      <p className="text-sm font-black text-slate-700">Nuevo usuario</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          autoFocus
          type="text"
          placeholder="Nombre para mostrar"
          value={form.displayName}
          onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
          className="text-sm border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:border-blue-400"
        />
        <input
          type="email"
          placeholder="correo@email.com *"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          className="text-sm border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:border-blue-400"
        />
        <input
          type="password"
          placeholder="Contraseña *"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          className="text-sm border border-slate-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:border-blue-400"
        />
      </div>
      {error && <p className="text-xs text-red-600 font-bold bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={isPending || !form.email || !form.password}
          className="flex items-center gap-2 bg-blue-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Crear usuario
        </button>
        <button onClick={onDone} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default function UserManager({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-700">
          Usuarios · <span className="text-slate-400 font-normal">{profiles.length}</span>
        </h2>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-blue-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
        >
          {showForm ? <X size={15} /> : <UserPlus size={15} />}
          {showForm ? 'Cancelar' : 'Añadir usuario'}
        </button>
      </div>

      {showForm && <NewUserForm onDone={() => setShowForm(false)} />}

      <div className="space-y-2">
        {profiles.map(p => (
          <UserRow key={p.id} profile={p} isCurrentUser={p.id === currentUserId} />
        ))}
      </div>
    </div>
  )
}
