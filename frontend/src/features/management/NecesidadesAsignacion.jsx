import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/management'
import { BookOpen, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function NecesidadesAsignacion({ id, periodId, onSaved, onClose }) {
  const [data, setData] = useState(null),
    [type, setType] = useState(''),
    [accepted, setAccepted] = useState(false)
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0)
  const generation = useRef(0)

  useEffect(() => {
    const c = new AbortController(),
      current = ++generation.current
    setData(null)
    setError('')
    setLoading(true)
    setBusy(false)
    setFailed(false)
    setAccepted(false)
    api('/asignacion-academica/necesidades', {
      method: 'POST',
      data: { id, id_periodo: periodId },
      signal: c.signal,
    })
      .then(result => {
        if (current === generation.current) {
          setData(result)
          setType(result.tipo_espacio ?? '')
        }
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

  const changed = data && (!data.definidas || type !== (data.tipo_espacio ?? ''))

  async function save(e) {
    e.preventDefault()
    if (!data || busy || failed || !accepted || !changed) return
    const current = generation.current
    setBusy(true)
    setError('')
    try {
      await api('/asignacion-academica/necesidades', {
        method: 'PATCH',
        data: {
          id,
          id_periodo: periodId,
          revision: data.asignacion.revision,
          tipo_espacio: type || null,
        },
      })
      if (current === generation.current) onSaved()
    } catch (e) {
      if (current === generation.current) {
        setError(`${e.message} Recarga las necesidades antes de guardar otra vez.`)
        setFailed(true)
        setAccepted(false)
      }
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  return (
    <section aria-label="Necesidades de aula" style={{ minWidth: 0 }}>
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '24px 0', color: '#64748B' }}>
          <p role="status" style={{ margin: 0 }}>Consultando necesidades…</p>
        </div>
      )}

      {error && (
        <p role="alert" className="error" style={{ marginBottom: '16px' }}>
          {error}
        </p>
      )}

      {data && !loading && (
        <form onSubmit={save}>
          {/* Header Card */}
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
                <Building2 size={16} color="var(--primary-indigo)" />
                <strong style={{ fontSize: '15px', color: '#1E293B' }}>
                  {data.asignacion.codigo} · {data.asignacion.nombre}
                </strong>
              </div>
              <span className="status-pill active" style={{ fontSize: '12px', padding: '2px 8px' }}>
                Año {data.asignacion.ano_estudio}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#64748B', lineHeight: '1.4' }}>
              El coordinador indica qué tipo de aula necesita esta asignatura. El generador utiliza esta información al distribuir las clases.
            </p>
            <div style={{ marginTop: '4px' }}>
              <span className={data.definidas ? 'status-pill active' : 'status-pill warning'} style={{ fontSize: '12px', padding: '2px 8px' }}>
                <span className="status-dot" aria-hidden="true">●</span>
                <span>{data.definidas ? 'El coordinador ya revisó estas necesidades.' : 'Necesidades pendientes de revisión. No se asumirá que cualquier aula sirve.'}</span>
              </span>
            </div>
          </div>

          <fieldset disabled={busy || failed} style={{ border: 0, padding: 0, margin: 0 }}>
            <div style={{ marginBottom: '18px' }}>
              <label>
                Tipo de espacio necesario
                <select
                  value={type}
                  onChange={e => {
                    setType(e.target.value)
                    setAccepted(false)
                  }}
                  style={{
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginTop: '6px',
                    maxWidth: '300px',
                    display: 'block',
                  }}
                >
                  <option value="">Sin preferencia de tipo</option>
                  {[...new Set([...data.tipos, ...(type ? [type] : [])])].map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <p className="muted" style={{ margin: '6px 0 0 0', fontSize: '12px' }}>
                Los tipos provienen del inventario. «Sin preferencia de tipo» permite cualquier tipo compatible con la capacidad exigida.
              </p>
            </div>

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
                    Cambio en tipo de espacio
                  </strong>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: '#78350F' }}>
                  Tipo anterior: {data.definidas ? data.tipo_espacio || 'Sin preferencia' : 'Pendiente'} → <strong>{type || 'Sin preferencia'}</strong>
                </p>
                <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(251, 191, 36, 0.4)' }}>
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
                    Revisé las necesidades de esta asignatura y confirmo estos datos.
                  </label>
                </div>
              </div>
            )}

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
                Recargar necesidades
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={onClose}
                  style={{ fontSize: '13px', padding: '6px 14px' }}
                >
                  Cerrar necesidades
                </button>
                <button
                  className="primary"
                  type="submit"
                  disabled={!changed || !accepted || busy}
                  style={{ fontSize: '13px', padding: '6px 16px' }}
                >
                  {busy ? 'Guardando necesidades…' : 'Guardar necesidades'}
                </button>
              </div>
            </div>
          </fieldset>
        </form>
      )}
    </section>
  )
}
