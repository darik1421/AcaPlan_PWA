import { useState } from 'react'
import { supabase, supabaseConfigured } from '../../lib/supabase'

export default function LoginPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const notice = new URLSearchParams(window.location.search).get('salida')

  async function submit(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    setError('')
    setBusy(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: values.get('email').trim().toLowerCase(), password: values.get('password'),
      })
      if (authError) setError(authError.status >= 500 || authError.name === 'AuthRetryableFetchError'
        ? 'No se pudo conectar con el servicio. Intenta nuevamente.'
        : 'No se pudo iniciar sesión. Revisa tus credenciales y el acceso de tu cuenta.')
    } catch { setError('No se pudo conectar. Comprueba tu conexión e intenta nuevamente.') }
    finally { setBusy(false) }
  }

  return <section className="auth-grid">
    <div className="auth-story">
      <p className="eyebrow">UNAN-MANAGUA · CUR-CHONTALES</p>
      <h1>La planificación<br />comienza aquí.</h1>
      <p>Un espacio para coordinar la programación académica y mantener a nuestra comunidad informada.</p>
      <div className="schedule-art" aria-hidden="true">
        <span>LUN</span><span>MAR</span><span>MIÉ</span><span>JUE</span><span>VIE</span>
        {Array.from({ length: 15 }, (_, i) => <i key={i} className={'block-' + i % 4} />)}
      </div>
      <span className="stage">Sprint 1 · Interfaz provisional</span>
    </div>
    <div className="auth-card">
      <p className="eyebrow">BIENVENIDO A ACAPLAN</p>
      <h2>Iniciar sesión</h2>
      <p className="muted">Accede con tu cuenta institucional registrada.</p>
      {notice === 'ok' && <p className="success" role="status">Sesión cerrada correctamente.</p>}
      {notice === 'local' && <p className="notice" role="status">Sesión cerrada en este navegador. No fue posible confirmar el cierre en el servidor.</p>}
      {!supabaseConfigured && <p className="error" role="alert">Falta configurar la conexión de Supabase.</p>}
      <form onSubmit={submit}>
        <label htmlFor="email">Correo institucional</label>
        <input id="email" name="email" type="email" autoComplete="username" maxLength={100} placeholder="tu.correo@institucion.edu.ni" required disabled={busy} />
        <label htmlFor="password">Contraseña</label>
        <div className="password-field">
          <input id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required disabled={busy} />
          <button className="reveal" type="button" onClick={() => setVisible(!visible)} aria-pressed={visible}>{visible ? 'Ocultar' : 'Mostrar'}</button>
        </div>
        <a className="forgot" href="/recuperar">¿Olvidaste tu contraseña?</a>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" disabled={busy || !supabaseConfigured}>{busy ? 'Verificando…' : 'Iniciar sesión'}</button>
      </form>
      <p className="auth-footnote">¿Necesitas una cuenta? Contacta al responsable de tu institución.</p>
    </div>
  </section>
}

