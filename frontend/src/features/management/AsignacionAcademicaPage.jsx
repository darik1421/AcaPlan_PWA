import ProgramacionPage from './ProgramacionPage'
import ResumenDepartamento from './ResumenDepartamento'

export default function AsignacionAcademicaPage({ context }) {

  return (
    <section className="management-page" aria-labelledby="academic-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Coordinadores de carrera</span>
          <h2 id="academic-title">Asignación académica</h2>
          <p className="muted">Componentes curriculares y docentes recibidos para cada año de carrera.</p>
        </div>
      </div>

      <div className="banner-notice">
        Sube un único Excel con docentes, componentes curriculares, años y turnos.
      </div>

      {context?.esDirectorDepartamento ? <ResumenDepartamento /> : <ProgramacionPage context={context} />}


    </section>
  )
}
