import { useState } from 'react'
import ProgramacionPage from './ProgramacionPage'
import SeccionesPage from './SeccionesPage'
import ResumenDepartamento from './ResumenDepartamento'

export default function AsignacionAcademicaPage({ context }) {
  const [historical, setHistorical] = useState(false)

  return (
    <section className="management-page" aria-labelledby="academic-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Coordinadores de carrera</span>
          <h2 id="academic-title">Asignación académica</h2>
          <p className="muted">Asignaturas y docentes recibidos para cada año de carrera.</p>
        </div>
      </div>

      <div className="banner-notice">
        El coordinador entrega un único Excel con los docentes, sus asignaturas, la carrera, el año, el turno y las horas totales del semestre. Las correcciones puntuales y necesidades de espacio se gestionan sobre cada registro.
      </div>

      {context?.esDirectorDepartamento ? <ResumenDepartamento /> : <ProgramacionPage context={context} />}

      {!context?.esDirectorDepartamento && <details
        style={{
          marginTop: '24px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px 20px',
        }}
        onToggle={e => setHistorical(e.currentTarget.open)}
      >
        <summary style={{ fontWeight: 600, color: '#1B2C48', cursor: 'pointer' }}>
          Consultar datos del modelo anterior
        </summary>
        <p className="notice" style={{ marginTop: '12px' }}>
          Estos registros se conservan para consultar datos existentes. No son un segundo paso de la entrega por Excel ni se completan automáticamente con ella.
        </p>
        {historical && <SeccionesPage context={context} />}
      </details>}
    </section>
  )
}
