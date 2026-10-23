import EstadoBorrador from './EstadoBorrador'
import VistaSemanalBorrador from './VistaSemanalBorrador'
import RevisionBorrador from './RevisionBorrador'
import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'
const days=['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo']
const empty={id_asignacion:'',componente:'general',id_aula:'',dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:30'}
const describe=c=>c?`${c.dia} ${c.hora_inicio}–${c.hora_fin}, aula ${c.id_aula}, asignación ${c.id_asignacion} (${c.componente})`:'Nueva clase'
export default function BorradoresPage({periodId,canPlan=false}){
 const [list,setList]=useState(null),[selected,setSelected]=useState(null),[detail,setDetail]=useState(null),[name,setName]=useState(''),[careers,setCareers]=useState([])
 const [form,setForm]=useState(empty),[editing,setEditing]=useState(null),[operation,setOperation]=useState('clase'),[accepted,setAccepted]=useState(false),[reason,setReason]=useState('')
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[report,setReport]=useState(null),[attempt,setAttempt]=useState(0)
 const generation=useRef(0)
 useEffect(()=>{setSelected(null);setName('');setCareers([])},[periodId])
 useEffect(()=>{
  const c=new AbortController(),g=++generation.current;setList(null);setDetail(null);setReport(null);setEditing(null);setForm(empty);setOperation('clase');setAccepted(false);setReason('');setError('');setBusy(false)
  if(periodId)api('/borradores/consultar',{method:'POST',data:{id_periodo:periodId},signal:c.signal}).then(d=>{if(g===generation.current)setList(d)}).catch(e=>{if(!c.signal.aborted)setError(e.message)})
  if(selected)api('/borradores/detalle',{method:'POST',data:{id:selected},signal:c.signal}).then(d=>{if(g===generation.current)setDetail(d)}).catch(e=>{if(!c.signal.aborted)setError(e.message)})
  return()=>{c.abort();generation.current++}
 },[periodId,selected,attempt])
 async function run(path,payload,onSuccess){const g=generation.current;setBusy(true);setError('');setReport(null);try{const d=await api(path,{method:'POST',data:payload});if(g===generation.current)onSuccess(d)}catch(e){if(g===generation.current){setError(`${e.message} Consulta nuevamente los datos antes de reintentar.`);setDetail(null)}}finally{if(g===generation.current)setBusy(false)}}
 const refresh=()=>setAttempt(n=>n+1)
 const course=detail?.asignaciones.find(a=>a.id===Number(form.id_asignacion))
 const parts=course?.componentes||[{tipo:'general'}]
 function prepare(c,action){setEditing(c);setOperation(action);setForm({...c,hora_inicio:c.hora_inicio.slice(0,5),hora_fin:c.hora_fin.slice(0,5)});setAccepted(false);setReason('');setReport(null)}
 function cancel(){setEditing(null);setForm(empty);setOperation('clase');setAccepted(false);setReason('')}
 async function save(e){e.preventDefault();const payload={id:selected,revision:detail.borrador.revision,...(editing?{id_clase:editing.id}:{}),autorizar:accepted,motivo:reason};if(operation==='clase')Object.assign(payload,{id_asignacion:Number(form.id_asignacion),id_aula:Number(form.id_aula),componente:form.componente,dia:form.dia,hora_inicio:form.hora_inicio,hora_fin:form.hora_fin});if(operation==='fijar')payload.fijada=!editing.fijada;await run(`/borradores/${operation}`,payload,refresh)}
 const needsAuthorization=editing?.fijada&&(operation!=='fijar'||editing.fijada)
 if(!periodId)return <p>Activa un semestre para trabajar con borradores.</p>
 return <section><h2>Borradores de horarios</h2><p>Organiza propuestas independientes por semestre. Guardar o fijar una clase no aprueba el horario. El motor de generación sigue pendiente; aquí puedes preparar y revisar una propuesta.</p>
 {error&&<p role="alert" className="error">{error}</p>}<button className="secondary" disabled={busy} onClick={refresh}>Consultar nuevamente</button>
 {list&&<><label>Borrador<select disabled={busy} value={selected||''} onChange={e=>{setSelected(Number(e.target.value)||null);cancel()}}><option value="">Seleccionar borrador</option>{list.borradores.map(d=><option key={d.id} value={d.id}>{d.nombre}</option>)}</select></label>
 {canPlan&&<details><summary>Crear un borrador</summary><form onSubmit={e=>{e.preventDefault();run('/borradores',{id_periodo:periodId,nombre:name,carreras:careers},d=>{setSelected(d.id);refresh()})}}><fieldset disabled={busy||!list.semestre_activo}><label>Nombre del borrador<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><fieldset><legend>Carreras incluidas</legend>{list.carreras.map(c=><label className="check-label" key={c.id_carrera}><input type="checkbox" checked={careers.includes(c.id_carrera)} onChange={()=>setCareers(a=>a.includes(c.id_carrera)?a.filter(id=>id!==c.id_carrera):[...a,c.id_carrera])}/>{c.nombre}</label>)}</fieldset><button className="primary" disabled={!careers.length}>Crear borrador</button></fieldset></form></details>}</>}
 {detail&&<><h3>{detail.borrador.nombre}</h3><p>Versión {detail.borrador.revision} · {detail.clases.length} clases · Consulta el estado de publicación abajo</p>
 <EstadoBorrador key={`${selected}:${attempt}`} id={selected} revision={detail.borrador.revision} active={detail.semestre_activo} onChanged={refresh}/><VistaSemanalBorrador key={selected} detail={detail} onEdit={prepare} disabled={!canPlan||busy||!detail.semestre_activo}/><div className="table-scroll"><table><caption>Clases de esta propuesta</caption><thead><tr><th>Asignatura</th><th>Sesión</th><th>Aula</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{detail.clases.map(c=><tr key={c.id}><td>{detail.asignaciones.find(a=>a.id===c.id_asignacion)?.nombre||'Asignación retirada'} · {c.componente}</td><td>{c.dia} {c.hora_inicio.slice(0,5)}–{c.hora_fin.slice(0,5)}</td><td>{detail.espacios.find(a=>a.id_aula===c.id_aula)?.codigo||c.id_aula}</td><td>{c.fijada?'Fijada':'Editable'}</td><td>{canPlan&&[['clase','Editar'],['fijar',c.fijada?'Desfijar':'Fijar'],['retirar','Retirar']].map(([action,label])=><button key={action} className="secondary" disabled={!canPlan||busy||!detail.semestre_activo} onClick={()=>prepare(c,action)}>{label} clase {c.id}</button>)}</td></tr>)}</tbody></table></div>
 {canPlan&&<form onSubmit={save} className="management-form"><fieldset disabled={!canPlan||busy||!detail.semestre_activo}><legend>{editing?`${operation==='clase'?'Editar':operation==='fijar'?(editing.fijada?'Desfijar':'Fijar'):'Retirar'} clase ${editing.id}`:'Añadir una clase al borrador'}</legend>
 {operation==='clase'&&<><label>Asignatura de la propuesta<select required value={form.id_asignacion} onChange={e=>{const a=detail.asignaciones.find(a=>a.id===Number(e.target.value));setForm({...form,id_asignacion:e.target.value,componente:a?.componentes?.[0]?.tipo||'general'});setAccepted(false)}}><option value="">Seleccionar</option>{detail.asignaciones.map(a=><option value={a.id} key={a.id}>{a.carrera} · Año {a.ano_estudio} · {a.codigo} · {a.nombre}</option>)}</select></label>
 <label>Sesión<select value={form.componente} onChange={e=>{setForm({...form,componente:e.target.value});setAccepted(false)}}>{parts.map(p=><option key={p.tipo}>{p.tipo}</option>)}</select></label>
 <label>Aula<select required value={form.id_aula} onChange={e=>{setForm({...form,id_aula:e.target.value});setAccepted(false)}}><option value="">Seleccionar</option>{detail.espacios.filter(r=>r.estado==='activo').map(r=><option key={r.id_aula} value={r.id_aula}>{r.sede} · {r.codigo||r.nombre||r.id_aula}</option>)}</select></label>
 <label>Día<select value={form.dia} onChange={e=>{setForm({...form,dia:e.target.value});setAccepted(false)}}>{days.map(d=><option key={d}>{d}</option>)}</select></label>
 {['hora_inicio','hora_fin'].map((key,i)=><label key={key}>{i?'Hora de fin':'Hora de inicio'}<input required type="time" value={form[key]} onChange={e=>{setForm({...form,[key]:e.target.value});setAccepted(false)}}/></label>)}<p>La revisión comprobará la duración del turno, restricciones, ocupaciones y recesos.</p></>}
 {editing&&<p>Antes: {describe(editing)}. {operation==='clase'?`Después: ${describe(form)}`:operation==='retirar'?'Se retirará únicamente de este borrador.':editing.fijada?'Quedará editable.':'Quedará fijada para conservar su ubicación.'}</p>}
 {needsAuthorization&&<div className="notice"><p>Esta clase está fijada. Autorizar el cambio no permite ignorar restricciones.</p><label>Motivo de la autorización<input required maxLength={500} value={reason} onChange={e=>{setReason(e.target.value);setAccepted(false)}}/></label><label className="check-label"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>Autorizo este cambio de la clase fijada.</label></div>}
 <button className="primary" disabled={needsAuthorization&&(!accepted||!reason.trim())}>Confirmar {operation==='clase'?'clase':operation==='retirar'?'retiro':'estado'}</button><button className="secondary" type="button" onClick={cancel}>Cancelar edición</button></fieldset></form>}
 <button className="primary" disabled={busy} onClick={()=>run('/borradores/revisar',{id:selected,revision:detail.borrador.revision},setReport)}>Revisar borrador</button>
 {report&&<RevisionBorrador report={report} detail={detail} onEdit={prepare} disabled={!canPlan||busy||!detail.semestre_activo}/>}
 <details><summary>Historial de cambios</summary><ul>{detail.movimientos.map(m=><li key={m.id}>Clase {m.id_clase} · Usuario {m.actor} · {new Date(m.fecha).toLocaleString()} · {m.motivo||'Edición de propuesta'}<p>{describe(m.antes)} → {describe(m.despues)}{m.despues?.retirada?' (retirada)':''}</p></li>)}</ul></details></>}
 </section>
}




