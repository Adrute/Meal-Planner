'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ─── Trips ───────────────────────────────────────────────────────────────────

export async function createTrip(data: {
  title: string; destination: string; country?: string
  start_date?: string; end_date?: string; status: string
  notes?: string; budget_total?: number; cover_emoji?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { data: trip, error } = await supabase.from('trips').insert({
    user_id: user.id,
    title: data.title,
    destination: data.destination,
    country: data.country || null,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    status: data.status,
    notes: data.notes || null,
    budget_total: data.budget_total || null,
    cover_emoji: data.cover_emoji || '✈️',
  }).select('id').single()

  if (error) return { error: error.message }
  revalidatePath('/trips')
  redirect(`/trips/${trip.id}`)
}

export async function updateTrip(id: string, data: Partial<{
  title: string; destination: string; country: string
  start_date: string; end_date: string; status: string
  notes: string; budget_total: number; cover_emoji: string
}>) {
  const supabase = await createClient()
  const { error } = await supabase.from('trips').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/trips')
  revalidatePath(`/trips/${id}`)
  return { success: true }
}

export async function deleteTrip(id: string) {
  const supabase = await createClient()
  await supabase.from('trips').delete().eq('id', id)
  revalidatePath('/trips')
  redirect('/trips')
}

// ─── Transport ────────────────────────────────────────────────────────────────

export async function addTransport(tripId: string, data: {
  type: string; origin: string; destination: string
  departure_at?: string; arrival_at?: string
  booking_ref?: string; carrier?: string; price?: number; notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('trip_transport').insert({
    trip_id: tripId, type: data.type, origin: data.origin,
    destination: data.destination,
    departure_at: data.departure_at || null, arrival_at: data.arrival_at || null,
    booking_ref: data.booking_ref || null, carrier: data.carrier || null,
    price: data.price || null, notes: data.notes || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}`)
  return { success: true }
}

export async function deleteTransport(id: string, tripId: string) {
  const supabase = await createClient()
  await supabase.from('trip_transport').delete().eq('id', id)
  revalidatePath(`/trips/${tripId}`)
}

// ─── Accommodation ────────────────────────────────────────────────────────────

export async function addAccommodation(tripId: string, data: {
  name: string; address?: string; check_in?: string; check_out?: string
  total_price?: number; booking_ref?: string; url?: string; notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('trip_accommodations').insert({
    trip_id: tripId, name: data.name,
    address: data.address || null, check_in: data.check_in || null,
    check_out: data.check_out || null, total_price: data.total_price || null,
    booking_ref: data.booking_ref || null, url: data.url || null,
    notes: data.notes || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}`)
  return { success: true }
}

export async function deleteAccommodation(id: string, tripId: string) {
  const supabase = await createClient()
  await supabase.from('trip_accommodations').delete().eq('id', id)
  revalidatePath(`/trips/${tripId}`)
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function addActivity(tripId: string, data: {
  date: string; title: string; start_time?: string
  description?: string; location?: string; price?: number; notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('trip_activities').insert({
    trip_id: tripId, date: data.date, title: data.title,
    start_time: data.start_time || null, description: data.description || null,
    location: data.location || null, price: data.price || null,
    notes: data.notes || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}`)
  return { success: true }
}

export async function toggleActivityConfirmed(id: string, confirmed: boolean, tripId: string) {
  const supabase = await createClient()
  await supabase.from('trip_activities').update({ confirmed }).eq('id', id)
  revalidatePath(`/trips/${tripId}`)
}

export async function deleteActivity(id: string, tripId: string) {
  const supabase = await createClient()
  await supabase.from('trip_activities').delete().eq('id', id)
  revalidatePath(`/trips/${tripId}`)
}

// ─── POIs ─────────────────────────────────────────────────────────────────────

export async function addPoi(tripId: string, data: {
  name: string; lat?: number; lon?: number; osm_id?: string
  category?: string; address?: string; notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('trip_pois').insert({
    trip_id: tripId, name: data.name,
    lat: data.lat ?? null, lon: data.lon ?? null,
    osm_id: data.osm_id || null, category: data.category || null,
    address: data.address || null, notes: data.notes || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}`)
  return { success: true }
}

export async function togglePoiVisited(id: string, visited: boolean, tripId: string) {
  const supabase = await createClient()
  await supabase.from('trip_pois').update({ visited }).eq('id', id)
  revalidatePath(`/trips/${tripId}`)
}

export async function deletePoi(id: string, tripId: string) {
  const supabase = await createClient()
  await supabase.from('trip_pois').delete().eq('id', id)
  revalidatePath(`/trips/${tripId}`)
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function addExpense(tripId: string, data: {
  description: string; amount: number; category?: string
  date?: string; notes?: string
}) {
  const supabase = await createClient()
  const { error } = await supabase.from('trip_expenses').insert({
    trip_id: tripId, description: data.description, amount: data.amount,
    category: data.category || 'otro', date: data.date || null,
    notes: data.notes || null,
  })
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}`)
  return { success: true }
}

export async function deleteExpense(id: string, tripId: string) {
  const supabase = await createClient()
  await supabase.from('trip_expenses').delete().eq('id', id)
  revalidatePath(`/trips/${tripId}`)
}

// ─── Checklist ────────────────────────────────────────────────────────────────

export async function addChecklistItem(tripId: string, item: string, category: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('trip_checklist').insert({ trip_id: tripId, item, category })
  if (error) return { error: error.message }
  revalidatePath(`/trips/${tripId}`)
  return { success: true }
}

export async function toggleChecklistItem(id: string, checked: boolean, tripId: string) {
  const supabase = await createClient()
  await supabase.from('trip_checklist').update({ checked }).eq('id', id)
  revalidatePath(`/trips/${tripId}`)
}

export async function deleteChecklistItem(id: string, tripId: string) {
  const supabase = await createClient()
  await supabase.from('trip_checklist').delete().eq('id', id)
  revalidatePath(`/trips/${tripId}`)
}

export async function prefillChecklist(tripId: string) {
  const supabase = await createClient()
  const defaults = [
    { item: 'DNI / Pasaporte', category: 'documentos' },
    { item: 'Tarjeta de embarque / billetes', category: 'documentos' },
    { item: 'Seguro de viaje', category: 'documentos' },
    { item: 'Tarjeta bancaria', category: 'documentos' },
    { item: 'Medicación habitual', category: 'salud' },
    { item: 'Botiquín básico', category: 'salud' },
    { item: 'Cargador móvil', category: 'tecnología' },
    { item: 'Adaptador de enchufe', category: 'tecnología' },
    { item: 'Auriculares', category: 'tecnología' },
    { item: 'Ropa interior', category: 'ropa' },
    { item: 'Calcetines', category: 'ropa' },
    { item: 'Cepillo y pasta de dientes', category: 'higiene' },
    { item: 'Champú / gel', category: 'higiene' },
    { item: 'Protector solar', category: 'higiene' },
    { item: 'Gafas de sol', category: 'accesorios' },
    { item: 'Mochila de día', category: 'accesorios' },
  ]
  await supabase.from('trip_checklist').insert(defaults.map(d => ({ ...d, trip_id: tripId })))
  revalidatePath(`/trips/${tripId}`)
}
