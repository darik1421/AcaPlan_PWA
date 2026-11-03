import { useCallback, useEffect, useState } from 'react'
import RestriccionesPanel from './RestriccionesPanel'
import ConsecutivasPanel from './ConsecutivasPanel'
import { api } from '../../services/management'

export default function DisponibilidadPage({ context }) {
  const [rows, setRows] = useState([])
  const [docentes, setDocentes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroDocente, setFiltroDocente] = useState('')

  const load = useCallback(async signal => {
    setLoading(true)
    setError('')
    try {
      const [dataDisp, dataDoc] = await Promise.all([
        api('/disponibilidad', { signal }),
        api('/docentes', { signal }),
      ])
      if (!signal?.aborted) {
        setRows(dataDisp)
        setDocentes(dataDoc)
        setFiltroDocente(current =>
          dataDoc.some(d => d.id_docente === Number(current))
            ? current
            : dataDoc[0]?.id_docente || ''
        )
      }
    } catch (e) {
      if (!signal?.aborted) setError(e.message)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => c.abort()
  }, [load])

  const fmt = t => t.substring(0, 5)
  const visibles = rows.filter(
    r =>
      r.id_periodo === context?.activePeriod?.id_periodo &&
      r.id_docente === Number(filtroDocente)
  )

  return (
    <section className="management-page" aria-labelledby="disp-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Jefaturas de departamento</span>
          <h2 id="disp-title">Restricciones</h2>
          <p className="muted">
            Intervalos autorizados en los que un docente no puede impartir clases.
          </p>
        </div>
      </div>

      <div className="banner-notice">
        Si no se comunica una restricción, el docente no queda bloqueado por disponibilidad.
      </div>

      {!context?.activePeriod && (
        <div className="notice">No hay un semestre académico activo.</div>
      )}

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      <RestriccionesPanel context={context} />
      <ConsecutivasPanel context={context} />

      <details
        style={{
          marginTop: '24px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '16px 20px',
        }}
      >
        <summary style={{ fontWeight: 600, color: '#1B2C48', cursor: 'pointer' }}>
          Consultar disponibilidad del modelo anterior
        </summary>
        <p className="muted" style={{ marginTop: '8px', fontSize: '13px' }}>
          Estos intervalos son disponibilidad histórica; no se convierten en restricciones.
        </p>
        {context?.activePeriod && (
          <div className="list-toolbar" style={{ marginTop: '16px' }}>
            <label className="filter-card">
              <span>Docente seleccionado para ver su disponibilidad:</span>
              <select
                value={filtroDocente}
                onChange={e => {
                  setFiltroDocente(e.target.value)
                }}
              >
                {docentes.map(d => (
                  <option key={d.id_docente} value={d.id_docente}>
                    {d.nombres} {d.apellidos}
                  </option>
                ))}
                {!docentes.length && <option value="">Sin docentes registrados</option>}
              </select>
            </label>
          </div>
        )}

        {loading ? (
          <p role="status">Cargando disponibilidad histórica…</p>
        ) : (
          <div className="table-scroll" style={{ marginTop: '16px' }}>
            <table>
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map(r => (
                  <tr key={r.id_disponibilidad}>
                    <td><strong>{r.dia_semana}</strong></td>
                    <td>{fmt(r.hora_inicio)}</td>
                    <td>{fmt(r.hora_fin)}</td>
                  </tr>
                ))}
                {!visibles.length && (
                  <tr>
                    <td colSpan={3}>
                      No hay intervalos anteriores registrados para este docente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </section>
  )
}
