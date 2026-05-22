import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksClient from './TasksClient'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const year = now.getFullYear()

  const [{ data: tasks }, { data: completions }, { data: profiles }] = await Promise.all([
    supabase.from('household_tasks').select('*').order('frequency').order('day_of_week').order('title'),
    supabase.from('task_completions')
      .select('*')
      .gte('completed_date', `${year}-01-01`)
      .lte('completed_date', `${year}-12-31`),
    supabase.from('profiles').select('id, display_name, email').order('display_name'),
  ])

  return (
    <TasksClient
      tasks={tasks ?? []}
      completions={completions ?? []}
      profiles={profiles ?? []}
      currentUser={user.email ?? ''}
    />
  )
}
