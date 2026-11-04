import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import { publicationCsv } from './publication-csv'
import { RefreshCw, Download } from 'lucide-react'

export default function HorariosPublicados({ personal = false }) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0),
    [career, setCareer] = useState(''),
    [year, setYear] = useState(''),
    [busy, setBusy] = useState(false)
  const [identity, setIdentity] = useState(null)
  const endpoint = personal ? '/horarios/personal' : '/horarios/publicados'

  useEffect(() => {
    const c = new AbortController()
    setData(null)
    setError('')
    setIdentity(null)
    api(endpoint, { signal: c.signal })
      .then(d => {
        if (!c.signal.aborted) { setData(personal ? d.publicaciones : d); if (personal) setIdentity(d) }
      })
      .catch(e => {
        if (!c.signal.aborted) setError(e.message)
      })
    return () => c.abort()
  }, [attempt, endpoint, personal])

  const visible = rows =>
    rows.filter(r => (!career || r.carrera === career) && (!year || String(r.ano) === year))

  const weeklyRows = publications => publications.flatMap(p => p.filas).sort((a, b) => {
    const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
    const day = value => days.indexOf(String(value).toLocaleLowerCase('es'))
    return day(a.dia) - day(b.dia) || a.inicio.localeCompare(b.inicio) || a.carrera.localeCompare(b.carrera)
  })
  const displayed = personal && data?.length ? [{
    id: 'personal', nombre: 'Mi horario semanal', semestre: [...new Set(data.map(p => p.semestre))].join(', '),
    fecha: data.reduce((latest, p) => p.fecha > latest ? p.fecha : latest, data[0].fecha), filas: weeklyRows(data),
  }] : data

  async function download(id) {
    setBusy(true)
    setError('')
    try {
      const response = await api(endpoint),
        current = personal ? response.publicaciones : response,
        publication = personal ? (current.length ? { filas: weeklyRows(current) } : null) : current.find(p => p.id === id)
      setData(current)
      if (personal) setIdentity(response)
      if (!publication)
        throw new Error('La publicación cambió o perdió vigencia. Consulta el horario actualizado.')
      const blob = new Blob([publicationCsv(visible(publication.filas))], {
          type: 'text/csv;charset=utf-8',
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement('a')
      a.href = url
      a.download = `${personal ? 'mi-horario' : 'horario-publicado'}-${id}.csv`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
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
              <select value={career} onChange={e => setCareer(e.target.value)}>
                <option value="">Todas</option>
                {[...new Set(data.flatMap(p => p.filas.map(r => r.carrera)))].sort().map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="filter-card">
              <span>Año publicado</span>
              <select value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Todos</option>
                {[...new Set(data.flatMap(p => p.filas.map(r => r.ano)))]
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

              <div className="table-scroll">
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
                    {visible(p.filas).map((r, i) => (
                      <tr key={i}>
                        <td>{r.carrera} · Año {r.ano}</td>
                        <td><strong>{r.asignatura}</strong> · {r.componente}</td>
                        <td>{r.docentes.join(', ')}</td>
                        <td>{r.dia}</td>
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
