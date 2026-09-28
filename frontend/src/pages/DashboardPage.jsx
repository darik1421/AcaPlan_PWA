import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../services/management'
import {
  Building2, BookOpen, Users, LayoutGrid, Calendar,
  Layers, Clock, Search, Bell, Settings, User, LogOut, BookA, ClipboardList
} from 'lucide-react'

import AccountsPage from '../features/management/AccountsPage'
import PeriodsPage from '../features/management/PeriodsPage'
import CarrerasPage from '../features/management/CarrerasPage'
import AsignaturasPage from '../features/management/AsignaturasPage'
import EspaciosPage from '../features/management/EspaciosPage'
import SeccionesPage from '../features/management/SeccionesPage'
import ProgramacionPage from '../features/management/ProgramacionPage'
import BloquesPage from '../features/management/BloquesPage'
import DisponibilidadPage from '../features/management/DisponibilidadPage'
import '../features/management/management.css'

export default function DashboardPage() {
  const { profile, logout } = useAuth()
  const [closing, setClosing] = useState(false)
  const [context, setContext] = useState(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [page, setPage] = useState('periods')

  const admin = profile?.rol === 'administrador'
  const refresh = () => setRevision(value => value + 1)

  useEffect(() => {
    const controller = new AbortController()
    setError('')
    api('/workspace', { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setContext(data)
    }).catch(e => { if (!controller.signal.aborted) { setError(e.message); setContext(null) } })
    return () => controller.abort()
  }, [revision, profile])

  async function close() { setClosing(true); await logout() }

  return <div className="app-layout">
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon"><BookA size={20} /></div>
        <div className="sidebar-brand-text">
          <h1>Gestión Académica</h1>
          <span>{admin ? 'Administrador' : 'Docente'}</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <button className={page === 'periods' ? 'selected' : ''} onClick={() => setPage('periods')}><Calendar size={18} /> Periodos</button>
        <button className={page === 'carreras' ? 'selected' : ''} onClick={() => setPage('carreras')}><Layers size={18} /> Áreas</button>
        <button className={page === 'asignaturas' ? 'selected' : ''} onClick={() => setPage('asignaturas')}><BookOpen size={18} /> Asignaturas</button>
        <button className={page === 'espacios' ? 'selected' : ''} onClick={() => setPage('espacios')}><Building2 size={18} /> Aulas y Recursos</button>
        <button className={page === 'secciones' ? 'selected' : ''} onClick={() => setPage('secciones')}><Users size={18} /> Grupos Secciones</button>
        <button className={page === 'programacion' ? 'selected' : ''} onClick={() => setPage('programacion')}><ClipboardList size={18} /> Demanda de carga</button>
        <button className={page === 'bloques' ? 'selected' : ''} onClick={() => setPage('bloques')}><LayoutGrid size={18} /> Bloques Diarios</button>
        <button className={page === 'disponibilidad' ? 'selected' : ''} onClick={() => setPage('disponibilidad')}><Clock size={18} /> Disponibilidad</button>
        {context?.canManageAccounts && <button className={page === 'accounts' ? 'selected' : ''} onClick={() => setPage('accounts')}><User size={18} /> Gestión de Cuentas</button>}
      </nav>
      <div style={{ padding: '24px' }}>
        <button style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontWeight: 500, fontSize: '14px', width: '100%' }} onClick={close} disabled={closing}>
          <LogOut size={18} /> {closing ? 'Cerrando...' : 'Cerrar Sesión'}
        </button>
      </div>
    </aside>

    <div className="main-wrapper">
      <header className="topbar">
        <div className="topbar-left">
          <h2 className="topbar-title">UNAN-Managua CUR-Chontales</h2>
          <div className="topbar-periods">
            <span>{context?.activePeriod ? `Período Activo: ${context.activePeriod.nombre}` : 'Sin período activo'}</span>
          </div>
        </div>
        <div className="topbar-right">
          <div className="search-box">
            <Search size={16} />
            <input placeholder="Buscar..." disabled />
          </div>
          <div className="topbar-icons">
            <Bell size={20} />
            <Settings size={20} />
            <User size={20} />
          </div>
        </div>
      </header>

      <main className="content-area">
        {error && <div className="error" role="alert" style={{ marginBottom: '20px' }}><p style={{ margin: 0, marginBottom: '10px' }}>{error}</p><button className="secondary" onClick={refresh}>Reintentar carga</button></div>}
        {!context && !error && <p role="status">Cargando tu espacio de trabajo…</p>}
        {context && (
          page === 'accounts' && context.canManageAccounts ? <AccountsPage context={context} onChanged={refresh} /> :
            page === 'carreras' ? <CarrerasPage canManage={context.canManageCarreras} onChanged={refresh} /> :
              page === 'asignaturas' ? <AsignaturasPage context={context} canManage={context.canManageAsignaturas} onChanged={refresh} /> :
                page === 'espacios' ? <EspaciosPage canManage={context.canManageEspacios} onChanged={refresh} /> :
                  page === 'secciones' ? <SeccionesPage context={context} onChanged={refresh} /> :
                    page === 'programacion' ? <ProgramacionPage context={context} onChanged={refresh} /> :
                      page === 'bloques' ? <BloquesPage context={context} onChanged={refresh} /> :
                        page === 'disponibilidad' ? <DisponibilidadPage context={context} onChanged={refresh} /> :
                          <PeriodsPage canManage={context.canManagePeriods} onChanged={refresh} />
        )}
      </main>
    </div>
  </div>
}
