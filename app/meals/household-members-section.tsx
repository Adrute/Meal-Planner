'use client'

import { useState, useTransition } from 'react'
import { Users, Plus, Trash2, X, ChevronDown, Baby, User } from 'lucide-react'
import {
  createHouseholdMember,
  updateHouseholdMember,
  deleteHouseholdMember,
  type HouseholdMember,
  type Restriction,
} from './actions'

const RESTRICTION_TYPES = [
  { value: 'alergia', label: 'Alergia', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'intolerancia', label: 'Intolerancia', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'preferencia', label: 'No me gusta', color: 'bg-slate-100 text-slate-600 border-slate-200' },
] as const

function RestrictionChip({ r, onRemove }: { r: Restriction; onRemove: () => void }) {
  const meta = RESTRICTION_TYPES.find(t => t.value === r.type) ?? RESTRICTION_TYPES[2]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${meta.color}`}>
      {r.food}
      <span className="opacity-60">· {meta.label}</span>
      <button onClick={onRemove} className="hover:opacity-100 opacity-50 transition-opacity">
        <X size={11} />
      </button>
    </span>
  )
}

function MemberForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: HouseholdMember
  onSave: (data: { name: string; role: 'adult' | 'child'; restrictions: Restriction[] }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [role, setRole] = useState<'adult' | 'child'>(initial?.role ?? 'adult')
  const [restrictions, setRestrictions] = useState<Restriction[]>(initial?.restrictions ?? [])
  const [newFood, setNewFood] = useState('')
  const [newType, setNewType] = useState<Restriction['type']>('alergia')

  const addRestriction = () => {
    if (!newFood.trim()) return
    setRestrictions(r => [...r, { food: newFood.trim(), type: newType }])
    setNewFood('')
  }

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
      <div className="flex gap-3">
        <input
          autoFocus
          placeholder="Nombre *"
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 text-sm font-bold border border-slate-200 bg-white rounded-xl px-4 py-2.5 outline-none focus:border-blue-400"
        />
        <div className="relative">
          <select
            value={role}
            onChange={e => setRole(e.target.value as 'adult' | 'child')}
            className="appearance-none text-sm bg-white border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-400 cursor-pointer pr-8"
          >
            <option value="adult">👤 Adulto</option>
            <option value="child">👶 Niño/a</option>
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Restricciones alimentarias</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {restrictions.length === 0 && (
            <span className="text-xs text-slate-400">Sin restricciones</span>
          )}
          {restrictions.map((r, i) => (
            <RestrictionChip key={i} r={r} onRemove={() => setRestrictions(rs => rs.filter((_, j) => j !== i))} />
          ))}
        </div>
        <div className="flex gap-2">
          <input
            placeholder="Alimento (ej: gluten)"
            value={newFood}
            onChange={e => setNewFood(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRestriction()}
            className="flex-1 text-sm border border-slate-200 bg-white rounded-xl px-3 py-2 outline-none focus:border-blue-400"
          />
          <div className="relative">
            <select
              value={newType}
              onChange={e => setNewType(e.target.value as Restriction['type'])}
              className="appearance-none text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 cursor-pointer pr-7"
            >
              {RESTRICTION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={addRestriction}
            className="bg-slate-800 text-white text-sm font-bold px-3 py-2 rounded-xl hover:bg-slate-700 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => name.trim() && onSave({ name: name.trim(), role, restrictions })}
          disabled={!name.trim()}
          className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Guardar
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function MemberCard({
  member,
  onUpdated,
}: {
  member: HouseholdMember
  onUpdated: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSave = (data: { name: string; role: 'adult' | 'child'; restrictions: Restriction[] }) => {
    startTransition(async () => {
      await updateHouseholdMember(member.id, data)
      setIsEditing(false)
      onUpdated()
    })
  }

  const handleDelete = () => {
    if (!confirm(`¿Eliminar a ${member.name}?`)) return
    startTransition(async () => {
      await deleteHouseholdMember(member.id)
      onUpdated()
    })
  }

  if (isEditing) {
    return <MemberForm initial={member} onSave={handleSave} onCancel={() => setIsEditing(false)} />
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-4 transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${member.role === 'child' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
            {member.role === 'child' ? <Baby size={18} /> : <User size={18} />}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm">{member.name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{member.role === 'child' ? 'Niño/a' : 'Adulto'}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-slate-400 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {member.restrictions.length === 0 ? (
          <span className="text-xs text-slate-300">Sin restricciones</span>
        ) : (
          member.restrictions.map((r, i) => {
            const meta = RESTRICTION_TYPES.find(t => t.value === r.type) ?? RESTRICTION_TYPES[2]
            return (
              <span key={i} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                {r.food} · {meta.label}
              </span>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function HouseholdMembersSection({ members }: { members: HouseholdMember[] }) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(true)

  const handleCreate = (data: { name: string; role: 'adult' | 'child'; restrictions: Restriction[] }) => {
    startTransition(async () => {
      await createHouseholdMember(data)
      setShowForm(false)
    })
  }

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Users size={20} /></div>
          <div className="text-left">
            <h2 className="font-bold text-slate-800">Miembros del hogar</h2>
            <p className="text-xs text-slate-400">{members.length} miembro{members.length !== 1 ? 's' : ''} · Alergias e intolerancias para el planificador IA</p>
          </div>
        </div>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
          {members.length === 0 && !showForm && (
            <p className="text-sm text-slate-400 text-center py-4">
              Añade los miembros del hogar con sus restricciones para que la IA las tenga en cuenta.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {members.map(m => (
              <MemberCard key={m.id} member={m} onUpdated={() => {}} />
            ))}
          </div>

          {showForm && (
            <MemberForm
              onSave={handleCreate}
              onCancel={() => setShowForm(false)}
            />
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              disabled={isPending}
              className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4 py-2.5 rounded-xl border border-dashed border-blue-200 hover:border-blue-300 transition-all w-full justify-center"
            >
              <Plus size={16} />
              Añadir miembro
            </button>
          )}
        </div>
      )}
    </section>
  )
}
