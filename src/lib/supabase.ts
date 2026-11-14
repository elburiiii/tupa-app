import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!url || !anonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. See README.')
}

/** Shared browser client. Only the anon key is used; RLS protects every table. */
export const supabase = createClient(url, anonKey)

export const STORAGE_BUCKET = 'contracts'
