import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import { solveScheduleAI } from './schedule-ai-solver'
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
} from 'lucide-react'

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

export default function GeneradorPage({ _context, periodId, onNavigateToDrafts }) {
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [genStage, setGenStage] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Datos base
  const [sections, setSections] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [rooms, setRooms] = useState([])
  const [blocks, setBlocks] = useState([])
  const [restrictions, setRestrictions] = useState([])
  const [programacion, setProgramacion] = useState([])

  // Opciones del generador
  const [considerarAulas, setConsiderarAulas] = useState(false)
  const [modoProfundo, setModoProfundo] = useState(true)
  const [selectedDay, setSelectedDay] = useState('Todos')
  const [selectedSection, setSelectedSection] = useState('')
  const [lockedDays, setLockedDays] = useState([])
  const [pinnedClassIds, setPinnedClassIds] = useState(new Set())

  // Resultado
  const [result, setResult] = useState(null)
  const [draftName, setDraftName] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  async function loadData(signal) {
    setLoading(true)
    setError('')
    try {
      const [
        dataSections,
        dataSubjects,
        dataTeachers,
        dataRooms,
        dataBlocks,
        dataRestrictions,
        dataProgramacion,
      ] = await Promise.all([
        api('/secciones', { signal }).catch(() => []),
        api('/asignaturas', { signal }).catch(() => []),
        api('/docentes', { signal }).catch(() => []),
        api('/inventario', { signal }).catch(() => []),
        api('/bloques', { signal }).catch(() => []),
        api('/restricciones', { signal }).catch(() => []),
        api('/programacion', { signal }).catch(() => []),
      ])

      if (!signal?.aborted) {
        setSections(dataSections || [])
        setSubjects(dataSubjects || [])
        setTeachers(dataTeachers || [])
        setRooms(dataRooms || [])
        setBlocks(dataBlocks || [])
        setRestrictions(dataRestrictions || [])
        setProgramacion(dataProgramacion || [])
      }
    } catch (e) {
      if (!signal?.aborted) setError(e.message)
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const c = new AbortController()
    loadData(c.signal)
    return () => c.abort()
  }, [periodId])

  // Bloqueo de días interactivo
  const toggleLockDay = day => {
    setLockedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  // Fijación de clase interactiva
  const togglePinClass = id_horario => {
    setPinnedClassIds(prev => {
      const next = new Set(prev)
      if (next.has(id_horario)) next.delete(id_horario)
      else next.add(id_horario)
      return next
    })
  }

  // Ejecución del Generador IA
  const handleRunGenerator = async () => {
    setBusy(true)
    setError('')
    setMessage('')
    setGenStage('1. Identificando clases fijadas y días protegidos…')

    await new Promise(r => setTimeout(r, 200))
    setGenStage('2. Podando dominios y aplicando restricciones docentes…')

    await new Promise(r => setTimeout(r, 200))
    setGenStage('3. Explorando combinaciones óptimas sin colisiones…')

    try {
      // Clases ya fijadas que se deben preservar intactas
      const fixedClassesToKeep = (result?.clases || [])
        .filter(c => lockedDays.includes(c.dia) || pinnedClassIds.has(c.id_horario))
        .map(c => ({ ...c, es_fijada: true }))

      // Clases no fijadas para permitir que explore franjas alternativas
      const previousUnfixedPlacements = (result?.clases || [])
        .filter(c => !lockedDays.includes(c.dia) && !pinnedClassIds.has(c.id_horario))
        .map(c => ({
          id_seccion: c.id_seccion,
          id_asignatura: c.id_asignatura,
          sessionNumber: c.numero_sesion,
          id_bloque: c.id_bloque,
        }))

      // Mapeo de necesidades con compatibilidad de campos
      const mappedNeeds = (programacion || []).map(p => ({
        id_componente: p.id_programacion || p.id,
        id_seccion: p.id_seccion,
        id_asignatura: p.id_asignatura,
        id_docente: p.id_docente || p.id_docentes?.[0],
        sesiones_semana: p.sesiones_semanales || 2,
        duracion_minutos: (p.duracion_bloques || 2) * 45,
        requiere_espacio_especializado: p.requisito_laboratorio || false,
        observacion_espacio: p.requisito_laboratorio ? 'laboratorio' : '',
        recursos_requeridos: p.recursos_requeridos || [],
      }))

      const solverRes = solveScheduleAI({
        sections,
        subjects,
        teachers,
        rooms,
        blocks,
        restrictions,
        needs: mappedNeeds,
        fixedClasses: fixedClassesToKeep,
        lockedDays,
        considerarAulas,
        previousUnfixedPlacements,
        maxNodos: modoProfundo ? 15000 : 4000,
        maxTimeMs: modoProfundo ? 8000 : 3000,
      })

      setResult(solverRes)

      // Sincronizar clases fijadas con el resultado
      const newPinned = new Set(pinnedClassIds)
      solverRes.clases.forEach(c => {
        if (c.es_fijada) newPinned.add(c.id_horario)
      })
      setPinnedClassIds(newPinned)

      if (solverRes.estado === 'propuesta') {
        setMessage(solverRes.mensaje)
      } else {
        setError(solverRes.mensaje)
      }
    } catch (err) {
      setError(`Error durante la optimización: ${err.message}`)
    } finally {
      setBusy(false)
      setGenStage('')
    }
  }

  // Guardar como Borrador Oficial
  const handleSaveDraft = async () => {
    if (!result || !result.clases.length) return
    setSavingDraft(true)
    setError('')
    try {
      const name = draftName.trim() || `Propuesta IA - ${new Date().toLocaleDateString()}`
      // Obtener carreras involucradas
      const careerIds = [...new Set(sections.map(s => s.id_carrera).filter(Boolean))]

      // Crear borrador en el sistema
      const draftRes = await api('/borradores', {
        method: 'POST',
        data: {
          id_periodo: periodId,
          nombre: name,
          carreras: careerIds,
        },
      })

      setMessage(`Borrador "${name}" registrado correctamente.`)
      setShowSaveModal(false)
      if (onNavigateToDrafts && draftRes?.id) {
        onNavigateToDrafts(draftRes.id)
      }
    } catch (e) {
      setError(`No se pudo guardar el borrador: ${e.message}`)
    } finally {
      setSavingDraft(false)
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
    acc[d] = displayedClasses.filter(c => c.dia === d).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
    return acc
  }, {})

  return (
    <section className="management-page" aria-labelledby="generador-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Inteligencia Artificial Institucional</span>
          <h2 id="generador-title">Generador de Horarios con IA</h2>
          <p className="muted">
            Motor heurístico de optimización: asigna franjas horarias y aulas respetando restricciones y continuidad académica.
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

      {/* Tarjeta de Configuración y Parámetros */}
      <div className="surface-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#302C91" />
            <h3 className="card-title" style={{ margin: 0 }}>
              Parámetros de Optimización
            </h3>
          </div>
          <span className="status-pill active">
            <span className="status-dot" aria-hidden="true">●</span>
            <span>Semestre Activo</span>
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          {/* Opción Aulas */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={considerarAulas}
              onChange={e => setConsiderarAulas(e.target.checked)}
              disabled={busy}
            />
            <div>
              <strong style={{ display: 'block', fontSize: '13.5px', color: '#1B2C48' }}>
                Asignar aulas físicas
              </strong>
              <span className="muted" style={{ fontSize: '12px' }}>
                Verificar capacidad y laboratorios (opcional en borrador)
              </span>
            </div>
          </label>

          {/* Opción Modo Profundo */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={modoProfundo}
              onChange={e => setModoProfundo(e.target.checked)}
              disabled={busy}
            />
            <div>
              <strong style={{ display: 'block', fontSize: '13.5px', color: '#1B2C48' }}>
                Búsqueda en profundidad (MRV)
              </strong>
              <span className="muted" style={{ fontSize: '12px' }}>
                Hasta 15,000 pasos de retroceso para optimizar huecos
              </span>
            </div>
          </label>
        </div>

        {/* Protección de días */}
        <div style={{ marginBottom: '20px' }}>
          <span className="detail-label" style={{ display: 'block', marginBottom: '8px' }}>
            Días protegidos / bloqueados (haz clic para bloquear franjas):
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {DAYS.map(day => {
              const isLocked = lockedDays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleLockDay(day)}
                  disabled={busy}
                  className="secondary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '12.5px',
                    borderColor: isLocked ? '#D83236' : '#E2E8F0',
                    background: isLocked ? '#FEE2E2' : '#FFFFFF',
                    color: isLocked ? '#991B1B' : '#1B2C48',
                  }}
                >
                  {isLocked ? <Lock size={13} color="#D83236" /> : <Unlock size={13} color="#637086" />}
                  <span>{day}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Botón Principal de Ejecución */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className="primary"
            disabled={busy || loading}
            onClick={handleRunGenerator}
            style={{ padding: '12px 24px', fontSize: '14.5px', fontWeight: 600 }}
          >
            <Sparkles size={17} aria-hidden="true" />
            <span>{busy ? 'Generando propuesta…' : 'Generar Horario con IA'}</span>
          </button>

          {result && (
            <button
              className="secondary"
              disabled={busy}
              onClick={handleRunGenerator}
              title="Explora una combinación alternativa manteniendo las clases fijadas"
            >
              <RotateCw size={14} aria-hidden="true" />
              <span>Explorar alternativas</span>
            </button>
          )}

          {result && result.clases.length > 0 && (
            <button
              className="secondary"
              style={{ marginLeft: 'auto', borderColor: '#302C91', color: '#302C91' }}
              onClick={() => setShowSaveModal(true)}
            >
              <Save size={15} aria-hidden="true" />
              <span>Guardar como Borrador Oficial</span>
            </button>
          )}
        </div>

        {busy && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#EFEEFA',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div className="spinner" style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: '13.5px', color: '#302C91', fontWeight: 600 }}>
              {genStage || 'Procesando algoritmo…'}
            </span>
          </div>
        )}
      </div>

      {/* Modal / Card para guardar borrador */}
      {showSaveModal && (
        <div className="surface-card" style={{ marginBottom: '24px', border: '2px solid #302C91' }}>
          <h3 className="card-title">Registrar como Borrador Oficial</h3>
          <p className="card-subtitle">
            Al registrar la propuesta, quedará disponible en el ciclo de revisión y aprobación docente.
          </p>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
            <label style={{ flex: 1, minWidth: '240px' }}>
              <input
                type="text"
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                placeholder="Nombre del borrador (ej. Propuesta IA - Semestre I 2026)"
                style={{ width: '100%' }}
              />
            </label>
            <button className="primary" disabled={savingDraft} onClick={handleSaveDraft}>
              {savingDraft ? 'Guardando…' : 'Confirmar guardado'}
            </button>
            <button className="secondary" type="button" onClick={() => setShowSaveModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Métricas y Estadísticas de la Solución */}
      {result && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}
        >
          <div className="surface-card" style={{ padding: '16px' }}>
            <span className="detail-label">Sesiones Asignadas</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#302C91', display: 'block', marginTop: '4px' }}>
              {result.estadisticas.sesionesColocadas} / {result.estadisticas.totalSesiones}
            </span>
          </div>

          <div className="surface-card" style={{ padding: '16px' }}>
            <span className="detail-label">Fijadas Preservadas</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#1B2C48', display: 'block', marginTop: '4px' }}>
              {result.estadisticas.sesionesFijadasPreservadas}
            </span>
          </div>

          <div className="surface-card" style={{ padding: '16px' }}>
            <span className="detail-label">Huecos Evitados</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#15803D', display: 'block', marginTop: '4px' }}>
              {result.estadisticas.huecosEstudiantilesEvitados}
            </span>
          </div>

          <div className="surface-card" style={{ padding: '16px' }}>
            <span className="detail-label">Tiempo de Cálculo</span>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#637086', display: 'block', marginTop: '4px' }}>
              {result.estadisticas.tiempoCalculoMs} ms
            </span>
          </div>

          <div className="surface-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span className="detail-label">Estado de la Solución</span>
            <div style={{ marginTop: '6px' }}>
              <span className={result.estado === 'propuesta' ? 'status-pill active' : 'status-pill inactive'}>
                <span className="status-dot">●</span>
                <span>{result.estado === 'propuesta' ? '100% Óptimo' : 'Parcial'}</span>
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
              <strong>Día:</strong>
              <select value={selectedDay} onChange={e => setSelectedDay(e.target.value)}>
                <option value="Todos">Todos los días</option>
                {DAYS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px' }}>
              <strong>Grupo / Sección:</strong>
              <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}>
                <option value="">Todos los grupos</option>
                {sections.map(s => (
                  <option key={s.id_seccion} value={s.id_seccion}>
                    {s.codigo}
                  </option>
                ))}
              </select>
            </label>

            <span className="muted" style={{ fontSize: '13px', marginLeft: 'auto' }}>
              Mostrando {displayedClasses.length} de {result.clases.length} clases generadas
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
              <div key={day} className="surface-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="#302C91" />
                    <h3 className="card-title" style={{ margin: 0, fontSize: '16px' }}>
                      {day}
                    </h3>
                  </div>
                  <span className="muted" style={{ fontSize: '13px' }}>
                    {dayClasses.length} sesiones
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
                    const isPinned = pinnedClassIds.has(c.id_horario) || c.es_fijada
                    return (
                      <div
                        key={c.id_horario}
                        style={{
                          background: isPinned ? '#FEFCE8' : '#FFFFFF',
                          border: isPinned ? '1px solid #CA8A04' : '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="badge-code" style={{ fontSize: '11.5px' }}>
                            {c.hora_inicio} - {c.hora_fin}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinClass(c.id_horario)}
                            className="secondary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '11.5px',
                              height: 'auto',
                              borderColor: isPinned ? '#CA8A04' : '#E2E8F0',
                              color: isPinned ? '#854D0E' : '#637086',
                            }}
                            title={isPinned ? 'Desfijar clase' : 'Fijar clase (se preservará al re-generar)'}
                          >
                            {isPinned ? <Pin size={12} color="#CA8A04" /> : <PinOff size={12} />}
                            <span>{isPinned ? 'Fijada' : 'Fijar'}</span>
                          </button>
                        </div>

                        <strong style={{ fontSize: '14px', color: '#1B2C48', marginTop: '4px' }}>
                          {c.asignatura_nombre}
                        </strong>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12.5px', color: '#637086' }}>
                          <span><strong>Grupo:</strong> {c.seccion_codigo}</span>
                          <span>·</span>
                          <span><strong>Docente:</strong> {c.docente_nombre}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '12px' }}>
                          <Building2 size={13} color="#94A3B8" />
                          <span style={{ color: c.aula_codigo ? '#15803D' : '#94A3B8', fontWeight: 600 }}>
                            {c.aula_codigo ? `Aula ${c.aula_codigo}` : 'Sin aula física (opcional)'}
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
                  <th>Grupo</th>
                  <th>Asignatura</th>
                  <th>Sesión</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {result.pendientes.map((p, i) => (
                  <tr key={i}>
                    <td><strong>{p.seccion}</strong></td>
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
