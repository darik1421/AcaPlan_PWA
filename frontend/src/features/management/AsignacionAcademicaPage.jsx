import ProgramacionPage from './ProgramacionPage'
import ResumenDepartamento from './ResumenDepartamento'

export default function AsignacionAcademicaPage({ context }) {
  const isDirector = Boolean(context?.esDirectorDepartamento)
  const isAdmin = Boolean(context?.isAdmin)

  const kicker = isDirector
    ? 'Dirección de departamento'
    : isAdmin
      ? 'Administración y planificación'
      : 'Coordinadores de carrera'

  const title = isDirector
    ? 'Asignación académica del departamento'
    : 'Asignación académica'

  const description = isDirector
    ? 'Supervisión de entregas, asignaturas, docentes y cargas horarias de tu departamento.'
    : 'Componentes curriculares, docentes, años y turnos registrados para el semestre activo.'

  return (
    <section className="management-page" aria-labelledby="academic-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">{kicker}</span>
          <h2 id="academic-title">{title}</h2>
          <p className="muted">{description}</p>
        </div>
      </div>

      {!isDirector && (
        <div className="banner-notice">
          Sube un único Excel con docentes, componentes curriculares, años y turnos.
        </div>
      )}

      {isDirector ? <ResumenDepartamento /> : <ProgramacionPage context={context} />}
    </section>
  )
}

