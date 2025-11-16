import { createClient } from '@supabase/supabase-js'

// Lee las variables de entorno Vite: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase: faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el entorno')
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')
