import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'
export default function ComponentesAsignacion({id,periodId,onClose,onSaved}){
 const generation=useRef(0)
 const [data,setData]=useState(null),[parts,setParts]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[failed,setFailed]=useState(false)
 useEffect(()=>{const c=new AbortController();generation.current++;setData(null);setError("");setBusy(false);setFailed(false);api('/asignacion-academica/componentes',{method:'POST',data:{id,id_periodo:periodId},signal:c.signal}).then(d=>{if(c.signal.aborted)return;setData(d);setParts(d.componentes||[{tipo:'general',docentes:d.asignacion.docentes,sesiones:['matutino','vespertino'].includes(d.asignacion.turno)?2:null}])}).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>{c.abort();generation.current++}},[id,periodId])
 const regular=data&&['matutino','vespertino'].includes(data.asignacion.turno)
 async function save(e){e.preventDefault();const g=generation.current;setBusy(true);try{await api('/asignacion-academica/componentes',{method:'PATCH',data:{id,id_periodo:periodId,revision:data.asignacion.revision,componentes:parts}});if(g===generation.current)onSaved()}catch(e){if(g===generation.current){setError(e.message);setFailed(true)}}finally{if(g===generation.current)setBusy(false)}}
 return <section className="management-form"><h3>Teoría y práctica</h3><p>Solo separa las sesiones si tienen docentes diferentes. Una clase con varios docentes conserva a todos ocupados simultáneamente; no se administran grupos de mentoría.</p>{error&&<p role="alert">{error}</p>}
 {data?<form onSubmit={save}><fieldset disabled={busy||failed}><legend>{data.asignacion.asignatura}</legend>
 {!data.vigente&&<p className="notice">La asignación cambió. Revisa los docentes y vuelve a guardar esta distribución.</p>}
 <label>Distribución<select value={parts.length===2?'separada':'general'} onChange={e=>setParts(e.target.value==='general'?[{tipo:'general',docentes:data.asignacion.docentes,sesiones:regular?2:null}]:[{tipo:'teoria',docentes:[],sesiones:regular?1:null},{tipo:'practica',docentes:[],sesiones:regular?1:null}])}><option value="general">Mismos docentes en todas las sesiones</option><option value="separada">Teoría y práctica con docentes por sesión</option></select></label>
 <p>{regular?'Se mantienen dos sesiones de 90 minutos por semana; al separar, una de teoría y una de práctica.':'No se asignará una frecuencia semanal hasta confirmar la regla de este turno.'} Las necesidades de espacio actuales se aplican a ambas.</p>
 {parts.map((p,index)=><fieldset key={p.tipo}><legend>{p.tipo==='general'?'Todas las sesiones':p.tipo==='teoria'?'Teoría':'Práctica'}</legend>{data.disponibles.filter(d=>data.asignacion.docentes.includes(d.id)).map(d=><label className="check-label" key={d.id}><input type="checkbox" checked={p.docentes.includes(d.id)} onChange={()=>setParts(parts.map((part,i)=>i!==index?part:{...part,docentes:part.docentes.includes(d.id)?part.docentes.filter(x=>x!==d.id):[...part.docentes,d.id]}))}/>{d.nombre}</label>)}</fieldset>)}
 <p>Todos los docentes de la asignación deben participar al menos en una sesión.</p><button className="primary" disabled={parts.some(p=>!p.docentes.length)}>Guardar distribución</button></fieldset></form>:!error&&<p role="status">Consultando distribución…</p>}
 <button className="secondary" disabled={busy} onClick={onClose}>Cerrar distribución</button></section>
}


