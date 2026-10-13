import {useEffect,useState} from 'react'
import {api} from '../../services/management'
export default function GruposTurnos({context,configurations,groups,onEdit}) {
 const [rows,setRows]=useState([]),[links,setLinks]=useState([]),[selection,setSelection]=useState({}),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0)
 const [reloadRequired,setReloadRequired]=useState(true)
 const [query,setQuery]=useState(''),[career,setCareer]=useState(''),[year,setYear]=useState(''),[turn,setTurn]=useState('')
 const period=context?.activePeriod?.id_periodo
 const scope=JSON.stringify([context?.isAdmin===true,context?.funciones||[],context?.carreras||[]])
 const mayEdit=row=>context?.isAdmin===true||(context?.funciones?.includes('coordinador')&&context?.carreras?.includes(row.id_carrera))
 useEffect(()=>{setSelection({});setMessage('')},[scope])
 useEffect(()=>{setQuery('');setCareer('');setYear('');setTurn('')},[period])
 useEffect(()=>{
  const c=new AbortController();setLoading(true);setReloadRequired(true);setError('');setSelection({});setMessage('')
  Promise.all([groups === undefined ? api('/secciones',{signal:c.signal}) : Promise.resolve(groups), api('/grupos-turnos',{signal:c.signal})]).then(([sections,assignments])=>{
   if(!c.signal.aborted){setRows(sections);setLinks(assignments);setReloadRequired(false)}
  }).catch(e=>{if(!c.signal.aborted){setError(e.message);setRows([]);setLinks([])}}).finally(()=>{if(!c.signal.aborted)setLoading(false)})
  return()=>c.abort()
 },[period,revision,groups])
 async function save(row){
  if(busy||loading||reloadRequired||row.id_periodo!==period||!mayEdit(row)||!configurations.some(g=>g.id_periodo===period&&g.id_cuadricula===Number(selection[row.id_seccion])))return
  setBusy(true);setError('');setMessage('')
  try {
   const link=links.find(x=>x.id_seccion===row.id_seccion)
   const saved=await api('/grupos-turnos',{method:'POST',data:{id_seccion:row.id_seccion,id_cuadricula:Number(selection[row.id_seccion]),version:link?.version||0}})
   setLinks(current=>[...current.filter(x=>x.id_seccion!==row.id_seccion),saved]);setSelection(current=>{const next={...current};delete next[row.id_seccion];return next});setMessage(`Bloques asignados a ${row.codigo}.`)
  }catch(e){setError(e.message);setReloadRequired(true)}finally{setBusy(false)}
 }
 const semesterRows=rows.filter(r=>r.id_periodo===period)
 const careers=[...new Map(semesterRows.map(r=>[r.id_carrera,r.carrera_nombre||`Carrera ${r.id_carrera}`])).entries()].sort((a,b)=>a[1].localeCompare(b[1]))
 const years=[...new Set(semesterRows.map(r=>r.ano_estudio).filter(Number.isInteger))].sort((a,b)=>a-b)
 const label=row=>semesterRows.filter(r=>r.codigo===row.codigo).length>1?`${row.codigo} · ${row.carrera_nombre||'Carrera '+row.id_carrera} · ID ${row.id_seccion}`:row.codigo
 const visible=semesterRows.filter(row=>{
  const link=links.find(x=>x.id_seccion===row.id_seccion)
  const grid=configurations.find(g=>g.id_periodo===period&&g.id_cuadricula===link?.id_cuadricula)
  return (!career||row.id_carrera===Number(career))&&(!year||row.ano_estudio===Number(year))&&(!turn||(turn==='sin_asignar'?!grid:grid?.turno===turn))&&[row.codigo,row.carrera_nombre].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
 })
 const grids=configurations.filter(g=>g.id_periodo===period)
 return <section aria-labelledby="group-turn-title"><h3 id="group-turn-title">Años de carrera y turnos</h3>
  <p>Revisa el turno de cada año de carrera. Los grupos con clases ya registradas requieren revisar esas clases antes de cambiar su configuración.</p>
  {!loading&&!grids.length&&<p className="notice">Aún no hay bloques por turno en este semestre. El encargado debe configurarlos en Semestres antes de asignarlos a un año de carrera.</p>}
  {error&&<p role="alert" className="error">{error} <button className="secondary" disabled={busy} onClick={()=>setRevision(n=>n+1)}>Recargar asignaciones</button></p>}
  {message&&<p role="status" className="success">{message}</p>}
  <div className="list-toolbar">
   <label>Buscar grupos<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Código o carrera"/></label>
   <label>Filtrar grupos por carrera<select value={career} onChange={e=>setCareer(e.target.value)}><option value="">Todas las carreras</option>{careers.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
   <label>Filtrar grupos por año<select value={year} onChange={e=>setYear(e.target.value)}><option value="">Todos los años</option>{years.map(value=><option key={value} value={value}>Año {value}</option>)}</select></label>
   <label>Filtrar grupos por turno<select value={turn} onChange={e=>setTurn(e.target.value)}><option value="">Todos los turnos</option><option value="sin_asignar">Sin turno asignado</option><option value="matutino">Matutino</option><option value="vespertino">Vespertino</option><option value="nocturno">Nocturno</option><option value="encuentros">Por encuentros</option></select></label>
   <button className="secondary" onClick={()=>{setQuery('');setCareer('');setYear('');setTurn('')}}>Limpiar filtros</button>
  </div>
  {loading?<p role="status">Cargando grupos…</p>:error&&rows.length===0?<p className="notice">No se pudo consultar la lista. Recarga las asignaciones para volver a intentarlo.</p>:<div className="table-scroll"><table><caption>Grupos del semestre activo · {visible.length} de {semesterRows.length}</caption><thead><tr><th>Grupo</th><th>Carrera y año</th>{onEdit&&<th>Estudiantes y asignaturas</th>}<th>Bloques del turno</th><th>Acción</th></tr></thead><tbody>
   {visible.map(row=>{
    const link=links.find(x=>x.id_seccion===row.id_seccion)
    const canEdit=mayEdit(row)
    return <tr key={row.id_seccion}><td>{row.codigo}<span className="cell-detail">ID {row.id_seccion}</span></td><td>{row.carrera_nombre}{row.ano_estudio&&<span className="cell-detail">Año {row.ano_estudio}</span>}</td>{onEdit&&<td>{Number.isSafeInteger(row.cantidad_estudiantes)&&row.cantidad_estudiantes>0?`${row.cantidad_estudiantes} estudiantes`:'Cantidad de estudiantes pendiente'}<span className="cell-detail">{row.asignaturas?.length||0} asignaturas</span></td>}<td>{canEdit?<select aria-label={`Bloques de ${label(row)}`} disabled={busy||reloadRequired||!grids.length} value={selection[row.id_seccion]??link?.id_cuadricula??''} onChange={e=>setSelection({...selection,[row.id_seccion]:e.target.value})}><option value="">Sin asignar</option>{grids.map(g=><option key={g.id_cuadricula} value={g.id_cuadricula}>{g.nombre}</option>)}</select>:grids.find(g=>g.id_cuadricula===link?.id_cuadricula)?.nombre||'Sin asignar'}</td><td>{canEdit&&<><button className="secondary" disabled={busy||reloadRequired||!selection[row.id_seccion]||Number(selection[row.id_seccion])===link?.id_cuadricula} onClick={()=>save(row)}>Guardar {label(row)}</button>{onEdit&&context?.canManageSecciones&&<button className="secondary" disabled={busy||reloadRequired} onClick={()=>onEdit(row)}>Editar</button>}</>}</td></tr>
   })}
   {!visible.length&&<tr><td colSpan={onEdit?5:4}>{semesterRows.length?'No hay grupos que coincidan con los filtros.':'No hay grupos registrados en este semestre.'}</td></tr>}
  </tbody></table></div>}
 </section>
}
