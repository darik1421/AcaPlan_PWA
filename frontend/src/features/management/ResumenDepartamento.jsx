import { useEffect, useState } from 'react'
import { api } from '../../services/management'

export default function ResumenDepartamento() {
  const [rows,setRows]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
  useEffect(()=>{
    const controller=new AbortController();setRows(null);setError('')
    api('/departamento/asignaciones',{signal:controller.signal}).then(result=>{if(!controller.signal.aborted)setRows(result)}).catch(e=>{if(!controller.signal.aborted)setError(e.message)})
    return()=>controller.abort()
  },[attempt])
  return <div className="surface-card"><h3 className="card-title">Asignación académica del departamento</h3><p className="muted">Consulta las entregas de los coordinadores de tus carreras. Las correcciones de asignaciones corresponden al coordinador.</p>
    <button className="secondary" onClick={()=>setAttempt(value=>value+1)}>Actualizar asignaciones</button>
    {error&&<p className="error" role="alert">{error}</p>}{!rows&&!error&&<p role="status">Consultando asignaciones…</p>}
    {rows&&<div className="table-scroll"><table><caption>Asignaturas y docentes de tu departamento</caption><thead><tr>{['Carrera','Año','Asignatura','Docentes','Turno','Horas semestrales'].map(label=><th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.carrera}</td><td>{row.ano_estudio}</td><td>{row.codigo} · {row.asignatura}</td><td>{row.docentes.join(', ')}</td><td>{row.turno}</td><td>{row.horas_semestre}</td></tr>)}</tbody></table>{!rows.length&&<p>No hay entregas académicas para tu departamento en el semestre activo.</p>}</div>}
  </div>
}
