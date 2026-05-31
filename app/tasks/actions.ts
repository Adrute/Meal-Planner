'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTask(data: {
  title: string
  frequency: string
  day_of_week?: string
  assigned_to?: string
  notes?: string
  custom_interval_days?: number | null
  last_done_date?: string | null
}) {
  const supabase = await createClient()
  const { data: created, error } = await supabase.from('household_tasks').insert({
    title: data.title,
    frequency: data.frequency,
    day_of_week: data.day_of_week || null,
    assigned_to: data.assigned_to || null,
    notes: data.notes || null,
    custom_interval_days: data.custom_interval_days || null,
  }).select('id').single()
  if (error) return { error: error.message }

  if (data.last_done_date && created) {
    await supabase.from('task_completions').insert({
      task_id: created.id,
      completed_date: data.last_done_date,
      completed_by: null,
    })
  }

  revalidatePath('/tasks')
  return { success: true }
}

export async function updateTask(id: string, data: {
  title: string
  frequency: string
  day_of_week?: string
  assigned_to?: string
  notes?: string
  custom_interval_days?: number | null
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('household_tasks').update({
    title: data.title,
    frequency: data.frequency,
    day_of_week: data.day_of_week || null,
    assigned_to: data.assigned_to || null,
    notes: data.notes || null,
    custom_interval_days: data.custom_interval_days || null,
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

export async function completeTask(taskId: string, completedBy: string, date?: string) {
  const supabase = await createClient()
  const completedDate = date ?? new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('task_completions').insert({
    task_id: taskId,
    completed_date: completedDate,
    completed_by: completedBy,
  })
  if (error) return { error: error.message }
  revalidatePath('/tasks')
  return { success: true }
}

export async function uncompleteTaskOnDate(taskId: string, date: string) {
  const supabase = await createClient()
  await supabase.from('task_completions').delete().eq('task_id', taskId).eq('completed_date', date)
  revalidatePath('/tasks')
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
    const monday = new Date(now); monday.setDate(now.getDate() - day + 1)
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
    query = query
      .gte('completed_date', monday.toISOString().split('T')[0])
      .lte('completed_date', sunday.toISOString().split('T')[0])
  } else if (period === 'year') {
    const year = new Date().getFullYear()
    query = query.gte('completed_date', `${year}-01-01`).lte('completed_date', `${year}-12-31`)
  } else if (period === 'recent') {
    // custom interval tasks: delete the most recent completion
    const { data } = await supabase.from('task_completions')
      .select('id').eq('task_id', taskId).order('completed_date', { ascending: false }).limit(1).single()
    if (data) await supabase.from('task_completions').delete().eq('id', data.id)
    revalidatePath('/tasks')
    return
  }

  await query
  revalidatePath('/tasks')
}

// Uses select+update to avoid overwriting unrelated columns
export async function setTaskWeekDay(taskId: string, weekStart: string, dayOfWeek: string | null) {
  const supabase = await createClient()
  const { data: existing } = await supabase.from('task_week_assignments')
    .select('id').eq('task_id', taskId).eq('week_start', weekStart).maybeSingle()

  if (existing) {
    await supabase.from('task_week_assignments').update({ day_of_week: dayOfWeek }).eq('id', existing.id)
  } else if (dayOfWeek !== null) {
    await supabase.from('task_week_assignments').insert({ task_id: taskId, week_start: weekStart, day_of_week: dayOfWeek })
  }
  revalidatePath('/tasks')
  return { success: true }
}

export async function deleteCompletedContract(id: string) {
  const supabase = await createClient()
  await supabase.from('task_completions').delete().eq('task_id', id)
  await supabase.from('household_tasks').delete().eq('id', id)
  revalidatePath('/tasks')
}

export async function setTaskWeekAssignee(taskId: string, weekStart: string, assignedTo: string | null) {
  const supabase = await createClient()
  const { data: existing } = await supabase.from('task_week_assignments')
    .select('id').eq('task_id', taskId).eq('week_start', weekStart).maybeSingle()

  if (existing) {
    await supabase.from('task_week_assignments').update({ assigned_to: assignedTo }).eq('id', existing.id)
  } else if (assignedTo !== null) {
    await supabase.from('task_week_assignments').insert({ task_id: taskId, week_start: weekStart, assigned_to: assignedTo })
  }
  revalidatePath('/tasks')
  return { success: true }
}
