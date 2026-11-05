import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/management'
import TurnoAno from './TurnoAno'
import { RefreshCw } from 'lucide-react'

export default function DatosAnos({ periodId, revision, onChanged, onDataChanged }) {
  const [turnRow, setTurnRow] = useState(null)
  const [rows, setRows] = useState([]),
    [form, setForm] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [attempt, setAttempt] = useState(0),
    [message, setMessage] = useState('')
  const [selectedKey, setSelectedKey] = useState(null)
  const generation = useRef(0)

  useEffect(() => {
    setMessage('')
  }, [periodId])

  useEffect(() => {
    setTurnRow(null)
    setSelectedKey(null)
  }, [periodId, revision])

  useEffect(() => {
    const c = new AbortController()
    generation.current++
    setForm(null)
    setError('')
    setLoading(true)
    setRows([])
    setBusy(false)
    api('/asignacion-academica/anos', { signal: c.signal })
      .then(data => {
        if (!c.signal.aborted) setRows(data.filter(r => r.id_periodo === periodId))
      })
      .catch(e => {
        if (!c.signal.aborted) setError(e.message)
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false)
      })
    return () => {
      c.abort()
      generation.current++
    }
  }, [periodId, revision, attempt])

  async function save(e) {
    e.preventDefault()
    if (busy || !form) return
    const current = generation.current
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/asignacion-academica/anos', {
        method: 'PATCH',
        data: {
          id_periodo: periodId,
          id_carrera: form.id_carrera,
          ano_estudio: form.ano_estudio,
          revision: form.revision,
          cantidad_estudiantes:
            form.cantidad_estudiantes === '' ? null : Number(form.cantidad_estudiantes),
          sede: form.sede.trim() || null,
        },
      })
      if (current === generation.current) {
        onDataChanged?.()
        setMessage('Datos del año guardados.')
        setAttempt(n => n + 1)
      }
    } catch (err) {
      if (current === generation.current) {
        setError(`${err.message} Recarga antes de volver a corregir.`)
        setForm(null)
      }
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  const turnName = val =>
    ({
      matutino: 'Matutino',
      vespertino: 'Vespertino',
      nocturno: 'Nocturno',
      encuentros: 'Por encuentros',
    }[val] || val)

  const selectedGroup =
    rows.find(r => `${r.id_carrera}:${r.ano_estudio}` === selectedKey) || rows[0] || null

  return (
    <section aria-labelledby="year-data-title" style={{ marginTop: '8px' }}>
      <div className="section-heading" style={{ marginBottom: '16px' }}>
        <div>
          <h3 id="year-data-title" className="card-title">
            Datos complementarios de los años de carrera
          </h3>
          <p className="muted">
            Los años y turnos se obtienen del mismo Excel académico. Completa la cantidad de estudiantes y la sede cuando las conozcas.
          </p>
        </div>
        <button
          className="secondary"
          disabled={busy || loading || !!turnRow}
          onClick={() => setAttempt(n => n + 1)}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Actualizar datos de los años</span>
        </button>
      </div>

      {error && <p role="alert" className="error">{error}</p>}
      {message && <p role="status" className="success">{message}</p>}

      {turnRow && (
        <TurnoAno
          periodId={periodId}
          row={turnRow}
          onCancel={() => setTurnRow(null)}
          onSaved={() => {
            setTurnRow(null)
            setMessage('Turno del año corregido para todas sus asignaturas.')
            setAttempt(n => n + 1)
            onChanged?.()
          }}
        />
      )}

      {form && (
        <form className="management-form" onSubmit={save}>
          <h4>
            {form.carrera} · Año {form.ano_estudio}
          </h4>
          <fieldset disabled={busy}>
            <div className="form-grid">
              <label>
                Cantidad de estudiantes
                <input
                  type="number"
                  min="1"
                  max="999999"
                  value={form.cantidad_estudiantes}
                  onChange={e =>
                    setForm({ ...form, cantidad_estudiantes: e.target.value })
                  }
                />
              </label>
              <label>
                Sede
                <input
                  maxLength={100}
                  value={form.sede}
                  onChange={e => setForm({ ...form, sede: e.target.value })}
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="primary">Guardar datos del año</button>
              <button
                type="button"
                className="secondary"
                onClick={() => setForm(null)}
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {loading ? (
        <p role="status">Consultando años de carrera…</p>
      ) : error && rows.length === 0 ? null : (
        <div className="two-column-layout">
          {/* Columna Izquierda: Tabla de años de carrera */}
          <div>
            <div className="table-scroll">
              <table>
                <caption>Años recibidos en este semestre</caption>
                <thead>
                  <tr>
                    <th>Carrera y año</th>
                    <th>Turno</th>
                    <th>Estudiantes</th>
                    <th>Sede</th>
                    <th>Completar datos</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const rowKey = `${r.id_carrera}:${r.ano_estudio}`
                    const isSelected = selectedGroup && `${selectedGroup.id_carrera}:${selectedGroup.ano_estudio}` === rowKey
                    return (
                      <tr
                        key={rowKey}
                        onClick={() => setSelectedKey(rowKey)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? '#EFEEFA' : undefined,
                        }}
                      >
                        <td>
                          <strong>{r.carrera}</strong> · Año {r.ano_estudio}
                        </td>
                        <td>
                          <span className="status-pill active">
                            <span className="status-dot" aria-hidden="true">●</span>
                            <span>{turnName(r.turno)}</span>
                          </span>
                        </td>
                        <td>{r.cantidad_estudiantes ?? 'Pendiente'}</td>
                        <td>{r.sede ?? 'Pendiente'}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="secondary"
                              disabled={busy || !!turnRow}
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedKey(rowKey)
                                setForm({
                                  ...r,
                                  cantidad_estudiantes: r.cantidad_estudiantes ?? '',
                                  sede: r.sede ?? '',
                                })
                                setMessage('')
                              }}
                            >
                              Completar {r.carrera} · Año {r.ano_estudio}
                            </button>
                            <button
                              className="secondary"
                              disabled={busy || !!turnRow || !!form}
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedKey(rowKey)
                                setTurnRow(r)
                                setMessage('')
                              }}
                            >
                              Corregir turno de {r.carrera} · Año {r.ano_estudio}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!rows.length && (
                    <tr>
                      <td colSpan={5}>
                        Los años aparecerán al confirmar la entrega académica.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Turno del grupo (Figma anos_carrera_233_2375) */}
          <aside className="side-panel-card">
            <h3 className="card-title">Turno del grupo</h3>
            <p className="card-subtitle">
              {selectedGroup
                ? `${selectedGroup.carrera} · Año ${selectedGroup.ano_estudio}`
                : 'Selecciona un grupo'}
            </p>

            {selectedGroup ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="filter-card">
                  <span>Carrera y año</span>
                  <strong>
                    {selectedGroup.carrera} · Año {selectedGroup.ano_estudio}
                  </strong>
                </div>

                <div className="filter-card">
                  <span>Turno asignado</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span className="status-pill active" style={{ fontSize: '11px', padding: '2px 8px' }}>
                      <span className="status-dot" aria-hidden="true">●</span> {turnName(selectedGroup.turno)}
                    </span>
                  </div>
                </div>

                <div className="filter-card">
                  <span>Estudiantes</span>
                  <span>
                    {selectedGroup.cantidad_estudiantes != null
                      ? `${selectedGroup.cantidad_estudiantes} estudiantes`
                      : 'Pendiente de registrar'}
                  </span>
                </div>

                <div className="filter-card">
                  <span>Sede</span>
                  <span>{selectedGroup.sede || 'Pendiente de asignar'}</span>
                </div>

                <p
                  className="muted"
                  style={{ fontSize: '12.5px', margin: '4px 0 8px 0', lineHeight: '1.4' }}
                >
                  La asignación conserva el semestre y carrera del grupo.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="primary"
                    disabled={busy || !!turnRow}
                    onClick={() => {
                      setForm({
                        ...selectedGroup,
                        cantidad_estudiantes: selectedGroup.cantidad_estudiantes ?? '',
                        sede: selectedGroup.sede ?? '',
                      })
                      setMessage('')
                    }}
                  >
                    Completar datos de {selectedGroup.carrera}
                  </button>
                  <button
                    className="secondary"
                    disabled={busy || !!turnRow || !!form}
                    onClick={() => {
                      setTurnRow(selectedGroup)
                      setMessage('')
                    }}
                  >
                    Corregir turno asignado
                  </button>
                </div>
              </div>
            ) : (
              <p className="muted" style={{ fontSize: '13px' }}>
                Selecciona cualquier grupo de la tabla para ver su información y actualizar turno o estudiantes.
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  )
}
