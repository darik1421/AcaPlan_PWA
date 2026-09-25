import { useEffect, useState } from 'react'
import { api } from '../../services/management'
const empty = () => ({nombre:'',ano_lectivo:new Date().getFullYear(),fecha_inicio:'',fecha_fin:''})
export default function PeriodsPage({ canManage, onChanged }) {
  const [rows,setRows] = useState([])
  const [form,setForm] = useState(null)
  const [loading,setLoading] = useState(true)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [message,setMessage] = useState('')
  async function load(signal) {
    setLoading(true); setError('')
    try { const data = await api('/periods',{signal}); if(!signal?.aborted) setRows(data) }
    catch(e) { if(!signal?.aborted) setError(e.message) }
    finally { if(!signal?.aborted) setLoading(false) }
  }
  useEffect(()=>{ const c=new AbortController();load(c.signal);return ()=>c.abort() },[])
  const field = (name,value) => setForm(current=>({...current,[name]:value}))
  async function save(event) {
    event.preventDefault()
    if(busy) return
    if(form.fecha_inicio >= form.fecha_fin) {setError('La fecha inicial debe ser anterior a la final.');return}
    setBusy(true);setError('');setMessage('')
    try { await api('/periods',{method:'POST',data:form});setForm(null);setMessage('Período guardado.');await load();onChanged() }
    catch(e) { setError(e.message) } finally {setBusy(false)}
  }
  async function activate(row) {
    if(busy || !window.confirm(row.es_activo ? `¿Desactivar «${row.nombre}»? No quedará ningún período activo.` : `¿Activar «${row.nombre}»? Sustituirá al período activo actual.`)) return
    setBusy(true);setError('');setMessage('')
    try { await api('/periods/active',{method:'POST',data:{id:row.id_periodo,active:!row.es_activo}});setMessage('Período activo actualizado.');await load();onChanged() }
    catch(e) { setError(e.message) } finally {setBusy(false)}
  }
  return <section aria-labelledby="periods-title">
    <div className="section-heading"><div><h2 id="periods-title">Períodos académicos</h2><p className="muted">Fechas de planificación e historial de períodos.</p></div>
    {canManage && <button className="secondary" disabled={busy} onClick={()=>{setForm(empty());setMessage('')}}>Nuevo período</button>}</div>
    {error && <p role="alert" className="error">{error}</p>}{message && <p role="status" className="success">{message}</p>}
    {form && canManage && <form className="management-form" onSubmit={save}><h3>{form.id ? 'Editar período':'Nuevo período'}</h3><fieldset disabled={busy}><div className="form-grid">
      <label>Nombre<input required maxLength={50} value={form.nombre} onChange={e=>field('nombre',e.target.value)} placeholder="Ej. Primer semestre"/></label>
      <label>Año lectivo<input type="number" required min={1900} max={2200} step={1} value={form.ano_lectivo} onChange={e=>field('ano_lectivo',e.target.value)}/></label>
      <label>Fecha inicial<input type="date" required value={form.fecha_inicio} onChange={e=>field('fecha_inicio',e.target.value)}/></label>
      <label>Fecha final<input type="date" required min={form.fecha_inicio || undefined} value={form.fecha_fin} onChange={e=>field('fecha_fin',e.target.value)}/></label>
    </div><div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…':'Guardar período'}</button><button className="secondary" type="button" onClick={()=>setForm(null)}>Cancelar</button></div></fieldset></form>}
    <div className="list-toolbar"><p className="muted">Activar otro período conserva los registros anteriores.</p><button className="secondary" disabled={busy || loading} onClick={()=>load()}>Actualizar lista</button></div>
    {loading ? <p role="status">Cargando períodos…</p> : <div className="table-scroll"><table><caption>{rows.length} períodos</caption><thead><tr><th>Período</th><th>Fechas</th><th>Estado</th>{canManage && <th>Acciones</th>}</tr></thead><tbody>
      {rows.map(row=><tr key={row.id_periodo}><td><strong>{row.nombre}</strong><span className="cell-detail">{row.ano_lectivo}</span></td><td>{row.fecha_inicio}<span className="cell-detail">al {row.fecha_fin}</span></td><td><span className={row.es_activo ? 'badge active':'badge'}>{row.es_activo ? 'Activo':'Inactivo'}</span></td>{canManage && <td><div className="row-actions"><button className="secondary" disabled={busy} aria-label={`Editar ${row.nombre}`} onClick={()=>{setForm({...row,id:row.id_periodo});setMessage('')}}>Editar</button><button className="secondary" disabled={busy} aria-label={`${row.es_activo ? 'Desactivar':'Activar'} ${row.nombre}`} onClick={()=>activate(row)}>{row.es_activo ? 'Desactivar':'Activar'}</button></div></td>}</tr>)}
      {!rows.length && <tr><td colSpan={canManage ? 4:3}>Aún no hay períodos académicos registrados.</td></tr>}
    </tbody></table></div>}
  </section>
}
