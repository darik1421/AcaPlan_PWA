import { useEffect, useState, useRef } from 'react'
import { api } from '../../services/management'
import { Plus, RefreshCw, Pencil } from 'lucide-react'

const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

export default function RestriccionesPanel({ context }) {
  const period = context?.activePeriod?.id_periodo,
    editable = Boolean(context?.canManageDisponibilidad)
  const [docentes, setDocentes] = useState([])
  const [schemaVersion, setSchemaVersion] = useState(0)
  const generation = useRef(0)
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reloadRequired, setReloadRequired] = useState(false)

  async function load(signal) {
    const current = ++generation.current
    setLoading(true)
    setError('')
    try {
      const data = await api('/restricciones/unificadas', { signal })
      if (!signal?.aborted && current === generation.current) {
        if (!Array.isArray(data.docentes) || !Array.isArray(data.restricciones))
          throw new Error('Respuesta incompleta de restricciones.')
        setRows(data.restricciones)
        setDocentes(data.docentes)
        setSchemaVersion(data.version)
        setReloadRequired(false)
      }
    } catch (e) {
      if (!signal?.aborted && current === generation.current) {
        setError(e.message)
        setReloadRequired(true)
      }
    } finally {
      if (!signal?.aborted && current === generation.current) setLoading(false)
    }
  }

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => {
      c.abort()
      generation.current++
    }
  }, [period, editable])

  useEffect(() => {
    setForm(null)
    setMessage('')
  }, [period, editable])

  async function save(e) {
    e.preventDefault()
    if (busy || reloadRequired || !editable || !form || form.id_periodo !== period) return
    const current = generation.current
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/restricciones/unificadas', { method: 'POST', data: form })
      if (current === generation.current) {
        setForm(null)
        setMessage('Restricción guardada.')
        await load()
      }
    } catch (e) {
      if (current === generation.current) {
        setError(e.message)
        setReloadRequired(true)
      }
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  const visible = rows.filter(r => r.id_periodo === period)
  const key = (origen, id) => `${origen}:${id}`
  const name = (origen, id) =>
    docentes.find(d => d.origen === origen && d.id_docente === id)?.nombre ||
    'Docente pendiente de consulta'

  return (
    <div style={{ marginTop: '16px' }}>
      <p className="muted" style={{ fontSize: '13.5px', marginBottom: '16px' }}>
        Los jefes de departamento registran los intervalos autorizados en los que un docente no
        puede impartir clases. Los coordinadores pueden consultarlos. Sin restricciones comunicadas
        no hay bloqueo por disponibilidad.
      </p>

      {schemaVersion === 1 && (
        <p className="notice">
          Las restricciones existentes siguen disponibles. Falta aplicar en Supabase la conexión con
          docentes recibidos por Excel.
        </p>
      )}
      {schemaVersion === 2 && (
        <p className="muted" style={{ fontSize: '13px', marginBottom: '16px' }}>
          La lista incluye docentes recibidos por Excel aunque no tengan una cuenta. Los que ya están
          vinculados a un docente existente utilizan ese registro.
        </p>
      )}

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
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <button
          className="secondary"
          disabled={busy || loading}
          onClick={() => {
            setForm(null)
            load()
          }}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Recargar restricciones</span>
        </button>

        {period && editable && (
          <button
            className="primary"
            aria-label="Registrar restricción"
            disabled={busy || loading || reloadRequired || !docentes.some(d => d.estado === 'activo')}
            onClick={() => {
              setMessage('')
              setForm({
                id_periodo: period,
                origen: '',
                id_docente: '',
                dia: 'Lunes',
                hora_inicio: '',
                hora_fin: '',
                activa: true,
              })
            }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Registrar restricción</span>
          </button>
        )}
      </div>

      {reloadRequired && (
        <p className="notice">Recarga las restricciones antes de intentar otro guardado.</p>
      )}

      {form && editable && form.id_periodo === period && (
        <form className="management-form" onSubmit={save}>
          <h3>{form.id ? 'Corregir restricción' : 'Nueva restricción comunicada'}</h3>
          <fieldset disabled={busy || reloadRequired}>
            <div className="form-grid">
              <label>
                Docente de la restricción
                <select
                  required
                  disabled={Boolean(form.id)}
                  value={form.id_docente ? key(form.origen, form.id_docente) : ''}
                  onChange={e => {
                    const selected = docentes.find(
                      d => key(d.origen, d.id_docente) === e.target.value
                    )
                    setForm({
                      ...form,
                      origen: selected?.origen || '',
                      id_docente: selected?.id_docente || '',
                    })
                  }}
                >
                  <option value="">Selecciona un docente</option>
                  {docentes
                    .filter(
                      d =>
                        d.estado === 'activo' ||
                        key(d.origen, d.id_docente) === key(form.origen, form.id_docente)
                    )
                    .map(d => (
                      <option key={key(d.origen, d.id_docente)} value={key(d.origen, d.id_docente)}>
                        {d.nombre} · {d.origen === 'academico' ? 'Recibido por Excel' : 'Registro existente'}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Día no disponible
                <select
                  value={form.dia}
                  onChange={e => setForm({ ...form, dia: e.target.value })}
                >
                  {days.map(d => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>

              <label>
                Desde
                <input
                  type="time"
                  required
                  value={form.hora_inicio}
                  onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
                />
              </label>

              <label>
                Hasta
                <input
                  type="time"
                  required
                  value={form.hora_fin}
                  onChange={e => setForm({ ...form, hora_fin: e.target.value })}
                />
              </label>

              {form.id && (
                <label>
                  Estado de la restricción
                  <select
                    value={String(form.activa)}
                    onChange={e => setForm({ ...form, activa: e.target.value === 'true' })}
                  >
                    <option value="true">Activa</option>
                    <option value="false">Retirada</option>
                  </select>
                </label>
              )}
            </div>

            <div className="form-actions">
              <button className="primary" type="submit">
                Guardar restricción
              </button>
              <button className="secondary" type="button" onClick={() => setForm(null)}>
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}

      {loading ? (
        <p role="status">Cargando restricciones…</p>
      ) : (
        !error &&
        period && (
          <div className="table-scroll">
            <table>
              <caption>Restricciones comunicadas del semestre</caption>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Día</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Estado</th>
                  {editable && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map(r => (
                  <tr key={key(r.origen, r.id_restriccion)}>
                    <td>
                      <strong>{name(r.origen, r.id_docente)}</strong>
                    </td>
                    <td>{r.dia}</td>
                    <td>{r.hora_inicio.slice(0, 5)}</td>
                    <td>{r.hora_fin.slice(0, 5)}</td>
                    <td>
                      <span
                        className={
                          r.activa ? 'status-pill active' : 'status-pill warning'
                        }
                      >
                        <span className="status-dot" aria-hidden="true">●</span>
                        <span>{r.activa ? 'Activa' : 'Retirada'}</span>
                      </span>
                    </td>
                    {editable && (
                      <td>
                        <button
                          className="secondary"
                          disabled={busy || reloadRequired}
                          onClick={() => {
                            setMessage('')
                            setForm({
                              id: r.id_restriccion,
                              origen: r.origen,
                              id_docente: r.id_docente,
                              id_periodo: r.id_periodo,
                              dia: r.dia,
                              hora_inicio: r.hora_inicio.slice(0, 5),
                              hora_fin: r.hora_fin.slice(0, 5),
                              activa: r.activa,
                              version: r.version,
                            })
                          }}
                        >
                          <Pencil size={13} aria-hidden="true" />
                          <span>Corregir restricción de {name(r.origen, r.id_docente)}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {!visible.length && (
                  <tr>
                    <td colSpan={editable ? 6 : 5}>
                      No hay restricciones comunicadas en este semestre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}
