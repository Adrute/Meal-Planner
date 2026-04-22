import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TripsClient from './TripsClient'

export const dynamic = 'force-dynamic'

export default async function TripsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <TripsClient trips={trips ?? []} />
}
