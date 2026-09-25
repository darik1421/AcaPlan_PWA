import AppLayout from './components/AppLayout'
import AuthProvider from './features/auth/AuthProvider'
import { useAuth } from './features/auth/AuthContext'
import LoginPage from './features/auth/LoginPage'
import RecoveryPage from './features/auth/RecoveryPage'
import DashboardPage from './pages/DashboardPage'
import './App.css'
import './features/auth/auth.css'

function Screens() {
  const { session, profile, loading, recovery, error, retry, logout } = useAuth()
  if (loading) return <section className="recovery-wrap"><p role="status">Verificando tu acceso…</p></section>
  if (recovery || window.location.pathname === '/recuperar') return <RecoveryPage />
  if (!session) return <LoginPage />
  if (!profile) return <section className="recovery-wrap"><div className="auth-card">
    <h2>No se pudo habilitar el acceso</h2>
    <p className="error" role="alert">{error || 'Es necesario comprobar tu cuenta antes de continuar.'}</p>
    <button className="primary" onClick={retry}>Volver a comprobar</button>
    <button className="secondary back-link" onClick={logout}>Cerrar sesión</button>
  </div></section>
  return <DashboardPage />
}

export default function App() {
  return <AuthProvider><AppLayout><Screens /></AppLayout></AuthProvider>
}
