'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─── Weight ──────────────────────────────────────────────────────────────────

export async function addWeightLog(date: string, weight_kg: number, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('weight_logs').upsert(
    { user_id: user.id, date, weight_kg, notes: notes || null },
    { onConflict: 'user_id, date' }
  )
  if (error) return { error: error.message }
  revalidatePath('/health')
  return { success: true }
}

export async function deleteWeightLog(id: string) {
  const supabase = await createClient()
  await supabase.from('weight_logs').delete().eq('id', id)
  revalidatePath('/health')
}

// ─── Running ─────────────────────────────────────────────────────────────────

export async function addRunningLog(data: {
  date: string
  distance_km: number
  duration_minutes: number
  feeling?: number
  notes?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('running_logs').insert({
    user_id: user.id,
    date: data.date,
    distance_km: data.distance_km,
    duration_minutes: data.duration_minutes,
    feeling: data.feeling ?? null,
    notes: data.notes || null,
  })
  if (error) return { error: error.message }
  revalidatePath('/health')
  return { success: true }
}

export async function deleteRunningLog(id: string) {
  const supabase = await createClient()
  await supabase.from('running_logs').delete().eq('id', id)
  revalidatePath('/health')
}
