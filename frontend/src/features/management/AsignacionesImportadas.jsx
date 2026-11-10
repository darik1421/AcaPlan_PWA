import ComponentesAsignacion from './ComponentesAsignacion'
import CorreccionAsignacion from './CorreccionAsignacion'
import NecesidadesAsignacion from './NecesidadesAsignacion'
import { useEffect, useState } from 'react'
import { api } from '../../services/management'

export default function AsignacionesImportadas({ periodId, revision, onDataChanged }) {
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [needs, setNeeds] = useState(null)
  const [components, setComponents] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    setEditing(null)
    setNeeds(null)
    setComponents(null)
    setMessage('')
    setSelectedId(null)
  }, [periodId, revision])

  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const c = new AbortController()
    setLoading(true)
    setError('')
    setRows([])
    api('/asignacion-academica', { signal: c.signal })
      .then(data => {
        if (!c.signal.aborted) setRows(data)
      })
      .catch(e => {
        if (!c.signal.aborted) setError(e.message)
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false)
      })
    return () => c.abort()
  }, [periodId, revision, attempt])

  const [career, setCareer] = useState('')
  const [year, setYear] = useState('')
  const [turn, setTurn] = useState('')

  useEffect(() => { setCareer(''); setYear(''); setTurn('') }, [periodId])
  useEffect(() => {
    if (loading) return
    const current = rows.filter(r => r.id_periodo === periodId)
    setCareer(value => current.some(r => r.carrera === value) ? value : '')
    setYear(value => current.some(r => String(r.ano_estudio) === value) ? value : '')
    setTurn(value => current.some(r => r.turno === value) ? value : '')
  }, [rows,periodId,loading])

  const semesterRows = rows.filter(r => r.id_periodo === periodId)
  const careers = [...new Set(semesterRows.map(r => r.carrera))].sort()
  const years = [...new Set(semesterRows.map(r => String(r.ano_estudio)))].sort(
    (a, b) => Number(a) - Number(b)
  )
  const turns = [...new Set(semesterRows.map(r => r.turno))].sort()
  const turnName = value =>
    ({
      matutino: 'Matutino',
      vespertino: 'Vespertino',
      nocturno: 'Nocturno',
      encuentros: 'Por encuentros',
    }[value] || value)

  const visible = semesterRows.filter(
    r =>
      (!career || r.carrera === career) &&
      (!year || String(r.ano_estudio) === year) &&
      (!turn || r.turno === turn)
  )

  const selectedRecord =
    visible.find(r => r.id === selectedId) || visible[0] || null

  return (
    <div style={{ marginTop: '8px' }}>
      {message && (
        <p role="status" className="success">
          {message}
        </p>
      )}

      {editing && (
        <CorreccionAsignacion
          key={`${periodId}:${editing}`}
          id={editing}
          periodId={periodId}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            setMessage(
              'Corrección guardada. Se actualizaron los docentes y las horas de la asignación.'
            )
            setAttempt(n => n + 1)
            onDataChanged?.()
          }}
        />
      )}

      {components && (
        <ComponentesAsignacion
          key={`componentes:${periodId}:${components}`}
          id={components}
          periodId={periodId}
          onClose={() => setComponents(null)}
          onSaved={() => {
            setComponents(null)
            setMessage('Distribución guardada.')
            setAttempt(n => n + 1)
            onDataChanged?.()
          }}
        />
      )}

      {needs && (
        <NecesidadesAsignacion
          key={`necesidades:${periodId}:${needs}`}
          id={needs}
          periodId={periodId}
          onClose={() => setNeeds(null)}
          onSaved={() => {
            setNeeds(null)
            setMessage('Necesidades de aula guardadas.')
            setAttempt(n => n + 1)
            onDataChanged?.()
          }}
        />
      )}

      {!loading && !error && semesterRows.length > 0 && (
        <div className="filter-grid" style={{ marginBottom: '16px' }}>
          <label className="filter-card">
            <span>Carrera de la entrega</span>
            <select value={career} onChange={e => setCareer(e.target.value)}>
              <option value="">Todas las carreras</option>
              {careers.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="filter-card">
            <span>Año de la entrega</span>
            <select value={year} onChange={e => setYear(e.target.value)}>
              <option value="">Todos los años</option>
              {years.map(y => (
                <option key={y} value={y}>
                  Año {y}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-card">
            <span>Turno de la entrega</span>
            <select value={turn} onChange={e => setTurn(e.target.value)}>
              <option value="">Todos los turnos</option>
              {turns.map(t => (
                <option key={t} value={t}>
                  {turnName(t)}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className="secondary"
              onClick={() => {
                setCareer('')
                setYear('')
                setTurn('')
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p role="alert" className="error">
          {error}{' '}
          <button className="secondary" onClick={() => setAttempt(n => n + 1)}>
            Reintentar consulta
          </button>
        </p>
      ) : loading ? (
        <p role="status">Consultando asignación importada…</p>
      ) : (
        <div className="academic-delivery-layout">
          {/* Columna Izquierda: Tabla de asignaturas */}
          <div>
            <div className="table-scroll academic-delivery-table">
              <table>
                <caption>Entrega recibida para el semestre activo</caption>
                <thead>
                  <tr>
                    <th>Carrera y año</th>
                    <th>Componente</th>
                    <th>Docentes</th>
                    <th>Turno</th>
                    <th>Horas totales</th>
                    <th>Correcciones y necesidades</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map(r => {
                    const isSelected = selectedRecord?.id === r.id
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? '#EFEEFA' : undefined,
                        }}
                      >
                        <td>{r.carrera}<span className="cell-detail delivery-subline">Año {r.ano_estudio}</span></td>
                        <td><strong>{r.nombre_asignatura}</strong><span className="cell-detail delivery-subline">{r.codigo_asignatura}</span></td>
                        <td>{r.docentes?.join(', ')}</td>
                        <td>
                          <span className="status-pill active">
                            <span className="status-dot" aria-hidden="true">●</span>
                            <span>{turnName(r.turno)}</span>
                          </span>
                        </td>
                        <td>{r.horas_semestre}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="secondary"
                              disabled={!!editing || !!needs || !!components}
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedId(r.id)
                                setMessage('')
                                setEditing(r.id)
                              }}
                            >
                              Corregir {r.codigo_asignatura}
                            </button>
                            <button
                              className="secondary"
                              disabled={!!editing || !!needs || !!components}
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedId(r.id)
                                setMessage('')
                                setNeeds(r.id)
                              }}
                            >
                              Necesidades de {r.codigo_asignatura}
                            </button>
                            <button
                              className="secondary"
                              disabled={!!editing || !!needs || !!components}
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedId(r.id)
                                setComponents(r.id)
                              }}
                            >
                              Teoría y práctica de {r.codigo_asignatura}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!visible.length && (
                    <tr>
                      <td colSpan={6}>
                        {semesterRows.length
                          ? 'No hay asignaciones que coincidan con los filtros.'
                          : 'No hay entregas confirmadas en este semestre.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Registro seleccionado (Figma asignaturas_docentes_233_2490) */}
          {semesterRows.length > 0 && <details className="side-panel-card delivery-detail">
            <summary>Detalle del componente curricular seleccionado</summary>
            <p className="card-subtitle">
              {selectedRecord
                ? 'Detalle y necesidades del componente curricular seleccionado'
                : 'Selecciona una fila de la tabla'}
            </p>

            {selectedRecord ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="filter-card">
                  <span>Componente curricular</span>
                  <strong>{selectedRecord.nombre_asignatura}</strong>
                  <span className="cell-detail">Código institucional: {selectedRecord.codigo_asignatura}</span>
                </div>

                <div className="filter-card">
                  <span>Docente asignado</span>
                  <span>
                    {selectedRecord.docentes?.length
                      ? selectedRecord.docentes.map(d => `Prof. ${d}`).join(' · ')
                      : 'Sin docente asignado'}
                  </span>
                </div>

                <div className="filter-card">
                  <span>Carrera y año</span>
                  <span>
                    Carrera: {selectedRecord.carrera} (Año {selectedRecord.ano_estudio})
                  </span>
                </div>

                <div className="filter-card">
                  <span>Turno y horas</span>
                  <span>
                    Turno {turnName(selectedRecord.turno)} ({selectedRecord.horas_semestre} hrs semestrales)
                  </span>
                </div>

                <p
                  className="muted"
                  style={{ fontSize: '12.5px', margin: '4px 0 8px 0', lineHeight: '1.4' }}
                >
                  Los datos originales se conservan al revisar una asignación.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="primary"
                    disabled={!!editing || !!needs || !!components}
                    onClick={() => {
                      setMessage('')
                      setEditing(selectedRecord.id)
                    }}
                  >
                    Corregir datos de asignación
                  </button>
                  <button
                    className="secondary"
                    disabled={!!editing || !!needs || !!components}
                    onClick={() => {
                      setMessage('')
                      setNeeds(selectedRecord.id)
                    }}
                  >
                    Necesidades de espacio
                  </button>
                  <button
                    className="secondary"
                    disabled={!!editing || !!needs || !!components}
                    onClick={() => setComponents(selectedRecord.id)}
                  >
                    Teoría y práctica
                  </button>
                </div>
              </div>
            ) : (
              <p className="muted" style={{ fontSize: '13px' }}>
                Haz clic sobre cualquier componente curricular de la tabla para ver su información y gestionar necesidades.
              </p>
            )}
          </details>}
        </div>
      )}
    </div>
  )
}
