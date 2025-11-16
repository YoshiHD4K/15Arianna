import { supabase } from '../lib/supabase'

// Adaptación de utilidades de autenticación para usar Supabase Auth

export async function registerAdmin({ name, email, password }) {
  if (!name || !email || !password) {
    return { ok: false, message: 'Todos los campos son obligatorios.' }
  }

  // Usamos supabase.auth.signUp
  try {
    const res = await supabase.auth.signUp({ email, password }, { data: { name } })
    if (res.error) return { ok: false, message: res.error.message }
    // res.data.user puede ser nulo si se necesita confirmación por email, devolvemos info mínima
    return { ok: true, message: 'Administrador creado. Revisa tu email si se requiere verificación.', user: res.data.user ?? null }
  } catch (err) {
    return { ok: false, message: err?.message ?? 'Error al registrar' }
  }
}

export async function loginAdmin(email, password) {
  try {
    const res = await supabase.auth.signInWithPassword({ email, password })
    if (res.error) return { ok: false, message: res.error.message }
    return { ok: true, message: 'Sesión iniciada.', session: res.data.session }
  } catch (err) {
    return { ok: false, message: err?.message ?? 'Error al iniciar sesión' }
  }
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function getAdmin() {
  const res = await supabase.auth.getUser()
  if (res.error) return null
  return res.data.user
}

export async function getSession() {
  const res = await supabase.auth.getSession()
  if (res.error) return null
  return res.data.session
}

export async function isAuthenticated() {
  const s = await getSession()
  return !!s
}
