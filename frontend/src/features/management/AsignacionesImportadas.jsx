import ComponentesAsignacion from './ComponentesAsignacion'
import CorreccionAsignacion from './CorreccionAsignacion'
import NecesidadesAsignacion from './NecesidadesAsignacion'
import {useEffect,useState} from 'react'
import {api} from '../../services/management'
export default function AsignacionesImportadas({periodId,revision}){
 const [editing,setEditing]=useState(null),[message,setMessage]=useState('')
 const [needs,setNeeds]=useState(null),[components,setComponents]=useState(null)
 useEffect(()=>{setEditing(null);setNeeds(null);setComponents(null);setMessage('')},[periodId,revision])
 const [rows,setRows]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0)
 useEffect(()=>{const c=new AbortController();setLoading(true);setError('');setRows([]);api('/asignacion-academica',{signal:c.signal}).then(data=>{if(!c.signal.aborted)setRows(data)}).catch(e=>{if(!c.signal.aborted)setError(e.message)}).finally(()=>{if(!c.signal.aborted)setLoading(false)});return()=>c.abort()},[periodId,revision,attempt])
 const [career,setCareer]=useState(''),[year,setYear]=useState(''),[turn,setTurn]=useState('')
 const semesterRows=rows.filter(r=>r.id_periodo===periodId)
 const careers=[...new Set(semesterRows.map(r=>r.carrera))].sort()
 const years=[...new Set(semesterRows.map(r=>String(r.ano_estudio)))].sort((a,b)=>Number(a)-Number(b))
 const turns=[...new Set(semesterRows.map(r=>r.turno))].sort()
 const turnName=value=>({matutino:'Matutino',vespertino:'Vespertino',nocturno:'Nocturno',encuentros:'Por encuentros'})[value]||value
 const visible=semesterRows.filter(r=>(!career||r.carrera===career)&&(!year||String(r.ano_estudio)===year)&&(!turn||r.turno===turn))
 return <section><h3>Asignación académica importada</h3>
 {message&&<p role="status" className="success">{message}</p>}
 {editing&&<CorreccionAsignacion key={`${periodId}:${editing}`} id={editing} periodId={periodId} onClose={()=>setEditing(null)} onSaved={()=>{setEditing(null);setMessage('Corrección guardada. Se actualizaron los docentes y las horas de la asignación.');setAttempt(n=>n+1)}}/>}
 {components&&<ComponentesAsignacion key={`componentes:${periodId}:${components}`} id={components} periodId={periodId} onClose={()=>setComponents(null)} onSaved={()=>{setComponents(null);setMessage("Distribución guardada.");setAttempt(n=>n+1)}}/>}{needs&&<NecesidadesAsignacion key={`necesidades:${periodId}:${needs}`} id={needs} periodId={periodId} onClose={()=>setNeeds(null)} onSaved={()=>{setNeeds(null);setMessage('Necesidades de aula y equipamiento guardadas.');setAttempt(n=>n+1)}}/>}
 {!loading&&!error&&semesterRows.length>0&&<div className="list-toolbar">
  <label>Carrera de la entrega<select value={career} onChange={e=>setCareer(e.target.value)}><option value="">Todas las carreras</option>{careers.map(c=><option key={c}>{c}</option>)}</select></label>
  <label>Año de la entrega<select value={year} onChange={e=>setYear(e.target.value)}><option value="">Todos los años</option>{years.map(y=><option key={y} value={y}>Año {y}</option>)}</select></label>
  <label>Turno de la entrega<select value={turn} onChange={e=>setTurn(e.target.value)}><option value="">Todos los turnos</option>{turns.map(t=><option key={t} value={t}>{turnName(t)}</option>)}</select></label>
  <button className="secondary" onClick={()=>{setCareer('');setYear('');setTurn('')}}>Limpiar filtros</button>
 </div>}
 {error?<p role="alert" className="error">{error} <button className="secondary" onClick={()=>setAttempt(n=>n+1)}>Reintentar consulta</button></p>:loading?<p role="status">Consultando asignación importada…</p>:<div className="table-scroll"><table><caption>Entrega recibida para el semestre activo</caption><thead><tr><th>Carrera y año</th><th>Asignatura</th><th>Docentes</th><th>Turno</th><th>Horas totales del semestre</th><th>Correcciones y necesidades</th></tr></thead><tbody>{visible.map(r=><tr key={r.id}><td>{r.carrera} · Año {r.ano_estudio}</td><td>{r.codigo_asignatura} · {r.nombre_asignatura}</td><td>{r.docentes?.join(', ')}</td><td>{turnName(r.turno)}</td><td>{r.horas_semestre}</td><td><button className="secondary" disabled={!!editing||!!needs||!!components} onClick={()=>{setMessage('');setEditing(r.id)}}>Corregir {r.codigo_asignatura}</button><button className="secondary" disabled={!!editing||!!needs||!!components} onClick={()=>{setMessage('');setNeeds(r.id)}}>Necesidades de {r.codigo_asignatura}</button><button className="secondary" disabled={!!editing||!!needs||!!components} onClick={()=>setComponents(r.id)}>Teoría y práctica de {r.codigo_asignatura}</button></td></tr>)}{!visible.length&&<tr><td colSpan={6}>{semesterRows.length?'No hay asignaciones que coincidan con los filtros.':'No hay entregas confirmadas en este semestre.'}</td></tr>}</tbody></table></div>}
 </section>
}

