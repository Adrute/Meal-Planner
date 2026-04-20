'use client'

import { useForm, useFieldArray, Controller, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RecipeSchema, RecipeFormValues, CatalogIngredient } from '@/types/schema'
import { createRecipe, updateRecipe } from './actions'
import { Plus, Trash2, Save, ChevronLeft, Clock, Tag, AlertCircle } from 'lucide-react'
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

function getValidationSummary(errors: FieldErrors<RecipeFormValues>): string[] {
  const msgs: string[] = []
  if (errors.name) msgs.push(errors.name.message ?? 'El nombre es obligatorio.')
  if (errors.steps?.root || errors.steps?.message) {
    msgs.push('Añade al menos un paso de preparación.')
  } else if (Array.isArray(errors.steps)) {
    const hasEmptyStep = errors.steps.some(s => s?.text)
    if (hasEmptyStep) msgs.push('Hay pasos vacíos — escribe algo en cada paso o elimínalo.')
  }
  if (errors.ingredients?.root || (errors.ingredients as any)?.message) {
    msgs.push('Añade al menos un ingrediente.')
  } else if (Array.isArray(errors.ingredients)) {
    const hasEmptyName = errors.ingredients.some(i => i?.name)
    const hasEmptyAmount = errors.ingredients.some(i => i?.amount)
    if (hasEmptyName) msgs.push('Faltan nombres de ingredientes.')
    if (hasEmptyAmount) msgs.push('Faltan cantidades en algún ingrediente.')
  }
  return msgs
}

type Props = {
  ingredients: CatalogIngredient[]
  mode: 'create' | 'edit'
  recipeId?: string
  defaultValues?: Partial<RecipeFormValues>
}

export default function RecipeForm({ ingredients, mode, recipeId, defaultValues }: Props) {
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

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
    setValidationErrors([])
    startTransition(async () => {
      const res = mode === 'edit' && recipeId
        ? await updateRecipe(recipeId, data)
        : await createRecipe(data)
      if (res?.error) setServerError(res.error)
    })
  }

  const onValidationError = (errs: FieldErrors<RecipeFormValues>) => {
    setValidationErrors(getValidationSummary(errs))
  }

  const hasStepErrors = Array.isArray(errors.steps)
    ? errors.steps.some(s => s?.text)
    : !!errors.steps

  const hasIngredientErrors = Array.isArray(errors.ingredients)
    ? errors.ingredients.some(i => i?.name || i?.amount)
    : !!errors.ingredients

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

      <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-6">

        {/* Nombre */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">Nombre del plato</label>
          <input
            {...register('name')}
            placeholder="Ej: Macarrones con tomate"
            className={`w-full p-4 rounded-xl border bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-colors ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
          />
          {errors.name && (
            <p className="text-red-500 text-sm flex items-center gap-1.5">
              <AlertCircle size={14} /> {errors.name.message}
            </p>
          )}
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
        <section className={`bg-white p-5 rounded-2xl border shadow-sm transition-colors ${hasIngredientErrors ? 'border-red-200' : 'border-slate-100'}`}>
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
            {ingFields.map((field, index) => {
              const ingError = Array.isArray(errors.ingredients) ? errors.ingredients[index] : undefined
              return (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex flex-col gap-1">
                    <input
                      {...register(`ingredients.${index}.amount`)}
                      placeholder="Cant."
                      className={`w-16 shrink-0 p-3 rounded-xl border text-sm bg-slate-50 focus:border-emerald-400 outline-none transition-colors ${ingError?.amount ? 'border-red-300' : 'border-slate-200'}`}
                    />
                  </div>
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
                        error={!!ingError?.name}
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
              )
            })}
          </div>
        </section>

        {/* Pasos */}
        <section className={`bg-white p-5 rounded-2xl border shadow-sm transition-colors ${hasStepErrors ? 'border-red-200' : 'border-slate-100'}`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="font-bold text-lg">👨‍🍳 Pasos</h2>
              {hasStepErrors && (
                <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                  <AlertCircle size={12} /> Rellena todos los pasos o elimina los vacíos
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => appendStep({ text: '' })}
              className="text-emerald-600 text-sm font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Plus size={16} /> Añadir Paso
            </button>
          </div>

          <div className="space-y-3">
            {stepFields.map((field, index) => {
              const stepError = Array.isArray(errors.steps) ? errors.steps[index]?.text : undefined
              return (
                <div key={field.id} className="flex gap-3 items-start">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mt-3 shrink-0 ${stepError ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                    {index + 1}
                  </span>
                  <textarea
                    {...register(`steps.${index}.text`)}
                    placeholder={`Describe el paso ${index + 1}...`}
                    rows={2}
                    className={`flex-1 p-3 rounded-xl border text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition-colors ${stepError ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
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
              )
            })}
          </div>
        </section>

        {/* Banner de errores de validación */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700 mb-1">Revisa el formulario antes de guardar:</p>
              <ul className="space-y-0.5">
                {validationErrors.map((msg, i) => (
                  <li key={i} className="text-sm text-red-600">· {msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Banner de error del servidor */}
        {serverError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-700">{serverError}</p>
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
