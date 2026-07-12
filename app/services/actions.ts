'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendBonoAgotadoEmail } from '@/lib/email'

export async function addService(formData: FormData) {
  const service_name = formData.get('service_name') as string
  const total_sessions = Number(formData.get('total_sessions'))
  const amount_paid = Number(formData.get('amount_paid'))
  const payment_date = formData.get('payment_date') as string || new Date().toISOString().split('T')[0]

  const supabase = await createClient()

  if (service_name && total_sessions > 0) {
    await supabase.from('service_passes').insert([{
      service_name,
      total_sessions,
      used_sessions: 0,
      amount_paid,
      last_payment_date: payment_date,
      session_dates: [],
    }])
    revalidatePath('/')
    revalidatePath('/services')
  }
}

export async function deleteService(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  await supabase.from('service_passes').delete().eq('id', id)
  revalidatePath('/')
  revalidatePath('/services')
}

export async function consumeSession(formData: FormData) {
  const id = formData.get('id') as string
  const consume_date = formData.get('consume_date') as string
  const supabase = await createClient()

  const { data } = await supabase
    .from('service_passes')
    .select('used_sessions, total_sessions, session_dates, service_name, amount_paid')
    .eq('id', id)
    .single()

  if (data) {
    const currentDates = data.session_dates || []
    currentDates.push(consume_date)
    const newUsed = data.used_sessions + 1

    await supabase.from('service_passes').update({
      used_sessions: newUsed,
      session_dates: currentDates,
    }).eq('id', id)

    if (newUsed >= data.total_sessions) {
      await sendBonoAgotadoEmail(data.service_name, data.total_sessions, data.amount_paid)
    }
  }

  revalidatePath('/')
  revalidatePath('/services')
}

export async function renewService(formData: FormData) {
  const id = formData.get('id') as string
  const renewal_date = formData.get('renewal_date') as string
  const supabase = await createClient()

  await supabase.from('service_passes').update({
    used_sessions: 0,
    last_payment_date: renewal_date,
    session_dates: [],
  }).eq('id', id)

  revalidatePath('/')
  revalidatePath('/services')
}
