import {useEffect,useState} from 'react'
import {api} from '../../services/management'
export default function SeccionesPage({context}) {
 const [data,setData]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[query,setQuery]=useState('')
 const period=context?.activePeriod?.id_periodo,scope=JSON.stringify([context?.isAdmin,context?.carreras])
 useEffect(()=>{
  const c=new AbortController();setData(null);setError('');setQuery('')
  if(period)Promise.all(['/secciones','/grupos-turnos','/cuadriculas'].map(path=>api(path,{signal:c.signal}))).then(([rows,links,grids])=>{if(!c.signal.aborted)setData({rows,links,grids})}).catch(e=>{if(!c.signal.aborted)setError(e.message)})
  return()=>c.abort()
 },[period,scope,attempt])
 const rows=data?.rows.filter(r=>r.id_periodo===period&&(context?.isAdmin||context?.carreras?.includes(r.id_carrera))&&`${r.codigo} ${r.carrera_nombre}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')))||[]
 return <section aria-labelledby="secciones-title"><h3 id="secciones-title">Años del modelo anterior</h3>
 <p className="notice">Solo consulta de registros históricos. La entrega actual se recibe mediante un único Excel. Corrige estudiantes, sede y turno en Asignación académica → Años de carrera y turnos; las asignaturas y docentes se corrigen en la entrega importada.</p>
 {!period?<p>No hay semestre activo.</p>:<><button className="secondary" onClick={()=>setAttempt(n=>n+1)}>Actualizar consulta histórica</button>
 {error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">Consultando años anteriores…</p>}
 {data&&<><label>Buscar año histórico<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
 <div className="table-scroll"><table><caption>Años históricos del semestre activo · Solo consulta</caption><thead><tr><th>Carrera</th><th>Año</th><th>Registro anterior</th><th>Estudiantes</th><th>Bloques anteriores</th></tr></thead><tbody>{rows.map(r=>{
 const link=data.links.find(l=>l.id_seccion===r.id_seccion),grid=data.grids.find(g=>g.id_cuadricula===link?.id_cuadricula&&g.id_periodo===period)
 return <tr key={r.id_seccion}><td>{r.carrera_nombre}</td><td>{r.ano_estudio||'Sin identificar'}</td><td>{r.codigo}</td><td>{r.cantidad_estudiantes??'Sin registrar'}</td><td>{grid?.nombre||'Sin vínculo anterior'}</td></tr>
 })}{!rows.length&&<tr><td colSpan={5}>No hay años históricos que coincidan.</td></tr>}</tbody></table></div></>}
 </>}
 </section>
}
