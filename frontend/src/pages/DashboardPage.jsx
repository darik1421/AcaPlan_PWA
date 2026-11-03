import { useEffect, useState } from 'react'
import {
  Building2,
  BookOpen,
  Calendar,
  Layers,
  Clock,
  User,
  LogOut,
  ClipboardList,
} from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../services/management'
import acaplanLogo from '../assets/acaplan-logo.png'

import HorariosPublicados from '../features/management/HorariosPublicados'
import BorradoresPage from '../features/management/BorradoresPage'
import AccountsPage from '../features/management/AccountsPage'
import PeriodsPage from '../features/management/PeriodsPage'
import CarrerasPage from '../features/management/CarrerasPage'
import AsignaturasPage from '../features/management/AsignaturasPage'
import EspaciosPage from '../features/management/EspaciosPage'
import AsignacionAcademicaPage from '../features/management/AsignacionAcademicaPage'
import CuadriculasPage from '../features/management/CuadriculasPage'
import DisponibilidadPage from '../features/management/DisponibilidadPage'
import '../features/management/management.css'

const PAGE_TITLES = {
  publicados: 'Horario semanal',
  periods: 'Semestres académicos',
  carreras: 'Carreras coordinadas',
  asignaturas: 'Catálogo de asignaturas',
  espacios: 'Aulas y recursos',
  programacion: 'Asignación académica',
  disponibilidad: 'Restricciones',
  borradores: 'Borradores de horarios',
  accounts: 'Gestión de cuentas',
}

