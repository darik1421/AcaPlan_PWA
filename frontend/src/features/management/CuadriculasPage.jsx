import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import BloquesPage from './BloquesPage'
const days=['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo']
const turns={matutino:'Matutino',vespertino:'Vespertino',nocturno:'Nocturno',encuentros:'Por encuentros'}
const block=()=>({dia:'Lunes',hora_inicio:'',hora_fin:'',es_receso:false})
export default function CuadriculasPage({context}) {
 const [rows,setRows]=useState([]),[form,setForm]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[loading,setLoading]=useState(true)
 const period=context?.activePeriod?.id_periodo
 const editable=context?.canManageBloques
 const [turn,setTurn]=useState('matutino')
 const [showPrevious,setShowPrevious]=useState(false)
 const visibleRows=rows.filter(r=>r.id_periodo===period&&r.turno===turn)
 async function load(signal) {
  setLoading(true)
  try { const data=await api('/cuadriculas',{signal}); if(!signal?.aborted)setRows(data) }
  catch(e){if(!signal?.aborted)setError(e.message)}
  finally {if(!signal?.aborted)setLoading(false)}
 }
 useEffect(()=>{const c=new AbortController();load(c.signal);return()=>c.abort()},[])
 useEffect(()=>{setForm(null)},[period,editable])
 function changeBlock(index,key,value){setForm(f=>({...f,bloques:f.bloques.map((b,i)=>i===index?{...b,[key]:value}:b)}))}
 async function save(e){
  e.preventDefault();if(busy||!editable||form.id_periodo!==period)return
  setBusy(true);setError('');setMessage('')
  try {await api('/cuadriculas',{method:'POST',data:form});setTurn(form.turno);setForm(null);setMessage('Bloques y recesos guardados.');await load()}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 return <section aria-labelledby="grids-title">
  <div className="section-heading"><div><h2 id="grids-title">Bloques y recesos</h2><p>Define las horas de cada turno para {context?.activePeriod?.nombre||'un semestre activo'}.</p></div>
   {period&&editable&&<button className="secondary" disabled={busy} onClick={()=>{setForm({nombre:'',turno:turn,id_periodo:period,bloques:[block()]});setError('');setMessage('')}}>Añadir configuración de turno</button>}
  </div>
  <p className="muted">Matutino y vespertino: bloques de 45 minutos; dos seguidos forman una sesión de 90. Nocturno y encuentros: bloques de 60 minutos. El nocturno no lleva recesos. Registra el viernes dentro de encuentros cuando corresponda.</p>
  <p className="notice">Asigna la configuración a cada grupo desde Grupos. Si un grupo ya tiene clases, no se pueden cambiar los tiempos ni el turno de su configuración; sí puedes corregir el nombre. La generación de horarios sigue pendiente.</p>
  <label>Turno a consultar<select disabled={busy} value={turn} onChange={e=>setTurn(e.target.value)}>{Object.entries(turns).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  {!period&&<p className="notice">Activa un semestre para configurar sus bloques y recesos.</p>}
  {error&&<p role="alert" className="error">{error}</p>}{message&&<p role="status" className="success">{message}</p>}
  {form&&editable&&<form className="management-form" onSubmit={save}><h3>{form.id?'Editar bloques del turno':'Configurar bloques del turno'}</h3><fieldset disabled={busy}>
   <div className="form-grid"><label>Nombre de la configuración<input required maxLength={100} placeholder="Ej. Matutino CUR" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})}/></label>
   <label>Turno<select value={form.turno} onChange={e=>setForm({...form,turno:e.target.value})}>{Object.entries(turns).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label></div>
   {form.bloques.map((b,i)=><fieldset key={i}><legend>Intervalo {i+1}</legend><div className="form-grid">
    <label>Día {i+1}<select value={b.dia} onChange={e=>changeBlock(i,'dia',e.target.value)}>{days.map(d=><option key={d}>{d}</option>)}</select></label>
    <label>Inicio {i+1}<input required type="time" value={b.hora_inicio} onChange={e=>changeBlock(i,'hora_inicio',e.target.value)}/></label>
    <label>Fin {i+1}<input required type="time" value={b.hora_fin} onChange={e=>changeBlock(i,'hora_fin',e.target.value)}/></label>
    <label>Tipo {i+1}<select value={String(b.es_receso)} onChange={e=>changeBlock(i,'es_receso',e.target.value==='true')}><option value="false">Clase</option><option value="true">Receso</option></select></label>
   </div><button type="button" className="secondary" disabled={form.bloques.length===1} onClick={()=>setForm({...form,bloques:form.bloques.filter((_,n)=>n!==i)})}>Quitar intervalo {i+1}</button></fieldset>)}
   <div className="form-actions"><button type="button" className="secondary" disabled={form.bloques.length>=140} onClick={()=>setForm({...form,bloques:[...form.bloques,block()]})}>Añadir intervalo</button><button className="primary">{busy?'Guardando…':'Guardar bloques y recesos'}</button><button type="button" className="secondary" onClick={()=>setForm(null)}>Cancelar</button></div>
  </fieldset></form>}
  {loading?<p role="status">Cargando bloques por turno…</p>:<div>{visibleRows.map(row=><details key={row.id_cuadricula}><summary>{row.nombre} · {turns[row.turno]} · {row.bloques.length} intervalos</summary>
   <div className="table-scroll"><table><caption>{row.nombre}</caption><thead><tr><th>Día</th><th>Inicio</th><th>Fin</th><th>Tipo</th></tr></thead><tbody>{[...row.bloques].sort((a,b)=>days.indexOf(a.dia)-days.indexOf(b.dia)||a.hora_inicio.localeCompare(b.hora_inicio)).map((b,i)=><tr key={i}><td>{b.dia}</td><td>{b.hora_inicio}</td><td>{b.hora_fin}</td><td>{b.es_receso?'Receso':'Clase'}</td></tr>)}</tbody></table></div>
   {editable&&<button className="secondary" disabled={busy} onClick={()=>{setForm({...row,id:row.id_cuadricula});setMessage('');setError('')}}>Editar {row.nombre}</button>}
  </details>)}{period&&!visibleRows.length&&<p>No hay bloques configurados para este turno y semestre.</p>}</div>}
  <details onToggle={e=>setShowPrevious(e.currentTarget.open)}><summary>Consultar bloques anteriores sin turno asignado</summary>
   <p>Solo consulta. No se asigna un turno automáticamente a los registros anteriores.</p>
   {showPrevious&&<BloquesPage context={context}/>}
  </details>
 </section>
}
