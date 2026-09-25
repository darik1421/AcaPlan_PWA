import { useState } from 'react'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import { useAuth } from './AuthContext'

export default function RecoveryPage() {
  const { recovery, logout } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [changed, setChanged] = useState(false)
  const hasLinkError = new URLSearchParams(window.location.hash.slice(1)).has('error')
    || new URLSearchParams(window.location.search).has('error')
  async function submit(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setError('')
    if (recovery && values.get('password') !== values.get('confirmation')) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    try {
      if (recovery) {
        const { error: failure } = await supabase.auth.updateUser({ password: values.get('password') })
        if (failure) throw new Error('No se pudo actualizar la contraseña. Comprueba la política de contraseña o solicita otro enlace.')
        setChanged(true)
      } else {
        const { error: failure } = await supabase.auth.resetPasswordForEmail(
          values.get('email').trim().toLowerCase(),
          { redirectTo: new URL('/recuperar', window.location.origin).href },
        )
        // La respuesta no confirma ni descarta que exista una cuenta.
        if (failure?.status === 429) throw new Error('Espera unos minutos antes de volver a solicitar el enlace.')
        if (failure && (!failure.status || failure.status >= 500)) throw new Error('No se pudo enviar la solicitud. Intenta de nuevo.')
        setSent(true)
      }
    } catch (failure) { setError(failure.message || 'No se pudo completar la solicitud.') }
    finally { setBusy(false) }
  }
  return <section className="recovery-wrap"><div className="auth-card">
    <p className="eyebrow">RECUPERACIÓN DE ACCESO</p>
    <h2>{recovery ? 'Crea una nueva contraseña' : 'Recupera tu cuenta'}</h2>
    {hasLinkError && <p className="error" role="alert">El enlace no es válido o ha vencido. Solicita uno nuevo.</p>}
    {!supabaseConfigured && <p className="error" role="alert">Falta configurar Supabase.</p>}
    {changed ? <><p className="success" role="status">Contraseña actualizada. Cierra esta sesión y vuelve a ingresar con la nueva contraseña.</p><button className="primary" onClick={logout}>Volver al inicio de sesión</button></>
      : sent ? <><p className="success" role="status">Si el correo corresponde a una cuenta, recibirás las instrucciones de recuperación. Revisa también la carpeta de correo no deseado.</p><a href="/">Volver al acceso</a></>
      : <form onSubmit={submit}>
        <p className="muted">{recovery ? 'Utiliza al menos 8 caracteres. La política de Supabase puede exigir requisitos adicionales.' : 'Te enviaremos un enlace para restablecer tu contraseña.'}</p>
        {recovery ? <>
          <label htmlFor="new-password">Nueva contraseña</label>
          <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required disabled={busy} />
          <label htmlFor="confirmation">Repite la contraseña</label>
          <input id="confirmation" name="confirmation" type="password" autoComplete="new-password" minLength={8} required disabled={busy} />
        </> : <>
          <label htmlFor="recovery-email">Correo institucional</label>
          <input id="recovery-email" name="email" type="email" autoComplete="email" maxLength={100} required disabled={busy} />
        </>}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy || !supabaseConfigured}>{busy ? 'Procesando…' : recovery ? 'Guardar contraseña' : 'Enviar enlace'}</button>
        <a className="back-link" href="/">Volver al acceso</a>
      </form>}
  </div></section>
}

