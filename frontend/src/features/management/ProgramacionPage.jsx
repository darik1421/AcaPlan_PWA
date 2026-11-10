import { useState } from 'react'
import PreparacionExcel from './PreparacionExcel'
import AsignacionesImportadas from './AsignacionesImportadas'
import DatosAnos from './DatosAnos'
import RevisionPreparacion from './RevisionPreparacion'
import { Calendar, UploadCloud, CheckCircle2, Users, ShieldCheck, Sparkles } from 'lucide-react'

export default function ProgramacionPage({ context }) {
  const [revision, setRevision] = useState(0)
  const [reportRevision, setReportRevision] = useState(0)
  const periodId = context?.activePeriod?.id_periodo
  const changed = () => setReportRevision(n => n + 1)

  return (
    <section className="management-page" aria-label="Entrega del coordinador">
      {/* Banner de estado del semestre activo */}
      <div 
        className="surface-card" 
        style={{
          padding: '18px 24px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, rgba(48, 44, 145, 0.04) 0%, rgba(254, 209, 0, 0.05) 100%)',
          border: '1px solid rgba(48, 44, 145, 0.12)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'var(--primary-indigo)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Calendar size={22} />
          </div>
          <div>
            <h3 className="card-title" style={{ margin: 0, fontSize: '17px', color: 'var(--text-dark)' }}>
              Entrega del semestre {context?.activePeriod?.nombre || 'sin definir'}
            </h3>
            <p className="muted" style={{ margin: '3px 0 0 0', fontSize: '13px' }}>
              Ciclo de planificación oficial para coordinadores y asignación docente de la CUR-Chontales.
            </p>
          </div>
        </div>
        {context?.activePeriod && (
          <span className="status-pill active" style={{ fontSize: '13px', padding: '6px 14px' }}>
            <span className="status-dot" aria-hidden="true">●</span>
            <span>Semestre Activo</span>
          </span>
        )}
      </div>

      {!periodId && (
        <p className="notice" style={{ marginBottom: '20px' }}>
          No hay un semestre académico activo definido. Contacta al Administrador para activar un semestre.
        </p>
      )}

      {context?.canManageSecciones ? (
        <>
          {/* Paso 1: Subir entrega */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: 'var(--primary-indigo)', 
                color: '#fff', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '12px', 
                fontWeight: 700 
              }}>1</div>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-dark)' }}>1. Subir la entrega</h3>
            </div>
            <PreparacionExcel tipo="asignaciones" periodId={periodId} onConfirmed={() => setRevision(n => n + 1)} />
          </div>

          {periodId && (
            <>
              {/* Paso 2: Revisar entrega */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: 'var(--primary-indigo)', 
                    color: '#fff', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '12px', 
                    fontWeight: 700 
                  }}>2</div>
                  <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-dark)' }}>2. Revisar entrega</h3>
                </div>

                <AsignacionesImportadas key={periodId} periodId={periodId} revision={revision} onDataChanged={changed} />

                {/* Paso 3: Completar años y sedes */}
                <details 
                  className="surface-card" 
                  style={{ 
                    padding: '20px 24px', 
                    marginTop: '20px', 
                    borderRadius: '16px',
                    border: '1px solid var(--border-card)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: 'var(--primary-indigo)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} />
                    <span>Completar o corregir datos de los años de carrera</span>
                  </summary>
                  <p className="muted" style={{ margin: '8px 0 16px 0', fontSize: '13.5px' }}>
                    Estudiantes, sede y turno de cada año.
                  </p>
                  <DatosAnos key={'anos:' + periodId} periodId={periodId} revision={revision} onChanged={() => setRevision(n => n + 1)} onDataChanged={changed} />
                </details>

                {/* Paso 4: Verificar datos */}
                <details 
                  className="surface-card" 
                  style={{ 
                    padding: '20px 24px', 
                    marginTop: '20px', 
                    borderRadius: '16px',
                    border: '1px solid var(--border-card)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '15px', color: 'var(--primary-indigo)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={18} />
                    <span>3. Verificar datos</span>
                  </summary>
                  <div style={{ marginTop: '14px' }}>
                    <RevisionPreparacion periodId={periodId} revision={revision + ':' + reportRevision} />
                  </div>
                </details>
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
