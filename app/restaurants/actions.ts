'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addRestaurant(restaurantData: {
  name: string
  lat: number
  lng: number
  status: string
  comments: string
  allergens: string[]
  is_favorite: boolean
  food_type: string
  reservation_date: string | null
}) {
  const supabase = await createClient()
  
  await supabase.from('restaurants').insert([{
    name: restaurantData.name,
    lat: restaurantData.lat,
    lng: restaurantData.lng,
    status: restaurantData.status,
    comments: restaurantData.comments,
    allergens: restaurantData.allergens,
    is_favorite: restaurantData.is_favorite,
    food_type: restaurantData.food_type,
    reservation_date: restaurantData.reservation_date || null
  }])

  revalidatePath('/restaurants')
}

export async function deleteRestaurant(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  
  await supabase.from('restaurants').delete().eq('id', id)
  
  // Al borrar, volvemos al mapa
  revalidatePath('/restaurants')
}

// --- NUEVAS FUNCIONES PARA LISTAS Y EDICIÓN ---

export async function createList(name: string) {
  const supabase = await createClient()
  await supabase.from('restaurant_lists').insert([{ name }])
  // Refrescamos la página de detalle para que aparezca la lista
  revalidatePath('/restaurants/[id]', 'page') 
}

export async function toggleList(restaurantId: string, listId: string, isAdding: boolean) {
  const supabase = await createClient()
  if (isAdding) {
    await supabase.from('restaurant_list_items').insert([{ restaurant_id: restaurantId, list_id: listId }])
  } else {
    await supabase.from('restaurant_list_items').delete().match({ restaurant_id: restaurantId, list_id: listId })
  }
  revalidatePath(`/restaurants/${restaurantId}`)
}

export async function updateRestaurant(id: string, restaurantData: any) {
  const supabase = await createClient()
  await supabase.from('restaurants').update(restaurantData).eq('id', id)
  revalidatePath(`/restaurants/${id}`)
  revalidatePath('/restaurants')
}

export async function addReservation(restaurantId: string, date: string) {
  const supabase = await createClient()
  await supabase.from('reservations').insert([{ restaurant_id: restaurantId, reservation_date: date }])
  revalidatePath('/', 'layout') 
}

export async function cancelReservation(id: string) {
  const supabase = await createClient()
  await supabase.from('reservations').delete().eq('id', id)
  revalidatePath('/', 'layout')
}

export async function updateReservationDate(id: string, newDate: string) {
  const supabase = await createClient()
  await supabase.from('reservations').update({ reservation_date: newDate }).eq('id', id)
  revalidatePath('/', 'layout')
}