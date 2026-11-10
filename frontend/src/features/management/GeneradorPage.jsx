import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/management'
import { useDraftCycle } from './useDraftCycle'
import NuevaVersionBorrador from './NuevaVersionBorrador'
import Modal from '../../components/Modal'
import {
  Sparkles,
  Lock,
  Unlock,
  Pin,
  PinOff,
  RotateCw,
  AlertTriangle,
  Save,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react'

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

export default function GeneradorPage({
  context,
  periodId,
  onNavigateToDrafts,
  initialDraftId = null,
  onNavigateToRestrictions,
}) {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [list, setList] = useState(null)
  const [selectedDraft, setSelectedDraft] = useState('')
  const [department, setDepartment] = useState('')
  const [automaticDraft, setAutomaticDraft] = useState(null)
  const [modoProfundo, setModoProfundo] = useState(true)
  const [selectedDay, setSelectedDay] = useState('Todos')
  const [selectedSection, setSelectedSection] = useState('')
  const [lockedDays, setLockedDays] = useState([])
  const [result, setResult] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const generation = useRef(0)
  const cycle = useDraftCycle(selectedDraft, periodId)
  const editableDraft = Boolean(selectedDraft && cycle.data?.estado === 'borrador')
  const canGenerate = Boolean(
    context?.canManageBloques && list?.semestre_activo && (editableDraft || department)
  )
  const draft = list?.borradores.find(d => String(d.id) === selectedDraft)
  const sections = [
    ...new Map(
      (result?.clases || []).map(c => [
        c.id_seccion,
        { id_seccion: c.id_seccion, codigo: c.seccion_codigo },
      ])
    ).values(),
  ]

  useEffect(() => {
    const controller = new AbortController()
    generation.current++
    setList(null)
    setSelectedDraft('')
    setDepartment('')
    setAutomaticDraft(null)
    setResult(null)
    setLoading(Boolean(periodId))
    setBusy(false)
    setSavingDraft(false)
    setShowSaveModal(false)
    setError('')
    setMessage('')
    setLockedDays([])

    if (periodId) {
      api('/borradores/consultar', {
        method: 'POST',
        data: { id_periodo: periodId },
        signal: controller.signal,
      })
        .then(data => {
          if (controller.signal.aborted) return
          if (!Array.isArray(data?.borradores) || typeof data.semestre_activo !== 'boolean') {
            throw new Error('No se pudieron consultar los borradores. Vuelve a intentarlo.')
          }
          setList(data)
          if (data.borradores.some(d => String(d.id) === String(initialDraftId))) {
            setSelectedDraft(String(initialDraftId))
          }
        })
        .catch(e => {
          if (!controller.signal.aborted) setError(e.message)
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }
    return () => {
      controller.abort()
      generation.current++
    }
  }, [periodId, attempt, initialDraftId])

  function invalidate() {
    generation.current++
    setResult(null)
    setShowSaveModal(false)
    setError('')
    setMessage('')
    setSelectedSection('')
    setSelectedDay('Todos')
  }

  function toggleLockDay(day) {
    invalidate()
    setLockedDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]))
  }

  async function handleRunGenerator() {
    if (!canGenerate || busy || savingDraft || loading) return
    const current = ++generation.current
    const previas = result?.clases.map(c =>
      Object.fromEntries(
        ['id_asignacion', 'componente', 'numero_sesion', 'dia', 'hora_inicio', 'hora_fin'].map(
          k => [k, c[k]]
        )
      )
    )
    setBusy(true)
    setError('')
    setMessage('')
    setResult(null)
    setShowSaveModal(false)

    try {
      let targetId = Number(selectedDraft)
      let firstGeneration = automaticDraft === targetId
      if (!targetId) {
        const selectedDepartment = list.departamentos.find(d => String(d.id) === department)
        const careers = list.carreras
          .filter(c => String(c.id_departamento) === department)
          .map(c => c.id_carrera)
        if (!selectedDepartment || !careers.length) {
          throw new Error('Este departamento no tiene carreras disponibles para generar.')
        }
        const baseName = 'Borrador · ' + selectedDepartment.nombre
        const names = new Set(list.borradores.map(d => d.nombre.trim().toLocaleLowerCase('es')))
        let draftName = baseName,
          suffix = 2
        while (names.has(draftName.toLocaleLowerCase('es'))) draftName = baseName + ' (' + suffix++ + ')'
        const created = await api('/borradores', {
          method: 'POST',
          data: {
            id_periodo: periodId,
            id_departamento: Number(department),
            carreras: careers,
            nombre: draftName,
          },
        })
        if (current !== generation.current) return
        targetId = created.id
        firstGeneration = true
        setAutomaticDraft(targetId)
        setSelectedDraft(String(targetId))
        setList(prev => ({
          ...prev,
          borradores: [
            {
              id: targetId,
              id_departamento: Number(department),
              departamento: selectedDepartment.nombre,
              nombre: draftName,
            },
            ...prev.borradores,
          ],
        }))
      }

      const proposal = await api('/generador/proponer', {
        method: 'POST',
        data: {
          id: targetId,
          lockedDays,
          modoProfundo,
          ...(previas?.length ? { previas } : {}),
        },
      })
      if (current !== generation.current) return

      if (firstGeneration && proposal.listo_para_guardar) {
        const clases = proposal.clases.map(c =>
          Object.fromEntries(
            ['id', 'id_asignacion', 'componente', 'id_aula', 'dia', 'hora_inicio', 'hora_fin'].map(
              k => [k, c[k]]
            )
          )
        )
        const saved = await api('/generador/guardar', {
          method: 'POST',
          data: { id: targetId, huella: proposal.huella, clases },
        })
        if (current !== generation.current) return
        setAutomaticDraft(null)
        setDepartment('')
        setResult(null)
        setMessage(
          'Primer borrador generado y guardado con ' +
            saved.clases +
            ' clases. Ya está disponible para revisión; aún no está aprobado ni publicado.'
        )
        return
      }
      setResult(proposal)
      if (proposal.listo_para_guardar) setMessage(proposal.mensaje)
      else setError(proposal.mensaje)
    } catch (e) {
      if (current === generation.current) setError(e.message)
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  async function handleSaveDraft() {
    if (!canGenerate || busy || savingDraft || !result?.listo_para_guardar) return
    const current = generation.current
    setSavingDraft(true)
    setError('')
    try {
      const clases = result.clases.map(c =>
        Object.fromEntries(
          ['id', 'id_asignacion', 'componente', 'id_aula', 'dia', 'hora_inicio', 'hora_fin'].map(
            k => [k, c[k]]
          )
        )
      )
      const saved = await api('/generador/guardar', {
        method: 'POST',
        data: { id: Number(selectedDraft), huella: result.huella, clases },
      })
      if (current !== generation.current) return
      setMessage(
        'Se guardaron ' +
          saved.clases +
          ' clases en «' +
          draft.nombre +
          '». El horario sigue sin aprobar ni publicar.'
      )
      setResult(null)
      setShowSaveModal(false)
      onNavigateToDrafts?.(saved.id)
    } catch (e) {
      if (current === generation.current) {
        setError(e.message + ' Consulta el borrador antes de reintentar.')
        setResult(null)
        setShowSaveModal(false)
      }
    } finally {
      if (current === generation.current) setSavingDraft(false)
    }
  }

  // Filtrado de clases generadas para la visualización
  const displayedClasses = (result?.clases || []).filter(c => {
    if (selectedDay !== 'Todos' && c.dia !== selectedDay) return false
    if (selectedSection && String(c.id_seccion) !== String(selectedSection)) return false
    return true
  })

  // Agrupar por día para la cuadrícula
  const classesByDay = DAYS.reduce((acc, d) => {
    acc[d] = displayedClasses
      .filter(c => c.dia === d)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    return acc
  }, {})

  return (
    <section className="management-page" aria-labelledby="generador-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Inteligencia Artificial Institucional</span>
          <h2 id="generador-title">Generador de Horarios con IA</h2>
          <p className="muted">
            Generación automática por departamento mediante algoritmo de satisfacción de restricciones y optimización de huecos.
          </p>
          <p className="muted" style={{ fontSize: '13px', marginTop: '2px' }}>
            Respeta los horarios aprobados/publicados. Los borradores pendientes de otros departamentos todavía no reservan aulas ni docentes.
          </p>
        </div>
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

      {loading && (
        <div
          className="surface-card"
          aria-busy="true"
          style={{
            minHeight: 240,
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <div className="spinner" style={{ width: '28px', height: '28px' }} />
          <p role="status" style={{ fontWeight: 600, color: '#302C91', margin: 0 }}>
            Preparando generador…
          </p>
          <span className="muted" style={{ fontSize: '13px' }}>
            Consultando departamentos, carreras y asignaciones del semestre activo.
          </span>
        </div>
      )}

      {!loading && periodId && !list && (
        <div className="surface-card" style={{ marginBottom: 24, textAlign: 'center', padding: '32px' }}>
          <p className="muted" style={{ marginBottom: '16px' }}>No se pudo cargar la información de borradores.</p>
          <button className="secondary" onClick={() => setAttempt(n => n + 1)}>
            Volver a consultar borradores
          </button>
        </div>
      )}

      {!periodId && (
        <div className="banner-notice" style={{ marginBottom: 24 }}>
          <p className="notice" style={{ margin: 0 }}>Activa un semestre antes de generar.</p>
        </div>
      )}

      {message.startsWith('Primer borrador') && (
        <div style={{ marginBottom: 20 }}>
          <button className="primary" onClick={() => onNavigateToDrafts?.(Number(selectedDraft))}>
            Revisar borrador generado
          </button>
        </div>
      )}

      {/* Comprobación de la propuesta (Conflictos o Pendientes) */}
      {result?.revision && !result.listo_para_guardar && (
        <div
          className="surface-card"
          style={{
            marginBottom: 24,
            borderLeft: '4px solid #D97706',
            background: '#FFFBEB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="#D97706" />
            <h3 className="card-title" style={{ margin: 0, color: '#92400E' }}>
              Comprobación de la propuesta
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#78350F', margin: '0 0 12px 0' }}>
            La propuesta calculada presenta los siguientes avisos institucionales que impiden su guardado directo:
          </p>
          <ul style={{ paddingLeft: '20px', margin: 0, lineHeight: '1.8', color: '#92400E', fontSize: '13.5px' }}>
            {result.revision.conflictos.map((f, i) => (
              <li key={'c' + i}>
                <strong>Conflicto:</strong> {f.motivo}
              </li>
            ))}
            {result.revision.pendientes.map((f, i) => (
              <li key={'p' + i}>
                <strong>Pendiente:</strong> {f.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Barra de Acceso Rápido a Restricciones */}
      {!loading && list && onNavigateToRestrictions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={18} color="#302C91" />
            <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 500 }}>
              Se usarán las restricciones vigentes del semestre.
            </span>
          </div>
          <button
            className="secondary"
            disabled={busy || savingDraft}
            onClick={() => onNavigateToRestrictions(selectedDraft ? Number(selectedDraft) : null)}
            style={{ fontSize: '13px', padding: '6px 14px' }}
          >
            Revisar restricciones antes de generar
          </button>
        </div>
      )}

      {/* Tarjeta Principal de Configuración y Parámetros */}
      {!loading && (list || !periodId) && (
        <div className="surface-card" style={{ marginBottom: '24px' }}>
          {cycle.loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div className="spinner" style={{ width: '14px', height: '14px' }} />
              <p role="status" style={{ margin: 0, fontSize: '13px', color: '#637086' }}>
                Comprobando estado del borrador…
              </p>
            </div>
          )}

          {cycle.error && (
            <p role="alert" className="error" style={{ marginBottom: '16px' }}>
              {cycle.error}{' '}
              <button
                className="secondary"
                onClick={cycle.retry}
                style={{ marginLeft: '8px', padding: '4px 10px', fontSize: '12px' }}
              >
                Consultar estado nuevamente
              </button>
            </p>
          )}

          {selectedDraft && cycle.data?.estado === 'en_revision' && (
            <div className="banner-notice" style={{ marginBottom: '16px' }}>
              <p className="notice" style={{ margin: 0 }}>
                Este borrador está en revisión. Consulta su estado en Borradores antes de continuar.
              </p>
            </div>
          )}

          {selectedDraft && ['aprobado', 'publicado'].includes(cycle.data?.estado) && (
            <div className="banner-notice" style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '13.5px' }}>
                Este horario ya está <strong>{cycle.data.estado}</strong>. Prepara una nueva versión para reorganizarlo.
              </p>
              <NuevaVersionBorrador
                id={Number(selectedDraft)}
                revision={draft?.revision}
                version={cycle.data.version}
                disabled={busy || savingDraft || !draft?.revision}
                onCreated={id => onNavigateToDrafts?.(id)}
              />
            </div>
          )}

          {/* Encabezado de la Tarjeta */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid #E2E8F0',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#EFEEFA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={20} color="#302C91" />
              </div>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '17px' }}>
                  Generar horario
                </h3>
                <span className="muted" style={{ fontSize: '12.5px' }}>
                  Elige el departamento o borrador para iniciar la optimización
                </span>
              </div>
            </div>

            <span className={list?.semestre_activo ? 'status-pill active' : 'status-pill inactive'}>
              <span className="status-dot" aria-hidden="true">
                ●
              </span>
              <span>{list?.semestre_activo ? 'Semestre activo' : 'Sin semestre activo'}</span>
            </span>
          </div>

          {/* Selector de Departamento vs Borrador */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            {list?.departamentos?.length > 0 && (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '16px',
                  background: department ? '#F5F3FF' : '#F8FAFC',
                  border: department ? '1.5px solid #8B5CF6' : '1px solid #E2E8F0',
                  borderRadius: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <strong style={{ fontSize: '14px', color: '#1B2C48' }}>
                  Generar un nuevo horario
                </strong>
                <select
                  aria-label="Departamento para generar"
                  value={department}
                  disabled={loading || busy || savingDraft}
                  onChange={e => {
                    invalidate()
                    setDepartment(e.target.value)
                    setSelectedDraft('')
                    setAutomaticDraft(null)
                    setLockedDays([])
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    borderColor: department ? '#8B5CF6' : '#CBD5E1',
                  }}
                >
                  <option value="">Selecciona un departamento</option>
                  {list.departamentos.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
                <span className="muted" style={{ fontSize: '12px' }}>
                  Se guardará un primer borrador para revisión.
                </span>
              </label>
            )}

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '16px',
                background: selectedDraft ? '#F5F3FF' : '#F8FAFC',
                border: selectedDraft ? '1.5px solid #8B5CF6' : '1px solid #E2E8F0',
                borderRadius: '12px',
                transition: 'all 0.15s ease',
              }}
            >
              <strong style={{ fontSize: '14px', color: '#1B2C48' }}>
                Continuar un borrador existente
              </strong>
              <select
                aria-label="Borrador del departamento"
                value={selectedDraft}
                disabled={loading || busy || savingDraft}
                onChange={e => {
                  invalidate()
                  setSelectedDraft(e.target.value)
                  setDepartment('')
                  setAutomaticDraft(null)
                  setLockedDays([])
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  borderColor: selectedDraft ? '#8B5CF6' : '#CBD5E1',
                }}
              >
                <option value="">Selecciona un borrador</option>
                {(list?.borradores || [])
                  .filter(d => d.id_departamento)
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      {d.departamento} · {d.nombre}
                    </option>
                  ))}
              </select>
              <span className="muted" style={{ fontSize: '12px' }}>
                Reorganizar una propuesta guardada.
              </span>
            </label>
          </div>

          {/* Opción Modo Profundo */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 18px',
                background: modoProfundo ? '#F8FAFC' : '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                cursor: busy || savingDraft ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              <input
                type="checkbox"
                checked={modoProfundo}
                onChange={e => {
                  invalidate()
                  setModoProfundo(e.target.checked)
                }}
                disabled={busy || savingDraft}
                style={{ width: '18px', height: '18px', accentColor: '#302C91' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={14} color="#302C91" />
                  <strong style={{ fontSize: '13.5px', color: '#1B2C48' }}>
                    Búsqueda más exhaustiva
                  </strong>
                </div>
                <span className="muted" style={{ fontSize: '12.5px', display: 'block', marginTop: '2px' }}>
                  Dedicar más tiempo a buscar una solución.
                </span>
              </div>
            </label>
          </div>

          {/* Protección de días */}
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Lock size={15} color="#475569" />
              <strong style={{ fontSize: '13.5px', color: '#1E293B' }}>
                Protección de días de la semana
              </strong>
            </div>
            <span className="detail-label" style={{ display: 'block', marginBottom: '10px', fontSize: '12px', color: '#64748B' }}>
              Conservar días de este borrador: no mover sus clases ni añadir otras en esos días.
            </span>
            {!selectedDraft && (
              <p className="muted" style={{ fontSize: '12.5px', margin: '4px 0 0 0' }}>
                Disponible al seleccionar un borrador existente.
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {DAYS.map(day => {
                const isLocked = lockedDays.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleLockDay(day)}
                    disabled={!editableDraft || busy || savingDraft}
                    aria-pressed={isLocked}
                    className="secondary"
                    style={{
                      padding: '7px 14px',
                      fontSize: '13px',
                      fontWeight: 600,
                      borderRadius: '8px',
                      borderColor: isLocked ? '#EF4444' : '#CBD5E1',
                      background: isLocked ? '#FEF2F2' : '#FFFFFF',
                      color: isLocked ? '#991B1B' : '#334155',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: !editableDraft || busy || savingDraft ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isLocked ? <Lock size={13} color="#EF4444" /> : <Unlock size={13} color="#94A3B8" />}
                    <span>{day}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Botones de Acción / Toolbar de Generación */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              paddingTop: '16px',
              borderTop: '1px solid #E2E8F0',
            }}
          >
            <button
              className="primary"
              disabled={!canGenerate || busy || savingDraft || loading}
              onClick={handleRunGenerator}
              style={{
                padding: '12px 26px',
                fontSize: '14.5px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: canGenerate && !busy ? '0 2px 8px rgba(48, 44, 145, 0.25)' : 'none',
              }}
            >
              <Sparkles size={17} aria-hidden="true" />
              <span>{busy ? 'Generando propuesta…' : 'Generar Horario con IA'}</span>
            </button>

            {result && (
              <button
                className="secondary"
                disabled={busy || savingDraft}
                onClick={handleRunGenerator}
                title="Explora una combinación alternativa manteniendo las clases fijadas"
                style={{ padding: '12px 18px', fontSize: '13.5px' }}
              >
                <RotateCw size={14} aria-hidden="true" />
                <span>Explorar alternativas</span>
              </button>
            )}

            {result?.listo_para_guardar && (
              <button
                className="secondary"
                style={{
                  marginLeft: 'auto',
                  borderColor: '#302C91',
                  color: '#302C91',
                  background: '#EFEEFA',
                  padding: '12px 20px',
                  fontWeight: 600,
                }}
                onClick={() => setShowSaveModal(true)}
              >
                <Save size={15} aria-hidden="true" />
                <span>Guardar propuesta en el borrador</span>
              </button>
            )}
          </div>

          {busy && (
            <div
              style={{
                marginTop: '18px',
                padding: '14px 18px',
                background: '#EFEEFA',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid #D6D3F2',
              }}
            >
              <div className="spinner" style={{ width: '18px', height: '18px' }} />
              <span style={{ fontSize: '13.5px', color: '#302C91', fontWeight: 600 }}>
                Consultando datos y calculando una propuesta con las restricciones actuales…
              </span>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación para guardar borrador */}
      <Modal
        isOpen={Boolean(showSaveModal)}
        onClose={() => setShowSaveModal(false)}
        title={`Guardar propuesta en «${draft?.nombre || 'borrador'}»`}
        maxWidth={540}
      >
        <div>
          <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px 0' }}>
            Se sustituirán las clases no protegidas por todas las sesiones comprobadas de esta propuesta. Las fijadas se conservan. Esto no aprueba ni publica el horario.
          </p>
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#475569',
            }}
          >
            <strong>Nota de seguridad:</strong> El borrador quedará listo para revisión departamental. Podrás seguir editando clases individuales o enviar a revisión cuando desees.
          </div>
          <div className="form-actions" style={{ margin: 0, justifyContent: 'flex-end', gap: '10px' }}>
            <button
              className="primary"
              disabled={savingDraft}
              onClick={handleSaveDraft}
              style={{ padding: '10px 20px', fontSize: '13.5px' }}
            >
              {savingDraft ? 'Guardando…' : 'Confirmar guardado'}
            </button>
            <button
              className="secondary"
              type="button"
              disabled={savingDraft}
              onClick={() => setShowSaveModal(false)}
              style={{ padding: '10px 18px', fontSize: '13.5px' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Métricas y Estadísticas de la Solución (KPIs) */}
      {result && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '24px',
          }}
        >
          <div
            className="surface-card"
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              borderLeft: '4px solid #302C91',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '12.5px', fontWeight: 600 }}>
              <span className="detail-label" style={{ margin: 0 }}>Sesiones Asignadas</span>
              <CheckCircle2 size={16} color="#302C91" />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#302C91', display: 'block', marginTop: '6px' }}>
              {result.estadisticas.sesionesColocadas} / {result.estadisticas.totalSesiones}
            </span>
          </div>

          <div
            className="surface-card"
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              borderLeft: '4px solid #D97706',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '12.5px', fontWeight: 600 }}>
              <span className="detail-label" style={{ margin: 0 }}>Fijadas Preservadas</span>
              <Pin size={16} color="#D97706" />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#1B2C48', display: 'block', marginTop: '6px' }}>
              {result.estadisticas.sesionesFijadasPreservadas}
            </span>
          </div>

          <div
            className="surface-card"
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              borderLeft: '4px solid #16A34A',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '12.5px', fontWeight: 600 }}>
              <span className="detail-label" style={{ margin: 0 }}>Huecos Evitados</span>
              <Sparkles size={16} color="#16A34A" />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#15803D', display: 'block', marginTop: '6px' }}>
              {result.estadisticas.huecosEstudiantilesEvitados}
            </span>
          </div>

          <div
            className="surface-card"
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              borderLeft: '4px solid #64748B',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#64748B', fontSize: '12.5px', fontWeight: 600 }}>
              <span className="detail-label" style={{ margin: 0 }}>Tiempo de Cálculo</span>
              <Clock size={16} color="#64748B" />
            </div>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#475569', display: 'block', marginTop: '6px' }}>
              {result.estadisticas.tiempoCalculoMs} ms
            </span>
          </div>

          <div
            className="surface-card"
            style={{
              padding: '16px 18px',
              borderRadius: '14px',
              borderLeft: result.listo_para_guardar ? '4px solid #16A34A' : '4px solid #DC2626',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <span className="detail-label" style={{ margin: '0 0 6px 0', fontSize: '12.5px' }}>
              Estado de la Solución
            </span>
            <div>
              <span className={result.listo_para_guardar ? 'status-pill active' : 'status-pill inactive'}>
                <span className="status-dot">●</span>
                <span>{result.listo_para_guardar ? 'Completa y comprobada' : 'Pendiente de revisión'}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filtros de Visualización */}
      {result && result.clases.length > 0 && (
        <div className="surface-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
              <Calendar size={15} color="#475569" />
              <strong>Día:</strong>
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '13px' }}
              >
                <option value="Todos">Todos los días</option>
                {DAYS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
              <Users size={15} color="#475569" />
              <strong>Carrera y año:</strong>
              <select
                value={selectedSection}
                onChange={e => setSelectedSection(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', fontSize: '13px' }}
              >
                <option value="">Todas las carreras y años</option>
                {sections.map(s => (
                  <option key={s.id_seccion} value={s.id_seccion}>
                    {s.codigo}
                  </option>
                ))}
              </select>
            </label>

            <span className="muted" style={{ fontSize: '13px', marginLeft: 'auto', fontWeight: 500 }}>
              Mostrando <strong>{displayedClasses.length}</strong> de {result.clases.length} clases generadas
            </span>
          </div>
        </div>
      )}

      {/* Matriz Semanal de Clases */}
      {result && result.clases.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {DAYS.filter(d => selectedDay === 'Todos' || selectedDay === d).map(day => {
            const dayClasses = classesByDay[day] || []
            if (selectedDay === 'Todos' && dayClasses.length === 0) return null

            return (
              <div key={day} className="surface-card" style={{ padding: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    borderBottom: '1px solid #E2E8F0',
                    paddingBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#EFEEFA',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Calendar size={16} color="#302C91" />
                    </div>
                    <h3 className="card-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                      {day}
                    </h3>
                  </div>
                  <span
                    className="status-pill active"
                    style={{ fontSize: '12px', padding: '3px 10px', fontWeight: 600 }}
                  >
                    {dayClasses.length} {dayClasses.length === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '14px',
                  }}
                >
                  {dayClasses.map(c => {
                    const isPinned = c.es_fijada
                    return (
                      <div
                        key={c.id}
                        style={{
                          background: isPinned ? '#FEFCE8' : '#FFFFFF',
                          border: isPinned ? '1.5px solid #CA8A04' : '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            className="badge-code"
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              background: '#EFEEFA',
                              color: '#302C91',
                              padding: '3px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {c.hora_inicio} - {c.hora_fin}
                          </span>
                          <button
                            type="button"
                            disabled
                            title="Las fijaciones y sus autorizaciones se administran en Borradores"
                            className="secondary"
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              height: 'auto',
                              borderColor: isPinned ? '#CA8A04' : '#E2E8F0',
                              color: isPinned ? '#854D0E' : '#64748B',
                              background: isPinned ? '#FEF08A' : '#F8FAFC',
                              borderRadius: '6px',
                            }}
                          >
                            {isPinned ? <Pin size={11} color="#CA8A04" /> : <PinOff size={11} />}
                            <span>{isPinned ? 'Protegida' : 'Sin fijar'}</span>
                          </button>
                        </div>

                        <strong
                          style={{
                            fontSize: '14.5px',
                            color: '#1E293B',
                            marginTop: '2px',
                            lineHeight: '1.3',
                          }}
                        >
                          {c.asignatura_nombre}
                        </strong>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            fontSize: '12.5px',
                            color: '#64748B',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Users size={12} color="#94A3B8" />
                            <span>
                              <strong>Año:</strong> {c.seccion_codigo}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>●</span>
                            <span>
                              <strong>Docente:</strong> {c.docente_nombre}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '4px',
                            paddingTop: '8px',
                            borderTop: '1px dashed #E2E8F0',
                            fontSize: '12px',
                          }}
                        >
                          <Building2 size={13} color="#94A3B8" />
                          <span
                            style={{
                              color: c.aula_codigo ? '#15803D' : '#D97706',
                              fontWeight: 600,
                              background: c.aula_codigo ? '#DCFCE7' : '#FEF3C7',
                              padding: '2px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            {c.aula_codigo ? `Aula ${c.aula_codigo}` : 'Aula pendiente'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {dayClasses.length === 0 && (
                    <p className="muted" style={{ gridColumn: '1 / -1', fontSize: '13px', margin: '8px 0' }}>
                      No hay clases asignadas para este día con los filtros seleccionados.
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sesiones Pendientes si hubo búsqueda parcial */}
      {result && result.pendientes && result.pendientes.length > 0 && (
        <div className="surface-card" style={{ marginTop: '24px', borderColor: '#F59E0B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color="#D97706" />
            <h3 className="card-title" style={{ margin: 0, color: '#B45309' }}>
              Sesiones Pendientes ({result.pendientes.length})
            </h3>
          </div>
          <p className="muted" style={{ fontSize: '13px', margin: '0 0 14px 0' }}>
            Las siguientes materias no pudieron colocarse automáticamente sin infringir restricciones de docentes o disponibilidad de bloques:
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Carrera y año</th>
                  <th>Componente</th>
                  <th>Sesión</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {result.pendientes.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{p.seccion}</strong>
                    </td>
                    <td>{p.asignatura}</td>
                    <td>Sesión #{p.sesion}</td>
                    <td style={{ color: '#D97706', fontSize: '13px' }}>{p.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
