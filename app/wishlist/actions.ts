'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type WishItemInput = {
  name: string
  description: string
  type: string
  url: string
  price_estimate: string
  priority: string
}

export async function createWishItem(data: WishItemInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.rpc('create_wish_item', {
    p_user_id: user.id,
    p_name: data.name.trim(),
    p_description: data.description.trim() || null,
    p_type: data.type,
    p_url: data.url.trim() || null,
    p_price_estimate: data.price_estimate ? parseFloat(data.price_estimate) : null,
    p_priority: data.priority,
  })
  if (error) return { error: error.message }
  revalidatePath('/wishlist')
  return { success: true }
}

export async function updateWishItem(id: string, data: WishItemInput) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('update_wish_item', {
    p_id: id,
    p_name: data.name.trim(),
    p_description: data.description.trim() || null,
    p_type: data.type,
    p_url: data.url.trim() || null,
    p_price_estimate: data.price_estimate ? parseFloat(data.price_estimate) : null,
    p_priority: data.priority,
  })
  if (error) return { error: error.message }
  revalidatePath('/wishlist')
  return { success: true }
}

export async function deleteWishItem(id: string) {
  const supabase = await createClient()
  await supabase.rpc('delete_wish_item', { p_id: id })
  revalidatePath('/wishlist')
}

export async function toggleWishField(
  id: string,
  field: 'is_shareable' | 'is_purchased',
  value: boolean,
) {
  const supabase = await createClient()
  await supabase.rpc('toggle_wish_field', { p_id: id, p_field: field, p_value: value })
  revalidatePath('/wishlist')
}

export async function shareWithUser(itemId: string, userId: string) {
  const supabase = await createClient()
  await supabase.rpc('share_wish_item', { p_item_id: itemId, p_user_id: userId })
  revalidatePath('/wishlist')
}

export async function unshareWithUser(itemId: string, userId: string) {
  const supabase = await createClient()
  await supabase.rpc('unshare_wish_item', { p_item_id: itemId, p_user_id: userId })
  revalidatePath('/wishlist')
}
