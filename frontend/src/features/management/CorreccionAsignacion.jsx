import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/management'
import { BookOpen, UserCheck, AlertTriangle } from 'lucide-react'

export default function CorreccionAsignacion({ id, periodId, onSaved, onClose }) {
  const [context, setContext] = useState(null),
    [hours, setHours] = useState(''),
    [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [failed, setFailed] = useState(false)
  const [accepted, setAccepted] = useState(false),
    [attempt, setAttempt] = useState(0)
  const [allowMultiple, setAllowMultiple] = useState(false)
  const generation = useRef(0)

  useEffect(() => {
    const c = new AbortController(),
      current = ++generation.current
    setLoading(true)
    setContext(null)
    setError('')
    setFailed(false)
    setAccepted(false)
    setBusy(false)
    api('/asignacion-academica/correccion', {
      method: 'POST',
      data: { id, id_periodo: periodId },
      signal: c.signal,
    })
      .then(data => {
        if (current !== generation.current) return
        setContext(data)
        setHours(String(data.asignacion.horas_semestre))
        setTeachers(data.asignacion.docentes)
        setAllowMultiple(data.asignacion.docentes.length > 1)
      })
      .catch(e => {
        if (current === generation.current) setError(e.message)
      })
      .finally(() => {
        if (current === generation.current) setLoading(false)
      })
    return () => {
      c.abort()
      generation.current++
    }
  }, [id, periodId, attempt])

  const names = ids =>
    ids.map(id => context?.disponibles.find(d => d.id === id)?.nombre || `Registro ${id}`).join(', ')

  const changed =
    context &&
    (Number(hours) !== context.asignacion.horas_semestre ||
      [...teachers].sort().join(',') !== [...context.asignacion.docentes].sort().join(','))

  const valid = /^\d+$/.test(hours) && Number(hours) <= 10000 && teachers.length > 0

  const toggle = id => {
    setAccepted(false)
    setTeachers(current => {
      if (current.includes(id)) {
        return current.filter(t => t !== id)
      }
      if (allowMultiple) {
        return [...current, id]
      }
      return [id]
    })
  }

  async function save(e) {
    e.preventDefault()
    if (!valid || !changed || !accepted || busy || failed) return
    const current = generation.current
    setBusy(true)
    setError('')
    try {
      await api('/asignacion-academica/correccion', {
        method: 'PATCH',
        data: {
          id,
          id_periodo: periodId,
          revision: context.asignacion.revision,
          horas_semestre: Number(hours),
          docentes: teachers,
        },
      })
      if (current === generation.current) onSaved()
    } catch (e) {
      if (current === generation.current) {
        setError(`${e.message} Recarga la asignación antes de volver a guardar.`)
        setFailed(true)
        setAccepted(false)
      }
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  return (
    <section aria-label="Corregir asignación" style={{ minWidth: 0 }}>
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '24px 0', color: '#64748B' }}>
          <p role="status" style={{ margin: 0 }}>Cargando datos para corregir…</p>
        </div>
      )}

      {error && (
        <p role="alert" className="error" style={{ marginBottom: '16px' }}>
          {error}
        </p>
      )}

      {context && !loading && (
        <form onSubmit={save}>
          {/* Tarjeta de Encabezado Informativo */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color="var(--primary-indigo)" />
                <strong style={{ fontSize: '15px', color: '#1E293B' }}>
                  {context.asignacion.asignatura}
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-pill active" style={{ fontSize: '12px', padding: '2px 8px' }}>
                  Año {context.asignacion.ano_estudio}
                </span>
                <span className="status-pill purple" style={{ fontSize: '12px', padding: '2px 8px' }}>
                  {context.asignacion.turno}
                </span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B', lineHeight: '1.4' }}>
              Corrige los docentes asociados o la carga total del semestre. La carrera, el año y el turno se conservan.
            </p>
          </div>

          <fieldset disabled={busy || failed} style={{ border: 0, padding: 0, margin: 0 }}>
            {/* Campo: Horas totales */}
            <div style={{ marginBottom: '18px' }}>
              <label>
                Horas totales del semestre a corregir
                <input
                  type="number"
                  min="0"
                  max="10000"
                  step="1"
                  required
                  value={hours}
                  onChange={e => {
                    setHours(e.target.value)
                    setAccepted(false)
                  }}
                  style={{
                    maxWidth: '160px',
                    height: '40px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginTop: '6px',
                  }}
                />
              </label>
              <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                Son horas del semestre, por ejemplo 42 o 56. No se convierten automáticamente en sesiones semanales.
              </p>
            </div>

            {/* Campo: Docentes */}
            <fieldset style={{ border: 0, padding: 0, margin: '0 0 18px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <legend style={{ fontWeight: 700, fontSize: '13.5px', color: '#1E293B', marginBottom: 0 }}>
                  Docentes de la asignatura
                </legend>
                <label
                  className="check-label"
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#475569',
                    cursor: 'pointer',
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allowMultiple}
                    onChange={e => {
                      setAllowMultiple(e.target.checked)
                      if (!e.target.checked && teachers.length > 1) {
                        setTeachers(teachers.slice(0, 1))
                      }
                    }}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--primary-indigo)', margin: 0 }}
                  />
                  <span>Permitir múltiples docentes (co-docencia)</span>
                </label>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748B' }}>
                {allowMultiple
                  ? 'Marca los docentes que participarán conjuntamente en la asignatura.'
                  : 'Selecciona el docente responsable. Al hacer clic en otro docente, se cambiará automáticamente.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {context.disponibles.map(d => {
                  const isChecked = teachers.includes(d.id)
                  const isDisabled = !d.activo && !isChecked
                  return (
                    <label
                      key={d.id}
                      className="check-label teacher-select-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: isChecked ? '1.5px solid var(--primary-indigo)' : '1px solid #E2E8F0',
                        background: isChecked ? 'rgba(48, 44, 145, 0.05)' : '#FFFFFF',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.6 : 1,
                        transition: 'all 0.15s ease',
                        margin: 0,
                        fontSize: '13.5px',
                        fontWeight: 600,
                        color: '#1E293B',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => toggle(d.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: 'var(--primary-indigo)',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          margin: '0 10px 0 0',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1 }}>
                        {d.nombre}
                        {context.disponibles.filter(other => other.nombre === d.nombre).length > 1 ? ` · Registro académico ${d.id}` : ''}
                        {!d.activo ? ' (cuenta inactiva; retíralo para guardar)' : ''}
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            {/* Resumen de Cambios y Confirmación */}
            {changed && (
              <div
                style={{
                  background: '#FFFBEB',
                  border: '1px solid #FCD34D',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginTop: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <AlertTriangle size={15} color="#B45309" />
                  <strong style={{ fontSize: '13px', color: '#92400E' }}>
                    Resumen de cambios a aplicar
                  </strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px', color: '#78350F' }}>
                  <div>
                    <strong>Horas:</strong> {context.asignacion.horas_semestre} → <strong>{hours || 'sin indicar'}</strong>
                  </div>
                  <div>
                    <strong>Docentes actuales:</strong> {names(context.asignacion.docentes)}
                  </div>
                  <div>
                    <strong>Docentes después de guardar:</strong> <strong>{names(teachers) || 'ninguno'}</strong>
                  </div>
                </div>
                <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(251, 191, 36, 0.4)' }}>
                  <label
                    className="check-label"
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#92400E',
                      margin: 0,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={e => setAccepted(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--primary-indigo)', margin: '0 8px 0 0', flexShrink: 0 }}
                    />
                    Revisé los cambios y confirmo esta corrección.
                  </label>
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div
              className="form-actions"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                marginTop: '18px',
                paddingTop: '14px',
                borderTop: '1px solid #E2E8F0',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="secondary"
                disabled={busy || loading}
                onClick={() => setAttempt(n => n + 1)}
                style={{ fontSize: '13px', padding: '6px 14px' }}
              >
                Recargar asignación
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={onClose}
                  style={{ fontSize: '13px', padding: '6px 14px' }}
                >
                  Cerrar corrección
                </button>
                <button
                  className="primary"
                  disabled={!valid || !changed || !accepted || busy}
                  type="submit"
                  style={{ fontSize: '13px', padding: '6px 16px' }}
                >
                  {busy ? 'Guardando corrección…' : 'Guardar corrección'}
                </button>
              </div>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  )
}
