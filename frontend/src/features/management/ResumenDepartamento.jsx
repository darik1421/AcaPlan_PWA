import { useEffect, useState, useMemo } from 'react'
import { api } from '../../services/management'
import { 
  Building2, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Clock, 
  RefreshCw, 
  Filter, 
  Search, 
  RotateCcw,
  Info
} from 'lucide-react'

export default function ResumenDepartamento() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  // Filtros interactivos
  const [career, setCareer] = useState('')
  const [year, setYear] = useState('')
  const [turn, setTurn] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setRows(null)
    setError('')
    api('/departamento/asignaciones', { signal: controller.signal })
      .then(result => {
        if (!controller.signal.aborted) setRows(result)
      })
      .catch(e => {
        if (!controller.signal.aborted) setError(e.message)
      })
    return () => controller.abort()
  }, [attempt])

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

  const allRows = useMemo(() => rows || [], [rows])
  const careers = useMemo(() => [...new Set(allRows.map(r => r.carrera))].sort(), [allRows])
  const years = useMemo(() => [...new Set(allRows.map(r => String(r.ano_estudio)))].sort(
    (a, b) => Number(a) - Number(b)
  ), [allRows])
  const turns = useMemo(() => [...new Set(allRows.map(r => r.turno))].sort(), [allRows])

  // Stats
  const totalHours = useMemo(() => allRows.reduce((sum, r) => sum + (Number(r.horas_semestre) || 0), 0), [allRows])
  const uniqueTeachers = useMemo(() => new Set(allRows.flatMap(r => r.docentes || [])).size, [allRows])

  const visibleRows = useMemo(() => {
    return allRows.filter(r => {
      const matchCareer = !career || r.carrera === career
      const matchYear = !year || String(r.ano_estudio) === year
      const matchTurn = !turn || r.turno === turn
      const matchSearch = !search.trim() ||
        r.asignatura?.toLowerCase().includes(search.toLowerCase()) ||
        r.codigo?.toLowerCase().includes(search.toLowerCase()) ||
        r.docentes?.some(d => d.toLowerCase().includes(search.toLowerCase()))
      return matchCareer && matchYear && matchTurn && matchSearch
    })
  }, [allRows, career, year, turn, search])

  return (
    <div className="surface-card" style={{ padding: '24px', borderRadius: '16px' }}>
      <div className="section-heading" style={{ marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Building2 size={20} color="var(--primary-indigo)" />
            <h3 className="card-title" style={{ margin: 0 }}>Asignación académica del departamento</h3>
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
            Consulta las entregas de los coordinadores de tus carreras. Las correcciones de asignaciones corresponden al coordinador.
          </p>
        </div>
        <button className="secondary" onClick={() => setAttempt(value => value + 1)}>
          <RefreshCw size={14} aria-hidden="true" />
          <span>Actualizar asignaciones</span>
        </button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      {!rows && !error && <p role="status">Consultando asignaciones del departamento…</p>}

      {rows && (
        <>
          {/* Tarjetas de Métricas Ejecutivas */}
          <div className="stat-grid" style={{ marginBottom: '20px' }}>
            <div className="stat-card">
              <span className="stat-label">
                <BookOpen size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Asignaturas
              </span>
              <strong className="stat-value">{allRows.length}</strong>
              <span className="stat-caption">Componentes entregados</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">
                <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Docentes Asignados
              </span>
              <strong className="stat-value">{uniqueTeachers}</strong>
              <span className="stat-caption">Cuerpo académico</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">
                <GraduationCap size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Carreras
              </span>
              <strong className="stat-value">{careers.length}</strong>
              <span className="stat-caption">Planes departamentales</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">
                <Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                Carga Horaria
              </span>
              <strong className="stat-value">{totalHours}</strong>
              <span className="stat-caption">Horas semestrales totales</span>
            </div>
          </div>

          {/* Filtros para el Director */}
          {allRows.length > 0 && (
            <div className="surface-card" style={{ padding: '16px 20px', marginBottom: '20px', background: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Filter size={15} color="var(--primary-indigo)" />
                <strong style={{ fontSize: '13.5px' }}>Filtros de revisión departamental</strong>
                {visibleRows.length !== allRows.length && (
                  <span className="status-pill active" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    {visibleRows.length} de {allRows.length} visibles
                  </span>
                )}
              </div>

              <div className="filter-grid" style={{ marginBottom: '10px' }}>
                <label className="filter-card">
                  <span>Carrera</span>
                  <select value={career} onChange={e => setCareer(e.target.value)}>
                    <option value="">Todas las carreras</option>
                    {careers.map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="filter-card">
                  <span>Año</span>
                  <select value={year} onChange={e => setYear(e.target.value)}>
                    <option value="">Todos los años</option>
                    {years.map(y => <option key={y} value={y}>Año {y}</option>)}
                  </select>
                </label>
                <label className="filter-card">
                  <span>Turno</span>
                  <select value={turn} onChange={e => setTurn(e.target.value)}>
                    <option value="">Todos los turnos</option>
                    {turns.map(t => <option key={t} value={t}>{turnName(t)}</option>)}
                  </select>
                </label>
                <label className="filter-card">
                  <span>Buscar</span>
                  <input
                    type="search"
                    placeholder="Asignatura o docente…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="secondary"
                  onClick={() => { setCareer(''); setYear(''); setTurn(''); setSearch('') }}
                  style={{ fontSize: '12.5px', padding: '5px 12px' }}
                >
                  <RotateCcw size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  <span>Limpiar filtros</span>
                </button>
              </div>
            </div>
          )}

          {/* Tabla */}
          <div className="table-scroll">
            <table>
              <caption>Asignaturas y docentes de tu departamento</caption>
              <thead>
                <tr>
                  {['Carrera', 'Año', 'Asignatura', 'Docentes', 'Turno', 'Horas semestrales'].map(label => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(row => (
                  <tr key={row.id}>
                    <td><strong>{row.carrera}</strong></td>
                    <td>
                      <span className="status-pill" style={{ background: '#F1F5F9', color: '#334155', fontWeight: 600 }}>
                        Año {row.ano_estudio}
                      </span>
                    </td>
                    <td>
                      <strong>{row.codigo}</strong> · {row.asignatura}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {row.docentes?.map((d, i) => (
                          <span key={i} className="status-pill active" style={{ fontSize: '12px' }}>
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={turnPillClass(row.turno)}>
                        <span className="status-dot" aria-hidden="true">●</span>
                        <span>{turnName(row.turno)}</span>
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '14px' }}>{row.horas_semestre}</strong>
                      <span className="cell-detail">hrs</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visibleRows.length && (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <Info size={28} color="var(--primary-indigo)" style={{ opacity: 0.5, marginBottom: 8 }} />
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-dark)' }}>
                  {allRows.length
                    ? 'No hay componentes que coincidan con los filtros seleccionados.'
                    : 'No hay entregas académicas para tu departamento en el semestre activo.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

