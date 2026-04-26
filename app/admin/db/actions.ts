'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'claudrian1992@gmail.com'

async function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('No autorizado')
}

export async function updateRow(table: string, id: string, data: Record<string, unknown>) {
  await assertAdmin()
  const supabase = await getAdminClient()
  const { error } = await supabase.from(table).update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/db')
  return { success: true }
}

export async function deleteRow(table: string, id: string) {
  await assertAdmin()
  const supabase = await getAdminClient()
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/db')
  return { success: true }
}
