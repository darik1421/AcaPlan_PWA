import { useState } from 'react'
import PreparacionExcel from './PreparacionExcel'
import AsignacionesImportadas from './AsignacionesImportadas'
import DatosAnos from './DatosAnos'
import RevisionPreparacion from './RevisionPreparacion'

export default function ProgramacionPage({ context }) {
  const [revision, setRevision] = useState(0)
  const [reportRevision, setReportRevision] = useState(0)
  const periodId = context?.activePeriod?.id_periodo
  const changed = () => setReportRevision(n => n + 1)
  return <section className="management-page" aria-label="Entrega del coordinador">
    <div className="surface-card" style={{padding:'16px 20px',marginBottom:'16px'}}>
      <h3 className="card-title">Entrega del semestre {context?.activePeriod?.nombre || 'sin definir'}</h3>

    </div>
    {!periodId && <p className="notice">No hay un semestre académico activo definido.</p>}
    {context?.canManageSecciones ? <>
      <h3>1. Subir la entrega</h3>
      <PreparacionExcel tipo="asignaciones" periodId={periodId} onConfirmed={() => setRevision(n => n+1)}/>
      {periodId && <>
        <h3>2. Revisar entrega</h3>

        <AsignacionesImportadas key={periodId} periodId={periodId} revision={revision} onDataChanged={changed}/>
        <details className="surface-card" style={{padding:'16px 20px',marginTop:'16px'}}>
          <summary style={{cursor:'pointer',fontWeight:600}}>Completar o corregir datos de los años de carrera</summary>
          <p>Estudiantes, sede y turno de cada año.</p>
          <DatosAnos key={'anos:'+periodId} periodId={periodId} revision={revision} onChanged={() => setRevision(n => n+1)} onDataChanged={changed}/>
        </details>
        <details className="surface-card" style={{padding:'16px 20px',marginTop:'16px'}}>
          <summary style={{cursor:'pointer',fontWeight:600}}>3. Verificar datos</summary>
          <RevisionPreparacion periodId={periodId} revision={revision+':'+reportRevision}/>
        </details>
      </>}
    </> : <p className="notice">La entrega académica está disponible para administradores y coordinadores de carrera autorizados.</p>}
  </section>
}
