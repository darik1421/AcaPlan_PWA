import { useState } from 'react'
import {setRememberSession} from '../../lib/auth-storage'
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { supabase, supabaseConfigured } from '../../lib/supabase'
import acaplanLogo from '../../assets/acaplan-logo.png'
import loginHeroImg from '../../assets/login-hero.png'

export default function LoginPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [visible, setVisible] = useState(false)
  const notice = new URLSearchParams(window.location.search).get('salida')

  async function submit(event) {
    event.preventDefault()
    if (busy || !supabaseConfigured) return
    const values = new FormData(event.currentTarget)
    setError('')
    setBusy(true)
    try {
      setRememberSession(values.get('remember') === 'on')
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: values.get('email').trim().toLowerCase(),
        password: values.get('password'),
      })
      if (authError) {
        setError(
          authError.status >= 500 || authError.name === 'AuthRetryableFetchError'
            ? 'No se pudo conectar con el servicio. Intenta nuevamente.'
            : 'No se pudo iniciar sesión. Revisa tus credenciales y el acceso de tu cuenta.'
        )
      }
    } catch {
      setError('No se pudo conectar. Comprueba tu conexión e intenta nuevamente.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-viewport">
      {/* Franja institucional superior de 4px */}
      <div className="institutional-stripe" aria-hidden="true">
        <span className="stripe-blue" />
        <span className="stripe-yellow" />
        <span className="stripe-red" />
      </div>

      <div className="login-container">
        {/* Cabecera compacta con Logo AcaPlan alineado a la derecha */}
        <header className="login-header login-header--wordmark">
          <img
            src={acaplanLogo}
            alt="AcaPlan"
            className="login-logo-img login-logo-img--wordmark"
          />
        </header>

        {/* Retícula de acceso compacta: Presentación (Hero) + Formulario */}
        <main className="login-main-grid">
          {/* Columna Izquierda: Presentación institucional */}
          <section className="login-hero-card" aria-label="Información institucional">
            <div className="login-hero-text">
              <div className="academic-tag">
                <span className="tag-line" aria-hidden="true" />
                <span>PLANIFICACIÓN ACADÉMICA</span>
              </div>
              <h1 className="hero-title">
                Tu tiempo,<br />bien organizado.
              </h1>
              <p className="hero-subtitle">Tu educación, en buenas manos.</p>
            </div>

            <div className="login-hero-media">
              <img src={loginHeroImg} alt="Reloj académico y libros" className="hero-img" />
              <div className="hero-campus-badge">
                <span className="badge-accent" aria-hidden="true" />
                <div className="badge-text">
                  <strong>UNAN-Managua</strong>
                  <span>CUR-Chontales</span>
                </div>
              </div>
            </div>
          </section>

          {/* Columna Derecha: Tarjeta de Acceso Institucional */}
          <section className="login-form-card" aria-labelledby="login-form-title">
            <h2 id="login-form-title">Iniciar sesión</h2>
            <p className="login-form-subtitle">Accede a tu cuenta para continuar</p>

            {notice === 'ok' && (
              <p className="success" role="status">
                Sesión cerrada correctamente.
              </p>
            )}
            {notice === 'local' && (
              <p className="notice" role="status">
                Sesión cerrada en este navegador. No fue posible confirmar el cierre en el servidor.
              </p>
            )}
            {!supabaseConfigured && (
              <p className="error" role="alert">
                Falta configurar la conexión de Supabase.
              </p>
            )}

            <form onSubmit={submit} className="login-form">
              <div className="field-group">
                <label htmlFor="email">Correo institucional</label>
                <div className="input-wrapper">
                  <User size={17} className="input-icon" aria-hidden="true" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    maxLength={100}
                    placeholder="Ingresa tu correo o usuario"
                    required
                    disabled={busy}
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="password">Contraseña</label>
                <div className="input-wrapper">
                  <Lock size={17} className="input-icon" aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type={visible ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    required
                    disabled={busy}
                  />
                  <button
                    className="reveal"
                    type="button"
                    onClick={() => setVisible(!visible)}
                    aria-pressed={visible}
                    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="form-meta-row">
                <label className="remember-checkbox">
                  <input type="checkbox" name="remember" />
                  <span>Recordarme</span>
                </label>
                <a className="forgot" href="/recuperar">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}

              <button
                className="primary"
                type="submit"
                aria-label="Iniciar sesión"
                disabled={busy || !supabaseConfigured}
              >
                <span>{busy ? 'Verificando…' : 'Iniciar sesión'}</span>
                <ArrowRight size={17} className="btn-arrow-icon" aria-hidden="true" />
              </button>
            </form>

            <p className="auth-footnote">Usa tus credenciales institucionales para acceder.</p>
          </section>
        </main>

        {/* Pie de página institucional compacto */}
        <footer className="login-footer">
          AcaPlan · UNAN-Managua · CUR-Chontales
        </footer>
      </div>
    </div>
  )
}
