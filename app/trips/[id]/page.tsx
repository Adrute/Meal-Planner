import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import TripDetail from './TripDetail'

export const dynamic = 'force-dynamic'

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: trip },
    { data: transport },
    { data: accommodations },
    { data: activities },
    { data: pois },
    { data: expenses },
    { data: checklist },
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('id', id).single(),
    supabase.from('trip_transport').select('*').eq('trip_id', id).order('departure_at', { ascending: true }),
    supabase.from('trip_accommodations').select('*').eq('trip_id', id).order('check_in', { ascending: true }),
    supabase.from('trip_activities').select('*').eq('trip_id', id).order('date').order('start_time'),
    supabase.from('trip_pois').select('*').eq('trip_id', id).order('created_at'),
    supabase.from('trip_expenses').select('*').eq('trip_id', id).order('date', { ascending: false }),
    supabase.from('trip_checklist').select('*').eq('trip_id', id).order('category').order('created_at'),
  ])

  if (!trip) notFound()

  return (
    <TripDetail
      trip={trip}
      transport={transport ?? []}
      accommodations={accommodations ?? []}
      activities={activities ?? []}
      pois={pois ?? []}
      expenses={expenses ?? []}
      checklist={checklist ?? []}
    />
  )
}
