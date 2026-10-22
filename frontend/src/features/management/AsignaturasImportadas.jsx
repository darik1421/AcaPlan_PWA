import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'
export default function AsignaturasImportadas({context,canManage,onLinked}) {
 const [rows,setRows]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[form,setForm]=useState(null),[attempt,setAttempt]=useState(0),[query,setQuery]=useState(''),[message,setMessage]=useState('')
 const generation=useRef(0),scope=JSON.stringify([canManage,context?.isAdmin,context?.carreras])
 useEffect(()=>{const c=new AbortController();generation.current++;setForm(null);setLoading(true);setError('');setBusy(false)
  api('/asignaturas/importadas',{signal:c.signal}).then(data=>{if(!c.signal.aborted){setRows(data);onLinked?.(data.map(r=>r.id_asignatura).filter(Boolean))}}).catch(e=>{if(!c.signal.aborted){setError(e.message);setRows([])}}).finally(()=>{if(!c.signal.aborted)setLoading(false)})
  return()=>{c.abort();generation.current++}
 },[attempt,scope,onLinked])
 const mayEdit=r=>canManage&&(context?.isAdmin||context?.carreras?.includes(r.id_carrera))
 async function save(e){e.preventDefault();if(busy||!form||!mayEdit(form))return;const current=generation.current;setBusy(true);setError('');setMessage('')
  try{await api('/asignaturas/importadas',{method:'PATCH',data:{id:form.id,nombre:form.nombre,huella:form.huella}});if(current===generation.current){setMessage('Nombre de asignatura corregido.');setAttempt(n=>n+1)}}catch(err){if(current===generation.current){setError(`${err.message} Actualiza la lista antes de volver a corregir.`);setForm(null)}}finally{if(current===generation.current)setBusy(false)}
 }
 return <section><h3>Asignaturas recibidas por Excel</h3><p>Este catálogo se completa con la entrega académica. Puedes corregir el nombre; el código y la carrera identifican la asignatura y se conservan. El año no se cambia desde esta corrección.</p>
 {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
 <label>Buscar asignaturas importadas<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><button className="secondary" disabled={busy||loading} onClick={()=>setAttempt(n=>n+1)}>Actualizar asignaturas importadas</button>
 {form&&<form className="management-form" onSubmit={save}><h4>Corregir {form.codigo} · {form.carrera}</h4><fieldset disabled={busy}><label>Nombre de asignatura importada<input required maxLength={form.id_asignatura?100:150} value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></label><button className="primary">Guardar nombre</button><button type="button" onClick={()=>setForm(null)}>Cancelar</button></fieldset></form>}
 {loading?<p role="status">Consultando asignaturas importadas…</p>:error&&rows.length===0?null:<div className="table-scroll"><table><caption>Catálogo recibido por Excel</caption><thead><tr><th>Código</th><th>Asignatura</th><th>Carrera</th><th>Año</th><th>Correcciones</th></tr></thead><tbody>{rows.filter(r=>[r.codigo,r.nombre,r.carrera].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(r=><tr key={r.id}><td>{r.codigo}</td><td>{r.nombre}</td><td>{r.carrera}</td><td>{r.ano_estudio}</td><td>{mayEdit(r)&&<button className="secondary" disabled={busy} onClick={()=>{setForm(r);setMessage('')}}>Corregir nombre de {r.codigo}</button>}</td></tr>)}{!rows.length&&<tr><td colSpan={5}>No hay asignaturas importadas.</td></tr>}</tbody></table></div>}
 </section>
}
