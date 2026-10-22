import {useState} from 'react'
const days=[['Lunes','Lunes'],['Martes','Martes'],['Miercoles','Miércoles'],['Jueves','Jueves'],['Viernes','Viernes'],['Sabado','Sábado'],['Domingo','Domingo']]
const partName={general:'Clase',teoria:'Teoría',practica:'Práctica'}
export default function VistaSemanalBorrador({detail,onEdit,disabled}){
 const [selection,setSelection]=useState('')
 const groups=[...new Map(detail.asignaciones.map(a=>[`${a.id_carrera}:${a.ano_estudio}`,{key:`${a.id_carrera}:${a.ano_estudio}`,label:`${a.carrera} · Año ${a.ano_estudio}`}])).values()]
 const selected=groups.some(g=>g.key===selection)?selection:groups[0]?.key
 const assignments=detail.asignaciones.filter(a=>`${a.id_carrera}:${a.ano_estudio}`===selected)
 const rows=detail.clases.filter(c=>assignments.some(a=>a.id===c.id_asignacion)).sort((a,b)=>a.hora_inicio.localeCompare(b.hora_inicio)||a.id-b.id)
 const ranges=[...new Set(rows.map(c=>`${c.hora_inicio.slice(0,5)}–${c.hora_fin.slice(0,5)}`))].sort()
 return <section aria-label="Vista semanal del borrador"><h3>Vista semanal por carrera y año</h3><p>Vista de trabajo de la propuesta. La versión vigente se consulta en «Horarios publicados». Los espacios vacíos no certifican disponibilidad. La revisión detecta cruces y huecos; los recesos no se presentan como clases.</p>
 {groups.length?<><label>Carrera y año de la vista<select value={selected} onChange={e=>setSelection(e.target.value)}>{groups.map(g=><option key={g.key} value={g.key}>{g.label}</option>)}</select></label>
 {rows.length?<div className="table-scroll"><table><caption>{groups.find(g=>g.key===selected)?.label} · {detail.borrador.nombre}</caption><thead><tr><th scope="col">Hora</th>{days.map(([key,name])=><th scope="col" key={key}>{name}</th>)}</tr></thead><tbody>{ranges.map(range=><tr key={range}><th scope="row">{range}</th>{days.map(([day])=><td key={day}>{rows.filter(c=>c.dia===day&&`${c.hora_inicio.slice(0,5)}–${c.hora_fin.slice(0,5)}`===range).map(c=>{
 const a=assignments.find(a=>a.id===c.id_asignacion),room=detail.espacios.find(r=>r.id_aula===c.id_aula)
 const teacherIds=a.componentes?.find(p=>p.tipo===c.componente)?.docentes||(!a.componentes?a.docentes?.map(d=>d.id):[])
 return <article key={c.id} className="weekly-class"><strong>{a.nombre}</strong><span>{partName[c.componente]||c.componente}</span><span>{a.docentes?.filter(d=>teacherIds?.includes(d.id)).map(d=>d.nombre).join(', ')||'Revisar docentes'}</span><span>{room?`${room.sede||'Sede pendiente'} · ${room.codigo}`:'Aula pendiente'}</span><span>{c.fijada?'Fijada':'Editable'}</span><button className="secondary" disabled={disabled} onClick={()=>onEdit(c,'clase')}>Editar sesión {c.id}</button></article>
 })}</td>)}</tr>)}</tbody></table></div>:<p>Este año todavía no tiene clases en el borrador.</p>}</>:<p>No hay asignaciones para mostrar en esta propuesta.</p>}
 </section>
}

