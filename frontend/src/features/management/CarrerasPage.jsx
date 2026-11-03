import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import { Plus, Pencil, RotateCw } from 'lucide-react'

const empty = () => ({ nombre: '' })

export default function CarrerasPage({ canManage, onChanged }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load(signal) {
    setLoading(true)
    setError('')
    try {
      const data = await api('/carreras', { signal })
      if (!signal?.aborted) setRows(data)
    } catch (e) {
      if (!signal?.aborted) setError(e.message)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => c.abort()
  }, [])

  const field = (name, value) =>
    setForm(current => ({ ...current, [name]: value }))

  async function save(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/carreras', { method: form.id ? 'PATCH' : 'POST', data: form })
      setMessage(form.id ? 'Carrera actualizada.' : 'Carrera registrada.')
      setForm(null)
      await load()
      onChanged()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const filtered = rows.filter(r =>
    r.nombre.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <section className="management-page" aria-labelledby="carreras-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Organización académica</span>
          <h2 id="carreras-title">Gestión de carreras</h2>
          <p className="muted">Catálogo institucional de carreras ofrecidas.</p>
        </div>
        {canManage && (
          <button
            className="primary"
            disabled={busy}
            onClick={() => {
              setForm(empty())
              setMessage('')
            }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Nueva carrera</span>
          </button>
        )}
      </div>

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

      {form && (
        <form className="management-form" onSubmit={save} style={{ marginBottom: '24px' }}>
          <h3>{form.id ? 'Editar carrera' : 'Nueva carrera'}</h3>
          <fieldset disabled={busy}>
            <div className="form-grid">
              <label>
                Nombre de la carrera
                <input
                  required
                  maxLength={150}
                  value={form.nombre}
                  onChange={e => field('nombre', e.target.value)}
                  placeholder="Ej. Ingeniería en Sistemas de Información"
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
                {busy ? 'Guardando…' : 'Guardar carrera'}
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

      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div style={{ flex: '1', minWidth: '240px' }}>
          <label className="filter-card">
            <span>Buscar carreras</span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nombre de la carrera…"
            />
          </label>
        </div>
        <button
          className="secondary"
          disabled={busy || loading}
          onClick={() => load()}
          style={{ height: '48px', marginTop: 'auto' }}
        >
          <RotateCw size={14} aria-hidden="true" />
          <span>Actualizar lista</span>
        </button>
      </div>

      {loading ? (
        <p role="status">Cargando carreras…</p>
      ) : (
        <div className="table-scroll">
          <table>
            <caption>{filtered.length} carreras</caption>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                {canManage && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id_carrera}>
                  <td>
                    <strong>{row.nombre}</strong>
                  </td>
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
                      <button
                        className="secondary"
                        disabled={busy}
                        aria-label={`Editar ${row.nombre}`}
                        onClick={() => {
                          setForm({ ...row, id: row.id_carrera })
                          setMessage('')
                        }}
                      >
                        <Pencil size={13} aria-hidden="true" />
                        <span>Editar</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={canManage ? 3 : 2}>
                    No hay carreras que coincidan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
