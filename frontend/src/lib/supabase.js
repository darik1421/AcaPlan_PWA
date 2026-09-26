import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const publicKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// Capturar antes de que el SDK procese y retire los parámetros del enlace.
export const authLinkError = new URLSearchParams(window.location.hash.slice(1)).has('error')
  || new URLSearchParams(window.location.search).has('error')

function isPublicConfiguration() {
  if (!url || !publicKey || url.includes('YOUR_PROJECT') || publicKey.includes('YOUR_PUBLIC')) return false
  try {
    if (new URL(url).protocol !== 'https:') return false
    if (publicKey.startsWith('sb_publishable_')) return true
    if (publicKey.startsWith('sb_secret_')) return false
    const encoded = publicKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(encoded)).role === 'anon'
  } catch {
    return false
  }
}

// Solo claves públicas. Las políticas RLS deben proteger los datos.
export const supabaseConfigured = isPublicConfiguration()
export const supabase = supabaseConfigured ? createClient(url, publicKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'acaplan-pwa-auth',
  },
}) : null
