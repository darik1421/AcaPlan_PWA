import { useEffect, useState, useRef } from 'react'
import { api } from '../../services/management'
import { Plus, RefreshCw, Pencil, Clock, Search, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import Modal from '../../components/Modal'

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
  const [search, setSearch] = useState('')
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
      if (!signal?.aborted && current === generation.current) {
        setLoading(false)
        setBusy(false)
      }
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

  const semesterRows = rows.filter(r => r.id_periodo === period)
  const visible = semesterRows.filter(
    r =>
      docentes
        .find(d => d.origen === r.origen && d.id_docente === r.id_docente)
        ?.nombre.toLocaleLowerCase('es')
        .includes(search.trim().toLocaleLowerCase('es')) || !search.trim()
  )
  const key = (origen, id) => `${origen}:${id}`
  const name = (origen, id) =>
    docentes.find(d => d.origen === origen && d.id_docente === id)?.nombre ||
    'Docente pendiente de consulta'

  const activeRestrictionsCount = semesterRows.filter(r => r.activa).length
  const uniqueTeachersCount = new Set(semesterRows.map(r => `${r.origen}:${r.id_docente}`)).size

  return (
    <div style={{ marginTop: '8px' }}>
      {schemaVersion === 1 && (
        <p className="notice">
          Las restricciones existentes siguen disponibles. Falta aplicar en Supabase la conexión con
          docentes recibidos por Excel.
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

      {/* KPI Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="surface-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--primary-indigo)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Restricciones del Semestre</span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-ink)', marginTop: '4px' }}>
            {semesterRows.length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--status-active-text)' }}>({activeRestrictionsCount} activas)</span>
          </div>
        </div>
        <div className="surface-card" style={{ padding: '14px 18px', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Docentes con Bloqueos</span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-ink)', marginTop: '4px' }}>
            {uniqueTeachersCount} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>de {docentes.length} disponibles</span>
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <label className="filter-card" style={{ margin: 0, flex: '1 1 280px', maxWidth: '420px' }}>
          Buscar restricciones de un docente
          <input
            type="search"
            value={search}
            placeholder="Escribe el nombre del docente"
            onChange={e => setSearch(e.target.value)}
          />
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="secondary"
            disabled={busy || loading}
            onClick={() => {
              setForm(null)
              load()
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} aria-hidden="true" />
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
      </div>

      {reloadRequired && (
        <p className="notice">Recarga las restricciones antes de intentar otro guardado.</p>
      )}

      {/* Modal Dialog for Create & Edit */}
      <Modal
        isOpen={Boolean(form && editable && form.id_periodo === period)}
        onClose={() => setForm(null)}
        title={form?.id ? 'Corregir restricción' : 'Nueva restricción comunicada'}
        maxWidth={560}
      >
        {form && editable && form.id_periodo === period && (
          <form className="management-form" onSubmit={save} style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
            <fieldset disabled={busy || reloadRequired} style={{ border: 'none', padding: 0, margin: 0 }}>
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

                <div>
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
                  {/* Visual Day Pills for dynamic quick selection */}
                  <div className="day-pills-selector" aria-hidden="true">
                    {days.map(d => (
                      <button
                        key={d}
                        type="button"
                        className={`day-pill-btn ${form.dia === d ? 'selected' : ''}`}
                        onClick={() => setForm({ ...form, dia: d })}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
                </div>

                {/* Quick Presets */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Horarios habituales:</span>
                  <div className="time-presets">
                    {[
                      { label: '07:00 - 08:35 (Sesión 1 Matutino)', start: '07:00', end: '08:35' },
                      { label: '08:45 - 10:20 (Sesión 2 Matutino)', start: '08:45', end: '10:20' },
                      { label: '10:30 - 12:05 (Sesión 3 Matutino)', start: '10:30', end: '12:05' },
                      { label: '13:00 - 14:35 (Sesión 1 Vespertino)', start: '13:00', end: '14:35' },
                      { label: '14:45 - 16:20 (Sesión 2 Vespertino)', start: '14:45', end: '16:20' },
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        className="time-preset-chip"
                        onClick={() => setForm({ ...form, hora_inicio: p.start, hora_fin: p.end })}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

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

              {/* Exact summary text guaranteed for tests and clear user feedback */}
              {form.id_docente && form.hora_inicio && form.hora_fin && (
                <p className="notice" style={{ marginTop: '16px' }}>
                  {name(form.origen, form.id_docente)}{' '}
                  {form.activa ? 'no podrá dar clase' : 'dejará de tener esta restricción'} el {form.dia}{' '}
                  de {form.hora_inicio} a {form.hora_fin}.
                </p>
              )}

              <div className="form-actions" style={{ marginTop: '20px' }}>
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
      </Modal>

      {/* Main Table / List */}
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
                {visible.map(r => {
                  const teacherName = name(r.origen, r.id_docente)
                  const initials = teacherName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'DC'
                  return (
                    <tr key={key(r.origen, r.id_restriccion)}>
                      <td>
                        <div className="teacher-cell">
                          <div className="teacher-avatar-badge" aria-hidden="true">{initials}</div>
                          <div>
                            <strong>{teacherName}</strong>
                            <div>
                              <span className={`tag-origin ${r.origen === 'academico' ? 'excel' : ''}`}>
                                {r.origen === 'academico' ? 'Excel' : 'Sistema'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="day-badge">{r.dia}</span>
                      </td>
                      <td>
                        <span className="time-slot-badge">
                          <Clock size={13} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
                          {r.hora_inicio.slice(0, 5)}
                        </span>
                      </td>
                      <td>
                        <span className="time-slot-badge">
                          <Clock size={13} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
                          {r.hora_fin.slice(0, 5)}
                        </span>
                      </td>
                      <td>
                        <span className={r.activa ? 'status-pill active' : 'status-pill warning'}>
                          <span className="status-dot" aria-hidden="true">●</span>
                          <span>{r.activa ? 'Activa' : 'Retirada'}</span>
                        </span>
                      </td>
                      {editable && (
                        <td>
                          <button
                            className="secondary"
                            disabled={busy || reloadRequired || r.editable === false}
                            title={
                              r.editable === false
                                ? 'Esta restricción es de consulta; su modificación corresponde al departamento que la registró o a administración.'
                                : undefined
                            }
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
                            <span>Corregir restricción de {teacherName}</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
                {!visible.length && (
                  <tr>
                    <td colSpan={editable ? 6 : 5} style={{ textAlign: 'center', padding: '32px 16px' }}>
                      <div style={{ color: 'var(--text-muted)' }}>
                        {search.trim()
                          ? 'No hay restricciones que coincidan con ese docente.'
                          : 'No hay restricciones comunicadas en este semestre.'}
                      </div>
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
