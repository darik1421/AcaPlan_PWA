import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/management'
import { RotateCw, Pencil, BookOpen, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'

export default function AsignaturasImportadas({
  context,
  canManage,
  onLinked,
  catalogRows,
  carreras = [],
  onChanged,
}) {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [careerFilter, setCareerFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [page, setPage] = useState(1)
  const [message, setMessage] = useState('')

  const PAGE_SIZE = 10

  const generation = useRef(0)
  const scope = JSON.stringify([canManage, context?.isAdmin, context?.carreras])

  useEffect(() => {
    const c = new AbortController()
    generation.current++
    setForm(null)
    setLoading(true)
    setError('')
    setBusy(false)

    api('/asignaturas/importadas', { signal: c.signal })
      .then(data => {
        if (!c.signal.aborted) {
          setRows(data)
          onLinked?.(data.map(r => r.id_asignatura).filter(Boolean))
        }
      })
      .catch(e => {
        if (!c.signal.aborted) {
          setError(e.message)
          setRows([])
        }
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false)
      })

    return () => {
      c.abort()
      generation.current++
    }
  }, [attempt, scope, onLinked])

  async function handleDelete(r) {
    if (busy || loading || !mayEdit(r)) return
    if (!window.confirm(`¿Estás seguro de que deseas dar de baja el componente «${r.nombre}»?`)) return
    const current = generation.current
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const targetId = r.id_asignatura || (catalogRows?.find(c => c.codigo === r.codigo)?.id_asignatura)
      if (targetId) {
        await api('/asignaturas', {
          method: 'PATCH',
          data: {
            id: targetId,
            nombre: r.nombre,
            codigo: r.codigo,
            ano_estudio: r.ano_estudio,
            horas_teoricas: 0,
            horas_practicas: 0,
            estado: 'inactivo',
          },
        })
      }
      setRows(rows => rows.filter(item => item.id !== r.id))
      setMessage('Componente curricular dado de baja.')
      onChanged?.()
    } catch (err) {
      if (current === generation.current) {
        setError(err.message)
      }
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  const mayEdit = r =>
    canManage && (context?.isAdmin || context?.carreras?.includes(r.id_carrera))

  async function save(e) {
    e.preventDefault()
    if (busy || !form || !mayEdit(form)) return
    const current = generation.current
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api('/asignaturas/importadas', {
        method: 'PATCH',
        data: { id: form.id, nombre: form.nombre, huella: form.huella },
      })

      const targetId = form.id_asignatura || (catalogRows?.find(c => c.codigo === form.codigo)?.id_asignatura)
      if (targetId) {
        try {
          await api('/asignaturas', {
            method: 'PATCH',
            data: {
              id: targetId,
              nombre: form.nombre,
              codigo: form.codigo,
              ano_estudio: Number(form.ano_estudio),
              horas_teoricas: Number(form.horas_teoricas ?? 0),
              horas_practicas: Number(form.horas_practicas ?? 0),
              estado: form.estado || 'activo',
            },
          })
        } catch {
          // Si el catálogo general no admite la modificación adicional, se conserva la actualización importada
        }
      }

      if (current === generation.current) {
        setMessage('Nombre del componente curricular corregido.')
        setForm(null)
        setAttempt(n => n + 1)
        onChanged?.()
      }
    } catch (err) {
      if (current === generation.current) {
        setError(`${err.message} Actualiza la lista antes de volver a corregir.`)
        setForm(null)
      }
    } finally {
      if (current === generation.current) setBusy(false)
    }
  }

  const uniqueCareers = Array.from(
    new Map([
      ...carreras.filter(c => c?.nombre).map(c => [c.nombre, { id: c.id_carrera, nombre: c.nombre }]),
      ...rows.filter(r => r?.carrera).map(r => [r.carrera, { id: r.id_carrera, nombre: r.carrera }]),
    ]).values()
  ).sort((a, b) => a.nombre.localeCompare(b.nombre))

  const uniqueYears = Array.from(
    new Set(rows.map(r => r.ano_estudio).filter(Boolean))
  ).sort((a, b) => a - b)

  const filtered = rows.filter(r => {
    const matchesQuery =
      !query ||
      [r.codigo, r.nombre, r.carrera]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase())

    const matchesCareer =
      !careerFilter ||
      String(r.carrera) === String(careerFilter) ||
      String(r.id_carrera) === String(careerFilter)

    const matchesYear =
      !yearFilter || Number(r.ano_estudio) === Number(yearFilter)

    return matchesQuery && matchesCareer && matchesYear
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1
  const validPage = Math.min(Math.max(1, page), totalPages)
  const paginated = filtered.slice((validPage - 1) * PAGE_SIZE, validPage * PAGE_SIZE)

  return (
    <section className="surface-card" style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <BookOpen size={20} color="#302C91" />
        <h3 className="card-title" style={{ margin: 0 }}>
          Componentes curriculares recibidos por Excel
        </h3>
      </div>
      <p className="muted" style={{ margin: '4px 0 16px 0', fontSize: '13.5px' }}>
        Componentes curriculares registrados e importados para el semestre activo. Edita el nombre, código, año y estado directamente desde cada fila.
      </p>

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
        <label className="filter-card" style={{ width: '100%', boxSizing: 'border-box' }}>
          <span>Buscar componentes importados</span>
          <input
            type="search"
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Código, nombre o carrera…"
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <label className="filter-card">
            <span>Filtrar carrera</span>
            <select
              value={careerFilter}
              onChange={e => {
                setCareerFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Todas las carreras</option>
              {uniqueCareers.map(c => (
                <option key={c.id || c.nombre} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-card">
            <span>Filtrar año</span>
            <select
              value={yearFilter}
              onChange={e => {
                setYearFilter(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Todos los años</option>
              {uniqueYears.map(yr => (
                <option key={yr} value={yr}>
                  Año {yr}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button
          className="secondary"
          disabled={busy || loading}
          onClick={() => {
            setAttempt(n => n + 1)
            setPage(1)
          }}
        >
          <RotateCw size={14} className={loading ? 'spin' : ''} aria-hidden="true" />
          <span>Actualizar componentes importados</span>
        </button>
      </div>

      <Modal
        isOpen={Boolean(form)}
        onClose={() => setForm(null)}
        title={form ? `Editar componente · ${form.codigo}` : 'Editar componente'} maxWidth={620}
      >
        {form && (
          <form className="management-form" onSubmit={save} style={{ marginBottom: '20px' }}>
            <fieldset disabled={busy} style={{ border: 'none', padding: 0, margin: 0 }}>
              <div className="form-grid">
                <label>
                  Código
                  <input
                    required
                    maxLength={20}
                    value={form.codigo || ''}
                    onChange={e => setForm(c => ({ ...c, codigo: e.target.value.toUpperCase() }))}
                  />
                </label>
                <label className="col-span-full">
                  Nombre del componente curricular importado
                  <input
                    required
                    maxLength={form.id_asignatura ? 100 : 150}
                    value={form.nombre || ''}
                    onChange={e => setForm(c => ({ ...c, nombre: e.target.value }))}
                  />
                </label>
                <label>
                  Carrera
                  <input
                    disabled
                    value={form.carrera || ''}
                  />
                </label>
                <label>
                  Año de estudio
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={form.ano_estudio || ''}
                    onChange={e => setForm(c => ({ ...c, ano_estudio: Number(e.target.value) }))}
                  />
                </label>
                <label>
                  Horas teóricas
                  <input
                    type="number"
                    min="0"
                    value={form.horas_teoricas ?? 0}
                    onChange={e => setForm(c => ({ ...c, horas_teoricas: Number(e.target.value) }))}
                  />
                </label>
                <label>
                  Horas prácticas
                  <input
                    type="number"
                    min="0"
                    value={form.horas_practicas ?? 0}
                    onChange={e => setForm(c => ({ ...c, horas_practicas: Number(e.target.value) }))}
                  />
                </label>
                <label>
                  Estado
                  <select
                    value={form.estado || 'activo'}
                    onChange={e => setForm(c => ({ ...c, estado: e.target.value }))}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </label>
              </div>
              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="primary" type="submit" aria-label="Guardar nombre">
                  Guardar cambios
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setForm(null)}
                >
                  Cancelar
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </Modal>

      {loading ? (
        <p role="status">Consultando componentes importados…</p>
      ) : error && rows.length === 0 ? null : (
        <>
          <div className="table-scroll">
          <table>
            <caption>Catálogo recibido por Excel</caption>
            <thead>
              <tr>
                <th>Código</th>
                <th>Componente</th>
                <th>Carrera</th>
                <th>Año</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(r => (
                <tr key={r.id}>
                  <td>
                    <span className="badge-code">{r.codigo}</span>
                  </td>
                  <td>
                    <strong>{r.nombre}</strong>
                  </td>
                  <td>{r.carrera}</td>
                  <td>Año {r.ano_estudio}</td>
                  <td className="row-actions-cell" style={{ whiteSpace: 'nowrap', width: '1%' }}>
                    {mayEdit(r) && (
                      <div className="row-actions" style={{ display: 'inline-flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', gap: '8px' }}>
                        <button
                          className="secondary"
                          disabled={busy}
                          aria-label={`Corregir nombre de ${r.codigo}`}
                          onClick={() => {
                            const existingCatalog = catalogRows?.find(c => c.codigo === r.codigo)
                            setForm({
                              ...r,
                              horas_teoricas: r.horas_teoricas ?? existingCatalog?.horas_teoricas ?? 0,
                              horas_practicas: r.horas_practicas ?? existingCatalog?.horas_practicas ?? 0,
                              estado: r.estado || existingCatalog?.estado || 'activo',
                            })
                            setMessage('')
                          }}
                        >
                          <Pencil size={13} aria-hidden="true" />
                          <span>Editar</span>
                        </button>
                        <button
                          className="secondary danger-btn"
                          disabled={busy}
                          aria-label={`Eliminar ${r.nombre}`}
                          onClick={() => handleDelete(r)}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={5}>No hay componentes importados.</td>
                </tr>
              ) : !filtered.length ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No hay componentes importados que coincidan con los filtros.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={validPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemLabel="componentes"
        />
        </>
      )}
    </section>
  )
}
