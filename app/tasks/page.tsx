import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksClient from './TasksClient'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const year = new Date().getFullYear()

  const [{ data: tasks }, { data: completions }, { data: profiles }, { data: weekAssignments }] = await Promise.all([
    supabase.from('household_tasks').select('*').order('frequency').order('day_of_week').order('title'),
    supabase.from('task_completions')
      .select('*')
      .gte('completed_date', `${year}-01-01`)
      .lte('completed_date', `${year}-12-31`),
    supabase.from('profiles').select('id, display_name, email').order('display_name'),
    supabase.from('task_week_assignments')
      .select('*')
      .gte('week_start', `${year}-01-01`)
      .lte('week_start', `${year}-12-31`),
  ])

  return (
    <TasksClient
      tasks={tasks ?? []}
      completions={completions ?? []}
      profiles={profiles ?? []}
      weekAssignments={weekAssignments ?? []}
      currentUser={user.email ?? ''}
    />
  )
}
