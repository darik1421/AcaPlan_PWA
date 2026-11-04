import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'

export default function NecesidadesAsignacion({id,periodId,onSaved,onClose}) {
 const [data,setData]=useState(null),[type,setType]=useState(''),[accepted,setAccepted]=useState(false)
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0)
 const generation=useRef(0)
 useEffect(()=>{
  const c=new AbortController(),current=++generation.current;setData(null);setError('');setLoading(true);setBusy(false);setFailed(false);setAccepted(false)
  api('/asignacion-academica/necesidades',{method:'POST',data:{id,id_periodo:periodId},signal:c.signal})
   .then(result=>{if(current===generation.current){setData(result);setType(result.tipo_espacio??'')}})
   .catch(e=>{if(current===generation.current)setError(e.message)})
   .finally(()=>{if(current===generation.current)setLoading(false)})
  return()=>{c.abort();generation.current++}
 },[id,periodId,attempt])
 const changed=data&&(!data.definidas||type!==(data.tipo_espacio??''))
 async function save(e){
  e.preventDefault();if(!data||busy||failed||!accepted||!changed)return
  const current=generation.current;setBusy(true);setError('')
  try{
   await api('/asignacion-academica/necesidades',{method:'PATCH',data:{id,id_periodo:periodId,revision:data.asignacion.revision,tipo_espacio:type||null}})
   if(current===generation.current)onSaved()
  }catch(e){if(current===generation.current){setError(`${e.message} Recarga las necesidades antes de guardar otra vez.`);setFailed(true);setAccepted(false)}}
  finally{if(current===generation.current)setBusy(false)}
 }
 return <section className="management-form" aria-label="Necesidades de aula"><h3>Necesidades de aula</h3>
  <p>El coordinador indica qué tipo de aula necesita esta asignatura. Estos datos preparan la revisión y la generación futura de los horarios.</p>
  {loading&&<p role="status">Consultando necesidades…</p>}{error&&<p role="alert" className="error">{error}</p>}
  {data&&!loading&&<form onSubmit={save}>
   <p><strong>{data.asignacion.codigo} · {data.asignacion.nombre}</strong> · Año {data.asignacion.ano_estudio}</p>
   <p className="notice">{data.definidas?'El coordinador ya revisó estas necesidades.':'Necesidades pendientes de revisión. No se asumirá que cualquier aula sirve.'}</p>
   <fieldset disabled={busy||failed}>
    <label>Tipo de espacio necesario<select value={type} onChange={e=>{setType(e.target.value);setAccepted(false)}}><option value="">Sin preferencia de tipo</option>{[...new Set([...data.tipos,...(type?[type]:[])])].map(t=><option key={t} value={t}>{t}</option>)}</select></label>
    <p className="muted">Los tipos provienen del inventario. «Sin preferencia de tipo» permite cualquier tipo compatible con la capacidad exigida.</p>
    {changed&&<div className="notice"><p>Tipo anterior: {data.definidas?(data.tipo_espacio||'Sin preferencia'):'Pendiente'} → {type||'Sin preferencia'}</p><label className="check-label"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>Revisé las necesidades de esta asignatura y confirmo estos datos.</label></div>}
    <button className="primary" type="submit" disabled={!changed||!accepted}>{busy?'Guardando necesidades…':'Guardar necesidades'}</button>
   </fieldset>
  </form>}
  <div className="form-actions"><button className="secondary" disabled={busy||loading} onClick={()=>setAttempt(n=>n+1)}>Recargar necesidades</button><button className="secondary" disabled={busy} onClick={onClose}>Cerrar necesidades</button></div>
 </section>
}