export default function DashboardPage() {
  const { profile, logout } = useAuth()
  const [closing, setClosing] = useState(false)
  const [workspace, setWorkspace] = useState(null)
  const profileKey = JSON.stringify(profile)
  const context = workspace?.profileKey === profileKey ? workspace.data : null
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [page, setPage] = useState('periods')

  const admin = profile?.rol === 'administrador'
  const refresh = () => setRevision(value => value + 1)

  useEffect(() => {
    const controller = new AbortController()
    setError('')
    api('/workspace', { signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted) setWorkspace({ profileKey, data })
      })
      .catch(e => {
        if (!controller.signal.aborted) {
          setError(e.message)
          setWorkspace(null)
        }
      })
    return () => controller.abort()
  }, [revision, profileKey])

  async function close() {
    setClosing(true)
    await logout()
  }

  const activePeriodText = context?.activePeriod
    ? `Semestre Activo: ${context.activePeriod.nombre}`
    : context
      ? 'Sin semestre activo'
      : 'Semestre pendiente de consulta'

  const userInitial = (profile?.nombre || profile?.email || 'U').charAt(0).toUpperCase()

  return (
    <div className="app-container">
      {/* Franja institucional superior de 5px (Azul / Amarillo / Rojo) */}
      <div className="institutional-stripe" aria-hidden="true">
        <span className="stripe-blue" />
        <span className="stripe-yellow" />
        <span className="stripe-red" />
      </div>

      <div className="app-layout">
        {/* Sidebar institucional */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <img src={acaplanLogo} alt="AcaPlan" className="sidebar-logo" />
            <span className="sidebar-category">PLANIFICACIÓN ACADÉMICA</span>
          </div>

          <nav className="sidebar-nav">
            <button
              className={page === 'publicados' ? 'selected' : ''}
              onClick={() => setPage('publicados')}
            >
              <Calendar size={18} />
              <span>Horarios publicados</span>
            </button>

            <button
              className={page === 'periods' ? 'selected' : ''}
              onClick={() => setPage('periods')}
            >
              <Calendar size={18} />
              <span>Semestres</span>
            </button>

            <button
              className={page === 'carreras' ? 'selected' : ''}
              onClick={() => setPage('carreras')}
            >
              <Layers size={18} />
              <span>Carreras</span>
            </button>

            <button
              className={page === 'asignaturas' ? 'selected' : ''}
              onClick={() => setPage('asignaturas')}
            >
              <BookOpen size={18} />
              <span>Asignaturas</span>
            </button>

            <button
              className={page === 'espacios' ? 'selected' : ''}
              onClick={() => setPage('espacios')}
            >
              <Building2 size={18} />
              <span>Aulas y Recursos</span>
            </button>

            <button
              className={page === 'programacion' ? 'selected' : ''}
              onClick={() => setPage('programacion')}
            >
              <ClipboardList size={18} />
              <span>Asignación académica</span>
            </button>

            <button
              className={page === 'disponibilidad' ? 'selected' : ''}
              onClick={() => setPage('disponibilidad')}
            >
              <Clock size={18} />
              <span>Restricciones</span>
            </button>

            {context?.canReadDrafts && (
              <button
                className={page === 'borradores' ? 'selected' : ''}
                onClick={() => setPage('borradores')}
              >
                <Calendar size={18} />
                <span>Borradores</span>
              </button>
            )}

            {context?.canManageAccounts && (
              <button
                className={page === 'accounts' ? 'selected' : ''}
                onClick={() => setPage('accounts')}
              >
                <User size={18} />
                <span>Gestión de Cuentas</span>
              </button>
            )}
          </nav>

          <div className="sidebar-footer">
            <div className="sidebar-institution">
              <span className="institution-line" aria-hidden="true" />
              <strong>UNAN-Managua</strong>
              <span>CUR-Chontales</span>
            </div>

            <button className="logout-btn" onClick={close} disabled={closing}>
              <LogOut size={16} />
              <span>{closing ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
            </button>
          </div>
        </aside>

        {/* Área principal */}
        <div className="main-wrapper">
          <header className="topbar">
            <div className="topbar-left">
              <div className="topbar-periods">
                <span className="topbar-context">{activePeriodText}</span>
              </div>
              <span className="topbar-title">{PAGE_TITLES[page] || 'Gestión Académica'}</span>
            </div>

            <div className="topbar-right">
              <div className="user-profile-badge">
                <div className="user-avatar-circle" aria-hidden="true">
                  {userInitial}
                </div>
                <div className="user-info">
                  <span className="user-name">{profile?.nombre || profile?.email || 'Usuario'}</span>
                  <span className="user-role">{admin ? 'Administración' : 'Docente'}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="content-area">
            {error && (
              <div className="error" role="alert" style={{ marginBottom: '20px' }}>
                <p style={{ margin: 0, marginBottom: '10px' }}>{error}</p>
                <button className="secondary" onClick={refresh}>
                  Reintentar carga
                </button>
              </div>
            )}

            {!context && !error && <p role="status">Cargando tu espacio de trabajo…</p>}

            {context && (
              page === 'publicados' ? <HorariosPublicados /> :
              page === 'borradores' && context.canReadDrafts ? (
                <BorradoresPage
                  key={context.activePeriod?.id_periodo}
                  periodId={context.activePeriod?.id_periodo}
                  canPlan={context.canManageBloques}
                />
              ) :
              page === 'accounts' && context.canManageAccounts ? (
                <AccountsPage context={context} onChanged={refresh} />
              ) :
              page === 'carreras' ? (
                <CarrerasPage canManage={context.canManageCarreras} onChanged={refresh} />
              ) :
              page === 'asignaturas' ? (
                <AsignaturasPage
                  context={context}
                  canManage={context.canManageAsignaturas}
                  onChanged={refresh}
                />
              ) :
              page === 'espacios' ? (
                <EspaciosPage
                  periodId={context.activePeriod?.id_periodo}
                  canManage={context.canManageEspacios}
                  onChanged={refresh}
                />
              ) :
              page === 'programacion' ? (
                <AsignacionAcademicaPage context={context} onChanged={refresh} />
              ) :
              page === 'disponibilidad' ? (
                <DisponibilidadPage context={context} />
              ) : (
                <>
                  <PeriodsPage canManage={context.canManagePeriods} onChanged={refresh} />
                  {context.canManageBloques && (
                    <details>
                      <summary>Configuración de tiempos del semestre</summary>
                      <p>
                        El encargado configura las horas de clase y los descansos de cada turno
                        antes de organizar los horarios.
                      </p>
                      <CuadriculasPage context={context} />
                    </details>
                  )}
                </>
              )
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
