import {useEffect,useState} from 'react'
import {api} from '../../services/management'
export default function GruposTurnos({context,configurations,groups,onEdit}) {
 const [rows,setRows]=useState([]),[links,setLinks]=useState([]),[selection,setSelection]=useState({}),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0)
 const [reloadRequired,setReloadRequired]=useState(true)
 const period=context?.activePeriod?.id_periodo
 useEffect(()=>{
  const c=new AbortController();setLoading(true);setReloadRequired(true);setError('');setSelection({});setMessage('')
  Promise.all([groups === undefined ? api('/secciones',{signal:c.signal}) : Promise.resolve(groups), api('/grupos-turnos',{signal:c.signal})]).then(([sections,assignments])=>{
   if(!c.signal.aborted){setRows(sections);setLinks(assignments);setReloadRequired(false)}
  }).catch(e=>{if(!c.signal.aborted)setError(e.message)}).finally(()=>{if(!c.signal.aborted)setLoading(false)})
  return()=>c.abort()
 },[period,revision,groups])
 async function save(row){
  if(busy||reloadRequired)return
  setBusy(true);setError('');setMessage('')
  try {
   const link=links.find(x=>x.id_seccion===row.id_seccion)
   const saved=await api('/grupos-turnos',{method:'POST',data:{id_seccion:row.id_seccion,id_cuadricula:Number(selection[row.id_seccion]),version:link?.version||0}})
   setLinks(current=>[...current.filter(x=>x.id_seccion!==row.id_seccion),saved]);setSelection(current=>{const next={...current};delete next[row.id_seccion];return next});setMessage(`Bloques asignados a ${row.codigo}.`)
  }catch(e){setError(e.message);setReloadRequired(true)}finally{setBusy(false)}
 }
 const grids=configurations.filter(g=>g.id_periodo===period)
 return <section aria-labelledby="group-turn-title"><h3 id="group-turn-title">Grupos y bloques del turno</h3>
  <p>Selecciona la configuración del turno para cada grupo. Los grupos con clases ya registradas requieren revisar esas clases antes de cambiar su configuración.</p>
  {!loading&&!grids.length&&<p className="notice">Aún no hay bloques por turno en este semestre. El encargado debe configurarlos en Bloques y recesos antes de asignarlos a un grupo.</p>}
  {error&&<p role="alert" className="error">{error} <button className="secondary" disabled={busy} onClick={()=>setRevision(n=>n+1)}>Recargar asignaciones</button></p>}
  {message&&<p role="status" className="success">{message}</p>}
  {loading?<p role="status">Cargando grupos…</p>:<div className="table-scroll"><table><caption>Grupos del semestre activo</caption><thead><tr><th>Grupo</th><th>Carrera y año</th>{onEdit&&<th>Estudiantes y asignaturas</th>}<th>Bloques del turno</th><th>Acción</th></tr></thead><tbody>
   {rows.filter(r=>r.id_periodo===period).map(row=>{
    const link=links.find(x=>x.id_seccion===row.id_seccion)
    const canEdit=context?.isAdmin||(context?.funciones?.includes('coordinador')&&context?.carreras?.includes(row.id_carrera))
    return <tr key={row.id_seccion}><td>{row.codigo}</td><td>{row.carrera_nombre}{row.ano_estudio&&<span className="cell-detail">Año {row.ano_estudio}</span>}</td>{onEdit&&<td>{row.cantidad_estudiantes} estudiantes<span className="cell-detail">{row.asignaturas?.length||0} asignaturas</span></td>}<td>{canEdit?<select aria-label={`Bloques de ${row.codigo}`} disabled={busy||reloadRequired||!grids.length} value={selection[row.id_seccion]??link?.id_cuadricula??''} onChange={e=>setSelection({...selection,[row.id_seccion]:e.target.value})}><option value="">Sin asignar</option>{grids.map(g=><option key={g.id_cuadricula} value={g.id_cuadricula}>{g.nombre}</option>)}</select>:grids.find(g=>g.id_cuadricula===link?.id_cuadricula)?.nombre||'Sin asignar'}</td><td>{canEdit&&<><button className="secondary" disabled={busy||reloadRequired||!selection[row.id_seccion]||Number(selection[row.id_seccion])===link?.id_cuadricula} onClick={()=>save(row)}>Guardar {row.codigo}</button>{onEdit&&context?.canManageSecciones&&<button className="secondary" disabled={busy||reloadRequired} onClick={()=>onEdit(row)}>Editar</button>}</>}</td></tr>
   })}
   {!rows.some(r=>r.id_periodo===period)&&<tr><td colSpan={onEdit?5:4}>No hay grupos registrados en este semestre.</td></tr>}
  </tbody></table></div>}
 </section>
}
