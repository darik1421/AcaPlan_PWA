import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../services/management'
import { Plus, Pencil, Trash2, RotateCw, Users, GraduationCap, Search, X, Check, AlertCircle } from 'lucide-react'
import Modal from '../../components/Modal'

export default function DepartamentosPage({ canManage = true, onChanged }) {
  const [departments, setDepartments] = useState([])
  const [carreras, setCarreras] = useState([])
  const [docentes, setDocentes] = useState([])
  const [form, setForm] = useState(null)
  const [query, setQuery] = useState('')
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('')
  const [teacherPickerOpen, setTeacherPickerOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const generation = useRef(0)

  const load = useCallback(async (signal) => {
    const current = ++generation.current
    setLoading(true)
    setLoadFailed(false)
    setError('')
    try {
      const [deptData, carrData, docData] = await Promise.all([
        api('/departamentos', { signal }),
        api('/carreras', { signal }).catch(() => []),
        api('/departamentos/docentes', { signal }).catch(() => ({ docentes: [] })),
      ])
      if (!signal?.aborted && current === generation.current) {
        setDepartments(Array.isArray(deptData?.departamentos) ? deptData.departamentos : Array.isArray(deptData) ? deptData : [])
        setCarreras(Array.isArray(carrData) ? carrData : Array.isArray(carrData?.carreras) ? carrData.carreras : [])
        setDocentes(Array.isArray(docData?.docentes) ? docData.docentes : Array.isArray(docData) ? docData : [])
      }
    } catch (e) {
      if (!signal?.aborted && current === generation.current) {
        setError(e.message)
        setLoadFailed(true)
        setDepartments([])
      }
    } finally {
      if (!signal?.aborted && current === generation.current) {
        setLoading(false)
        setBusy(false)
      }
    }
  }, [])

  useEffect(() => {
    const c = new AbortController()
    load(c.signal)
    return () => c.abort()
  }, [load])

  async function save(e) {
    e.preventDefault()
    if (busy || loading || !form || !form.nombre.trim()) return
    const current = generation.current
    setBusy(true)
    setError('')
    setMessage('')
    try {
      let deptId = form.id
      if (form.id) {
        const existing = departments.find(d => d.id === form.id)
        if (!existing || existing.nombre !== form.nombre.trim()) {
          await api('/departamentos', {
            method: 'PATCH',
            data: { id: form.id, nombre: form.nombre.trim() },
          })
        }
      } else {
        const res = await api('/departamentos', {
          method: 'POST',
          data: { nombre: form.nombre.trim() },
        })
        deptId = res?.departamento?.id
      }

      // Sincronizar asignación del docente director si hubo cambios
      if (deptId && form.id_director !== form.initial_director) {
        if (form.id_director) {
          await api('/departamentos/director', {
            method: 'PATCH',
            data: { id_usuario: Number(form.id_director), id_departamento: deptId },
          })
        } else if (form.initial_director) {
          await api('/departamentos/director', {
            method: 'PATCH',
            data: { id_usuario: Number(form.initial_director), id_departamento: null },
          })
        }
      }

      if (current === generation.current) {
        setMessage(form.id ? 'Departamento y director docente actualizados exitosamente.' : 'Departamento y director docente registrados exitosamente.')
      }
      setForm(null)
      setTeacherPickerOpen(false)
      setTeacherSearchQuery('')
      await load()
      onChanged?.()
    } catch (e) {
      if (current === generation.current) setError(e.message)
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  async function handleDelete(dept) {
    if (busy || loading || !canManage) return
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el departamento «${dept.nombre}»?`)) return
    const current = generation.current
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/departamentos', {
        method: 'DELETE',
        data: { id: dept.id },
      })
      if (current === generation.current) {
        setMessage('Departamento eliminado exitosamente.')
        await load()
        onChanged?.()
      }
    } catch (e) {
      if (current === generation.current) setError(e.message)
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  const filteredDepartments = departments.filter(d =>
    d.nombre.toLowerCase().includes(query.toLowerCase())
  )

  const getDepartmentCareers = deptId =>
    Array.isArray(carreras) ? carreras.filter(c => c.id_departamento === deptId || c.departamento_id === deptId) : []

  const getDepartmentDirectorDocente = deptId =>
    docentes.find(d => d.id_departamento === deptId)

  // Filtrado de docentes para el selector por nombre o cédula
  const filteredDocentes = useMemo(() => {
    const q = teacherSearchQuery.trim().toLowerCase()
    if (!q) return docentes
    return docentes.filter(d =>
      (d.nombre || '').toLowerCase().includes(q) ||
      (d.cedula || '').toLowerCase().includes(q)
    )
  }, [docentes, teacherSearchQuery])

  const selectedDocente = useMemo(() => {
    if (!form?.id_director) return null
    return docentes.find(d => String(d.id_usuario) === String(form.id_director))
  }, [form?.id_director, docentes])

  return (
    <section className="management-page" aria-labelledby="dept-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Organización académica</span>
          <h2 id="dept-title">Departamentos académicos</h2>
          <p className="muted">Catálogo institucional para gestionar facultades, departamentos y asignar al docente responsable de cada jefatura.</p>
        </div>
        {canManage && (
          <button
            className="primary"
            disabled={busy || loading || loadFailed}
            onClick={() => {
              setForm({ id: null, nombre: '', id_director: '', initial_director: '' })
              setTeacherPickerOpen(false)
              setTeacherSearchQuery('')
              setMessage('')
            }}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Nuevo departamento</span>
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

      {/* KPI Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div className="surface-card" style={{ padding: '14px 18px', borderLeft: '4px solid var(--primary-indigo)' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Departamentos Registrados</span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-ink)', marginTop: '4px' }}>
            {departments.length}
          </div>
        </div>
        <div className="surface-card" style={{ padding: '14px 18px', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Carreras Asignadas</span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-ink)', marginTop: '4px' }}>
            {Array.isArray(carreras) ? carreras.filter(c => c.estado === 'activo').length : 0}
          </div>
        </div>
        <div className="surface-card" style={{ padding: '14px 18px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Docentes Directores</span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-ink)', marginTop: '4px' }}>
            {docentes.filter(d => Boolean(d.id_departamento)).length} <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}>de {departments.length} departamentos</span>
          </div>
        </div>
      </div>

      {/* Filter and Refresh Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div style={{ flex: '1', minWidth: '240px' }}>
          <label className="filter-card">
            <span>Buscar departamentos</span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Nombre del departamento…"
            />
          </label>
        </div>
        <button
          className="secondary"
          disabled={busy || loading}
          onClick={() => {
            setForm(null)
            load()
          }}
          style={{ height: '48px', marginTop: 'auto' }}
        >
          <RotateCw size={14} className={loading ? 'spin' : ''} aria-hidden="true" />
          <span>Actualizar lista</span>
        </button>
      </div>

      {/* Modal Dialog for Edit / Create with Dedicated Docente Picker */}
      <Modal
        isOpen={Boolean(form)}
        onClose={() => {
          setForm(null)
          setTeacherPickerOpen(false)
          setTeacherSearchQuery('')
        }}
        title={
          <div className="dept-modal-title-row">
            <span>{form?.id ? 'Editar departamento' : 'Nuevo departamento'}</span>
            {form?.id && <span className="dept-id-badge">#{form.id}</span>}
          </div>
        }
        maxWidth={560}
      >
        {form && (
          <form onSubmit={save} style={{ margin: 0, padding: 0 }}>
            <fieldset disabled={busy} style={{ border: 'none', padding: 0, margin: 0 }}>
              <div className="dept-form-group">
                <label htmlFor="dept-nombre" className="dept-form-label">
                  <span>Nombre del departamento</span>
                </label>
                <input
                  id="dept-nombre"
                  type="text"
                  className="dept-text-input"
                  required
                  maxLength={150}
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. Ciencias Económicas y Administrativas"
                />
              </div>

              {/* Sección interactiva: Asignación de Docente Director */}
              <div className="dept-form-group">
                <label htmlFor="teacher-search-input" className="dept-form-label">
                  <span>Docente responsable (Director de departamento)</span>
                </label>
                <p className="dept-form-sublabel">
                  Docente titular asignado a la dirección académica de este departamento.
                </p>

                {/* Estado A: Docente ya asignado */}
                {selectedDocente && !teacherPickerOpen ? (
                  <div className="dept-assigned-card">
                    <div className="dept-assigned-main">
                      <div className="dept-assigned-avatar" aria-hidden="true">
                        {selectedDocente.nombre ? selectedDocente.nombre.charAt(0).toUpperCase() : 'D'}
                      </div>
                      <div className="dept-assigned-details">
                        <div className="dept-assigned-name">
                          {selectedDocente.nombre}
                        </div>
                        <div className="dept-assigned-meta">
                          <span>Cédula docente:</span>
                          <strong>{selectedDocente.cedula}</strong>
                          <span className="dept-badge-assigned">Jefe asignado</span>
                        </div>
                      </div>
                    </div>

                    <div className="dept-assigned-actions">
                      <button
                        type="button"
                        className="dept-btn-change"
                        onClick={() => {
                          setTeacherPickerOpen(true)
                          setTeacherSearchQuery('')
                        }}
                      >
                        Cambiar docente
                      </button>
                      <button
                        type="button"
                        className="dept-btn-remove"
                        onClick={() => {
                          setForm({ ...form, id_director: '' })
                          setTeacherPickerOpen(false)
                        }}
                      >
                        Quitar director
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Estado B: Buscador interactivo de Docentes */
                  <div className="dept-picker-box">
                    <div className="dept-picker-search-bar">
                      <div className="dept-search-input-wrap">
                        <Search size={16} className="dept-search-icon" aria-hidden="true" />
                        <input
                          id="teacher-search-input"
                          type="search"
                          className="dept-search-input"
                          value={teacherSearchQuery}
                          onChange={e => setTeacherSearchQuery(e.target.value)}
                          placeholder="Buscar docente por nombre o cédula…"
                          autoFocus={teacherPickerOpen}
                          style={{ paddingLeft: '42px' }}
                        />
                      </div>
                      {selectedDocente && (
                        <button
                          type="button"
                          className="dept-btn-cancel-picker"
                          onClick={() => {
                            setTeacherPickerOpen(false)
                            setTeacherSearchQuery('')
                          }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    {/* Lista de docentes filtrados */}
                    <div className="dept-picker-list">
                      {filteredDocentes.map(doc => {
                        const isAssignedToThis = String(doc.id_usuario) === String(form.id_director)
                        const otherDeptName = doc.id_departamento && doc.id_departamento !== form.id ? doc.departamento_nombre : null

                        return (
                          <div
                            key={doc.id_usuario}
                            className={`dept-picker-row ${isAssignedToThis ? 'selected' : ''}`}
                          >
                            <div className="dept-picker-row-info">
                              <div className="dept-picker-row-name">
                                {doc.nombre}
                              </div>
                              <div className="dept-picker-row-meta">
                                <span>Cédula: {doc.cedula}</span>
                                {otherDeptName && (
                                  <span className="dept-picker-conflict-tag">
                                    Actualmente en: {otherDeptName}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="dept-picker-row-action">
                              <button
                                type="button"
                                className={`btn-assign-director ${isAssignedToThis ? 'active' : ''}`}
                                onClick={() => {
                                  setForm({ ...form, id_director: String(doc.id_usuario) })
                                  setTeacherPickerOpen(false)
                                  setTeacherSearchQuery('')
                                }}
                              >
                                {isAssignedToThis ? 'Seleccionado' : 'Asignar como Director'}
                              </button>
                            </div>
                          </div>
                        )
                      })}

                      {!filteredDocentes.length && (
                        <div className="dept-picker-empty">
                          No se encontraron docentes con ese nombre o cédula.
                        </div>
                      )}
                    </div>

                    <p className="dept-picker-hint">
                      El docente seleccionado asumirá la jefatura del departamento en la planificación académica.
                    </p>
                  </div>
                )}
              </div>

              {/* Botones de acción del formulario */}
              <div className="dept-modal-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={() => {
                    setForm(null)
                    setTeacherPickerOpen(false)
                    setTeacherSearchQuery('')
                  }}
                >
                  Cancelar
                </button>
                <button className="primary" type="submit" disabled={busy}>
                  {busy ? 'Guardando…' : form.id ? 'Guardar departamento' : 'Registrar departamento'}
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </Modal>

      {/* Table of Departments */}
      {loading ? (
        <p role="status">Cargando departamentos…</p>
      ) : loadFailed ? (
        <p className="notice">No se pudo cargar la lista. Pulsa «Actualizar lista» para reintentar.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <caption>Catálogo de departamentos académicos</caption>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Nombre del departamento</th>
                <th>Docente Director</th>
                <th>Carreras adscritas</th>
                {canManage && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.map(dept => {
                const dirDocente = getDepartmentDirectorDocente(dept.id)
                const deptCarreras = getDepartmentCareers(dept.id)
                return (
                  <tr key={dept.id}>
                    <td>
                      <span className="day-badge">#{dept.id}</span>
                    </td>
                    <td>
                      <strong style={{ fontSize: '15px', color: 'var(--text-ink)' }}>{dept.nombre}</strong>
                    </td>
                    <td>
                      {dirDocente ? (
                        <div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <GraduationCap size={15} style={{ color: 'var(--primary-indigo)' }} aria-hidden="true" />
                            <strong>{dirDocente.nombre}</strong>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '21px', marginTop: '2px' }}>
                            Cédula: {dirDocente.cedula}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '13px' }}>
                          Sin docente asignado
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} style={{ color: '#3b82f6' }} aria-hidden="true" />
                        <span>{deptCarreras.length} carreras</span>
                      </div>
                    </td>
                    {canManage && (
                      <td className="row-actions-cell" style={{ whiteSpace: 'nowrap', width: '1%' }}>
                        <div
                          className="row-actions"
                          style={{
                            display: 'inline-flex',
                            flexDirection: 'row',
                            flexWrap: 'nowrap',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <button
                            className="secondary"
                            disabled={busy}
                            aria-label={`Editar ${dept.nombre}`}
                            onClick={() => {
                              const currentDoc = docentes.find(d => d.id_departamento === dept.id)
                              const currentId = currentDoc ? String(currentDoc.id_usuario) : ''
                              setForm({
                                id: dept.id,
                                nombre: dept.nombre,
                                id_director: currentId,
                                initial_director: currentId,
                              })
                              setTeacherPickerOpen(false)
                              setTeacherSearchQuery('')
                              setMessage('')
                            }}
                          >
                            <Pencil size={13} aria-hidden="true" />
                            <span>Editar</span>
                          </button>
                          <button
                            className="secondary danger-btn"
                            disabled={busy}
                            aria-label={`Eliminar ${dept.nombre}`}
                            onClick={() => handleDelete(dept)}
                          >
                            <Trash2 size={13} aria-hidden="true" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {!filteredDepartments.length && (
                <tr>
                  <td colSpan={canManage ? 5 : 4} style={{ textAlign: 'center', padding: '24px' }}>
                    No hay departamentos que coincidan con la búsqueda.
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
