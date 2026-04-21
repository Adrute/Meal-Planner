import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HealthDashboard from './HealthDashboard'

export const dynamic = 'force-dynamic'

export default async function HealthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: weightLogs }, { data: runningLogs }] = await Promise.all([
    supabase
      .from('weight_logs')
      .select('id, date, weight_kg, notes')
      .eq('user_id', user.id)
      .order('date', { ascending: true }),
    supabase
      .from('running_logs')
      .select('id, date, distance_km, duration_minutes, feeling, notes')
      .eq('user_id', user.id)
      .order('date', { ascending: true }),
  ])

  return (
    <HealthDashboard
      weightLogs={weightLogs ?? []}
      runningLogs={runningLogs ?? []}
    />
  )
}
