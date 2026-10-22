import {useEffect,useState} from 'react'
import {api} from '../../services/management'
import {publicationCsv} from './publication-csv'
export default function HorariosPublicados(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[career,setCareer]=useState(''),[year,setYear]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{const c=new AbortController();setData(null);setError('');api('/horarios/publicados',{signal:c.signal}).then(d=>{if(!c.signal.aborted)setData(d)}).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>c.abort()},[attempt])
 const visible=rows=>rows.filter(r=>(!career||r.carrera===career)&&(!year||String(r.ano)===year))
 async function download(id){setBusy(true);setError('');try{
  const current=await api('/horarios/publicados'),publication=current.find(p=>p.id===id);setData(current)
  if(!publication)throw new Error('La publicación cambió o perdió vigencia. Consulta el horario actualizado.')
  const blob=new Blob([publicationCsv(visible(publication.filas))],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`horario-publicado-${id}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
 }catch(e){setError(e.message)}finally{setBusy(false)}}
 return <section><h2>Horarios publicados</h2><p>Consulta las publicaciones vigentes. Los borradores y las aprobaciones desactualizadas no aparecen aquí.</p><button className="secondary" disabled={busy} onClick={()=>setAttempt(n=>n+1)}>Actualizar horarios</button>
 {error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">Consultando publicaciones…</p>}
 {data&&<><label>Carrera publicada<select value={career} onChange={e=>setCareer(e.target.value)}><option value="">Todas</option>{[...new Set(data.flatMap(p=>p.filas.map(r=>r.carrera)))].sort().map(c=><option key={c}>{c}</option>)}</select></label><label>Año publicado<select value={year} onChange={e=>setYear(e.target.value)}><option value="">Todos</option>{[...new Set(data.flatMap(p=>p.filas.map(r=>r.ano)))].sort((a,b)=>a-b).map(y=><option key={y}>{y}</option>)}</select></label>
 {!data.length&&<p>No hay publicaciones vigentes. El encargado debe completar la revisión y publicación.</p>}
 {data.map(p=><section key={p.id}><h3>{p.semestre} · {p.nombre}</h3><p>Publicado: {new Date(p.fecha).toLocaleString()}</p><button className="secondary" disabled={busy||!visible(p.filas).length} onClick={()=>download(p.id)}>Descargar CSV de {p.nombre}</button><div className="table-scroll"><table><caption>Horario vigente</caption><thead><tr>{['Carrera / año','Asignatura','Docentes','Día','Hora','Aula / sede'].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{visible(p.filas).map((r,i)=><tr key={i}><td>{r.carrera} · Año {r.ano}</td><td>{r.asignatura} · {r.componente}</td><td>{r.docentes.join(', ')}</td><td>{r.dia}</td><td>{r.inicio}–{r.fin}</td><td>{r.aula} · {r.sede}</td></tr>)}</tbody></table></div></section>)}</>}
 </section>
}
