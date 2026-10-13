import {useState} from 'react'
import ProgramacionPage from './ProgramacionPage'
import SeccionesPage from './SeccionesPage'

export default function AsignacionAcademicaPage({context,onChanged}) {
 const [view,setView]=useState('asignaciones')
 return <section aria-labelledby="academic-title">
  <h2 id="academic-title">Asignación académica</h2>
  <p>El coordinador de carrera entrega las asignaturas y los docentes que las impartirán en cada año de su carrera. Por ejemplo: tercer año de Ingeniería en Sistemas, turno matutino.</p>
  <ol>
   <li>Recibir el Excel del coordinador con la asignación académica. La plantilla definitiva y su carga aún están pendientes; el archivo disponible es solo un ejemplo.</li>
   <li>Revisar los datos recibidos y corregir lo necesario. Cada año de carrera representa un único grupo de estudiantes; no se crean secciones A, B o C.</li>
   <li>Con las asignaciones, los espacios y las restricciones autorizadas, el encargado podrá generar y revisar el horario. El motor de generación aún está pendiente.</li>
  </ol>
  <p className="muted">Las restricciones se registran por los jefes de departamento en Restricciones. Los tiempos de los turnos se configuran desde Semestres por el encargado.</p>
  <nav className="workspace-nav" aria-label="Revisión de asignación académica">
   <button className={view==='asignaciones'?'selected':''} aria-pressed={view==='asignaciones'} onClick={()=>setView('asignaciones')}>Asignaturas y docentes</button>
   <button className={view==='anos'?'selected':''} aria-pressed={view==='anos'} onClick={()=>setView('anos')}>Años de carrera y turnos</button>
  </nav>
  {view==='asignaciones'?<ProgramacionPage context={context}/>:<SeccionesPage context={context} onChanged={onChanged}/>}
 </section>
}
