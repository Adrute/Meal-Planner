'use client'

import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RecipeSchema, RecipeFormValues, CatalogIngredient } from '@/types/schema'
import { createRecipe } from '../actions'
import { Plus, Trash2, Save, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { IngredientCombobox } from '@/components/IngredientCombobox'

export default function RecipeForm({ ingredients }: { ingredients: CatalogIngredient[] }) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<RecipeFormValues>({
    resolver: zodResolver(RecipeSchema),
    defaultValues: {
      steps: [{ text: '' }],
      ingredients: [{ ingredient_id: '', name: '', amount: '', store: '' }],
    }
  })

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({ control, name: 'steps' })
  const { fields: ingFields, append: appendIng, remove: removeIng } = useFieldArray({ control, name: 'ingredients' })

  const onSubmit = (data: RecipeFormValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = await createRecipe(data)
      if (res?.error) setServerError(res.error)
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/recipes" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft />
        </Link>
        <h1 className="text-2xl font-black text-slate-900">Nueva Receta</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* --- Nombre --- */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre del plato</label>
          <input
            {...register('name')}
            placeholder="Ej: Macarrones con tomate"
            className="w-full p-4 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        {/* --- Ingredientes --- */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="font-bold text-lg">🍅 Ingredientes</h2>
              <p className="text-xs text-slate-400 mt-0.5">Busca en tu catálogo o escribe uno nuevo</p>
            </div>
            <button
              type="button"
              onClick={() => appendIng({ ingredient_id: '', name: '', amount: '', store: '' })}
              className="text-emerald-600 text-sm font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Plus size={16} /> Añadir
            </button>
          </div>

          <div className="space-y-3">
            {ingFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                {/* Cantidad */}
                <input
                  {...register(`ingredients.${index}.amount`)}
                  placeholder="Cant."
                  className="w-20 shrink-0 p-3 rounded-xl border border-slate-200 text-sm bg-slate-50 focus:border-emerald-400 outline-none"
                />

                {/* Combobox de ingrediente */}
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

                {/* Eliminar fila */}
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

          {errors.ingredients && typeof errors.ingredients.message === 'string' && (
            <p className="text-red-500 text-sm mt-2">{errors.ingredients.message}</p>
          )}
        </section>

        {/* --- Pasos --- */}
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
          {isPending ? 'Guardando...' : <><Save size={20} /> Guardar Receta</>}
        </button>
      </form>
    </div>
  )
}
