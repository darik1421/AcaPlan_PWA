import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { api } from '../services/management'
import AccountsPage from '../features/management/AccountsPage'
import PeriodsPage from '../features/management/PeriodsPage'
import '../features/management/management.css'

export default function DashboardPage() {
  const { profile, logout } = useAuth()
  const [closing,setClosing] = useState(false)
  const [context,setContext] = useState(null)
  const [error,setError] = useState('')
  const [revision,setRevision] = useState(0)
  const [page,setPage] = useState('periods')
  const admin = profile.rol === 'administrador'
  const refresh = () => setRevision(value=>value+1)
  useEffect(()=>{
    const controller = new AbortController()
    setError('')
    api('/workspace',{signal:controller.signal}).then(data=>{
      if(!controller.signal.aborted) setContext(data)
    }).catch(e=>{if(!controller.signal.aborted){setError(e.message);setContext(null)}})
    return ()=>controller.abort()
  },[revision,profile])
  async function close(){setClosing(true);await logout()}
  return <section className="dashboard">
    <div className="dashboard-top"><div><p className="eyebrow">{admin ? 'PANEL ADMINISTRATIVO':'PORTAL DOCENTE'}</p><h1>Hola, {profile.nombre}.</h1><p className="muted">Organiza el próximo período académico.</p></div><button className="secondary" onClick={close} disabled={closing}>{closing ? 'Cerrando…':'Cerrar sesión'}</button></div>
    <div className="identity-card"><span className="avatar" aria-hidden="true">{profile.nombre.charAt(0).toUpperCase()}</span><div><strong>{profile.nombre}</strong><p>{profile.correo}</p></div><span className="stage">{admin ? 'Administrador':'Docente'}</span></div>
    {error && <div className="error" role="alert"><p>{error}</p><button className="secondary" onClick={refresh}>Reintentar</button></div>}
    {!context && !error && <p role="status">Cargando tu espacio de trabajo…</p>}
    {context && <>
      <div className="period-banner"><span>Período activo</span><strong>{context.activePeriod ? `${context.activePeriod.nombre} · ${context.activePeriod.ano_lectivo}`:'Sin período activo'}</strong></div>
      <nav className="workspace-nav" aria-label="Módulos">
        <button className={page==='periods' ? 'selected':''} aria-current={page==='periods' ? 'page':undefined} onClick={()=>setPage('periods')}>Períodos académicos</button>
        {context.canManageAccounts && <button className={page==='accounts' ? 'selected':''} aria-current={page==='accounts' ? 'page':undefined} onClick={()=>setPage('accounts')}>Gestión de cuentas</button>}
      </nav>
      {page==='accounts' && context.canManageAccounts ? <AccountsPage context={context} onChanged={refresh}/> : <PeriodsPage canManage={context.canManagePeriods} onChanged={refresh}/>}
    </>}
    <p className="auth-footnote">Interfaz provisional para validar el Sprint 1. Se adaptará al diseño de Figma.</p>
  </section>
}
