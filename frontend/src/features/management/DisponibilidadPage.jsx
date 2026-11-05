import RestriccionesPanel from './RestriccionesPanel'
import ConsecutivasPanel from './ConsecutivasPanel'

export default function DisponibilidadPage({ context, draftId, onRegenerate, onReturnToDraft }) {
  return <section className="management-page" aria-labelledby="disp-title">
    <div className="section-heading"><div>
      <span className="screen-kicker">Directores de departamento</span>
      <h2 id="disp-title">Restricciones</h2>
      <p className="muted">Indica cuándo un docente no puede dar clase o qué sesiones deben ir seguidas.</p>
    </div></div>
    <div className="banner-notice">Sin restricciones comunicadas, puedes continuar con la generación.</div>
    <p>Las restricciones se guardan para el semestre, no solo para un borrador. Los horarios no se reorganizan al guardarlas.</p>
    {context?.activePeriod && <div className="form-actions">
      {onRegenerate && <button className="primary" onClick={onRegenerate}>{draftId ? 'Volver a generar el borrador seleccionado' : 'Ir al generador'}</button>}
      {draftId && onReturnToDraft && <button className="secondary" onClick={onReturnToDraft}>Volver al borrador seleccionado</button>}
    </div>}
    {!onRegenerate && draftId && <p className="notice">Cuando termines, el Director o Administrador debe volver a generar el borrador con las restricciones actualizadas.</p>}
    {!context?.activePeriod && <p className="notice">No hay un semestre académico activo.</p>}
    <div className="surface-card" style={{padding:'16px 20px'}}>
      <h3>Horarios en los que un docente no puede dar clase</h3>
      <p className="muted">Por ejemplo: un docente no puede impartir clases los lunes de 08:00 a 09:30.</p>
      <RestriccionesPanel context={context}/>
    </div>
    <details className="surface-card" style={{padding:'16px 20px',marginTop:'16px'}}>
      <summary style={{cursor:'pointer',fontWeight:600}}>Solicitudes para que dos clases vayan seguidas</summary>
      <ConsecutivasPanel context={context}/>
    </details>
  </section>
}
