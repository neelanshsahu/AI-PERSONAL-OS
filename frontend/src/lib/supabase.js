/**
 * supabase.js — Supabase client singleton.
 *
 * Import `supabase` wherever you need to interact with Supabase
 * (auth, database, storage, etc.).
 *
 * Env vars (set in frontend/.env):
 *   VITE_SUPABASE_URL      — your project URL
 *   VITE_SUPABASE_ANON_KEY — your project's anon/public key
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Supabase credentials missing.\n' +
    'Copy frontend/.env.example → frontend/.env and fill in your project credentials.\n' +
    'Get them from: Supabase Dashboard → Project Settings → API',
  )
}

export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      persistSession: true,        // Persist session in localStorage
      autoRefreshToken: true,      // Auto-refresh JWT before expiry
      detectSessionInUrl: true,    // Handle OAuth redirect callbacks
    },
  },
)
