import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import { useAuth } from '../auth/AuthContext'
const empty = () => ({ nombre: '', correo: '', cedula: '', password: '', rol: 'docente', estado: 'activo', funciones: [], carreras: [] })
const functions = [['coordinador','Coordinación'], ['planificador','Planificación'], ['aprobador','Aprobación']]
export default function AccountsPage({ context, onChanged }) {
  const { profile, retry } = useAuth()
  const [rows,setRows] = useState([])
  const [form,setForm] = useState(null)
  const [query,setQuery] = useState('')
  const [loading,setLoading] = useState(true)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [message,setMessage] = useState('')
  async function load(signal) {
    setLoading(true); setError('')
    try { const data = await api('/accounts',{ signal }); if (!signal?.aborted) setRows(data) }
    catch(e) { if (!signal?.aborted) setError(e.message) }
    finally { if (!signal?.aborted) setLoading(false) }
  }
  useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort() }, [])
  const field = (name,value) => setForm(current => ({...current,[name]:value}))
  function toggle(name,value) { field(name,form[name].includes(value) ? form[name].filter(item => item !== value) : [...form[name],value]) }
  async function save(event) {
    event.preventDefault()
    if (busy) return
    if (form.id === profile.id_usuario && (form.estado !== 'activo' || form.rol !== profile.rol)
      && !window.confirm('Cambiarás tu propio acceso. Tu sesión se volverá a comprobar. ¿Continuar?')) return
    setBusy(true); setError(''); setMessage('')
    try {
      await api('/accounts', {method:form.id ? 'PATCH':'POST',data:form})
      const self = form.id === profile.id_usuario
      setMessage(form.id ? 'Cuenta actualizada.' : 'Cuenta creada. Entrega la contraseña inicial por un canal privado.')
      setForm(null); await load(); onChanged()
      if (self) retry()
    } catch(e) { setError(e.message) }
    finally { setBusy(false) }
  }
  const filtered = rows.filter(r => [r.nombre,r.correo,r.cedula].join(' ').toLowerCase().includes(query.toLowerCase()))
  return <section aria-labelledby="accounts-title">
    <div className="section-heading"><div><h2 id="accounts-title">Gestión de cuentas</h2><p className="muted">Personal autorizado y funciones institucionales.</p></div>
      <button className="secondary" disabled={busy || !context.canCreateAccounts} onClick={() => {setForm(empty());setMessage('')}}>Nueva cuenta</button></div>
    {!context.canCreateAccounts && <p className="notice">La creación de cuentas requiere completar la configuración del servidor.</p>}
    {error && <p role="alert" className="error">{error}</p>}
    {message && <p role="status" className="success">{message}</p>}
    {form && <form className="management-form" onSubmit={save}>
      <h3>{form.id ? 'Editar cuenta' : 'Nueva cuenta'}</h3>
      <fieldset disabled={busy}><div className="form-grid">
        <label>Nombre completo<input required maxLength={100} value={form.nombre} onChange={e=>field('nombre',e.target.value)} autoComplete="name"/></label>
        <label>Cédula<input required maxLength={20} value={form.cedula} onChange={e=>field('cedula',e.target.value)}/></label>
        <label>Correo<input type="email" required maxLength={100} value={form.correo} readOnly={Boolean(form.id)} onChange={e=>field('correo',e.target.value)} autoComplete="off"/></label>
        {!form.id && <label>Contraseña inicial<input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={form.password} onChange={e=>field('password',e.target.value)}/></label>}
        <label>Rol<select value={form.rol} onChange={e=>field('rol',e.target.value)}><option value="docente">Docente</option><option value="administrador">Administrador</option></select></label>
        {form.id && <label>Estado<select value={form.estado} onChange={e=>field('estado',e.target.value)}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>}
      </div>
      {form.id && <p className="muted">El correo se conserva para mantener la vinculación con Supabase Auth.</p>}
      <fieldset className="choice-group"><legend>Funciones adicionales</legend>
        {functions.map(([id,label])=><label className="check-label" key={id}><input type="checkbox" checked={form.funciones.includes(id)} onChange={()=>toggle('funciones',id)}/>{label}</label>)}
      </fieldset>
      <p className="muted">Planificación permite gestionar períodos. Las acciones de coordinación y aprobación se desarrollarán en sus sprints.</p>
      {form.funciones.includes('coordinador') && <fieldset className="choice-group"><legend>Carreras bajo coordinación (selecciona al menos una)</legend>
        {!context.catalogoCarreras.length && <p className="notice">No hay carreras registradas. Primero deben incorporarse al catálogo.</p>}
        {context.catalogoCarreras.map(c=><label className="check-label" key={c.id_carrera}><input type="checkbox" checked={form.carreras.includes(c.id_carrera)} onChange={()=>toggle('carreras',c.id_carrera)}/>{c.nombre}</label>)}
      </fieldset>}
      <div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…':'Guardar cuenta'}</button><button className="secondary" type="button" onClick={()=>setForm(null)}>Cancelar</button></div>
      </fieldset>
    </form>}
    <div className="list-toolbar"><label>Buscar cuentas<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Nombre, correo o cédula"/></label><button className="secondary" disabled={busy || loading} onClick={()=>load()}>Actualizar lista</button></div>
    {loading ? <p role="status">Cargando cuentas…</p> : <div className="table-scroll"><table><caption>{filtered.length} cuentas</caption><thead><tr><th>Persona</th><th>Rol y funciones</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>
      {filtered.map(row=><tr key={row.id_usuario}><td><strong>{row.nombre}</strong><span className="cell-detail">{row.correo}</span></td><td>{row.rol}<span className="cell-detail">{row.funciones.join(', ') || 'Sin funciones adicionales'}</span></td><td><span className={row.estado === 'activo' ? 'badge active':'badge'}>{row.estado}</span></td><td><button className="secondary" disabled={busy} aria-label={`Editar cuenta de ${row.nombre}`} onClick={()=>{setForm({...row,id:row.id_usuario,password:''});setMessage('')}}>Editar</button></td></tr>)}
      {!filtered.length && <tr><td colSpan={4}>No hay cuentas que coincidan.</td></tr>}
    </tbody></table></div>}
  </section>
}
