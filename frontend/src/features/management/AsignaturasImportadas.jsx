import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/management'
import { RotateCw, Pencil, BookOpen } from 'lucide-react'

export default function AsignaturasImportadas({ context, canManage, onLinked }) {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')

  const generation = useRef(0)
  const scope = JSON.stringify([canManage, context?.isAdmin, context?.carreras])

  useEffect(() => {
    const c = new AbortController()
    generation.current++
    setForm(null)
    setLoading(true)
    setError('')
    setBusy(false)

    api('/asignaturas/importadas', { signal: c.signal })
      .then(data => {
        if (!c.signal.aborted) {
          setRows(data)
          onLinked?.(data.map(r => r.id_asignatura).filter(Boolean))
        }
      })
      .catch(e => {
        if (!c.signal.aborted) {
          setError(e.message)
          setRows([])
        }
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false)
      })

    return () => {
      c.abort()
      generation.current++
    }
  }, [attempt, scope, onLinked])

  const mayEdit = r =>
    canManage && (context?.isAdmin || context?.carreras?.includes(r.id_carrera))

  async function save(e) {
    e.preventDefault()
    if (busy || !form || !mayEdit(form)) return
    const current = generation.current
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/asignaturas/importadas', {
        method: 'PATCH',
        data: { id: form.id, nombre: form.nombre, huella: form.huella },
      })
      if (current === generation.current) {
        setMessage('Nombre de asignatura corregido.')
        setAttempt(n => n + 1)
      }
    } catch (err) {
      if (current === generation.current) {
        setError(`${err.message} Actualiza la lista antes de volver a corregir.`)
        setForm(null)
      }
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  const filtered = rows.filter(r =>
    [r.codigo, r.nombre, r.carrera]
      .join(' ')
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase())
  )

  return (
    <section className="surface-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <BookOpen size={20} color="#302C91" />
        <h3 className="card-title" style={{ margin: 0 }}>
          Asignaturas recibidas por Excel
        </h3>
      </div>
      <p className="muted" style={{ margin: '4px 0 16px 0', fontSize: '13.5px' }}>
        Este catálogo se completa con la entrega académica. Puedes corregir el nombre; el código y la carrera identifican la asignatura y se conservan. El año no se cambia desde esta corrección.
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

      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <div style={{ flex: '1', minWidth: '240px' }}>
          <label className="filter-card">
            <span>Buscar asignaturas importadas</span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Código, nombre o carrera…"
            />
          </label>
        </div>
        <button
          className="secondary"
          disabled={busy || loading}
          onClick={() => setAttempt(n => n + 1)}
          style={{ height: '48px', marginTop: 'auto' }}
        >
          <RotateCw size={15} aria-hidden="true" />
          <span>Actualizar asignaturas importadas</span>
        </button>
      </div>

      {form && (
        <form className="management-form" onSubmit={save} style={{ marginBottom: '20px' }}>
          <h4>
            Corregir {form.codigo} · {form.carrera}
          </h4>
          <fieldset disabled={busy}>
            <div className="form-grid">
              <label>
                Nombre de asignatura importada
                <input
                  required
                  maxLength={form.id_asignatura ? 100 : 150}
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="primary" type="submit">
                Guardar nombre
              </button>
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
        <p role="status">Consultando asignaturas importadas…</p>
      ) : error && rows.length === 0 ? null : (
        <div className="table-scroll">
          <table>
            <caption>Catálogo recibido por Excel</caption>
            <thead>
              <tr>
                <th>Código</th>
                <th>Asignatura</th>
                <th>Carrera</th>
                <th>Año</th>
                <th>Correcciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <span className="badge-code">{r.codigo}</span>
                  </td>
                  <td>
                    <strong>{r.nombre}</strong>
                  </td>
                  <td>{r.carrera}</td>
                  <td>Año {r.ano_estudio}</td>
                  <td>
                    {mayEdit(r) && (
                      <button
                        className="secondary"
                        disabled={busy}
                        onClick={() => {
                          setForm(r)
                          setMessage('')
                        }}
                      >
                        <Pencil size={13} aria-hidden="true" />
                        <span>Corregir nombre de {r.codigo}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5}>No hay asignaturas importadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
