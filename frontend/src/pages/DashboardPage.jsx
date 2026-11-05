import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  Building2,
  BookOpen,
  Calendar,
  Layers,
  Clock,
  User,
  LogOut,
  ClipboardList,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../services/management'
import acaplanLogo from '../assets/acaplan-logo.png'
import { roleLabel } from '../lib/role-labels'
import { workspacePages, workspacePage, workspaceScope } from '../lib/workspace-pages'

import GeneradorPage from '../features/management/GeneradorPage'
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
  personal: 'Mi horario',
  generador: 'Generador de Horarios con IA',
  publicados: 'Horario semanal',
  periods: 'Semestres académicos',
  carreras: 'Carreras coordinadas',
  asignaturas: 'Catálogo de asignaturas',
  espacios: 'Pabellones y aulas',
  programacion: 'Asignación académica',
  disponibilidad: 'Restricciones',
  borradores: 'Borradores de horarios',
  accounts: 'Gestión de cuentas',
}

export default function DashboardPage() {
  const { profile, logout, error: accessError, retry: retryAccess, accessRevision = 0 } = useAuth()
  const [closing, setClosing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [workspace, setWorkspace] = useState(null)
  const profileKey = JSON.stringify(profile)
  const context = workspace?.profileKey === profileKey ? workspace.data : null
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [requestedPage, setPage] = useState(null)
  const [generatedDraft, setGeneratedDraft] = useState(null)
  const availablePages = workspacePages(context)
  const page = workspacePage(requestedPage, context)
  const contentRef = useRef(null)

  useLayoutEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
      contentRef.current.scrollLeft = 0
    }
  }, [page])

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
          if ([401,403].includes(e.status)) setWorkspace(null)
        }
      })
    return () => controller.abort()
  }, [revision, profileKey, accessRevision])

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
    <div className="app-container" onKeyDown={event => { if (event.key === 'Escape') setMenuOpen(false) }}>
      {/* Franja institucional superior de 5px (Azul / Amarillo / Rojo) */}
      <div className="institutional-stripe" aria-hidden="true">
        <span className="stripe-blue" />
        <span className="stripe-yellow" />
        <span className="stripe-red" />
      </div>

      <div className="app-layout">
        {/* Sidebar institucional */}
        {menuOpen && <button className="mobile-menu-backdrop" aria-label="Cerrar menú de navegación" onClick={() => setMenuOpen(false)} />}
        <aside className="sidebar" id="workspace-navigation" data-open={menuOpen}>
          <button className="mobile-menu-toggle" onClick={() => setMenuOpen(false)}>Cerrar menú</button>
          <div className="sidebar-header">
            <img src={acaplanLogo} alt="AcaPlan" className="sidebar-logo" />
            <span className="sidebar-category">PLANIFICACIÓN ACADÉMICA</span>
          </div>

          <nav className="sidebar-nav" aria-label="Navegación principal" onClick={event => { if (event.target.closest('button')) setMenuOpen(false) }}>
            {[
              ['Planificación', [['programacion','Asignación académica',ClipboardList],['disponibilidad','Restricciones',Clock],['generador','Generador de horarios',Sparkles],['borradores','Borradores',Calendar]]],
              ['Horarios', [['personal','Mi horario',Calendar],['publicados','Horarios publicados',Calendar]]],
              ['Configuración', [['periods','Semestres',Calendar],['carreras','Carreras',Layers],['espacios','Pabellones y aulas',Building2],['asignaturas','Asignaturas',BookOpen],['accounts','Gestión de Cuentas',User]]],
            ].map(([group,items]) => {
              const visible = items.filter(([id]) => availablePages.has(id))
              return visible.length > 0 && <div className="sidebar-section" role="group" aria-label={group} key={group}>
                <span className="sidebar-section-title">{group}</span>
                {visible.map(([id,label,Icon]) => <button key={id} className={page === id ? 'selected' : ''} aria-current={page === id ? 'page' : undefined} onClick={() => setPage(id)}><Icon size={18}/><span>{label}</span></button>)}
              </div>
            })}
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
            <button className="mobile-menu-toggle" aria-controls="workspace-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>Menú</button>
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
                  <span className="user-role">{roleLabel(profile, context?.funciones || [])}</span>
                </div>
              </div>
            </div>
          </header>

          <main className="content-area" ref={contentRef}>
            {accessError && <div className="notice" role="status"><p>No se pudo volver a comprobar tu acceso. Comprueba la conexión y reintenta. El servidor verificará tus permisos en cada operación.</p><button className="secondary" onClick={retryAccess}>Comprobar acceso</button></div>}
            {error && (
              <div className="error" role="alert" style={{ marginBottom: '20px' }}>
                <p style={{ margin: 0, marginBottom: '10px' }}>{error}</p>
                <button className="secondary" onClick={refresh}>
                  Reintentar carga
                </button>
              </div>
            )}

            {!context && !error && <p role="status">Cargando tu espacio de trabajo…</p>}

            {context && <Fragment key={workspaceScope(context)}>{
              page === 'generador' && context.canManageBloques ? (
                <GeneradorPage
                  context={context}
                  periodId={context.activePeriod?.id_periodo}
                  initialDraftId={generatedDraft?.period === context.activePeriod?.id_periodo ? generatedDraft?.id ?? null : null}
                  onNavigateToRestrictions={id => {setGeneratedDraft({id,period:context.activePeriod?.id_periodo});setPage('disponibilidad')}}
                  onNavigateToDrafts={id => {setGeneratedDraft({id,period:context.activePeriod?.id_periodo});setPage('borradores')}}
                />
              ) :
              page === 'personal' && context.personalScheduleVersion >= 1 ? <HorariosPublicados key="personal" personal /> :
              page === 'publicados' ? <HorariosPublicados key="publicados" /> :
              page === 'borradores' && context.canReadDrafts ? (
                <BorradoresPage
                  key={context.activePeriod?.id_periodo}
                  periodId={context.activePeriod?.id_periodo}
                  canPlan={context.canManageBloques}
                  onNavigateToRestrictions={availablePages.has('disponibilidad') ? id => {setGeneratedDraft({id,period:context.activePeriod?.id_periodo});setPage('disponibilidad')} : undefined}
                  onRegenerate={context.canManageBloques ? id => {setGeneratedDraft({id,period:context.activePeriod?.id_periodo});setPage('generador')} : undefined}
                  initialDraftId={generatedDraft?.period === context.activePeriod?.id_periodo ? generatedDraft?.id ?? null : null}
                />
              ) :
              page === 'accounts' && context.canManageAccounts ? (
                <AccountsPage context={context} onChanged={refresh} />
              ) :
              page === 'carreras' ? (
                <CarrerasPage canManage={context.canManageCarreras} onChanged={refresh} manageDepartments={context.isAdmin} />
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
                <DisponibilidadPage context={context}
                  draftId={generatedDraft?.period === context.activePeriod?.id_periodo ? generatedDraft?.id ?? null : null}
                  onRegenerate={context.canManageBloques ? () => setPage('generador') : undefined}
                  onReturnToDraft={context.canReadDrafts ? () => setPage('borradores') : undefined}
                />
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
            }</Fragment>}
          </main>
        </div>
      </div>
    </div>
  )
}
