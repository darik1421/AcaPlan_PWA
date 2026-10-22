import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'
import TurnoAno from './TurnoAno'

export default function DatosAnos({periodId,revision,onChanged}) {
 const [turnRow,setTurnRow]=useState(null)
 const [rows,setRows]=useState([]),[form,setForm]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0),[message,setMessage]=useState('')
 const generation=useRef(0)
 useEffect(()=>{setMessage('')},[periodId])
 useEffect(()=>{setTurnRow(null)},[periodId,revision])
 useEffect(()=>{
  const c=new AbortController();generation.current++;setForm(null);setError('');setLoading(true);setRows([]);setBusy(false)
  api('/asignacion-academica/anos',{signal:c.signal}).then(data=>{if(!c.signal.aborted)setRows(data.filter(r=>r.id_periodo===periodId))}).catch(e=>{if(!c.signal.aborted)setError(e.message)}).finally(()=>{if(!c.signal.aborted)setLoading(false)})
  return()=>{c.abort();generation.current++}
 },[periodId,revision,attempt])
 async function save(e){
  e.preventDefault();if(busy||!form)return
  const current=generation.current;setBusy(true);setError('');setMessage('')
  try{
   await api('/asignacion-academica/anos',{method:'PATCH',data:{id_periodo:periodId,id_carrera:form.id_carrera,ano_estudio:form.ano_estudio,revision:form.revision,cantidad_estudiantes:form.cantidad_estudiantes===''?null:Number(form.cantidad_estudiantes),sede:form.sede.trim()||null}})
   if(current===generation.current){setMessage('Datos del año guardados.');setAttempt(n=>n+1)}
  }catch(err){if(current===generation.current){setError(`${err.message} Recarga antes de volver a corregir.`);setForm(null)}}finally{if(current===generation.current)setBusy(false)}
 }
 return <section aria-labelledby="year-data-title"><h3 id="year-data-title">Datos complementarios de los años de carrera</h3>
  <p>Los años y turnos se obtienen del mismo Excel académico. Completa la cantidad de estudiantes y la sede cuando las conozcas; déjalas pendientes si aún no tienes esa información. No se crean grupos A, B o C.</p>
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  {turnRow&&<TurnoAno periodId={periodId} row={turnRow} onCancel={()=>setTurnRow(null)} onSaved={()=>{setTurnRow(null);setMessage('Turno del año corregido para todas sus asignaturas.');setAttempt(n=>n+1);onChanged?.()}}/>}
  <button className="secondary" disabled={busy||loading||!!turnRow} onClick={()=>setAttempt(n=>n+1)}>Actualizar datos de los años</button>
  {form&&<form className="management-form" onSubmit={save}><h4>{form.carrera} · Año {form.ano_estudio}</h4><fieldset disabled={busy}>
   <label>Cantidad de estudiantes<input type="number" min="1" max="999999" value={form.cantidad_estudiantes} onChange={e=>setForm({...form,cantidad_estudiantes:e.target.value})}/></label>
   <label>Sede<input maxLength={100} value={form.sede} onChange={e=>setForm({...form,sede:e.target.value})}/></label>
   <button className="primary">Guardar datos del año</button><button type="button" className="secondary" onClick={()=>setForm(null)}>Cancelar</button>
  </fieldset></form>}
  {loading?<p role="status">Consultando años de carrera…</p>:error&&rows.length===0?null:<div className="table-scroll"><table><caption>Años recibidos en este semestre</caption><thead><tr><th>Carrera y año</th><th>Turno</th><th>Estudiantes</th><th>Sede</th><th>Completar datos</th></tr></thead><tbody>
   {rows.map(r=><tr key={`${r.id_carrera}:${r.ano_estudio}`}><td>{r.carrera} · Año {r.ano_estudio}</td><td>{({matutino:'Matutino',vespertino:'Vespertino',nocturno:'Nocturno',encuentros:'Por encuentros'})[r.turno]}</td><td>{r.cantidad_estudiantes??'Pendiente'}</td><td>{r.sede??'Pendiente'}</td><td><button className="secondary" disabled={busy||!!turnRow} onClick={()=>{setForm({...r,cantidad_estudiantes:r.cantidad_estudiantes??'',sede:r.sede??''});setMessage('')}}>Completar {r.carrera} · Año {r.ano_estudio}</button><button className="secondary" disabled={busy||!!turnRow||!!form} onClick={()=>{setTurnRow(r);setMessage('')}}>Corregir turno de {r.carrera} · Año {r.ano_estudio}</button></td></tr>)}
   {!rows.length&&<tr><td colSpan={5}>Los años aparecerán al confirmar la entrega académica.</td></tr>}
  </tbody></table></div>}
 </section>
}
