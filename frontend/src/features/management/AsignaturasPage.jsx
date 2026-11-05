import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import AsignaturasImportadas from './AsignaturasImportadas'
import { Archive, Pencil, RotateCw } from 'lucide-react'

export default function AsignaturasPage({ context, canManage, onChanged }) {
  const [rows, setRows] = useState([])
  const [linked, setLinked] = useState([])
  const [carreras, setCarreras] = useState([])
  const [form, setForm] = useState(null)
  const [query, setQuery] = useState('')
  const [careerFilter, setCareerFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load(signal) {
    setLoading(true)
    setLoadFailed(false)
    setError('')
    try {
      const [dataAsignaturas, dataCarreras] = await Promise.all([
        api('/asignaturas', { signal }),
        api('/carreras', { signal }),
      ])
      if (!signal?.aborted) {
        setRows(dataAsignaturas)
        setCarreras(dataCarreras)
      }
    } catch (e) {
      if (!signal?.aborted) { setError(e.message); setLoadFailed(true); setRows([]); setCarreras([]); setForm(null) }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => c.abort()
  }, [])

  const careerScope = JSON.stringify(context?.carreras || [])
  useEffect(() => {
    setForm(null)
    setMessage('')
  }, [canManage, context?.isAdmin, careerScope])

  const field = (name, value) =>
    setForm(current => ({ ...current, [name]: value }))

  async function save(event) {
    event.preventDefault()
    if (busy || loading || loadFailed || !form?.id || !canEdit(form.id_carrera)) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/asignaturas', { method: 'PATCH', data: form })
      setMessage('Asignatura actualizada.')
      setForm(null)
      await load()
      onChanged()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const filtered = rows.filter(
    r =>
      !linked.includes(r.id_asignatura) &&
      (!careerFilter || r.id_carrera === Number(careerFilter)) &&
      (!yearFilter || r.ano_estudio === Number(yearFilter)) &&
      (r.nombre.toLowerCase().includes(query.toLowerCase()) ||
        r.codigo.toLowerCase().includes(query.toLowerCase()) ||
        r.carrera_nombre.toLowerCase().includes(query.toLowerCase()))
  )

  const canEdit = id =>
    canManage && (context?.isAdmin || context?.carreras?.includes(id))
  const activeCarreras = carreras.filter(
    c => c.estado === 'activo' && canEdit(c.id_carrera)
  )

  return (
    <section className="management-page" aria-labelledby="asignaturas-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Catálogo institucional</span>
          <h2 id="asignaturas-title">Gestión de asignaturas</h2>
          <p className="muted">
            Consulta de asignaturas y corrección de los datos recibidos.
          </p>
        </div>
      </div>

      <AsignaturasImportadas
        context={context}
        canManage={canManage}
        onLinked={setLinked}
      />

      <details className="collapsible-card">
        <summary>
          <Archive size={16} color="#637086" />
          <span>Catálogo anterior</span>
        </summary>
        <p className="muted" style={{ margin: '8px 0 6px 0', fontSize: '13.5px' }}>
          Registros del modelo anterior. La entrega nueva se consulta arriba; no es necesario registrar las asignaturas de nuevo aquí.
        </p>
        <p className="muted" style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
          Las horas teóricas y prácticas son datos del catálogo; no determinan automáticamente la duración de las clases. La regla general de matutino y vespertino es de dos sesiones de 90 minutos por semana.
        </p>

        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="success">
            {message}
          </p>
        )}

        {form && canEdit(form.id_carrera) && (
          <form className="management-form" onSubmit={save} style={{ marginBottom: '20px' }}>
            <h3>Corregir asignatura</h3>
            <fieldset disabled={busy || loading || loadFailed}>
              <div className="form-grid">
                <label>
                  Carrera
                  <select
                    required
                    disabled={!!form.id}
                    value={form.id_carrera}
                    onChange={e => field('id_carrera', Number(e.target.value))}
                  >
                    {form.id &&
                      !activeCarreras.find(c => c.id_carrera === form.id_carrera) && (
                        <option value={form.id_carrera}>
                          {carreras.find(c => c.id_carrera === form.id_carrera)?.nombre}
                        </option>
                      )}
                    {activeCarreras.map(c => (
                      <option key={c.id_carrera} value={c.id_carrera}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Código
                  <input
                    required
                    maxLength={20}
                    value={form.codigo}
                    onChange={e => field('codigo', e.target.value)}
                  />
                </label>
                <label>
                  Nombre de la asignatura
                  <input
                    required
                    maxLength={100}
                    value={form.nombre}
                    onChange={e => field('nombre', e.target.value)}
                  />
                </label>
                <label>
                  Año de estudio
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={form.ano_estudio}
                    onChange={e => field('ano_estudio', Number(e.target.value))}
                  />
                </label>
                <label>
                  Horas teóricas
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.horas_teoricas}
                    onChange={e => field('horas_teoricas', e.target.value)}
                  />
                </label>
                <label>
                  Horas prácticas
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.horas_practicas}
                    onChange={e => field('horas_practicas', e.target.value)}
                  />
                </label>
                {form.id && (
                  <label>
                    Estado
                    <select
                      value={form.estado}
                      onChange={e => field('estado', e.target.value)}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </label>
                )}
              </div>
              <div className="form-actions">
                <button className="primary" type="submit">
                  {busy ? 'Guardando…' : 'Guardar asignatura'}
                </button>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setForm(null)}
                >
                  Cancelar
                </button>
              </div>
            </fieldset>
          </form>
        )}

        <div className="filter-grid" style={{ marginBottom: '16px' }}>
          <label className="filter-card">
            <span>Buscar asignaturas</span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Código, nombre o carrera"
            />
          </label>
          <label className="filter-card">
            <span>Filtrar por carrera</span>
            <select
              value={careerFilter}
              onChange={e => setCareerFilter(e.target.value)}
            >
              <option value="">Todas las carreras</option>
              {carreras.map(c => (
                <option key={c.id_carrera} value={c.id_carrera}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-card">
            <span>Filtrar por año</span>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
            >
              <option value="">Todos los años</option>
              {[...new Set(rows.map(r => r.ano_estudio))]
                .sort((a, b) => a - b)
                .map(year => (
                  <option key={year} value={year}>
                    Año {year}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
          <button
            className="secondary"
            disabled={busy || loading}
            onClick={() => load()}
          >
            <RotateCw size={14} aria-hidden="true" />
            <span>Actualizar lista</span>
          </button>
        </div>

        {loading ? (
          <p role="status">Cargando asignaturas…</p>
        ) : loadFailed ? (
          <p className="notice">No se pudo consultar el catálogo anterior. Usa «Actualizar lista» para reintentar.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <caption>{filtered.length} asignaturas</caption>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Asignatura</th>
                  <th>Carrera</th>
                  <th>Año</th>
                  <th>Horas teóricas</th>
                  <th>Horas prácticas</th>
                  <th>Estado</th>
                  {canManage && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => (
                  <tr key={row.id_asignatura}>
                    <td>
                      <span className="badge-code">{row.codigo}</span>
                    </td>
                    <td>
                      <strong>{row.nombre}</strong>
                    </td>
                    <td>{row.carrera_nombre}</td>
                    <td>Año {row.ano_estudio}</td>
                    <td>{row.horas_teoricas} h</td>
                    <td>{row.horas_practicas} h</td>
                    <td>
                      <span
                        className={
                          row.estado === 'activo'
                            ? 'status-pill active'
                            : 'status-pill inactive'
                        }
                      >
                        <span className="status-dot" aria-hidden="true">●</span>
                        <span>{row.estado}</span>
                      </span>
                    </td>
                    {canManage && (
                      <td>
                        {canEdit(row.id_carrera) && (
                          <button
                            className="secondary"
                            disabled={busy}
                            aria-label={`Editar ${row.nombre}`}
                            onClick={() => {
                              setForm({ ...row, id: row.id_asignatura })
                              setMessage('')
                            }}
                          >
                            <Pencil size={13} aria-hidden="true" />
                            <span>Editar</span>
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={canManage ? 8 : 7}>
                      No hay asignaturas que coincidan.
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
