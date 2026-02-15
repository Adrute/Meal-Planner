'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RecipeSchema, RecipeFormValues } from '@/types/schema'
import { createRecipe } from '../actions' // Importamos la acción del paso anterior
import { Plus, Trash2, Save, ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'

export default function NewRecipePage() {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  // Configuración del formulario
  const { register, control, handleSubmit, formState: { errors } } = useForm<RecipeFormValues>({
    resolver: zodResolver(RecipeSchema),
    defaultValues: {
      steps: [{ text: '' }],
      ingredients: [{ name: '', amount: '', store: 'Mercadona' }]
    }
  })

  // Gestión de listas dinámicas
  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control,
    name: "steps"
  })

  const { fields: ingFields, append: appendIng, remove: removeIng } = useFieldArray({
    control,
    name: "ingredients"
  })

  const onSubmit = (data: RecipeFormValues) => {
    setServerError(null)
    startTransition(async () => {
      const res = await createRecipe(data)
      if (res?.error) setServerError(res.error)
    })
  }

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      {/* Botón Volver */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/recipes" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft />
        </Link>
        <h1 className="text-2xl font-bold">Nueva Receta</h1>
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">🍅 Ingredientes</h2>
            <button 
              type="button" 
              onClick={() => appendIng({ name: '', amount: '', store: 'General' })}
              className="text-emerald-600 text-sm font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
            >
              <Plus size={16} /> Añadir
            </button>
          </div>
          
          <div className="space-y-3">
            {ingFields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start">
                <div className="grid grid-cols-12 gap-2 flex-1">
                  <input 
                    {...register(`ingredients.${index}.amount`)}
                    placeholder="Cant."
                    className="col-span-3 p-3 rounded-xl border border-slate-200 text-sm bg-slate-50"
                  />
                  <input 
                    {...register(`ingredients.${index}.name`)}
                    placeholder="Ingrediente..."
                    className="col-span-9 p-3 rounded-xl border border-slate-200 text-sm font-medium"
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => removeIng(index)}
                  className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          {errors.ingredients && <p className="text-red-500 text-sm mt-2">{errors.ingredients.message}</p>}
        </section>

        {/* --- Pasos --- */}
        <section className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">👨‍🍳 Pasos</h2>
            <button 
              type="button" 
              onClick={() => appendStep({ text: '' })}
              className="text-emerald-600 text-sm font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
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
                  className="mt-2 text-slate-300 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* --- Errores y Botón --- */}
        {serverError && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium text-center border border-red-100">
            {serverError}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700"
        >
          {isPending ? 'Guardando...' : <><Save size={20} /> Guardar Receta</>}
        </button>

      </form>
    </div>
  )
}