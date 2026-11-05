import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/management'
import { publicationCsv } from './publication-csv'
import { orderedScheduleRows } from '../../lib/schedule-order'
import { RefreshCw, Download } from 'lucide-react'

function readPublications(response, personal) {
  const list=personal?response?.publicaciones:response
  if(!Array.isArray(list)||list.some(p=>!p||!Array.isArray(p.filas)||p.filas.some(r=>!r||typeof r.carrera!=='string'||typeof r.inicio!=='string'||typeof r.fin!=='string'||!Array.isArray(r.docentes)||r.docentes.some(d=>typeof d!=='string'))))throw new Error('No se pudieron leer los horarios completos. Actualiza la consulta.')
  return list
}

function validFilters(filters, publications) {
  const rows = publications.flatMap(p=>p.filas)
  const career = rows.some(r=>r.carrera===filters.career) ? filters.career : ''
  const year = rows.some(r=>(!career||r.carrera===career)&&String(r.ano)===filters.year) ? filters.year : ''
  return {career,year}
}

export default function HorariosPublicados({ personal = false }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0),
    [filters, setFilters] = useState({career:'',year:''}),
    [busy, setBusy] = useState(false)
  const {career,year} = filters
  const [identity, setIdentity] = useState(null)
  const generation = useRef(0)
  const endpoint = personal ? '/horarios/personal' : '/horarios/publicados'

  useEffect(() => {
    const c = new AbortController()
    generation.current++
    setBusy(false)
    setData(null)
    setError('')
    setIdentity(null)
    api(endpoint, { signal: c.signal })
      .then(d => {
        if (!c.signal.aborted) { const publications=readPublications(d,personal); setData(publications); setFilters(current => validFilters(current,publications)); if (personal) setIdentity(d) }
      })
      .catch(e => {
        if (!c.signal.aborted) setError(e.message)
      })
    return () => { c.abort(); generation.current++ }
  }, [attempt, endpoint, personal])


  const visible = rows =>
    rows.filter(r => (!career || r.carrera === career) && (!year || String(r.ano) === year))

  const weeklyRows = publications => orderedScheduleRows(publications.flatMap(p => p.filas))
  const displayed = personal && data?.length ? [{
    id: 'personal', nombre: 'Mi horario semanal', semestre: [...new Set(data.map(p => p.semestre))].join(', '),
    fecha: data.reduce((latest, p) => p.fecha > latest ? p.fecha : latest, data[0].fecha), filas: weeklyRows(data),
  }] : data?.map(p => ({...p, filas: orderedScheduleRows(p.filas)}))

  async function download(id) {
    if (busy) return
    const currentGeneration = generation.current
    setBusy(true)
    setError('')
    try {
      const response = await api(endpoint),
        current = readPublications(response,personal),
        publication = personal ? (current.length ? { filas: weeklyRows(current) } : null) : current.find(p => p.id === id)
      if (currentGeneration !== generation.current) return
      setData(current)
      setFilters(filters => validFilters(filters,current))
      if (personal) setIdentity(response)
      if (!publication)
        throw new Error('La publicación cambió o perdió vigencia. Consulta el horario actualizado.')
      const rows = visible(publication.filas)
      if (!rows.length) throw new Error('Los datos cambiaron y ya no hay clases para los filtros seleccionados. Revisa el horario actualizado antes de descargar.')
      const blob = new Blob([publicationCsv(rows)], {
          type: 'text/csv;charset=utf-8',
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement('a')
      a.href = url
      a.download = `${personal ? 'mi-horario' : 'horario-publicado'}-${id}.csv`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      if (currentGeneration === generation.current) setError(e.message)
    } finally {
      if (currentGeneration === generation.current) setBusy(false)
    }
  }

  return (
    <section className="management-page" aria-labelledby="publicados-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Distribución semanal</span>
          <h2 id="publicados-title">{personal ? 'Mi horario' : 'Horarios publicados'}</h2>
          <p className="muted">
            {personal ? 'Tus clases publicadas, con sus días, horas y lugares, reunidas de todos los departamentos.' : 'Consulta las publicaciones vigentes. Los borradores y las aprobaciones desactualizadas no aparecen aquí.'}
          </p>
        </div>
        <button
          className="secondary"
          disabled={busy}
          onClick={() => setAttempt(n => n + 1)}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Actualizar horarios</span>
        </button>
      </div>

      {error && <p role="alert" className="error">{error}</p>}
      {!data && !error && <p role="status">Consultando publicaciones…</p>}
      {personal && identity?.vinculado === false && <p className="notice">Tu cuenta aún no está vinculada a un registro docente. Solicita a administración que revise esa relación.</p>}
      {personal && identity?.requiere_republicacion && <p className="notice">Existen publicaciones anteriores sin identificadores de docentes. El encargado debe revisarlas y volver a publicarlas para incorporarlas al horario personal.</p>}

      {data && (
        <>
          <div className="filter-grid" style={{ marginBottom: '24px' }}>
            <label className="filter-card">
              <span>Carrera publicada</span>
              <select disabled={busy} value={career} onChange={e => setFilters({career:e.target.value,year:''})}>
                <option value="">Todas</option>
                {[...new Set(data.flatMap(p => p.filas.map(r => r.carrera)))].sort().map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="filter-card">
              <span>Año publicado</span>
              <select disabled={busy} value={year} onChange={e => setFilters(current=>({...current,year:e.target.value}))}>
                <option value="">Todos</option>
                {[...new Set(data.flatMap(p => p.filas.filter(r => !career || r.carrera === career).map(r => r.ano)))]
                  .sort((a, b) => a - b)
                  .map(y => (
                    <option key={y}>{y}</option>
                  ))}
              </select>
            </label>
          </div>

          {!data.length && (
            <p className="notice">
              {personal ? 'Aún no tienes clases publicadas vigentes vinculadas a tu cuenta.' : 'No hay publicaciones vigentes. El encargado debe completar la revisión y publicación.'}
            </p>
          )}

          {displayed.map(p => (
            <div key={p.id} className="surface-card" style={{ marginBottom: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 className="card-title">
                    {p.semestre} · {p.nombre}
                  </h3>
                  <p className="card-subtitle" style={{ margin: 0 }}>
                    {personal ? 'Última publicación incluida: ' : 'Publicado: '}{new Date(p.fecha).toLocaleString()}
                  </p>
                </div>
                <button
                  className="secondary"
                  disabled={busy || !visible(p.filas).length}
                  onClick={() => download(p.id)}
                >
                  <Download size={14} aria-hidden="true" />
                  <span>Descargar CSV de {p.nombre}</span>
                </button>
              </div>

              <div className="table-scroll published-timetable">
                <table>
                  <caption>Horario vigente</caption>
                  <thead>
                    <tr>
                      {['Carrera / año', 'Asignatura', 'Docentes', 'Día', 'Hora', 'Aula / sede'].map(
                        h => (
                          <th key={h}>{h}</th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {!visible(p.filas).length && <tr><td colSpan={6}>No hay clases que coincidan con los filtros seleccionados.</td></tr>}
                    {visible(p.filas).map((r, i) => (
                      <tr key={i}>
                        <td>{r.carrera} · Año {r.ano}</td>
                        <td><strong>{r.asignatura}</strong> · {r.componente}</td>
                        <td>{r.docentes.join(', ')}</td>
                        <td><span className="schedule-day">{r.dia}</span></td>
                        <td>{r.inicio}–{r.fin}</td>
                        <td>{r.aula} · {r.sede}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  )
}
