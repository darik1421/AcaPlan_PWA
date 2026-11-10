import ComponentesAsignacion from './ComponentesAsignacion'
import CorreccionAsignacion from './CorreccionAsignacion'
import NecesidadesAsignacion from './NecesidadesAsignacion'
import NuevaAsignacionModal from './NuevaAsignacionModal'
import Modal from '../../components/Modal'
import { useEffect, useState, useMemo } from 'react'
import { api } from '../../services/management'
import { 
  BookOpen, 
  UserCheck, 
  Clock, 
  GraduationCap, 
  Filter, 
  Search, 
  RotateCcw, 
  Edit3, 
  Sliders, 
  Layers,
  ChevronRight,
  ChevronLeft,
  Info,
  Plus
} from 'lucide-react'

export default function AsignacionesImportadas({ periodId, revision, onDataChanged }) {
  const [editing, setEditing] = useState(null)
  const [message, setMessage] = useState('')
  const [needs, setNeeds] = useState(null)
  const [components, setComponents] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    setEditing(null)
    setNeeds(null)
    setComponents(null)
    setMessage('')
    setSelectedId(null)
    setShowCreateModal(false)
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
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => { 
    setCareer('')
    setYear('')
    setTurn('')
    setSearchTerm('')
    setCurrentPage(1)
  }, [periodId])

  useEffect(() => {
    setCurrentPage(1)
  }, [career, year, turn, searchTerm])

  useEffect(() => {
    if (loading) return
    const current = rows.filter(r => r.id_periodo === periodId)
    setCareer(value => current.some(r => r.carrera === value) ? value : '')
    setYear(value => current.some(r => String(r.ano_estudio) === value) ? value : '')
    setTurn(value => current.some(r => r.turno === value) ? value : '')
  }, [rows, periodId, loading])

  const semesterRows = useMemo(() => rows.filter(r => r.id_periodo === periodId), [rows, periodId])
  const careers = useMemo(() => [...new Set(semesterRows.map(r => r.carrera))].sort(), [semesterRows])
  const years = useMemo(() => [...new Set(semesterRows.map(r => String(r.ano_estudio)))].sort(
    (a, b) => Number(a) - Number(b)
  ), [semesterRows])
  const turns = useMemo(() => [...new Set(semesterRows.map(r => r.turno))].sort(), [semesterRows])

  const turnName = value =>
    ({
      matutino: 'Matutino',
      vespertino: 'Vespertino',
      nocturno: 'Nocturno',
      encuentros: 'Por encuentros',
    }[value] || value)

  const turnPillClass = value => {
    switch (value) {
      case 'matutino': return 'status-pill active'
      case 'vespertino': return 'status-pill warning'
      case 'nocturno': return 'status-pill purple'
      case 'encuentros': return 'status-pill teal'
      default: return 'status-pill'
    }
  }

  // Stats calculation
  const totalHours = useMemo(() => 
    semesterRows.reduce((acc, r) => acc + (Number(r.horas_semestre) || 0), 0),
    [semesterRows]
  )
  const uniqueTeachersCount = useMemo(() => {
    const list = semesterRows.flatMap(r => r.docentes || [])
    return new Set(list).size
  }, [semesterRows])

  const visible = semesterRows.filter(r => {
    const matchCareer = !career || r.carrera === career
    const matchYear = !year || String(r.ano_estudio) === year
    const matchTurn = !turn || r.turno === turn
    const matchSearch = !searchTerm.trim() || 
      (r.nombre_asignatura?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.codigo_asignatura?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.docentes?.some(d => d.toLowerCase().includes(searchTerm.toLowerCase())))
    return matchCareer && matchYear && matchTurn && matchSearch
  })

  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return visible.slice(start, start + pageSize)
  }, [visible, safePage, pageSize])

  const selectedRecord =
    visible.find(r => r.id === selectedId) || visible[0] || null

  return (
    <div style={{ marginTop: '8px' }}>
      {message && (
        <p role="status" className="success" style={{ marginBottom: '16px' }}>
          {message}
        </p>
      )}

      {/* Modales modernos para edición */}
      <Modal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Corregir asignación recibida"
        maxWidth={640}
      >
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
      </Modal>

      <Modal
        isOpen={Boolean(components)}
        onClose={() => setComponents(null)}
        title="Distribución de teoría y práctica"
        maxWidth={640}
      >
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
      </Modal>

      <Modal
        isOpen={Boolean(needs)}
        onClose={() => setNeeds(null)}
        title="Necesidades de aula y espacios"
        maxWidth={640}
      >
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
      </Modal>

      <NuevaAsignacionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        periodId={periodId}
        onSaved={() => {
          setMessage('Asignación académica registrada exitosamente.')
          setAttempt(n => n + 1)
          onDataChanged?.()
        }}
      />

      {/* Indicadores clave (KPIs) de la entrega */}
      {!loading && !error && semesterRows.length > 0 && (
        <div className="stat-grid" style={{ marginBottom: '20px' }}>
          <div className="stat-card">
            <span className="stat-label"><BookOpen size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Asignaciones</span>
            <strong className="stat-value">{semesterRows.length}</strong>
            <span className="stat-caption">Componentes curriculares</span>
          </div>
          <div className="stat-card">
            <span className="stat-label"><UserCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Docentes Únicos</span>
            <strong className="stat-value">{uniqueTeachersCount}</strong>
            <span className="stat-caption">Profesores asignados</span>
          </div>
          <div className="stat-card">
            <span className="stat-label"><GraduationCap size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Carreras</span>
            <strong className="stat-value">{careers.length}</strong>
            <span className="stat-caption">Planes académicos</span>
          </div>
          <div className="stat-card">
            <span className="stat-label"><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Horas Semestrales</span>
            <strong className="stat-value">{totalHours} hrs</strong>
            <span className="stat-caption">Carga total del semestre</span>
          </div>
        </div>
      )}

      {/* Filtros y búsqueda interactiva */}
      {!loading && !error && semesterRows.length > 0 && (
        <div className="surface-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} color="var(--primary-indigo)" />
              <strong style={{ fontSize: '14px', color: 'var(--text-dark)' }}>Filtrar entrega académica</strong>
              {visible.length !== semesterRows.length && (
                <span className="status-pill active" style={{ fontSize: '12px', padding: '2px 8px' }}>
                  Mostrando {visible.length} de {semesterRows.length}
                </span>
              )}
            </div>

            <button
              className="primary"
              type="button"
              onClick={() => setShowCreateModal(true)}
              style={{ fontSize: '13px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} aria-hidden="true" />
              <span>Nueva asignación</span>
            </button>
          </div>

          <div className="filter-grid" style={{ marginBottom: '12px' }}>
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
            <label className="filter-card">
              <span>Búsqueda rápida</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="search"
                  placeholder="Asignatura, código o docente…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              className="secondary"
              onClick={() => {
                setCareer('')
                setYear('')
                setTurn('')
                setSearchTerm('')
              }}
              style={{ fontSize: '13px', padding: '6px 14px' }}
            >
              <RotateCcw size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
              <span>Limpiar filtros</span>
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
          {/* Tarjeta de Registro seleccionado (Arriba) */}
          {semesterRows.length > 0 && (
            <details className="side-panel-card delivery-detail" open>
              <summary style={{ fontSize: '15px' }}>
                Detalle del componente curricular seleccionado
              </summary>
              <p className="card-subtitle">
                {selectedRecord
                  ? 'Detalle y necesidades del componente curricular seleccionado'
                  : 'Selecciona una fila de la tabla'}
              </p>

              {selectedRecord ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '14px' }}>
                  <div className="filter-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                    <div className="filter-card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>Componente curricular</span>
                      <strong style={{ fontSize: '15px', color: 'var(--primary-dark)' }}>{selectedRecord.nombre_asignatura}</strong>
                      <span className="cell-detail" style={{ fontWeight: 600, color: 'var(--primary-indigo)' }}>
                        Código institucional: {selectedRecord.codigo_asignatura}
                      </span>
                    </div>

                    <div className="filter-card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>Docentes asignados</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                        {selectedRecord.docentes?.length ? (
                          selectedRecord.docentes.map((d, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <UserCheck size={14} color="var(--primary-indigo)" />
                              <span style={{ fontWeight: 500, color: '#1E293B', fontSize: '13.5px' }}>Prof. {d}</span>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Sin docente asignado</span>
                        )}
                      </div>
                    </div>

                    <div className="filter-card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>Carrera y año de estudio</span>
                      <span style={{ fontWeight: 600, color: '#1E293B' }}>
                        {selectedRecord.carrera}
                      </span>
                      <span className="cell-detail" style={{ color: '#475569' }}>
                        Año de cohorte: Año {selectedRecord.ano_estudio}
                      </span>
                    </div>

                    <div className="filter-card" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>Turno y horas programadas</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                        <span className={turnPillClass(selectedRecord.turno)}>
                          <span className="status-dot" aria-hidden="true">●</span>
                          <span>{turnName(selectedRecord.turno)}</span>
                        </span>
                        <span style={{ fontWeight: 600, color: '#1E293B' }}>
                          {selectedRecord.horas_semestre} horas semestrales
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px', alignItems: 'center' }}>
                    <button
                      className="primary"
                      disabled={!!editing || !!needs || !!components}
                      onClick={() => {
                        setMessage('')
                        setEditing(selectedRecord.id)
                      }}
                    >
                      <Edit3 size={15} style={{ marginRight: 6 }} />
                      <span>Corregir datos de asignación</span>
                    </button>
                    <button
                      className="secondary"
                      disabled={!!editing || !!needs || !!components}
                      onClick={() => {
                        setMessage('')
                        setNeeds(selectedRecord.id)
                      }}
                    >
                      <Sliders size={15} style={{ marginRight: 6 }} />
                      <span>Necesidades de espacio</span>
                    </button>
                    <button
                      className="secondary"
                      disabled={!!editing || !!needs || !!components}
                      onClick={() => setComponents(selectedRecord.id)}
                    >
                      <Layers size={15} style={{ marginRight: 6 }} />
                      <span>Teoría y práctica</span>
                    </button>
                    <span className="muted" style={{ fontSize: '12.5px', marginLeft: 'auto' }}>
                      Los datos originales se conservan al revisar una asignación.
                    </span>
                  </div>
                </div>
              ) : (
                <p className="muted" style={{ fontSize: '13px', marginTop: '12px' }}>
                  Haz clic sobre cualquier componente curricular de la tabla para ver su información y gestionar necesidades.
                </p>
              )}
            </details>
          )}

          {/* Tabla de asignaturas con paginación (Abajo) */}
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
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map(r => {
                    const isSelected = selectedRecord?.id === r.id
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(48, 44, 145, 0.06)' : undefined,
                          borderLeft: isSelected ? '4px solid var(--primary-indigo)' : '4px solid transparent',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ minWidth: '220px', wordBreak: 'normal', hyphens: 'none' }}>
                          <strong>{r.carrera}</strong>
                          <span className="cell-detail delivery-subline" style={{ color: 'var(--primary-indigo)', fontWeight: 600 }}>Año {r.ano_estudio}</span>
                        </td>
                        <td style={{ minWidth: '240px', wordBreak: 'normal' }}>
                          <strong>{r.nombre_asignatura}</strong>
                          <span className="cell-detail delivery-subline">{r.codigo_asignatura}</span>
                        </td>
                        <td style={{ minWidth: '200px', wordBreak: 'normal' }}>
                          {r.docentes?.join(', ')}
                        </td>
                        <td style={{ minWidth: '130px', whiteSpace: 'nowrap' }}>
                          <span className={turnPillClass(r.turno)}>
                            <span className="status-dot" aria-hidden="true">●</span>
                            <span>{turnName(r.turno)}</span>
                          </span>
                        </td>
                        <td style={{ minWidth: '110px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <span style={{ fontWeight: 600 }}>{r.horas_semestre}</span>
                        </td>
                      </tr>
                    )
                  })}
                  {!visible.length && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '36px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <Info size={32} color="var(--primary-indigo)" style={{ opacity: 0.6 }} />
                          <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-dark)' }}>
                            {semesterRows.length
                              ? 'No hay asignaciones que coincidan con los filtros.'
                              : 'No hay entregas confirmadas en este semestre.'}
                          </p>
                          {semesterRows.length > 0 ? (
                            <button
                              className="secondary"
                              style={{ marginTop: '8px' }}
                              onClick={() => {
                                setCareer('')
                                setYear('')
                                setTurn('')
                                setSearchTerm('')
                              }}
                            >
                              Restablecer filtros
                            </button>
                          ) : (
                            <button
                              className="primary"
                              type="button"
                              style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => setShowCreateModal(true)}
                            >
                              <Plus size={15} aria-hidden="true" />
                              <span>Registrar asignación manualmente</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación con límite de 10 */}
            {visible.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 18px',
                  marginTop: '14px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#475569',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span>
                  Mostrando <strong>{(safePage - 1) * pageSize + 1}</strong>–<strong>{Math.min(safePage * pageSize, visible.length)}</strong> de <strong>{visible.length}</strong> componentes
                </span>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      className="secondary"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <ChevronLeft size={14} />
                      <span>Anterior</span>
                    </button>
                    <span style={{ padding: '0 6px', fontWeight: 600, color: 'var(--primary-dark)' }}>
                      Página {safePage} de {totalPages}
                    </span>
                    <button
                      type="button"
                      className="secondary"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      style={{ padding: '6px 12px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <span>Siguiente</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

