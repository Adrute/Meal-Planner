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
  Alimentación:          'bg-emerald-100 text-emerald-700',
  Hogar:                 'bg-stone-100 text-stone-700',
  Transporte:            'bg-sky-100 text-sky-700',
  Salud:                 'bg-red-100 text-red-700',
  Ocio:                  'bg-purple-100 text-purple-700',
  Ropa:                  'bg-pink-100 text-pink-700',
  Educación:             'bg-teal-100 text-teal-700',
  Suscripciones:         'bg-violet-100 text-violet-700',
  'Impuestos y seguros': 'bg-amber-100 text-amber-700',
  Regalos:               'bg-orange-100 text-orange-700',
  Ahorro:                'bg-green-100 text-green-700',
  Inversiones:           'bg-blue-100 text-blue-700',
  Deudas:                'bg-rose-100 text-rose-700',
  Ingresos:              'bg-emerald-100 text-emerald-700',
  Otros:                 'bg-gray-100 text-gray-600',
}
