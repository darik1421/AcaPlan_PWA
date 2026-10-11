import {useEffect,useState} from 'react'
import {api} from '../../services/management'
const days=['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo']
export default function RestriccionesPanel({context,docentes}) {
 const period=context?.activePeriod?.id_periodo, editable=Boolean(context?.canManageDisponibilidad)
 const [rows,setRows]=useState([]),[form,setForm]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[reloadRequired,setReloadRequired]=useState(false)
 async function load(signal) {
  setLoading(true);setError('')
  try {const data=await api('/restricciones',{signal});if(!signal?.aborted){setRows(data);setReloadRequired(false)}}
  catch(e){if(!signal?.aborted){setError(e.message);setReloadRequired(true)}}
  finally{if(!signal?.aborted)setLoading(false)}
 }
 useEffect(()=>{const c=new AbortController();load(c.signal);return()=>c.abort()},[])
 useEffect(()=>{setForm(null);setMessage('')},[period,editable])
 async function save(e) {
  e.preventDefault();if(busy||reloadRequired||!editable||!form||form.id_periodo!==period)return
  setBusy(true);setError('');setMessage('')
  try {await api('/restricciones',{method:'POST',data:form});setForm(null);setMessage('Restricción guardada.');await load()}
  catch(e){setError(e.message);setReloadRequired(true)}finally{setBusy(false)}
 }
 const visible=rows.filter(r=>r.id_periodo===period)
 const name=id=>{const d=docentes.find(d=>d.id_docente===id);return d?`${d.nombres} ${d.apellidos||''}`.trim():`Docente ${id}`}
 return <div>
  <p>Los jefes de departamento registran los intervalos autorizados en los que un docente no puede impartir clases. Los coordinadores pueden consultarlos. Sin restricciones comunicadas no hay bloqueo por disponibilidad.</p>
  <p className="notice">Este registro no reorganiza clases ni publica horarios. La conexión con las validaciones compartidas de horarios sigue pendiente; revisa las clases existentes cuando cambien las restricciones.</p>
  {error&&<p role="alert" className="error">{error}</p>}{message&&<p role="status">{message}</p>}
  <button className="secondary" disabled={busy||loading} onClick={()=>{setForm(null);load()}}>Recargar restricciones</button>
  {period&&editable&&<button className="secondary" disabled={busy||loading||reloadRequired||!docentes.some(d=>d.estado==='activo')} onClick={()=>{setMessage('');setForm({id_periodo:period,id_docente:'',dia:'Lunes',hora_inicio:'',hora_fin:'',activa:true})}}>Registrar restricción</button>}
  {reloadRequired&&<p>Recarga las restricciones antes de intentar otro guardado.</p>}
  {form&&editable&&form.id_periodo===period&&<form className="management-form" onSubmit={save}>
   <h3>{form.id?'Corregir restricción':'Nueva restricción comunicada'}</h3><fieldset disabled={busy||reloadRequired}>
    <label>Docente de la restricción<select required disabled={Boolean(form.id)} value={form.id_docente} onChange={e=>setForm({...form,id_docente:Number(e.target.value)})}><option value="">Selecciona un docente</option>{docentes.filter(d=>d.estado==='activo'||d.id_docente===form.id_docente).map(d=><option key={d.id_docente} value={d.id_docente}>{name(d.id_docente)}</option>)}</select></label>
    <label>Día no disponible<select value={form.dia} onChange={e=>setForm({...form,dia:e.target.value})}>{days.map(d=><option key={d}>{d}</option>)}</select></label>
    <label>Desde<input type="time" required value={form.hora_inicio} onChange={e=>setForm({...form,hora_inicio:e.target.value})}/></label>
    <label>Hasta<input type="time" required value={form.hora_fin} onChange={e=>setForm({...form,hora_fin:e.target.value})}/></label>
    {form.id&&<label>Estado de la restricción<select value={String(form.activa)} onChange={e=>setForm({...form,activa:e.target.value==='true'})}><option value="true">Activa</option><option value="false">Retirada</option></select></label>}
    <button className="primary" type="submit">Guardar restricción</button><button className="secondary" type="button" onClick={()=>setForm(null)}>Cancelar</button>
   </fieldset>
  </form>}
  {loading?<p role="status">Cargando restricciones…</p>:!error&&period&&<div className="table-scroll"><table><caption>Restricciones comunicadas del semestre</caption><thead><tr><th>Docente</th><th>Día</th><th>Desde</th><th>Hasta</th><th>Estado</th>{editable&&<th>Acciones</th>}</tr></thead><tbody>
   {visible.map(r=><tr key={r.id_restriccion}><td>{name(r.id_docente)}</td><td>{r.dia}</td><td>{r.hora_inicio.slice(0,5)}</td><td>{r.hora_fin.slice(0,5)}</td><td>{r.activa?'Activa':'Retirada'}</td>{editable&&<td><button className="secondary" disabled={busy||reloadRequired} onClick={()=>{setMessage('');setForm({id:r.id_restriccion,id_docente:r.id_docente,id_periodo:r.id_periodo,dia:r.dia,hora_inicio:r.hora_inicio.slice(0,5),hora_fin:r.hora_fin.slice(0,5),activa:r.activa,version:r.version})}}>Corregir restricción {r.id_restriccion}</button></td>}</tr>)}
   {!visible.length&&<tr><td colSpan={editable?6:5}>No hay restricciones comunicadas en este semestre.</td></tr>}
  </tbody></table></div>}
 </div>
}
