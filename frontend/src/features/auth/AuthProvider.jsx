import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getProfile, logout } from '../../services/session'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const lastCheck = useRef(-Infinity)
  const identity = useRef(null)
  const hasProfile = useRef(false)
  const [session, setSession] = useState(null)
  const [initialized, setInitialized] = useState(!supabase)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [recovery, setRecovery] = useState(false)
  const [revision, setRevision] = useState(0)
  const [accessRevision, setAccessRevision] = useState(0)
  const userId = session?.user.id
  const accessToken = session?.access_token
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
    if (!accessToken || recovery) {
      hasProfile.current = false
      setProfile(null)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    lastCheck.current = Date.now()
    setError('')
    setLoading(!hasProfile.current)
    getProfile(accessToken, controller.signal).then(value => {
      if (!controller.signal.aborted) { hasProfile.current = true; setProfile(value); setAccessRevision(n=>n+1) }
    }).catch(err => {
      if (!controller.signal.aborted) {
        // Un fallo de red no equivale a que Auth haya cerrado la sesión.
        if (!hasProfile.current || [401,403].includes(err.status)) { hasProfile.current = false; setProfile(null) }
        setError(err.message || 'No se pudo conectar con el servidor.')
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [accessToken, userId, recovery, revision])

  useEffect(() => {
    if (!userId || recovery) return
    const refresh = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck.current >= 60000) retry()
    }
    const reconnect = () => retry()
    const interval = setInterval(refresh, 60000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', reconnect)
    return () => { clearInterval(interval); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('online', reconnect) }
  }, [userId, recovery, retry])

  return <AuthContext.Provider value={{
    session, profile, error, recovery, retry, accessRevision,
    loading: !initialized || (Boolean(session) && loading),
    logout,
  }}>{children}</AuthContext.Provider>
}
