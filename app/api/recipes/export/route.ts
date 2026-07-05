import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, name, category, prep_time, is_favorite, steps, recipe_ingredients(amount, ingredients(name))')
    .order('name', { ascending: true })

  if (error) return NextResponse.json({ error: 'Error cargando recetas' }, { status: 500 })

  const withIngredients = (recipes ?? []).filter(
    (r: any) => r.recipe_ingredients?.length > 0
  )

  const lines: string[] = ['# Recetario familiar\n']

  for (const r of withIngredients as any[]) {
    lines.push(`## ${r.name}`)
    lines.push(`**ID:** ${r.id}`)

    const meta: string[] = []
    if (r.category) meta.push(`**Categoría:** ${r.category}`)
    if (r.prep_time) meta.push(`**Tiempo:** ${r.prep_time} min`)
    if (r.is_favorite) meta.push(`⭐ Favorita`)
    if (meta.length) lines.push(meta.join(' · '))

    lines.push('')
    lines.push('### Ingredientes')
    for (const item of r.recipe_ingredients) {
      const name = item.ingredients?.name ?? '?'
      lines.push(`- ${item.amount ? `${item.amount} de ` : ''}${name}`)
    }

    if (r.steps?.length) {
      lines.push('')
      lines.push('### Preparación')
      r.steps.forEach((step: string, i: number) => {
        lines.push(`${i + 1}. ${step}`)
      })
    }

    lines.push('\n---\n')
  }

  const md = lines.join('\n')
  const date = new Date().toISOString().slice(0, 10)
  const filename = `recetas-${date}.md`

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
