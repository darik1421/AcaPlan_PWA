import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../../services/management'
import { Plus, Pencil, RotateCw } from 'lucide-react'


const empty = () => ({ nombre: '' })

export default function CarrerasPage({ canManage, onChanged, manageDepartments = false }) {
  const [rows, setRows] = useState([])
  const [departments, setDepartments] = useState(null)
  const [form, setForm] = useState(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const generation = useRef(0)
  useEffect(() => {
    generation.current++
    setForm(null)
    setBusy(false)
    setMessage('')
    return () => { generation.current++ }
  }, [canManage, manageDepartments])

  const load = useCallback(async (signal) => {
    const current = generation.current
    setLoading(true)
    setLoadFailed(false)
    setError('')
    try {
      const [data, organization] = await Promise.all([api('/carreras', { signal }), manageDepartments ? api('/departamentos', { signal }) : Promise.resolve(null)])
      if (!signal?.aborted && current === generation.current) { setRows(data); setDepartments(organization) }
    } catch (e) {
      if (!signal?.aborted && current === generation.current) { setError(e.message); setLoadFailed(true); setRows([]); setDepartments(null); setForm(null) }
    } finally {
      if (!signal?.aborted && current === generation.current) setLoading(false)
    }
  }, [manageDepartments])

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => c.abort()
  }, [load, canManage])

  useEffect(() => { if (!canManage) setForm(null) }, [canManage])

  const field = (name, value) =>
    setForm(current => ({ ...current, [name]: value }))

  async function save(event) {
    event.preventDefault()
    if (busy || loading || loadFailed || !canManage || !form) return
    if (manageDepartments && !departments?.departamentos.some(d => d.id === Number(form.departamento))) {
      setError('Selecciona el departamento de la carrera antes de guardarla.')
      return
    }
    const current = generation.current
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/carreras', { method: form.id ? 'PATCH' : 'POST', data: { nombre: form.nombre, ...(form.id ? { id: form.id, estado: form.estado } : {}), ...(manageDepartments ? {id_departamento:Number(form.departamento),revision_departamento:form.revisionDepartamento || 0} : {}) } })
      if (current !== generation.current) return
      setMessage(form.id ? 'Carrera actualizada.' : 'Carrera registrada.')
      setForm(null)
      await load()
      if (current === generation.current) onChanged?.()
    } catch (e) {
      if (current === generation.current) setError(e.message)
    } finally {
      if (current === generation.current) setBusy(false)
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
            disabled={busy || loading || loadFailed}
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
              {manageDepartments && <label>Departamento de la carrera<select required value={form.departamento || ''} onChange={e => field('departamento',e.target.value)}><option value="">Selecciona un departamento</option>{departments?.departamentos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}</select></label>}
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
          onClick={() => { setForm(null); load() }}
          style={{ height: '48px', marginTop: 'auto' }}
        >
          <RotateCw size={14} aria-hidden="true" />
          <span>Actualizar lista</span>
        </button>
      </div>

      {loading ? (
        <p role="status">Cargando carreras…</p>
      ) : loadFailed ? (
        <p className="notice">No se pudo cargar la lista. Pulsa «Actualizar lista» para volver a intentarlo.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <caption>{filtered.length} carreras</caption>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                {manageDepartments && <th>Departamento</th>}
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
                  {manageDepartments && <td>{departments?.departamentos.find(d => d.id === departments.carreras.find(c => c.id_carrera === row.id_carrera)?.id_departamento)?.nombre || 'Pendiente de asignar'}</td>}
                  {canManage && (
                    <td>
                      <button
                        className="secondary"
                        disabled={busy}
                        aria-label={`Editar ${row.nombre}`}
                        onClick={() => {
                          const relation = departments?.carreras.find(c => c.id_carrera === row.id_carrera)
                          setForm({ ...row, id: row.id_carrera, departamento: relation?.id_departamento || '', revisionDepartamento: relation?.revision || 0 })
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
                  <td colSpan={(canManage ? 3 : 2) + (manageDepartments ? 1 : 0)}>
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
