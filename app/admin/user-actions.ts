'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const ADMIN_EMAIL = 'claudrian1992@gmail.com'

async function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) throw new Error('No autorizado')
}

export async function createUser(email: string, password: string, displayName: string) {
  await assertAdmin()
  const admin = await getAdminClient()

  const allPermissions = ['meals','recipes','shopping','finances','utilities','services','restaurants','wishlist']

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName, permissions: allPermissions },
  })
  if (error) return { error: error.message }

  // Insertar en profiles
  await admin.from('profiles').upsert({
    id: data.user.id,
    email: data.user.email,
    display_name: displayName || null,
    permissions: allPermissions,
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function deleteUser(userId: string) {
  await assertAdmin()
  const admin = await getAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { success: true }
}

export async function updateUserDisplayName(userId: string, displayName: string) {
  await assertAdmin()
  const admin = await getAdminClient()
  await admin.from('profiles').update({ display_name: displayName || null }).eq('id', userId)
  revalidatePath('/admin')
  return { success: true }
}

export async function updateUserPermissions(userId: string, permissions: string[]) {
  await assertAdmin()
  const admin = await getAdminClient()
  await admin.from('profiles').update({ permissions }).eq('id', userId)
  // Sync permissions to JWT user_metadata so middleware can check without a DB call
  await admin.auth.admin.updateUserById(userId, { user_metadata: { permissions } })
  revalidatePath('/admin')
  return { success: true }
}
