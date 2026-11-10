import PreparacionExcel from './PreparacionExcel'
import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import { Pencil, RefreshCw, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'

const PAGE_SIZE = 10

export default function EspaciosPage({ canManage, onChanged, periodId }) {
  const [tab, setTab] = useState('aulas')
  const [pabellones, setPabellones] = useState([])
  const [aulas, setAulas] = useState([])
  const [capacityFilter, setCapacityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Formularios
  const [formAula, setFormAula] = useState(null)
  const [formPabellon, setFormPabellon] = useState(null)

  async function load(signal) {
    setLoading(true)
    setLoadFailed(false)
    setError('')
    try {
      const [dataAulas, dataPabellones] = await Promise.all([
        api('/inventario', { signal }),
        api('/pabellones', { signal }),
      ])
      if (!signal?.aborted) {
        setAulas(dataAulas)
        setTypeFilter(current => (dataAulas.some(a => a.tipo === current) ? current : ''))
        setPabellones(dataPabellones)
      }
    } catch (e) {
      if (!signal?.aborted) {
        setError(e.message)
        setLoadFailed(true)
        setAulas([])
        setPabellones([])
        setFormAula(null)
        setFormPabellon(null)
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
      setFormAula(null)
      setFormPabellon(null)
      setMessage('')
    }
  }, [canManage])

  async function saveEntity(endpoint, payload, resetForm, successMsg) {
    if (busy || loading || loadFailed || !canManage || !payload.id) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api(endpoint, { method: 'PATCH', data: payload })
      setMessage(successMsg)
      resetForm()
      await load()
      onChanged?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteAula(row) {
    if (busy || loading || loadFailed || !canManage) return
    if (!window.confirm(`¿Estás seguro de que deseas dar de baja el aula «${row.codigo}»?`)) return
    saveEntity(
      '/aulas',
      {
        id: row.id_aula,
        codigo: row.codigo,
        tipo: row.tipo,
        capacidad: row.capacidad,
        estado: 'inactivo',
      },
      () => {},
      'Aula dada de baja'
    )
  }

  async function handleDeletePabellon(p) {
    if (busy || loading || loadFailed || !canManage) return
    const aulasPabellon = aulas.filter(
      a => a.id_pabellon === p.id_pabellon && a.estado !== 'inactivo'
    )
    if (aulasPabellon.length > 0) {
      setError(
        `No se puede eliminar el pabellón «${p.nombre}» porque tiene ${aulasPabellon.length} aula(s) asignada(s). Reasigna o da de baja las aulas primero.`
      )
      return
    }
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el pabellón «${p.nombre}»?`)) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/pabellones', { method: 'DELETE', data: { id: p.id_pabellon } })
      setMessage('Pabellón eliminado.')
      setFormPabellon(null)
      await load()
      onChanged?.()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const filteredAulas = aulas.filter(
    a =>
      (!capacityFilter || a.capacidad >= Number(capacityFilter)) &&
      (!typeFilter || a.tipo === typeFilter)
  )

  const totalPages = Math.ceil(filteredAulas.length / PAGE_SIZE) || 1
  const validPage = Math.min(Math.max(1, page), totalPages)
  const paginatedAulas = filteredAulas.slice((validPage - 1) * PAGE_SIZE, validPage * PAGE_SIZE)

  return (
    <section className="management-page" aria-labelledby="espacios-title">
      <div className="section-heading">
        <div>
          <span className="screen-kicker">Inventario institucional</span>
          <h2 id="espacios-title">Pabellones y aulas</h2>
          <p className="muted">Aulas completas, su pabellón, sede, tipo y capacidad.</p>
        </div>
      </div>

      <p className="notice">
        Importa el inventario desde Excel y confirma los datos revisados. La plantilla sigue siendo
        provisional. Las correcciones de aulas y pabellones existentes se realizan desde su fila.
      </p>

      <nav className="workspace-nav" aria-label="Espacios">
        <button
          className={tab === 'aulas' ? 'selected' : ''}
          onClick={() => setTab('aulas')}
        >
          Aulas y Laboratorios
        </button>
        <button
          className={tab === 'pabellones' ? 'selected' : ''}
          onClick={() => setTab('pabellones')}
        >
          Pabellones
        </button>
      </nav>

      {canManage && (
        <PreparacionExcel
          tipo="espacios"
          periodId={periodId}
          onConfirmed={() => {
            setFormAula(null)
            setFormPabellon(null)
            load()
            onChanged?.()
          }}
        />
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

      <button
        className="secondary"
        disabled={busy || loading || !!formAula || !!formPabellon}
        onClick={() => load()}
      >
        <RefreshCw size={14} aria-hidden="true" /> Actualizar inventario
      </button>
      {loadFailed && (
        <p className="notice">
          No se pudo consultar el inventario. Usa «Actualizar inventario» antes de corregir sus
          datos.
        </p>
      )}

      {/* MODAL EDICIÓN AULA */}
      <Modal
        isOpen={Boolean(formAula && canManage)}
        onClose={() => setFormAula(null)}
        title="Editar aula"
        maxWidth={580}
      >
        {formAula && canManage && (
          <form
            className="management-form"
            onSubmit={e => {
              e.preventDefault()
              saveEntity('/aulas', formAula, () => setFormAula(null), 'Aula actualizada')
            }}
          >
            <fieldset disabled={busy} style={{ border: 'none', padding: 0, margin: 0 }}>
              <div className="form-grid">
                <label>
                  Pabellón
                  <select
                    required
                    disabled={!!formAula.id}
                    value={formAula.id_pabellon}
                    onChange={e =>
                      setFormAula(c => ({ ...c, id_pabellon: Number(e.target.value) }))
                    }
                  >
                    {formAula.id &&
                      !pabellones.find(p => p.id_pabellon === formAula.id_pabellon) && (
                        <option value={formAula.id_pabellon}>
                          {aulas.find(a => a.id_aula === formAula.id)?.pabellon_nombre}
                        </option>
                      )}
                    {pabellones.map(p => (
                      <option key={p.id_pabellon} value={p.id_pabellon}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Código del espacio
                  <input
                    required
                    maxLength={20}
                    value={formAula.codigo}
                    onChange={e => setFormAula(c => ({ ...c, codigo: e.target.value }))}
                  />
                </label>
                <label>
                  Tipo (Ej. 'Laboratorio de Cómputo', 'Auditorio')
                  <input
                    required
                    maxLength={50}
                    value={formAula.tipo}
                    onChange={e => setFormAula(c => ({ ...c, tipo: e.target.value }))}
                  />
                </label>
                <label>
                  Capacidad (personas)
                  <input
                    required
                    type="number"
                    min="1"
                    value={formAula.capacidad}
                    onChange={e =>
                      setFormAula(c => ({ ...c, capacidad: Number(e.target.value) }))
                    }
                  />
                </label>
                {formAula.id && (
                  <label>
                    Estado
                    <select
                      value={formAula.estado}
                      onChange={e => setFormAula(c => ({ ...c, estado: e.target.value }))}
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </label>
                )}
              </div>
              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="primary" type="submit">
                  {busy ? 'Guardando…' : 'Guardar aula'}
                </button>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setFormAula(null)}
                >
                  Cancelar
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </Modal>

      {/* MODAL EDICIÓN PABELLÓN */}
      <Modal
        isOpen={Boolean(formPabellon && canManage)}
        onClose={() => setFormPabellon(null)}
        title="Editar pabellón"
        maxWidth={480}
      >
        {formPabellon && canManage && (
          <form
            className="management-form"
            onSubmit={e => {
              e.preventDefault()
              saveEntity(
                '/pabellones',
                formPabellon,
                () => setFormPabellon(null),
                'Pabellón actualizado'
              )
            }}
          >
            <fieldset disabled={busy} style={{ border: 'none', padding: 0, margin: 0 }}>
              <div className="form-grid">
                <label>
                  Nombre del pabellón
                  <input
                    required
                    maxLength={50}
                    value={formPabellon.nombre}
                    onChange={e => setFormPabellon(c => ({ ...c, nombre: e.target.value }))}
                    placeholder="Ej. Pabellón Central"
                  />
                </label>
              </div>
              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="primary" type="submit">
                  {busy ? 'Guardando…' : 'Guardar pabellón'}
                </button>
                <button
                  className="secondary"
                  type="button"
                  onClick={() => setFormPabellon(null)}
                >
                  Cancelar
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </Modal>

      {/* TAB AULAS */}
      {tab === 'aulas' && !loadFailed && (
        <div>
          <div className="filter-grid">
            <label className="filter-card">
              <span>Capacidad mínima</span>
              <input
                type="number"
                min="1"
                value={capacityFilter}
                onChange={e => {
                  setCapacityFilter(e.target.value)
                  setPage(1)
                }}
                placeholder="Ej. 30"
              />
            </label>
            <label className="filter-card">
              <span>Filtrar por tipo</span>
              <select
                value={typeFilter}
                onChange={e => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
              >
                <option value="">Todos los tipos</option>
                {[...new Set(aulas.map(a => a.tipo))].sort().map(tipo => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginTop: '16px' }}>
            {loading ? (
              <p role="status">Cargando aulas…</p>
            ) : (
              <>
                <div className="table-scroll">
                  <table>
                    <caption>Espacios registrados · {filteredAulas.length} aulas</caption>
                    <thead>
                      <tr>
                        <th>Sede</th>
                        <th>Pabellón</th>
                        <th>Código</th>
                        <th>Tipo</th>
                        <th>Capacidad</th>
                        <th>Estado</th>
                        {canManage && <th>Acciones</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAulas.map(row => (
                        <tr key={row.id_aula}>
                          <td>{row.sede || 'Pendiente'}</td>
                          <td>{row.pabellon_nombre}</td>
                          <td>
                            <strong>{row.codigo}</strong>
                          </td>
                          <td>{row.tipo}</td>
                          <td>{row.capacidad} personas</td>
                          <td>
                            <span
                              className={
                                row.estado === 'activo'
                                  ? 'status-pill active'
                                  : 'status-pill inactive'
                              }
                            >
                              <span className="status-dot" aria-hidden="true">
                                ●
                              </span>
                              <span>{row.estado}</span>
                            </span>
                          </td>
                          {canManage && (
                            <td>
                              <div className="row-actions">
                                <button
                                  className="secondary"
                                  disabled={busy || loading || loadFailed}
                                  onClick={() => {
                                    setFormAula({ ...row, id: row.id_aula })
                                    setMessage('')
                                  }}
                                >
                                  <Pencil size={13} aria-hidden="true" />
                                  <span>Editar</span>
                                </button>
                                <button
                                  className="secondary danger-btn"
                                  disabled={busy || loading || loadFailed}
                                  aria-label={`Eliminar aula ${row.codigo}`}
                                  onClick={() => handleDeleteAula(row)}
                                >
                                  <Trash2 size={13} aria-hidden="true" />
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {!filteredAulas.length && (
                        <tr>
                          <td colSpan={canManage ? 7 : 6}>
                            No hay aulas que coincidan con los filtros.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  currentPage={validPage}
                  totalPages={totalPages}
                  totalItems={filteredAulas.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  itemLabel="aulas"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB PABELLONES */}
      {tab === 'pabellones' && !loadFailed && (
        <div style={{ marginTop: '16px' }}>
          {loading ? (
            <p role="status">Cargando pabellones…</p>
          ) : (
            <div className="table-scroll">
              <table>
                <caption>Pabellones registrados · {pabellones.length} pabellones</caption>
                <thead>
                  <tr>
                    <th>Nombre del pabellón</th>
                    <th>Aulas asignadas</th>
                    {canManage && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {pabellones.map(p => {
                    const countAulas = aulas.filter(
                      a => a.id_pabellon === p.id_pabellon && a.estado !== 'inactivo'
                    ).length
                    return (
                      <tr key={p.id_pabellon}>
                        <td>
                          <strong>{p.nombre}</strong>
                        </td>
                        <td>
                          <span className="status-pill active" style={{ fontWeight: 500 }}>
                            {countAulas} {countAulas === 1 ? 'aula' : 'aulas'}
                          </span>
                        </td>
                        {canManage && (
                          <td>
                            <div className="row-actions">
                              <button
                                className="secondary"
                                disabled={busy || loading || loadFailed}
                                aria-label={`Editar pabellón ${p.nombre}`}
                                onClick={() => {
                                  setFormPabellon({ id: p.id_pabellon, nombre: p.nombre })
                                  setMessage('')
                                }}
                              >
                                <Pencil size={13} aria-hidden="true" />
                                <span>Editar</span>
                              </button>
                              <button
                                className="secondary danger-btn"
                                disabled={busy || loading || loadFailed}
                                aria-label={`Eliminar pabellón ${p.nombre}`}
                                onClick={() => handleDeletePabellon(p)}
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
                  {!pabellones.length && (
                    <tr>
                      <td colSpan={canManage ? 3 : 2}>No hay pabellones registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
