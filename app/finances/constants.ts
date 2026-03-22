// Tipos compartidos
export type Subcategory = {
  id: string
  name: string
  category_id: string
}

export type Category = {
  id: string
  name: string
  color: string
  is_income: boolean
  transaction_subcategories: Subcategory[]
}

// Paleta de colores para crear nuevas categorías
export const COLOR_OPTIONS = [
  '#10b981', '#f59e0b', '#f97316', '#a855f7', '#ec4899',
  '#0ea5e9', '#8b5cf6', '#94a3b8', '#ef4444', '#eab308',
  '#3b82f6', '#d946ef', '#14b8a6', '#f43f5e', '#22c55e',
  '#78716c', '#9ca3af', '#06b6d4', '#84cc16', '#e11d48',
]

// Colores de badge Tailwind por nombre de categoría
export const CATEGORY_COLORS: Record<string, string> = {
  Supermercado:  'bg-emerald-100 text-emerald-700',
  Gasolina:      'bg-amber-100 text-amber-700',
  Restaurante:   'bg-orange-100 text-orange-700',
  Ocio:          'bg-purple-100 text-purple-700',
  Farmacia:      'bg-pink-100 text-pink-700',
  Transporte:    'bg-sky-100 text-sky-700',
  Suscripciones: 'bg-violet-100 text-violet-700',
  Transferencia: 'bg-slate-100 text-slate-600',
  Préstamo:      'bg-red-100 text-red-700',
  Suministros:   'bg-yellow-100 text-yellow-700',
  Seguro:        'bg-blue-100 text-blue-700',
  Ropa:          'bg-fuchsia-100 text-fuchsia-700',
  Educación:     'bg-teal-100 text-teal-700',
  Impuestos:     'bg-rose-100 text-rose-700',
  Hogar:         'bg-stone-100 text-stone-700',
  Ingresos:      'bg-green-100 text-green-700',
  Otros:         'bg-gray-100 text-gray-600',
}
