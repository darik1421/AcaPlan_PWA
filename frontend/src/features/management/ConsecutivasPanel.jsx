import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'
export default function ConsecutivasPanel({context}){
 const period=context?.activePeriod?.id_periodo,editable=Boolean(context?.canManageDisponibilidad)
 const [data,setData]=useState(null),[form,setForm]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[attempt,setAttempt]=useState(0)
 const generation=useRef(0)
 useEffect(()=>{
  const c=new AbortController();generation.current++;setData(null);setForm(null);setError('');setBusy(false)
  if(period)api('/restricciones/consecutivas/contexto',{method:'POST',data:{id_periodo:period},signal:c.signal}).then(value=>{if(!c.signal.aborted){if(!Array.isArray(value?.asignaturas)||!Array.isArray(value?.reglas)||typeof value?.huella!=='string')throw new Error('Respuesta incompleta de clases consecutivas. Recarga los datos.');setData(value)}}).catch(e=>{if(!c.signal.aborted)setError(e.message)})
  return()=>{c.abort();generation.current++}
 },[period,editable,attempt])
 useEffect(()=>setMessage(''),[period,editable])
 const name=id=>{const s=data?.asignaturas.find(a=>a.id===id);return s?`${s.codigo} · ${s.nombre}`:'Asignatura no disponible'}
 const first=data?.asignaturas.find(a=>a.id===Number(form?.asignacion_a))
 const candidates=data?.asignaturas.filter(a=>a.estado_carrera==='activo'&&(!first||(a.id_carrera===first.id_carrera&&a.ano_estudio===first.ano_estudio&&a.turno===first.turno)))||[]
 async function save(e){
  e.preventDefault();if(busy||!editable||!data||!form||!form.confirmada)return
  const current=generation.current;setBusy(true);setError('');setMessage('')
  try{
   const {confirmada:_confirmada,...values}=form
   await api('/restricciones/consecutivas',{method:'POST',data:{...values,id_periodo:period,huella:data.huella,asignacion_a:Number(form.asignacion_a),asignacion_b:Number(form.asignacion_b)}})
   if(current===generation.current){setMessage('Regla guardada. Se tendrá que comprobar al revisar una propuesta de horario.');setAttempt(n=>n+1)}
  }catch(e){if(current===generation.current){setError(`${e.message} Recarga antes de volver a guardar.`);setData(null);setForm(null)}}finally{if(current===generation.current)setBusy(false)}
 }
 return <section aria-labelledby="consecutive-title"><h3 id="consecutive-title">Clases consecutivas</h3>
  <p>Los jefes de departamento registran las solicitudes autorizadas para unir dos sesiones del mismo año de carrera. Pueden ser de la misma asignatura o de dos distintas, en cualquier orden. Se permite el receso oficial entre ellas, pero no otra clase ni tiempo libre adicional.</p>
  <p className="notice">Cada regla solicita una pareja de sesiones durante la semana. No aumenta ni cambia la duración de las clases. Guardarla no mueve clases existentes; su conexión con la generación y validación integral sigue pendiente.</p>
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  {period&&<button className="secondary" disabled={busy} onClick={()=>setAttempt(n=>n+1)}>Recargar clases consecutivas</button>}
  {period&&editable&&data&&<button className="secondary" disabled={busy||!!form||!data.asignaturas.some(a=>a.estado_carrera==='activo')} onClick={()=>{setMessage('');setForm({asignacion_a:'',asignacion_b:'',motivo:'',activa:true,confirmada:false})}}>Registrar clases consecutivas</button>}
  {period&&!data&&!error&&<p role="status">Consultando reglas de clases consecutivas…</p>}
  {form&&data&&<form className="management-form" onSubmit={save}><fieldset disabled={busy}>
   <label>Primera asignatura<select required disabled={!!form.id} value={form.asignacion_a} onChange={e=>setForm({...form,asignacion_a:e.target.value,asignacion_b:'',confirmada:false})}><option value="">Selecciona carrera, año y asignatura</option>{data.asignaturas.filter(a=>a.estado_carrera==='activo'||a.id===Number(form.asignacion_a)).map(a=><option key={a.id} value={a.id}>{a.carrera} · Año {a.ano_estudio} · {name(a.id)}</option>)}</select></label>
   <label>Segunda asignatura<select required disabled={!!form.id||!first} value={form.asignacion_b} onChange={e=>setForm({...form,asignacion_b:e.target.value,confirmada:false})}><option value="">Selecciona la otra sesión</option>{(form.id?data.asignaturas.filter(a=>a.id===Number(form.asignacion_b)):candidates).map(a=><option key={a.id} value={a.id}>{a.id===Number(form.asignacion_a)?`Otra sesión de ${name(a.id)}`:name(a.id)}</option>)}</select></label>
   <label>Motivo de la solicitud autorizada<textarea required maxLength={500} value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value,confirmada:false})}/></label>
   {form.id&&<label>Estado de la regla<select value={String(form.activa)} onChange={e=>setForm({...form,activa:e.target.value==='true',confirmada:false})}><option value="true">Activa</option><option value="false">Retirada</option></select></label>}
   <label><input type="checkbox" checked={form.confirmada} onChange={e=>setForm({...form,confirmada:e.target.checked})}/>Confirmo que esta regla fue autorizada.</label>
   <button className="primary" disabled={!form.confirmada}>Guardar regla consecutiva</button><button type="button" className="secondary" onClick={()=>setForm(null)}>Cancelar regla consecutiva</button>
  </fieldset></form>}
  {data&&<div className="table-scroll"><table><caption>Parejas de sesiones solicitadas en el semestre</caption><thead><tr><th>Carrera y año</th><th>Sesiones que deben ir juntas</th><th>Motivo</th><th>Estado</th>{editable&&<th>Corregir</th>}</tr></thead><tbody>{data.reglas.map(r=>{const a=data.asignaturas.find(a=>a.id===r.asignacion_a);return <tr key={r.id}><td>{a?.carrera} · Año {a?.ano_estudio}</td><td>{name(r.asignacion_a)} + {r.asignacion_a===r.asignacion_b?'otra sesión de la misma asignatura':name(r.asignacion_b)}</td><td>{r.motivo}</td><td>{r.activa?'Activa':'Retirada'}</td>{editable&&<td><button className="secondary" disabled={busy||!!form} onClick={()=>{setForm({...r,confirmada:false});setMessage('')}}>Corregir regla {r.id}</button></td>}</tr>})}{!data.reglas.length&&<tr><td colSpan={editable?5:4}>No hay reglas de clases consecutivas registradas.</td></tr>}</tbody></table></div>}
 </section>
}
