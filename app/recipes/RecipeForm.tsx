'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RecipeSchema, RecipeFormValues, CatalogIngredient } from '@/types/schema'
import { createRecipe, updateRecipe } from './actions'
import { Plus, Trash2, Save, ChevronLeft, Clock, Tag } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { IngredientCombobox } from '@/components/IngredientCombobox'

const CATEGORIES = ['Pasta', 'Arroces', 'Carnes', 'Pescado', 'Verduras', 'Legumbres', 'Sopas', 'Huevos', 'Ensaladas', 'Postres', 'Otros']

const UNITS = [
  { label: '—', value: '' },
  { label: 'g', value: 'g' },
  { label: 'kg', value: 'kg' },
  { label: 'ml', value: 'ml' },
  { label: 'cl', value: 'cl' },
  { label: 'dl', value: 'dl' },
  { label: 'l', value: 'l' },
  { label: 'taza(s)', value: 'tazas' },
  { label: 'cda.', value: 'cucharadas' },
  { label: 'cdita.', value: 'cucharaditas' },
  { label: 'ud(s)', value: 'uds' },
  { label: 'diente(s)', value: 'dientes' },
  { label: 'lata(s)', value: 'latas' },
  { label: 'puñado(s)', value: 'puñados' },
  { label: 'rodaja(s)', value: 'rodajas' },
  { label: 'al gusto', value: 'al gusto' },
]

type Props = {
  ingredients: CatalogIngredient[]
  mode: 'create' | 'edit'
  recipeId?: string
  defaultValues?: Partial<RecipeFormValues>
}

export default function RecipeForm({ ingredients, mode, recipeId, defaultValues }: Props) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<RecipeFormValues>({
    resolver: zodResolver(RecipeSchema),
    defaultValues: defaultValues ?? {
      steps: [{ text: '' }],
      ingredients: [{ ingredient_id: '', name: '', amount: '', unit: '', store: '' }],
    },
  })

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({ control, name: 'steps' })
  const { fields: ingFields, append: appendIng, remove: removeIng } = useFieldArray({ control, name: 'ingredients' })

  const onSubmit = (data: RecipeFormValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = mode === 'edit' && recipeId
        ? await updateRecipe(recipeId, data)
        : await createRecipe(data)
      if (res?.error) setServerError(res.error)
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href={mode === 'edit' && recipeId ? `/recipes/${recipeId}` : '/recipes'} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft />
        </Link>
        <h1 className="text-2xl font-black text-slate-900">
          {mode === 'edit' ? 'Editar Receta' : 'Nueva Receta'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Nombre */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre del plato</label>
          <input
            {...register('name')}
            placeholder="Ej: Macarrones con tomate"
            className="w-full p-4 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        {/* Categoría + Tiempo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Tag size={14} /> Categoría
            </label>
            <select
              {...register('category')}
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            >
              <option value="">Sin categoría</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <Clock size={14} /> Tiempo (min)
            </label>
            <input
              {...register('prep_time', { valueAsNumber: true })}
              type="number"
              min={1}
              placeholder="Ej: 30"
              className="w-full p-3.5 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Ingredientes */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-bold text-lg">🍅 Ingredientes</h2>
              <p className="text-xs text-slate-400 mt-0.5">Busca en tu catálogo o escribe uno nuevo</p>
            </div>
            <button
              type="button"
              onClick={() => appendIng({ ingredient_id: '', name: '', amount: '', unit: '', store: '' })}
              className="text-emerald-600 text-sm font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Plus size={16} /> Añadir
            </button>
          </div>

          <div className="space-y-3">
            {ingFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <input
                  {...register(`ingredients.${index}.amount`)}
                  placeholder="Cant."
                  className="w-16 shrink-0 p-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-emerald-400 outline-none"
                />
                <select
                  {...register(`ingredients.${index}.unit`)}
                  className="w-24 shrink-0 p-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-emerald-400 outline-none text-slate-600"
                >
                  {UNITS.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                </select>
                <Controller
                  control={control}
                  name={`ingredients.${index}.name`}
                  render={({ field: nameField }) => (
                    <IngredientCombobox
                      ingredients={ingredients}
                      value={nameField.value}
                      error={!!errors.ingredients?.[index]?.name}
                      onChange={(name, ingredientId, store) => {
                        nameField.onChange(name)
                        setValue(`ingredients.${index}.ingredient_id`, ingredientId ?? '')
                        setValue(`ingredients.${index}.store`, store ?? '')
                      }}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={() => removeIng(index)}
                  disabled={ingFields.length === 1}
                  className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Pasos */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">👨‍🍳 Pasos</h2>
            <button
              type="button"
              onClick={() => appendStep({ text: '' })}
              className="text-emerald-600 text-sm font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Plus size={16} /> Añadir Paso
            </button>
          </div>

          <div className="space-y-3">
            {stepFields.map((field, index) => (
              <div key={field.id} className="flex gap-3 items-start">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mt-3 shrink-0">
                  {index + 1}
                </span>
                <textarea
                  {...register(`steps.${index}.text`)}
                  placeholder={`Describe el paso ${index + 1}...`}
                  rows={2}
                  className="flex-1 p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  disabled={stepFields.length === 1}
                  className="mt-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {serverError && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center border border-red-100">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 hover:bg-emerald-700"
        >
          {isPending ? 'Guardando...' : <><Save size={20} /> {mode === 'edit' ? 'Guardar Cambios' : 'Guardar Receta'}</>}
        </button>
      </form>
    </div>
  )
}
