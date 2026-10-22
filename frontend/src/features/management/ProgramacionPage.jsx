import {useState} from 'react'
import PreparacionExcel from './PreparacionExcel'
import AsignacionesImportadas from './AsignacionesImportadas'
import DatosAnos from './DatosAnos'
import RevisionPreparacion from './RevisionPreparacion'

export default function ProgramacionPage({context}) {
 const [revision,setRevision]=useState(0)
 return <section className="management-page" aria-label="Entrega del coordinador">
  <h3>Entrega del semestre {context?.activePeriod?.nombre || 'sin definir'}</h3>
  {context?.canManageSecciones&&<RevisionPreparacion periodId={context?.activePeriod?.id_periodo} revision={revision}/>}
  {!context?.activePeriod&&<p className="notice">No hay un semestre académico activo definido.</p>}
  {context?.canManageSecciones
   ? <><PreparacionExcel tipo="asignaciones" periodId={context?.activePeriod?.id_periodo} onConfirmed={()=>setRevision(n=>n+1)}/>
      {context?.activePeriod&&<><AsignacionesImportadas key={context.activePeriod.id_periodo} periodId={context.activePeriod.id_periodo} revision={revision}/><DatosAnos key={`anos:${context.activePeriod.id_periodo}`} periodId={context.activePeriod.id_periodo} revision={revision} onChanged={()=>setRevision(n=>n+1)}/></>}</>
   : <p className="notice">La entrega académica está disponible para administradores y coordinadores de carrera autorizados.</p>}
 </section>
}
