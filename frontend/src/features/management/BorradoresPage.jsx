import EstadoBorrador from './EstadoBorrador'
import VistaSemanalBorrador from './VistaSemanalBorrador'
import RevisionBorrador from './RevisionBorrador'
import { orderedScheduleRows } from '../../lib/schedule-order'
import NuevaVersionBorrador from './NuevaVersionBorrador'
import Modal from '../../components/Modal'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/management'
import {
  RefreshCw,
  Plus,
  FileText,
  Calendar,
  Building2,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Pin,
  Edit3,
  Trash2,
  Eye,
  History,
  RotateCw,
} from 'lucide-react'

const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']
const empty = {
  id_asignacion: '',
  componente: 'general',
  id_aula: '',
  dia: 'Lunes',
  hora_inicio: '08:00',
  hora_fin: '09:30',
}
const describe = c =>
  c
    ? `${c.dia} ${c.hora_inicio}–${c.hora_fin}, aula ${c.id_aula}, asignación ${c.id_asignacion} (${c.componente})`
    : 'Nueva clase'

const stateLabels = {
  borrador: { text: 'En edición', pill: 'active' },
  en_revision: { text: 'En revisión', pill: 'warning' },
  aprobado: { text: 'Aprobado', pill: 'active' },
  publicado: { text: 'Publicado', pill: 'active' },
}

