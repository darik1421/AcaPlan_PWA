import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getProfile, logout } from '../../services/session'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const identity = useRef(null)
  const hasProfile = useRef(false)
  const [session, setSession] = useState(null)
  const [initialized, setInitialized] = useState(!supabase)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(false)
  const [revision, setRevision] = useState(0)
  const retry = useCallback(() => setRevision(value => value + 1), [])

  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY' && nextSession) {
        sessionStorage.setItem('acaplan-recovery', nextSession.user.id)
      }
      setRecovery(Boolean(nextSession && sessionStorage.getItem('acaplan-recovery') === nextSession.user.id))
      if (identity.current !== nextSession?.user.id) {
        identity.current = nextSession?.user.id
        hasProfile.current = false
        setProfile(null)
        setLoading(Boolean(nextSession))
      }
      setSession(nextSession)
      setInitialized(true)
      if (!nextSession) {
        setProfile(null)
        sessionStorage.removeItem('acaplan-recovery')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session || recovery) {
      hasProfile.current = false
      setProfile(null)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setError('')
    setLoading(!hasProfile.current)
    getProfile(session.access_token, controller.signal).then(value => {
      if (!controller.signal.aborted) { hasProfile.current = true; setProfile(value) }
    }).catch(err => {
      if (!controller.signal.aborted) { hasProfile.current = false; setProfile(null); setError(err.message || 'No se pudo conectar con el servidor.') }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [session, recovery, revision])

  useEffect(() => {
    if (!session || recovery) return
    const refresh = () => { if (document.visibilityState === 'visible') retry() }
    const interval = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(interval); window.removeEventListener('focus', refresh) }
  }, [session, recovery, retry])

  return <AuthContext.Provider value={{
    session, profile, error, recovery, retry,
    loading: !initialized || (Boolean(session) && loading),
    logout,
  }}>{children}</AuthContext.Provider>
}
