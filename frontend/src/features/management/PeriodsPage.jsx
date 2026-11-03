import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import { Plus, RefreshCw, Pencil, Power } from 'lucide-react'

const empty = () => ({
  nombre: '',
  ano_lectivo: new Date().getFullYear(),
  fecha_inicio: '',
  fecha_fin: '',
})

export default function PeriodsPage({ canManage, onChanged }) {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load(signal) {
    setLoading(true)
    setLoadFailed(false)
    setError('')
    try {
      const data = await api('/periods', { signal })
      if (!signal?.aborted) setRows(data)
    } catch (e) {
      if (!signal?.aborted) {
        setError(e.message)
        setLoadFailed(true)
        setRows([])
        setForm(null)
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => c.abort()
  }, [])

  useEffect(() => {
    if (!canManage) {
      setForm(null)
      setMessage('')
    }
  }, [canManage])

  const field = (name, value) => setForm(current => ({ ...current, [name]: value }))

  async function save(event) {
    event.preventDefault()
    if (busy || loading || loadFailed || !canManage || !form) return
    if (form.fecha_inicio >= form.fecha_fin) {
      setError('La fecha inicial debe ser anterior a la final.')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/periods', { method: 'POST', data: form })
      setForm(null)
      setMessage('Semestre guardado.')
      await load()
      onChanged()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function activate(row) {
    if (
      busy ||
      loading ||
      loadFailed ||
      !canManage ||
      !window.confirm(
        row.es_activo
          ? `¿Desactivar «${row.nombre}»? No quedará ningún semestre activo.`
          : `¿Activar «${row.nombre}»? Sustituirá al semestre activo actual.`
      )
    )
      return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/periods/active', {
        method: 'POST',
        data: { id: row.id_periodo, active: !row.es_activo },
      })
      setMessage('Semestre activo actualizado.')
      await load()
      onChanged()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const activePeriod = rows.find(r => r.es_activo)

  return (
    <section className="management-page" aria-labelledby="periods-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Organización del período</span>
          <h2 id="periods-title">Semestres académicos</h2>
          <p className="muted">Fechas, estado y configuración de turnos para cada período.</p>
        </div>
        {canManage && (
          <button
            className="primary"
            aria-label="Nuevo semestre"
            disabled={busy || loading || loadFailed}
            onClick={() => {
              setForm(empty())
              setMessage('')
            }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Nuevo semestre</span>
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

      {form && canManage && (
        <form className="management-form" onSubmit={save}>
          <h3>{form.id ? 'Editar semestre' : 'Nuevo semestre'}</h3>
          <fieldset disabled={busy || loading || loadFailed}>
            <div className="form-grid">
              <label>
                Nombre
                <input
                  required
                  maxLength={50}
                  value={form.nombre}
                  onChange={e => field('nombre', e.target.value)}
                  placeholder="Ej. Primer semestre"
                />
              </label>
              <label>
                Año lectivo
                <input
                  type="number"
                  required
                  min={1900}
                  max={2200}
                  step={1}
                  value={form.ano_lectivo}
                  onChange={e => field('ano_lectivo', e.target.value)}
                />
              </label>
              <label>
                Fecha inicial
                <input
                  type="date"
                  required
                  value={form.fecha_inicio}
                  onChange={e => field('fecha_inicio', e.target.value)}
                />
              </label>
              <label>
                Fecha final
                <input
                  type="date"
                  required
                  min={form.fecha_inicio || undefined}
                  value={form.fecha_fin}
                  onChange={e => field('fecha_fin', e.target.value)}
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="primary" type="submit">
                {busy ? 'Guardando…' : 'Guardar semestre'}
              </button>
              <button className="secondary" type="button" onClick={() => setForm(null)}>
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <p className="muted" style={{ margin: 0, fontSize: '13.5px' }}>
          Activar otro semestre conserva los registros anteriores.
        </p>
        <button
          className="secondary"
          disabled={busy || loading}
          onClick={() => load()}
        >
          <RefreshCw size={14} aria-hidden="true" />
          <span>Actualizar lista</span>
        </button>
      </div>

      <div className="two-column-layout">
        {/* Columna Izquierda: Tabla de semestres */}
        <div>
          {loading ? (
            <p role="status">Cargando semestres…</p>
          ) : loadFailed ? (
            <p className="notice">
              No se pudo cargar la lista. Pulsa «Actualizar lista» para volver a intentarlo.
            </p>
          ) : (
            <div className="table-scroll">
              <table>
                <caption>Períodos registrados · {rows.length} semestres</caption>
                <thead>
                  <tr>
                    <th>Semestre</th>
                    <th>Fechas</th>
                    <th>Estado</th>
                    {canManage && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id_periodo}>
                      <td>
                        <strong>{row.nombre}</strong>
                        <span className="cell-detail">Año lectivo {row.ano_lectivo}</span>
                      </td>
                      <td>
                        {row.fecha_inicio}
                        <span className="cell-detail">al {row.fecha_fin}</span>
                      </td>
                      <td>
                        <span className={row.es_activo ? 'status-pill active' : 'status-pill warning'}>
                          <span className="status-dot" aria-hidden="true">●</span>
                          <span>{row.es_activo ? 'Activo' : 'Inactivo'}</span>
                        </span>
                      </td>
                      {canManage && (
                        <td>
                          <div className="row-actions">
                            <button
                              className="secondary"
                              disabled={busy || loading || loadFailed}
                              aria-label={`Editar ${row.nombre}`}
                              onClick={() => {
                                setForm({ ...row, id: row.id_periodo })
                                setMessage('')
                              }}
                            >
                              <Pencil size={13} aria-hidden="true" />
                              <span>Editar</span>
                            </button>
                            <button
                              className="secondary"
                              disabled={busy || loading || loadFailed}
                              aria-label={`${row.es_activo ? 'Desactivar' : 'Activar'} ${row.nombre}`}
                              onClick={() => activate(row)}
                            >
                              <Power size={13} aria-hidden="true" />
                              <span>{row.es_activo ? 'Desactivar' : 'Activar'}</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={canManage ? 4 : 3}>
                        Aún no hay semestres académicos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Columna Derecha: Tarjeta de turnos del semestre activo (Figma semestres_233_2614) */}
        <aside className="side-panel-card">
          <h3 className="card-title">Turnos del semestre activo</h3>
          <p className="card-subtitle">
            {activePeriod ? 'Configuración de turnos para el ciclo activo' : 'Sin semestre activo'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '14px', color: '#1B2C48' }}>Matutino</strong>
                <span className="status-pill active" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  <span className="status-dot" aria-hidden="true">●</span> Configurado
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#637086' }}>
                Bloques de 45 min · sesión de 90 min
              </span>
            </div>

            <div style={{ paddingBottom: '12px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '14px', color: '#1B2C48' }}>Vespertino</strong>
                <span className="status-pill active" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  <span className="status-dot" aria-hidden="true">●</span> Configurado
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#637086' }}>
                Bloques de 45 min · sesión de 90 min
              </span>
            </div>

            <div style={{ paddingBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '14px', color: '#1B2C48' }}>Nocturno</strong>
                <span className="status-pill warning" style={{ fontSize: '11px', padding: '2px 8px' }}>
                  <span className="status-dot" aria-hidden="true">●</span> Revisar
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#637086' }}>
                Bloques de 60 min · sin receso
              </span>
            </div>

            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '12.5px', color: '#637086', display: 'block', marginBottom: '12px' }}>
                Los tiempos y cuadrículas se definen por turno en la sección institucional.
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
