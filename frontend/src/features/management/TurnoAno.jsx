import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'
const labels={matutino:'Matutino',vespertino:'Vespertino',nocturno:'Nocturno',encuentros:'Por encuentros'}
export default function TurnoAno({periodId,row,onSaved,onCancel}){
 const [context,setContext]=useState(null),[turn,setTurn]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
 const generation=useRef(0)
 useEffect(()=>{
  const controller=new AbortController();generation.current++;setContext(null);setConfirmed(false);setError('');setBusy(false)
  api('/asignacion-academica/turno',{method:'POST',data:{id_periodo:periodId,id_carrera:row.id_carrera,ano_estudio:row.ano_estudio},signal:controller.signal}).then(data=>{if(!controller.signal.aborted){setContext(data);setTurn(data.asignaturas[0].turno)}}).catch(e=>{if(!controller.signal.aborted)setError(e.message)})
  return()=>{controller.abort();generation.current++}
 },[periodId,row.id_carrera,row.ano_estudio,attempt])
 async function save(e){
  e.preventDefault();if(!context||!confirmed||busy)return
  const current=generation.current;setBusy(true);setError('')
  try{
   await api('/asignacion-academica/turno',{method:'PATCH',data:{id_periodo:periodId,id_carrera:row.id_carrera,ano_estudio:row.ano_estudio,turno:turn,huella:context.huella}})
   if(current===generation.current)onSaved()
  }catch(err){if(current===generation.current){setError(`${err.message} Vuelve a cargar las asignaturas antes de intentar otra corrección.`);setContext(null);setConfirmed(false)}}finally{if(current===generation.current)setBusy(false)}
 }
 return <form className="management-form" onSubmit={save}><h4>Corregir turno de {row.carrera} · Año {row.ano_estudio}</h4>
  <p>Se cambiará el turno de todas las asignaturas de este año en el semestre activo. Las horas semestrales, docentes y necesidades de aula se conservan. Esta corrección no reorganiza un horario existente.</p>
  {error&&<p role="alert">{error}</p>}
  {!context&&!error&&<p role="status">Consultando asignaturas del año…</p>}
  {context&&<fieldset disabled={busy}><label>Nuevo turno<select value={turn} onChange={e=>{setTurn(e.target.value);setConfirmed(false)}}>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
   <ul>{context.asignaturas.map(a=><li key={a.id}>{a.codigo} · {a.nombre}: {labels[a.turno]} → {labels[turn]}</li>)}</ul>
   <label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Confirmo el cambio de turno de todas estas asignaturas.</label>
   <button className="primary" disabled={!confirmed||context.asignaturas.every(a=>a.turno===turn)}>Guardar turno del año</button>
  </fieldset>}
  {error&&<button type="button" className="secondary" disabled={busy} onClick={()=>setAttempt(n=>n+1)}>Volver a cargar asignaturas</button>}
  <button type="button" className="secondary" disabled={busy} onClick={onCancel}>Cerrar corrección de turno</button>
 </form>
}
