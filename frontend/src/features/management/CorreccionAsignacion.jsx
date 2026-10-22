import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'

export default function CorreccionAsignacion({id,periodId,onSaved,onClose}) {
 const [context,setContext]=useState(null),[hours,setHours]=useState(''),[teachers,setTeachers]=useState([])
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[failed,setFailed]=useState(false)
 const [accepted,setAccepted]=useState(false),[attempt,setAttempt]=useState(0)
 const generation=useRef(0)
 useEffect(()=>{
  const c=new AbortController(),current=++generation.current
  setLoading(true);setContext(null);setError('');setFailed(false);setAccepted(false);setBusy(false)
  api('/asignacion-academica/correccion',{method:'POST',data:{id,id_periodo:periodId},signal:c.signal})
   .then(data=>{if(current!==generation.current)return;setContext(data);setHours(String(data.asignacion.horas_semestre));setTeachers(data.asignacion.docentes)})
   .catch(e=>{if(current===generation.current)setError(e.message)})
   .finally(()=>{if(current===generation.current)setLoading(false)})
  return()=>{c.abort();generation.current++}
 },[id,periodId,attempt])
 const names=ids=>ids.map(id=>context?.disponibles.find(d=>d.id===id)?.nombre||`Registro ${id}`).join(', ')
 const changed=context&&(Number(hours)!==context.asignacion.horas_semestre||[...teachers].sort().join(',')!==[...context.asignacion.docentes].sort().join(','))
 const valid=/^\d+$/.test(hours)&&Number(hours)<=10000&&teachers.length>0
 const toggle=id=>{setAccepted(false);setTeachers(current=>current.includes(id)?current.filter(t=>t!==id):[...current,id])}
 async function save(e){
  e.preventDefault();if(!valid||!changed||!accepted||busy||failed)return
  const current=generation.current;setBusy(true);setError('')
  try{
   await api('/asignacion-academica/correccion',{method:'PATCH',data:{id,id_periodo:periodId,revision:context.asignacion.revision,horas_semestre:Number(hours),docentes:teachers}})
   if(current===generation.current)onSaved()
  }catch(e){if(current===generation.current){setError(`${e.message} Recarga la asignación antes de volver a guardar.`);setFailed(true);setAccepted(false)}}
  finally{if(current===generation.current)setBusy(false)}
 }
 return <section aria-label="Corregir asignación" className="management-form">
  <h3>Corregir asignación recibida</h3>
  {loading&&<p role="status">Cargando datos para corregir…</p>}
  {error&&<p role="alert" className="error">{error}</p>}
  {context&&!loading&&<form onSubmit={save}>
   <p><strong>{context.asignacion.asignatura}</strong> · Año {context.asignacion.ano_estudio} · {context.asignacion.turno}</p>
   <p>Corrige los docentes asociados o la carga total del semestre. No se cambian cuentas, restricciones ni horarios. La carrera, el año y el turno se conservan; cambiar el turno de todo el año requiere una corrección conjunta.</p>
   <fieldset disabled={busy||failed}>
    <label>Horas totales del semestre a corregir<input type="number" min="0" max="10000" step="1" required value={hours} onChange={e=>{setHours(e.target.value);setAccepted(false)}}/></label>
    <p className="muted">Son horas del semestre, por ejemplo 42 o 56. No se convierten automáticamente en sesiones semanales.</p>
    <fieldset><legend>Docentes de la asignatura</legend>
     <p>Selecciona al menos uno. Se muestran docentes ya recibidos para esta carrera. Para incorporar a alguien nuevo, utiliza el Excel.</p>
     {context.disponibles.map(d=><label className="check-label" key={d.id}><input type="checkbox" checked={teachers.includes(d.id)} disabled={!d.activo&&!teachers.includes(d.id)} onChange={()=>toggle(d.id)}/>{d.nombre}{context.disponibles.filter(other=>other.nombre===d.nombre).length>1?` · Registro académico ${d.id}`:''}{!d.activo?' (cuenta inactiva; retíralo para guardar)':''}</label>)}
    </fieldset>
    {changed&&<div className="notice"><p>Horas: {context.asignacion.horas_semestre} → {hours||'sin indicar'}</p><p>Docentes actuales: {names(context.asignacion.docentes)}</p><p>Docentes después de guardar: {names(teachers)||'ninguno'}</p><label className="check-label"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>Revisé los cambios y confirmo esta corrección.</label></div>}
    <button className="primary" disabled={!valid||!changed||!accepted} type="submit">{busy?'Guardando corrección…':'Guardar corrección'}</button>
   </fieldset>
  </form>}
  <div className="form-actions"><button className="secondary" disabled={busy||loading} onClick={()=>setAttempt(n=>n+1)}>Recargar asignación</button><button className="secondary" disabled={busy} onClick={onClose}>Cerrar corrección</button></div>
 </section>
}
