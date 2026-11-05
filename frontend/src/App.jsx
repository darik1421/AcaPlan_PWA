import AppLayout from './components/AppLayout'
import AccessPending from './components/AccessPending'
import AuthProvider from './features/auth/AuthProvider'
import { useAuth } from './features/auth/AuthContext'
import LoginPage from './features/auth/LoginPage'
import RecoveryPage from './features/auth/RecoveryPage'
import DeferredWorkspace from './components/DeferredWorkspace'
import './App.css'
import './features/auth/auth.css'

const loadWorkspace = () => import('./pages/DashboardPage')

function Screens() {
  const { session, profile, loading, recovery, error, retry, logout } = useAuth()
  if (loading) return <AccessPending message="Verificando tu acceso…" />
  if (recovery || window.location.pathname === '/recuperar') return <AppLayout><RecoveryPage /></AppLayout>
  if (!session) return <LoginPage />
  if (!profile) return <AppLayout><section className="recovery-wrap"><div className="auth-card">
    <h2>No se pudo habilitar el acceso</h2>
    <p className="error" role="alert">{error || 'Es necesario comprobar tu cuenta antes de continuar.'}</p>
    <button className="primary" onClick={retry}>Volver a comprobar</button>
    <button className="secondary back-link" onClick={logout}>Cerrar sesión</button>
  </div></section></AppLayout>
  return <DeferredWorkspace load={loadWorkspace} />
}

export default function App() {
  return <AuthProvider><Screens /></AuthProvider>
}
