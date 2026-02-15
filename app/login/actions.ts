'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Acción de Registro
export async function signup(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  // 1. Comprobar si ya existe
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (existing) {
    return { error: 'El usuario ya existe. Prueba otro nombre.' }
  }

  // 2. Crear usuario (Por defecto 'user')
  // Truco: Si el usuario es "DANTE", le damos admin automáticamente al registrarse si no existía
  const role = username.toUpperCase() === 'DANTE' ? 'admin' : 'user'

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ username, password, role })
    .select()
    .single()

  if (error) {
    return { error: 'Error al crear usuario: ' + error.message }
  }

  // 3. Iniciar sesión automáticamente
  await createSession(newUser)
  redirect('/')
}

// Acción de Login
export async function login(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single()

  if (error || !user) {
    return { error: 'Usuario o contraseña incorrectos' }
  }

  await createSession(user)
  redirect('/')
}

// Acción de Logout
export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('meal_session')
  redirect('/login')
}

// Función auxiliar para crear la cookie
async function createSession(user: any) {
  const sessionData = JSON.stringify({ 
    id: user.id, 
    username: user.username, 
    role: user.role 
  })

  const cookieStore = await cookies()
  cookieStore.set('meal_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
  })
}