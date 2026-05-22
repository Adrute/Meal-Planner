'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTask(data: {
  title: string
  frequency: string
  day_of_week?: string
  assigned_to?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('household_tasks').insert({
    title: data.title,
    frequency: data.frequency,
    day_of_week: data.day_of_week || null,
    assigned_to: data.assigned_to || null,
    notes: data.notes || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function updateTask(id: string, data: {
  title: string
  frequency: string
  day_of_week?: string
  assigned_to?: string
  notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('household_tasks').update({
    title: data.title,
    frequency: data.frequency,
    day_of_week: data.day_of_week || null,
    assigned_to: data.assigned_to || null,
    notes: data.notes || null,
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  await supabase.from('household_tasks').delete().eq('id', id)
  revalidatePath('/tasks')
}

export async function completeTask(taskId: string, completedBy: string) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('task_completions').insert({
    task_id: taskId,
    completed_date: today,
    completed_by: completedBy,
  })
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function uncompleteTask(taskId: string, period: string) {
  const supabase = await createClient()

  let query = supabase.from('task_completions').delete().eq('task_id', taskId)

  if (period === 'today') {
    const today = new Date().toISOString().split('T')[0]
    query = query.eq('completed_date', today)
  } else if (period === 'week') {
    const now = new Date()
    const day = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - day + 1)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    query = query
      .gte('completed_date', monday.toISOString().split('T')[0])
      .lte('completed_date', sunday.toISOString().split('T')[0])
  } else if (period === 'year') {
    const year = new Date().getFullYear()
    query = query
      .gte('completed_date', `${year}-01-01`)
      .lte('completed_date', `${year}-12-31`)
  } else {
    // punctual: delete all
  }

  await query
  revalidatePath('/tasks')
}
