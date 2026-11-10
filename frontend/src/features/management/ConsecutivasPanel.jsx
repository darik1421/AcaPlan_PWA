import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/management'
import { Plus, RefreshCw, Pencil, Link2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Modal from '../../components/Modal'

export default function ConsecutivasPanel({ context }) {
  const period = context?.activePeriod?.id_periodo,
    editable = Boolean(context?.canManageDisponibilidad)
  const [data, setData] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  const generation = useRef(0)

  useEffect(() => {
    const c = new AbortController()
    generation.current++
    setData(null)
    setForm(null)
    setError('')
    setBusy(false)
    if (period)
      api('/restricciones/consecutivas/contexto', {
        method: 'POST',
        data: { id_periodo: period },
        signal: c.signal,
      })
        .then(value => {
          if (!c.signal.aborted) {
            if (
              !Array.isArray(value?.asignaturas) ||
              !Array.isArray(value?.reglas) ||
              typeof value?.huella !== 'string'
            )
              throw new Error('Respuesta incompleta de clases consecutivas. Recarga los datos.')
            setData(value)
          }
        })
        .catch(e => {
          if (!c.signal.aborted) setError(e.message)
        })
    return () => {
      c.abort()
      generation.current++
    }
  }, [period, editable, attempt])

  useEffect(() => setMessage(''), [period, editable])

  const name = id => {
    const s = data?.asignaturas.find(a => a.id === id)
    return s ? `${s.codigo} · ${s.nombre}` : 'Componente no disponible'
  }

  const first = data?.asignaturas.find(a => a.id === Number(form?.asignacion_a))
  const candidates =
    data?.asignaturas.filter(
      a =>
        a.estado_carrera === 'activo' &&
        (!first ||
          (a.id_carrera === first.id_carrera &&
            a.ano_estudio === first.ano_estudio &&
            a.turno === first.turno))
    ) || []

  async function save(e) {
    e.preventDefault()
    if (busy || !editable || !data || !form || !form.confirmada) return
    const current = generation.current
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const { confirmada: _confirmada, ...values } = form
      await api('/restricciones/consecutivas', {
        method: 'POST',
        data: {
          ...values,
          id_periodo: period,
          huella: data.huella,
          asignacion_a: Number(form.asignacion_a),
          asignacion_b: Number(form.asignacion_b),
        },
      })
      if (current === generation.current) {
        setMessage('Regla guardada. Se tendrá que comprobar al revisar una propuesta de horario.')
        setAttempt(n => n + 1)
      }
    } catch (e) {
      if (current === generation.current) {
        setError(`${e.message} Recarga antes de volver a guardar.`)
        setData(null)
        setForm(null)
      }
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  const activeRulesCount = data?.reglas.filter(r => r.activa).length || 0

  return (
    <section aria-labelledby="consecutive-title" style={{ marginTop: '8px' }}>
      <h3 id="consecutive-title" style={{ display: 'none' }}>Clases consecutivas</h3>

      <p style={{ color: 'var(--text-ink)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
        Los directores de departamento registran las solicitudes autorizadas para unir dos sesiones del
        mismo año de carrera. Pueden ser del mismo componente curricular o de dos distintos, en cualquier orden.
        Se permite el receso oficial entre ellas, pero no otra clase ni tiempo libre adicional.
      </p>

      <div className="banner-notice" style={{ margin: '12px 0 18px 0' }}>
        Cada regla solicita una pareja de sesiones durante la semana. No aumenta ni cambia la duración de las
        clases. Guardarla no mueve clases existentes. La revisión del borrador comprueba que se cumpla antes
        de aprobar o publicar.
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

      {/* KPI Stats Bar */}
      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div className="surface-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--primary-indigo)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reglas de Consecutividad</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-ink)', marginTop: '4px' }}>
              {data.reglas.length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--status-active-text)' }}>({activeRulesCount} activas)</span>
            </div>
          </div>
          <div className="surface-card" style={{ padding: '14px 18px', borderLeft: '4px solid #3b82f6' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Componentes Disponibles</span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-ink)', marginTop: '4px' }}>
              {data.asignaturas.filter(a => a.estado_carrera === 'activo').length}
            </div>
          </div>
        </div>
      )}

      {/* Action Row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {period && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => setAttempt(n => n + 1)}
          >
            <RefreshCw size={14} className={busy ? 'spin' : ''} aria-hidden="true" />
            <span>Recargar clases consecutivas</span>
          </button>
        )}

        {period && editable && data && (
          <button
            className="primary"
            disabled={busy || !!form || !data.asignaturas.some(a => a.estado_carrera === 'activo')}
            onClick={() => {
              setMessage('')
              setForm({
                asignacion_a: '',
                asignacion_b: '',
                motivo: '',
                activa: true,
                confirmada: false,
              })
            }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Registrar clases consecutivas</span>
          </button>
        )}
      </div>

      {period && !data && !error && (
        <p role="status">Consultando reglas de clases consecutivas…</p>
      )}

      {/* Modal Dialog for Consecutivas */}
      <Modal
        isOpen={Boolean(form && data)}
        onClose={() => setForm(null)}
        title={form?.id ? `Corregir regla consecutiva #${form.id}` : 'Registrar clases consecutivas'}
        maxWidth={600}
      >
        {form && data && (
          <form className="management-form" onSubmit={save} style={{ margin: 0, padding: 0, border: 'none', background: 'transparent' }}>
            <fieldset disabled={busy} style={{ border: 'none', padding: 0, margin: 0 }}>
              <div className="form-grid">
                <label>
                  Primer componente curricular
                  <select
                    required
                    disabled={!!form.id}
                    value={form.asignacion_a}
                    onChange={e =>
                      setForm({
                        ...form,
                        asignacion_a: e.target.value,
                        asignacion_b: '',
                        confirmada: false,
                      })
                    }
                  >
                    <option value="">Selecciona carrera, año y componente</option>
                    {data.asignaturas
                      .filter(a => a.estado_carrera === 'activo' || a.id === Number(form.asignacion_a))
                      .map(a => (
                        <option key={a.id} value={a.id}>
                          {a.carrera} · Año {a.ano_estudio} · {name(a.id)}
                        </option>
                      ))}
                  </select>
                </label>

                {/* Visual Pairing Flow Box */}
                {first && (
                  <div className="consecutive-pairing-box" aria-hidden="true">
                    <div className="pairing-subject-card">
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Sesión A</div>
                      <div style={{ fontWeight: 700, color: 'var(--primary-indigo)' }}>{first.codigo}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-ink)' }}>{first.nombre}</div>
                    </div>
                    <div className="pairing-connector">
                      <Link2 size={16} />
                      <span>Seguidas</span>
                    </div>
                    <div className="pairing-subject-card">
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Sesión B</div>
                      <div style={{ fontWeight: 700, color: form.asignacion_b ? 'var(--primary-indigo)' : 'var(--text-muted)' }}>
                        {form.asignacion_b
                          ? (data?.asignaturas.find(a => a.id === Number(form.asignacion_b))?.codigo || 'Misma')
                          : 'Pendiente'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-ink)' }}>
                        {form.asignacion_b
                          ? (form.asignacion_a === form.asignacion_b
                              ? 'Segunda sesión del mismo componente curricular'
                              : data?.asignaturas.find(a => a.id === Number(form.asignacion_b))?.nombre)
                          : 'Selecciona la segunda sesión'}
                      </div>
                    </div>
                  </div>
                )}

                <label>
                  Segundo componente curricular
                  <select
                    required
                    disabled={!!form.id || !first}
                    value={form.asignacion_b}
                    onChange={e => setForm({ ...form, asignacion_b: e.target.value, confirmada: false })}
                  >
                    <option value="">Selecciona la otra sesión</option>
                    {(form.id
                      ? data.asignaturas.filter(a => a.id === Number(form.asignacion_b))
                      : candidates
                    ).map(a => (
                      <option key={a.id} value={a.id}>
                        {a.id === Number(form.asignacion_a)
                          ? `Otra sesión de ${name(a.id)}`
                          : name(a.id)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Motivo de la solicitud autorizada
                  <textarea
                    required
                    maxLength={500}
                    rows={3}
                    placeholder="Describe la justificación pedagógica u operativa (ej: bloques de prácticas integradas, laboratorio de 4 horas continuas)..."
                    value={form.motivo}
                    onChange={e => setForm({ ...form, motivo: e.target.value, confirmada: false })}
                  />
                </label>

                {form.id && (
                  <label>
                    Estado de la regla
                    <select
                      value={String(form.activa)}
                      onChange={e =>
                        setForm({ ...form, activa: e.target.value === 'true', confirmada: false })
                      }
                    >
                      <option value="true">Activa</option>
                      <option value="false">Retirada</option>
                    </select>
                  </label>
                )}
              </div>

              {/* Confirmation Checkbox Callout */}
              <div className="confirm-checkbox-box">
                <label>
                  <input
                    type="checkbox"
                    checked={form.confirmada}
                    onChange={e => setForm({ ...form, confirmada: e.target.checked })}
                  />
                  <span>Confirmo que esta regla fue autorizada.</span>
                </label>
              </div>

              <div className="form-actions" style={{ marginTop: '16px' }}>
                <button className="primary" disabled={!form.confirmada}>
                  Guardar regla consecutiva
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setForm(null)}
                >
                  Cancelar regla consecutiva
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </Modal>

      {/* Main Table */}
      {data && (
        <div className="table-scroll">
          <table>
            <caption>Parejas de sesiones solicitadas en el semestre</caption>
            <thead>
              <tr>
                <th>Carrera y año</th>
                <th>Sesiones que deben ir juntas</th>
                <th>Motivo</th>
                <th>Estado</th>
                {editable && <th>Corregir</th>}
              </tr>
            </thead>
            <tbody>
              {data.reglas.map(r => {
                const a = data.asignaturas.find(a => a.id === r.asignacion_a)
                return (
                  <tr key={r.id}>
                    <td>
                      <div>
                        <strong>{a?.carrera}</strong>
                        <div style={{ marginTop: '2px' }}>
                          <span className="day-badge">Año {a?.ano_estudio}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600 }}>{name(r.asignacion_a)}</span>
                        <span style={{ color: 'var(--primary-indigo)', fontWeight: 700 }}>+</span>
                        <span style={{ fontWeight: 600 }}>
                          {r.asignacion_a === r.asignacion_b
                            ? 'otra sesión del mismo componente'
                            : name(r.asignacion_b)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {r.motivo}
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
                          disabled={busy || !!form}
                          onClick={() => {
                            setForm({ ...r, confirmada: false })
                            setMessage('')
                          }}
                        >
                          <Pencil size={13} aria-hidden="true" />
                          <span>Corregir regla {r.id}</span>
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
              {!data.reglas.length && (
                <tr>
                  <td colSpan={editable ? 5 : 4} style={{ textAlign: 'center', padding: '32px 16px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                      No hay reglas de clases consecutivas registradas.
                    </div>
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
