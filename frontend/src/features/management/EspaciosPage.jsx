import PreparacionExcel from './PreparacionExcel'
import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import { Pencil, Building2 } from 'lucide-react'

export default function EspaciosPage({ canManage, onChanged, periodId }) {
  const [tab, setTab] = useState('aulas')
  const [pabellones, setPabellones] = useState([])
  const [aulas, setAulas] = useState([])
  const [capacityFilter, setCapacityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedAulaId, setSelectedAulaId] = useState(null)

  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Formularios
  const [formAula, setFormAula] = useState(null)

  async function load(signal) {
    setLoading(true)
    setError('')
    try {
      const [dataAulas, dataPabellones] = await Promise.all([
        api('/inventario', { signal }),
        api('/pabellones', { signal }),
      ])
      if (!signal?.aborted) {
        setAulas(dataAulas)
        setPabellones(dataPabellones)
      }
    } catch (e) {
      if (!signal?.aborted) setError(e.message)
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
      setMessage('')
    }
  }, [canManage])

  async function saveEntity(endpoint, payload, resetForm, successMsg) {
    if (busy || !canManage || !payload.id) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api(endpoint, { method: 'PATCH', data: payload })
      setMessage(successMsg)
      resetForm()
      await load()
      onChanged()
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

  const selectedAula =
    filteredAulas.find(a => a.id_aula === selectedAulaId) ||
    filteredAulas[0] ||
    null

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
        Importa el inventario desde Excel y confirma los datos revisados. La plantilla sigue siendo provisional. Las correcciones de aulas existentes se realizan desde su fila.
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

      {/* TABS */}
      {tab === 'aulas' && (
        <div>
          <div className="filter-grid">
            <label className="filter-card">
              <span>Capacidad mínima</span>
              <input
                type="number"
                min="1"
                value={capacityFilter}
                onChange={e => setCapacityFilter(e.target.value)}
                placeholder="Ej. 30"
              />
            </label>
            <label className="filter-card">
              <span>Filtrar por tipo</span>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
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

          <div className="two-column-layout">
            <div>
              {loading ? (
                <p role="status">Cargando aulas…</p>
              ) : (
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
                      {filteredAulas.map(row => {
                        const isSelected = selectedAula?.id_aula === row.id_aula
                        return (
                          <tr
                            key={row.id_aula}
                            className={isSelected ? 'selected-row' : ''}
                            onClick={() => setSelectedAulaId(row.id_aula)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{row.sede || 'Pendiente'}</td>
                            <td>{row.pabellon_nombre}</td>
                            <td><strong>{row.codigo}</strong></td>
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
                                <span className="status-dot" aria-hidden="true">●</span>
                                <span>{row.estado}</span>
                              </span>
                            </td>
                            {canManage && (
                              <td>
                                <button
                                  className="secondary"
                                  disabled={busy}
                                  onClick={e => {
                                    e.stopPropagation()
                                    setSelectedAulaId(row.id_aula)
                                    setFormAula({ ...row, id: row.id_aula })
                                    setMessage('')
                                  }}
                                >
                                  <Pencil size={13} aria-hidden="true" />
                                  <span>Editar</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        )
                      })}
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
              )}
            </div>

            {/* Right Column: Espacio seleccionado or Formulario de corrección */}
            <div>
              {formAula && canManage ? (
                <form
                  className="side-panel-card"
                  onSubmit={e => {
                    e.preventDefault()
                    saveEntity('/aulas', formAula, () => setFormAula(null), 'Aula actualizada')
                  }}
                >
                  <h3 className="card-title">Corregir aula</h3>
                  <p className="card-subtitle">Actualizar los datos del aula completa</p>
                  <fieldset disabled={busy} style={{ border: 'none', padding: 0, margin: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              ) : selectedAula ? (
                <div className="side-panel-card">
                  <h3 className="card-title">Espacio seleccionado</h3>
                  <p className="card-subtitle">Detalle del aula completa</p>
                  <div className="side-panel-detail-grid">
                    <div className="side-panel-item">
                      <span className="detail-label">Código del espacio</span>
                      <span className="detail-value">
                        <span className="badge-code">Aula: {selectedAula.codigo}</span>
                      </span>
                    </div>
                    <div className="side-panel-item">
                      <span className="detail-label">Tipo</span>
                      <span className="detail-value">{selectedAula.tipo}</span>
                    </div>
                    <div className="side-panel-item">
                      <span className="detail-label">Pabellón</span>
                      <span className="detail-value">{selectedAula.pabellon_nombre}</span>
                    </div>
                    <div className="side-panel-item">
                      <span className="detail-label">Capacidad</span>
                      <span className="detail-value">{selectedAula.capacidad} personas</span>
                    </div>

                    <div className="side-panel-item">
                      <span className="detail-label">Estado</span>
                      <div>
                        <span
                          className={
                            selectedAula.estado === 'activo'
                              ? 'status-pill active'
                              : 'status-pill inactive'
                          }
                        >
                          <span className="status-dot" aria-hidden="true">●</span>
                          <span>{selectedAula.estado}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      className="secondary"
                      style={{ width: '100%', marginTop: '6px' }}
                      onClick={() => {
                        setFormAula({ ...selectedAula, id: selectedAula.id_aula })
                        setMessage('')
                      }}
                    >
                      <Pencil size={14} aria-hidden="true" />
                      <span>Corregir este espacio</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="side-panel-card" style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <Building2 size={36} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
                  <h3 className="card-title" style={{ fontSize: '15px' }}>Ningún espacio seleccionado</h3>
                  <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                    Selecciona un aula de la tabla para ver su información.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'pabellones' && (
        <div className="surface-card">
          <h3 className="card-title">Pabellones registrados</h3>
          <p className="card-subtitle">Infraestructura del recinto universitario</p>
          {loading ? (
            <p role="status">Cargando pabellones…</p>
          ) : (
            <ul style={{ paddingLeft: '20px', lineHeight: '2' }}>
              {pabellones.map(p => (
                <li key={p.id_pabellon}>
                  <strong>{p.nombre}</strong>
                </li>
              ))}
              {!pabellones.length && <li>Vacío.</li>}
            </ul>
          )}
        </div>
      )}

    </section>
  )
}
