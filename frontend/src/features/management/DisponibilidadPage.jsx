import { useState } from 'react'
import RestriccionesPanel from './RestriccionesPanel'
import ConsecutivasPanel from './ConsecutivasPanel'
import { Clock, Link2 } from 'lucide-react'

export default function DisponibilidadPage({ context, draftId, onRegenerate, onReturnToDraft }) {
  const [activeTab, setActiveTab] = useState('docentes')

  return (
    <section className="management-page" aria-labelledby="disp-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Directores de departamento</span>
          <h2 id="disp-title">Restricciones</h2>
          <p className="muted">Indica cuándo un docente no puede dar clase o qué sesiones deben ir seguidas.</p>
        </div>
      </div>

      <div className="banner-notice">Sin restricciones comunicadas, puedes continuar con la generación.</div>
      <p>Las restricciones se guardan para el semestre, no solo para un borrador. Los horarios no se reorganizan al guardarlas.</p>

      {context?.activePeriod && (
        <div className="form-actions">
          {onRegenerate && (
            <button className="primary" onClick={onRegenerate}>
              {draftId ? 'Volver a generar el borrador seleccionado' : 'Ir al generador'}
            </button>
          )}
          {draftId && onReturnToDraft && (
            <button className="secondary" onClick={onReturnToDraft}>
              Volver al borrador seleccionado
            </button>
          )}
        </div>
      )}

      {!onRegenerate && draftId && (
        <p className="notice">
          Cuando termines, el Director o Administrador debe volver a generar el borrador con las restricciones actualizadas.
        </p>
      )}

      {!context?.activePeriod && <p className="notice">No hay un semestre académico activo.</p>}

      {/* Segmented Navigation Tabs */}
      <div className="restrictions-nav-tabs" role="tablist" aria-label="Secciones de restricciones">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'docentes'}
          className={`restrictions-tab-btn ${activeTab === 'docentes' ? 'active' : ''}`}
          onClick={() => setActiveTab('docentes')}
        >
          <Clock size={16} aria-hidden="true" />
          <span>Horarios no disponibles (Docentes)</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'consecutivas'}
          className={`restrictions-tab-btn ${activeTab === 'consecutivas' ? 'active' : ''}`}
          onClick={() => setActiveTab('consecutivas')}
        >
          <Link2 size={16} aria-hidden="true" />
          <span>Clases consecutivas</span>
        </button>
      </div>

      {/* Tab 1: Horarios no disponibles */}
      <div
        role="tabpanel"
        style={{ display: activeTab === 'docentes' ? 'block' : 'none' }}
        className="surface-card"
      >
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-ink)' }}>
              Horarios en los que un docente no puede dar clase
            </h3>
            <p className="muted" style={{ margin: 0 }}>
              Por ejemplo: un docente no puede impartir clases los lunes de 08:00 a 09:30.
            </p>
          </div>
          <RestriccionesPanel context={context} />
        </div>
      </div>

      {/* Tab 2: Clases consecutivas */}
      <div
        role="tabpanel"
        style={{ display: activeTab === 'consecutivas' ? 'block' : 'none' }}
        className="surface-card"
      >
        <div style={{ padding: '20px 24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-ink)' }}>
              Solicitudes para que dos clases vayan seguidas
            </h3>
            <p className="muted" style={{ margin: 0 }}>
              Configura sesiones que deben impartirse consecutivamente en el mismo día sin huecos intermedios.
            </p>
          </div>
          <ConsecutivasPanel context={context} />
        </div>
      </div>
    </section>
  )
}