export default function BorradoresPage({ periodId, canPlan = false, initialDraftId = null, onNavigateToRestrictions, onRegenerate, onPublished }) {
  const [list, setList] = useState(null),
    [selected, setSelected] = useState(initialDraftId),
    [detail, setDetail] = useState(null),
    [name, setName] = useState(''),
    [careers, setCareers] = useState([])
  const [form, setForm] = useState(empty),
    [editing, setEditing] = useState(null),
    [operation, setOperation] = useState('clase'),
    [accepted, setAccepted] = useState(false),
    [reason, setReason] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [report, setReport] = useState(null),
    [attempt, setAttempt] = useState(0)
  const generation = useRef(0)
  const [department, setDepartment] = useState('')
  const [cycle, setCycle] = useState(null)
  const currentCycle = cycle?.id === selected && cycle?.revision === detail?.borrador.revision ? cycle : null
  const editable = Boolean(canPlan && detail?.semestre_activo && currentCycle?.estado === 'borrador')
  const openDrafts = list?.borradores.filter(d => !d.publicado)
  const selectedIsOpen = openDrafts?.some(d => String(d.id) === String(selected))

  useEffect(() => {
    setSelected(initialDraftId)
    setName('')
    setCareers([])
    setDepartment('')
  }, [periodId, initialDraftId])

  useEffect(() => {
    const c = new AbortController(),
      g = ++generation.current
    setList(null)
    setDetail(null)
    setReport(null)
    setEditing(null)
    setIsModalOpen(false)
    setForm(empty)
    setOperation('clase')
    setAccepted(false)
    setReason('')
    setError('')
    setBusy(false)
    if (periodId)
      api('/borradores/consultar', {
        method: 'POST',
        data: { id_periodo: periodId },
        signal: c.signal,
      })
        .then(d => {
          if (g === generation.current) setList(d)
        })
        .catch(e => {
          if (!c.signal.aborted) setError(e.message)
        })
    if (selected)
      api('/borradores/detalle', {
        method: 'POST',
        data: { id: selected },
        signal: c.signal,
      })
        .then(d => {
          if (g === generation.current) setDetail(d)
        })
        .catch(e => {
          if (!c.signal.aborted) setError(e.message)
        })
    return () => {
      c.abort()
      generation.current++
    }
  }, [periodId, selected, attempt, canPlan])

  async function run(path, payload, onSuccess, method = 'POST') {
    const g = generation.current
    setBusy(true)
    setError('')
    setReport(null)
    try {
      const d = await api(path, { method, data: payload })
      if (g === generation.current) onSuccess(d)
    } catch (e) {
      if (g === generation.current) {
        setError(`${e.message} Consulta nuevamente los datos antes de reintentar.`)
        setDetail(null)
      }
    } finally {
      if (g === generation.current) setBusy(false)
    }
  }

  const refresh = () => setAttempt(n => n + 1)

  async function deleteDraft() {
    if (busy || !currentCycle?.canPublish || !detail?.semestre_activo) return
    const {id, nombre, revision} = detail.borrador
    if (!window.confirm(`¿Eliminar «${nombre}»? Se borrarán sus clases y su historial. Esta acción es permanente.`)) return
    await run('/borradores', {id, revision, version:currentCycle.version}, result => {
      if (result?.eliminado !== true) throw new Error('No se pudo confirmar la eliminación.')
      setSelected(null)
      refresh()
    }, 'DELETE')
  }

  const course = detail?.asignaciones.find(a => a.id === Number(form.id_asignacion))
  const parts = course?.componentes || [{ tipo: 'general' }]

  function prepare(c, action) {
    if (!editable || busy) return
    setEditing(c)
    setOperation(action)
    setForm({
      ...c,
      hora_inicio: c.hora_inicio.slice(0, 5),
      hora_fin: c.hora_fin.slice(0, 5),
    })
    setAccepted(false)
    setReason('')
    setReport(null)
    setIsModalOpen(true)
  }

  function cancel() {
    setIsModalOpen(false)
    setEditing(null)
    setForm(empty)
    setOperation('clase')
    setAccepted(false)
    setReason('')
  }

  function startAdd() {
    setEditing(null)
    setForm(empty)
    setOperation('clase')
    setAccepted(false)
    setReason('')
    setIsModalOpen(true)
  }

  async function save(e) {
    e.preventDefault()
    if (busy || !editable) return
    const payload = {
      id: selected,
      revision: detail.borrador.revision,
      ...(editing ? { id_clase: editing.id } : {}),
      autorizar: accepted,
      motivo: reason,
    }
    if (operation === 'clase')
      Object.assign(payload, {
        id_asignacion: Number(form.id_asignacion),
        id_aula: Number(form.id_aula),
        componente: form.componente,
        dia: form.dia,
        hora_inicio: form.hora_inicio,
        hora_fin: form.hora_fin,
      })
    if (operation === 'fijar') payload.fijada = !editing.fijada
    await run(`/borradores/${operation}`, payload, () => {
      cancel()
      refresh()
    })
  }

  const needsAuthorization =
    editing?.fijada && (operation !== 'fijar' || editing.fijada)

  const totalClasses = detail?.clases?.length || 0
  const fixedClasses = detail?.clases?.filter(c => c.fijada).length || 0
  const editableClasses = totalClasses - fixedClasses
  const uniqueRooms = detail ? new Set(detail.clases.map(c => c.id_aula).filter(Boolean)).size : 0

  if (!periodId) return <p className="notice">Activa un semestre para trabajar con borradores.</p>

  return (
    <section className="management-page" aria-labelledby="borradores-title">
      {/* ── Encabezado ── */}
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Planificación y propuestas</span>
          <h2 id="borradores-title">Borradores de horarios</h2>
          <p className="muted">
            Organiza propuestas independientes por semestre. Guardar o fijar una clase no aprueba el
            horario.
          </p>
        </div>
        <button className="secondary" disabled={busy} onClick={refresh} style={{ alignSelf: 'center' }}>
          <RefreshCw size={14} aria-hidden="true" />
          <span>Consultar nuevamente</span>
        </button>
      </div>

      {/* ── Banner Informativo ── */}
      <div className="banner-notice" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Shield size={18} color="#302C91" style={{ flexShrink: 0 }} />
        <span>
          Cada borrador corresponde a un departamento. Las clases fijadas conservan su ubicación; la revisión comprueba también las ocupaciones aprobadas o publicadas de otros departamentos.
        </span>
      </div>

      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {/* ── Selector de Borrador y Creación ── */}
      {list && (
        <div className="surface-card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingBottom: '14px',
              borderBottom: '1px solid #E2E8F0',
              marginBottom: '18px',
            }}
          >
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
              <FileText size={20} color="#302C91" />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0, fontSize: '17px' }}>
                Selección de borrador
              </h3>
              <span className="muted" style={{ fontSize: '12.5px' }}>
                Elige un borrador existente para revisar o editar sus clases
              </span>
            </div>
          </div>

          <div className="filter-grid" style={{ marginBottom: canPlan ? '16px' : 0 }}>
            <label className="filter-card">
              <span>Borrador</span>
              <select
                disabled={busy}
                value={selectedIsOpen ? selected : ''}
                onChange={e => {
                  setSelected(Number(e.target.value) || null)
                  cancel()
                }}
              >
                <option value="">Seleccionar borrador</option>
                {openDrafts.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}{d.departamento ? ` · ${d.departamento}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {canPlan && (
            <details
              style={{
                marginTop: '12px',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <summary
                style={{
                  fontWeight: 600,
                  color: '#1B2C48',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Plus size={16} />
                <span>Crear un borrador</span>
              </summary>
              <form
                style={{ marginTop: '16px' }}
                onSubmit={e => {
                  e.preventDefault()
                  run(
                    '/borradores',
                    { id_periodo: periodId, nombre: name, carreras: careers, ...(list.departmentDraftVersion >= 1 ? { id_departamento: Number(department) } : {}) },
                    d => {
                      setSelected(d.id)
                      refresh()
                    }
                  )
                }}
              >
                <fieldset disabled={busy || !list.semestre_activo}>
                  <div className="form-grid">
                    {list.departmentDraftVersion >= 1 && (
                      <label>
                        Departamento del borrador
                        <select required value={department} onChange={e => { setDepartment(e.target.value); setCareers([]) }}>
                          <option value="">Seleccionar departamento</option>
                          {list.departamentos.map(item => (
                            <option key={item.id} value={item.id}>{item.nombre}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <label>
                      Nombre del borrador
                      <input
                        required
                        maxLength={100}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Ej. Propuesta regular"
                      />
                    </label>
                  </div>
                  <fieldset className="choice-group">
                    <legend>Carreras incluidas</legend>
                    {list.carreras.filter(c => list.departmentDraftVersion < 1 || !list.departmentDraftVersion || c.id_departamento === Number(department)).map(c => (
                      <label className="check-label" key={c.id_carrera}>
                        <input
                          type="checkbox"
                          checked={careers.includes(c.id_carrera)}
                          onChange={() =>
                            setCareers(a =>
                              a.includes(c.id_carrera)
                                ? a.filter(id => id !== c.id_carrera)
                                : [...a, c.id_carrera]
                            )
                          }
                        />
                        {c.nombre}
                      </label>
                    ))}
                  </fieldset>
                  <div className="form-actions">
                    <button className="primary" disabled={!careers.length || (list.departmentDraftVersion >= 1 && !department)}>
                      Crear borrador
                    </button>
                  </div>
                </fieldset>
              </form>
            </details>
          )}
        </div>
      )}

      {/* ── Detalle del Borrador Seleccionado ── */}
      {detail && selectedIsOpen && (
        <>
          {/* Tarjeta de Resumen y KPIs */}
          <div className="surface-card" style={{ marginBottom: '20px', padding: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: '#EFEEFA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={22} color="#302C91" />
                </div>
                <div>
                  <h3 className="card-title" style={{ margin: 0, fontSize: '20px' }}>
                    {detail.borrador.nombre}
                  </h3>
                  <p className="card-subtitle" style={{ margin: '2px 0 0 0' }}>
                    Versión {detail.borrador.revision} · {detail.clases.length} clases · Consulta el
                    estado de publicación abajo
                  </p>
                </div>
              </div>

              {currentCycle && (
                <span
                  className={`status-pill ${stateLabels[currentCycle.estado]?.pill || 'active'}`}
                  style={{ fontSize: '13px', padding: '5px 14px', fontWeight: 600 }}
                >
                  <span className="status-dot" aria-hidden="true">●</span>
                  <span>{stateLabels[currentCycle.estado]?.text || currentCycle.estado}</span>
                </span>
              )}
            </div>

            {/* KPIs */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderLeft: '4px solid #302C91',
                  borderRadius: '12px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="detail-label" style={{ margin: 0, fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>Total Clases</span>
                  <Calendar size={14} color="#302C91" />
                </div>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#302C91', display: 'block', marginTop: '4px' }}>{totalClasses}</span>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderLeft: '4px solid #D97706',
                  borderRadius: '12px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="detail-label" style={{ margin: 0, fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>Fijadas</span>
                  <Pin size={14} color="#D97706" />
                </div>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#1B2C48', display: 'block', marginTop: '4px' }}>{fixedClasses}</span>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderLeft: '4px solid #16A34A',
                  borderRadius: '12px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="detail-label" style={{ margin: 0, fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>Editables</span>
                  <Edit3 size={14} color="#16A34A" />
                </div>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#15803D', display: 'block', marginTop: '4px' }}>{editableClasses}</span>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderLeft: '4px solid #64748B',
                  borderRadius: '12px',
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="detail-label" style={{ margin: 0, fontSize: '11.5px', color: '#64748B', fontWeight: 600 }}>Aulas</span>
                  <Building2 size={14} color="#64748B" />
                </div>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#475569', display: 'block', marginTop: '4px' }}>{uniqueRooms}</span>
              </div>
            </div>

            {/* Acciones Rápidas */}
            {detail.semestre_activo && (
              <div
                className="form-actions"
                style={{
                  marginTop: 0,
                  paddingTop: '16px',
                  borderTop: '1px solid #E2E8F0',
                  flexWrap: 'wrap',
                }}
              >
                {onNavigateToRestrictions && (
                  <button className="secondary" disabled={busy} onClick={() => onNavigateToRestrictions(Number(selected))}>
                    <Shield size={14} />
                    <span>Revisar o registrar restricciones</span>
                  </button>
                )}
                {onRegenerate && (
                  <button className="secondary" disabled={busy || !editable} onClick={() => onRegenerate(Number(selected))}>
                    <RotateCw size={14} />
                    <span>Volver a generar este borrador</span>
                  </button>
                )}
                {currentCycle?.canPublish && currentCycle.estado !== 'publicado' && (
                  <button type="button" className="secondary danger-btn" disabled={busy} onClick={deleteDraft}>
                    <Trash2 size={14} aria-hidden="true" />
                    Eliminar borrador
                  </button>
                )}
                <button
                  className="primary"
                  disabled={busy}
                  onClick={() =>
                    run(
                      '/borradores/revisar',
                      { id: selected, revision: detail.borrador.revision },
                      setReport
                    )
                  }
                  style={{ marginLeft: 'auto' }}
                >
                  <Eye size={14} />
                  <span>Revisar borrador</span>
                </button>
              </div>
            )}

            {canPlan && detail.semestre_activo && currentCycle?.estado === 'aprobado' && (
              <div style={{ marginTop: '16px' }}>
                <NuevaVersionBorrador
                  id={selected}
                  revision={detail.borrador.revision}
                  version={currentCycle.version}
                  onCreated={id => {
                    setSelected(id)
                    refresh()
                  }}
                />
              </div>
            )}

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E2E8F0' }}>
              <EstadoBorrador
                key={`${selected}:${attempt}`}
                id={selected}
                revision={detail.borrador.revision}
                active={detail.semestre_activo}
                onChanged={estado => {
                  if (estado === 'publicado') {
                    setSelected(null)
                    onPublished?.()
                  }
                  refresh()
                }}
                onStateLoaded={setCycle}
              />
            </div>
          </div>

          {/* ── Reporte de Revisión ── */}
          {report && (
            <div className="surface-card" style={{ marginBottom: '20px', padding: '20px 24px' }}>
              <RevisionBorrador
                report={report}
                detail={detail}
                onEdit={prepare}
                disabled={!editable || busy}
              />
            </div>
          )}

          {/* ── Vista Semanal por Carrera y Año ── */}
          <div style={{ marginBottom: '20px' }}>
            <VistaSemanalBorrador
              key={selected}
              detail={detail}
              onEdit={prepare}
              disabled={!editable || busy}
            />
          </div>

          {/* ── Tabla de Clases del Borrador ── */}
          <div className="surface-card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '14px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1B2C48' }}>
                  Clases de esta propuesta ({detail.clases.length})
                </h3>
                <p className="muted" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                  Administra, fija o retira sesiones del borrador. Las acciones se gestionan en ventana modal.
                </p>
              </div>
              {editable && (
                <button
                  type="button"
                  className="primary"
                  disabled={!canPlan || busy || !detail.semestre_activo}
                  onClick={startAdd}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={16} />
                  <span>Añadir clase al borrador</span>
                </button>
              )}
            </div>

            <div className="table-scroll">
              <table>
                <caption>Clases de esta propuesta ({detail.clases.length})</caption>
                <thead>
                  <tr>
                    <th>Asignatura</th>
                    <th>Sesión</th>
                    <th>Aula</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedScheduleRows(detail.clases).map(c => (
                    <tr key={c.id}>
                      <td>
                        <strong>
                          {detail.asignaciones.find(a => a.id === c.id_asignacion)?.nombre ||
                            'Asignación retirada'}
                        </strong>
                        <span className="cell-detail">{c.componente}</span>
                      </td>
                      <td>
                        {c.dia}
                        <span className="cell-detail">
                          {c.hora_inicio.slice(0, 5)}–{c.hora_fin.slice(0, 5)}
                        </span>
                      </td>
                      <td>
                        {detail.espacios.find(a => a.id_aula === c.id_aula)?.codigo || c.id_aula}
                      </td>
                      <td>
                        <span
                          className={
                            c.fijada ? 'status-pill warning' : 'status-pill active'
                          }
                        >
                          <span className="status-dot" aria-hidden="true">●</span>
                          <span>{c.fijada ? 'Fijada' : 'Editable'}</span>
                        </span>
                      </td>
                      <td>
                        {editable && (
                          <div className="row-actions">
                            {[
                              ['clase', 'Editar'],
                              ['fijar', c.fijada ? 'Desfijar' : 'Fijar'],
                              ['retirar', 'Retirar'],
                            ].map(([action, label]) => (
                              <button
                                key={action}
                                className="secondary"
                                disabled={!canPlan || busy || !detail.semestre_activo}
                                onClick={() => prepare(c, action)}
                              >
                                {label} clase {c.id}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Modal de Edición / Alta de Clase ── */}
          {editable && (
            <Modal
              isOpen={isModalOpen}
              onClose={cancel}
              title={
                editing
                  ? `${
                      operation === 'clase'
                        ? 'Editar'
                        : operation === 'fijar'
                        ? editing.fijada
                          ? 'Desfijar'
                          : 'Fijar'
                        : 'Retirar'
                    } clase ${editing.id}`
                  : 'Añadir una clase al borrador'
              }
              maxWidth={620}
            >
              <form onSubmit={save} className="management-form" style={{ margin: 0 }}>
                <fieldset disabled={!editable || busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                  <legend className="sr-only-input">
                    {editing
                      ? `${
                          operation === 'clase'
                            ? 'Editar'
                            : operation === 'fijar'
                            ? editing.fijada
                              ? 'Desfijar'
                              : 'Fijar'
                            : 'Retirar'
                        } clase ${editing.id}`
                      : 'Añadir una clase al borrador'}
                  </legend>
                  {operation === 'clase' && (
                    <>
                      <div className="form-grid">
                        <label>
                          Asignatura de la propuesta
                          <select
                            required
                            value={form.id_asignacion}
                            onChange={e => {
                              const a = detail.asignaciones.find(
                                a => a.id === Number(e.target.value)
                              )
                              setForm({
                                ...form,
                                id_asignacion: e.target.value,
                                componente: a?.componentes?.[0]?.tipo || 'general',
                              })
                              setAccepted(false)
                            }}
                          >
                            <option value="">Seleccionar</option>
                            {detail.asignaciones.map(a => (
                              <option value={a.id} key={a.id}>
                                {a.carrera} · Año {a.ano_estudio} · {a.codigo} · {a.nombre}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Sesión
                          <select
                            value={form.componente}
                            onChange={e => {
                              setForm({ ...form, componente: e.target.value })
                              setAccepted(false)
                            }}
                          >
                            {parts.map(p => (
                              <option key={p.tipo}>{p.tipo}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Aula
                          <select
                            required
                            value={form.id_aula}
                            onChange={e => {
                              setForm({ ...form, id_aula: e.target.value })
                              setAccepted(false)
                            }}
                          >
                            <option value="">Seleccionar</option>
                            {detail.espacios
                              .filter(r => r.estado === 'activo')
                              .map(r => (
                                <option key={r.id_aula} value={r.id_aula}>
                                  {r.sede} · {r.codigo || r.nombre || r.id_aula}
                                </option>
                              ))}
                          </select>
                        </label>
                        <label>
                          Día
                          <select
                            value={form.dia}
                            onChange={e => {
                              setForm({ ...form, dia: e.target.value })
                              setAccepted(false)
                            }}
                          >
                            {days.map(d => (
                              <option key={d}>{d}</option>
                            ))}
                          </select>
                        </label>
                        {['hora_inicio', 'hora_fin'].map((key, i) => (
                          <label key={key}>
                            {i ? 'Hora de fin' : 'Hora de inicio'}
                            <input
                              required
                              type="time"
                              value={form[key]}
                              onChange={e => {
                                setForm({ ...form, [key]: e.target.value })
                                setAccepted(false)
                              }}
                            />
                          </label>
                        ))}
                      </div>
                      <p className="muted" style={{ marginTop: '12px', fontSize: '13px' }}>
                        La revisión comprobará la duración del turno, restricciones, ocupaciones y
                        recesos.
                      </p>
                    </>
                  )}
                  {editing && (
                    <div
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        padding: '12px 14px',
                        margin: '14px 0',
                        fontSize: '13px',
                        color: '#334155',
                      }}
                    >
                      <p className="notice" style={{ margin: 0 }}>
                        Antes: {describe(editing)}.{' '}
                        {operation === 'clase'
                          ? `Después: ${describe(form)}`
                          : operation === 'retirar'
                          ? 'Se retirará únicamente de este borrador.'
                          : editing.fijada
                          ? 'Quedará editable.'
                          : 'Quedará fijada para conservar su ubicación.'}
                      </p>
                    </div>
                  )}
                  {needsAuthorization && (
                    <div className="notice" style={{ background: '#FFFBEB', borderLeft: '4px solid #D97706', margin: '14px 0' }}>
                      <p style={{ fontWeight: 600, color: '#92400E' }}>
                        Esta clase está fijada. Autorizar el cambio no permite ignorar restricciones.
                      </p>
                      <label style={{ display: 'block', margin: '8px 0' }}>
                        Motivo de la autorización
                        <input
                          required
                          maxLength={500}
                          value={reason}
                          onChange={e => {
                            setReason(e.target.value)
                            setAccepted(false)
                          }}
                        />
                      </label>
                      <label className="check-label">
                        <input
                          type="checkbox"
                          checked={accepted}
                          onChange={e => setAccepted(e.target.checked)}
                        />
                        Autorizo este cambio de la clase fijada.
                      </label>
                    </div>
                  )}
                  <div
                    className="form-actions"
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '10px',
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid #E2E8F0',
                    }}
                  >
                    <button className="secondary" type="button" onClick={cancel}>
                      Cancelar edición
                    </button>
                    <button
                      className="primary"
                      disabled={needsAuthorization && (!accepted || !reason.trim())}
                    >
                      Confirmar{' '}
                      {operation === 'clase'
                        ? 'clase'
                        : operation === 'retirar'
                        ? 'retiro'
                        : 'estado'}
                    </button>
                  </div>
                </fieldset>
              </form>
            </Modal>
          )}

          {/* ── Historial de Cambios ── */}
          {detail.movimientos?.length > 0 && (
            <details
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <summary style={{ fontWeight: 600, color: '#1B2C48', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} color="#302C91" />
                <span>Historial de cambios ({detail.movimientos.length})</span>
              </summary>
              <ul style={{ marginTop: '12px', paddingLeft: '20px', lineHeight: '1.8' }}>
                {detail.movimientos.map(m => (
                  <li key={m.id}>
                    <strong>Clase {m.id_clase}</strong> · Usuario {m.actor} ·{' '}
                    {new Date(m.fecha).toLocaleString()} · {m.motivo || 'Edición de propuesta'}
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#637086' }}>
                      {describe(m.antes)} → {describe(m.despues)}
                      {m.despues?.retirada ? ' (retirada)' : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  )
}
