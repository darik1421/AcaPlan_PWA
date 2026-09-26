// Mantiene el cierre local disponible aunque falle Supabase o la conexión.
export async function endSession({ auth, storage, sessionStorage, navigate, timeoutMs = 3500 }) {
  let confirmed = false
  let timer
  try {
    const result = await Promise.race([
      auth.signOut({ scope: 'local' }),
      new Promise(resolve => { timer = setTimeout(() => resolve({ error: true }), timeoutMs) }),
    ])
    confirmed = !result.error
  } catch { /* La limpieza local se realiza también sin conexión. */ }
  finally { clearTimeout(timer) }
  storage.removeItem('acaplan-pwa-auth')
  storage.removeItem('acaplan-pwa-auth-code-verifier')
  sessionStorage.removeItem('acaplan-recovery')
  try { await auth.stopAutoRefresh() } catch { /* No impedir la salida por un fallo del SDK. */ }
  navigate(confirmed ? '/?salida=ok' : '/?salida=local')
}
