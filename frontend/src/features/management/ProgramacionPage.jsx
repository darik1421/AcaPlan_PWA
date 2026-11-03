import { useState } from 'react'
import PreparacionExcel from './PreparacionExcel'
import AsignacionesImportadas from './AsignacionesImportadas'
import DatosAnos from './DatosAnos'
import RevisionPreparacion from './RevisionPreparacion'

export default function ProgramacionPage({ context }) {
  const [revision, setRevision] = useState(0)
  const [tab, setTab] = useState('asignaturas')

  return (
    <section className="management-page" aria-label="Entrega del coordinador">
      <div className="surface-card" style={{ padding: '16px 20px', marginBottom: '8px' }}>
        <h3 className="card-title" style={{ fontSize: '16px', margin: 0 }}>
          Entrega del semestre {context?.activePeriod?.nombre || 'sin definir'}
        </h3>
      </div>

      {context?.canManageSecciones && (
        <RevisionPreparacion
          periodId={context?.activePeriod?.id_periodo}
          revision={revision}
        />
      )}

      {!context?.activePeriod && (
        <p className="notice">No hay un semestre académico activo definido.</p>
      )}

      {context?.canManageSecciones ? (
        <>
          <PreparacionExcel
            tipo="asignaciones"
            periodId={context?.activePeriod?.id_periodo}
            onConfirmed={() => setRevision(n => n + 1)}
          />

          {context?.activePeriod && (
            <>
              {/* Pestañas estilo Figma con rol accesible 'tab' */}
              <nav
                className="workspace-nav"
                role="tablist"
                aria-label="Secciones de la asignación"
                style={{ marginTop: '16px', marginBottom: '20px' }}
              >
                <span
                  role="tab"
                  tabIndex={0}
                  aria-selected={tab === 'asignaturas'}
                  className={tab === 'asignaturas' ? 'selected' : ''}
                  onClick={() => setTab('asignaturas')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') setTab('asignaturas')
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Asignaturas y docentes
                </span>
                <span
                  role="tab"
                  tabIndex={0}
                  aria-selected={tab === 'anos'}
                  className={tab === 'anos' ? 'selected' : ''}
                  onClick={() => setTab('anos')}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') setTab('anos')
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  Años de carrera y turnos
                </span>
              </nav>

              {/* Panel 1: Asignaturas y docentes */}
              <div
                role="tabpanel"
                style={{ display: tab === 'asignaturas' ? 'block' : 'none' }}
              >
                <AsignacionesImportadas
                  key={context.activePeriod.id_periodo}
                  periodId={context.activePeriod.id_periodo}
                  revision={revision}
                />
              </div>

              {/* Panel 2: Años de carrera y turnos */}
              <div
                role="tabpanel"
                style={{ display: tab === 'anos' ? 'block' : 'none' }}
              >
                <DatosAnos
                  key={`anos:${context.activePeriod.id_periodo}`}
                  periodId={context.activePeriod.id_periodo}
                  revision={revision}
                  onChanged={() => setRevision(n => n + 1)}
                />
              </div>
            </>
          )}
        </>
      ) : (
        <p className="notice">
          La entrega académica está disponible para administradores y coordinadores de carrera autorizados.
        </p>
      )}
    </section>
  )
}
