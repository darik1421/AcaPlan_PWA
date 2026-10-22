import {useState} from 'react'
import ProgramacionPage from './ProgramacionPage'
import SeccionesPage from './SeccionesPage'

export default function AsignacionAcademicaPage({context,onChanged}) {
 const [historical,setHistorical]=useState(false)
 return <section aria-labelledby="academic-title">
  <h2 id="academic-title">Asignación académica</h2>
  <p>El coordinador entrega un único Excel con los docentes, sus asignaturas, la carrera, el año, el turno y las horas totales del semestre. No necesitas otro archivo para los años y turnos.</p>
  <ol>
   <li>Descarga la plantilla provisional y completa la entrega de tu carrera.</li>
   <li>Sube el archivo y revisa los datos y las coincidencias antes de confirmar.</li>
   <li>Confirma el guardado y consulta la entrega por carrera, año y turno.</li>
  </ol>
  <p className="muted">Cada año de carrera corresponde a un único grupo, sin secciones A, B o C. Los jefes de departamento registran las restricciones en Restricciones; el encargado configura los tiempos desde Semestres. Esta entrega no genera horarios ni crea cuentas de acceso.</p>
  <ProgramacionPage context={context}/>
  <details onToggle={e=>setHistorical(e.currentTarget.open)}>
   <summary>Consultar datos del modelo anterior</summary>
   <p className="notice">Estos registros se conservan para consultar y corregir datos existentes. No son un segundo paso de la entrega por Excel ni se completan automáticamente con ella.</p>
   {historical&&<SeccionesPage context={context} onChanged={onChanged}/>}
  </details>
 </section>
}
