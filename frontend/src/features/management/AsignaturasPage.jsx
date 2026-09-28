import { useEffect, useState } from 'react'
import { api } from '../../services/management'

const empty = (id_carrera = '') => ({ nombre: '', codigo: '', id_carrera, ano_estudio: 1, horas_teoricas: 0, horas_practicas: 0 })

export default function AsignaturasPage({ context, canManage, onChanged }) {
    const [rows, setRows] = useState([])
    const [carreras, setCarreras] = useState([])
    const [form, setForm] = useState(null)
    const [query, setQuery] = useState('')
    const [careerFilter, setCareerFilter] = useState('')
    const [yearFilter, setYearFilter] = useState('')
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    async function load(signal) {
        setLoading(true); setError('')
        try {
            const [dataAsignaturas, dataCarreras] = await Promise.all([
                api('/asignaturas', { signal }),
                api('/carreras', { signal })
            ])
            if (!signal?.aborted) {
                setRows(dataAsignaturas)
                setCarreras(dataCarreras)
            }
        } catch (e) {
            if (!signal?.aborted) setError(e.message)
        } finally {
            if (!signal?.aborted) setLoading(false)
        }
    }

    useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort() }, [])

    const field = (name, value) => setForm(current => ({ ...current, [name]: value }))

    async function save(event) {
        event.preventDefault()
        if (busy) return
        setBusy(true); setError(''); setMessage('')
        try {
            await api('/asignaturas', { method: form.id ? 'PATCH' : 'POST', data: form })
            setMessage(form.id ? 'Asignatura actualizada.' : 'Asignatura registrada.')
            setForm(null); await load(); onChanged()
        } catch (e) { setError(e.message) }
        finally { setBusy(false) }
    }

    const filtered = rows.filter(r =>
        (!careerFilter || r.id_carrera === Number(careerFilter)) &&
        (!yearFilter || r.ano_estudio === Number(yearFilter)) &&
        (r.nombre.toLowerCase().includes(query.toLowerCase()) ||
        r.codigo.toLowerCase().includes(query.toLowerCase()) ||
        r.carrera_nombre.toLowerCase().includes(query.toLowerCase()))
    )

    const canEdit = id => canManage && (context?.isAdmin || context?.carreras?.includes(id))
    const activeCarreras = carreras.filter(c => c.estado === 'activo' && canEdit(c.id_carrera))

    return <section aria-labelledby="asignaturas-title">
        <div className="section-heading">
            <div><h2 id="asignaturas-title">Gestión de asignaturas</h2><p className="muted">Oferta académica y horas requeridas.</p></div>
            {canManage && <button className="secondary" disabled={busy || !activeCarreras.length} onClick={() => { setForm(empty(activeCarreras[0]?.id_carrera)); setMessage('') }}>Nueva asignatura</button>}
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        {message && <p role="status" className="success">{message}</p>}
        {form && <form className="management-form" onSubmit={save}>
            <h3>{form.id ? 'Editar asignatura' : 'Nueva asignatura'}</h3>
            <fieldset disabled={busy}><div className="form-grid">
                <label>Carrera
                    <select required disabled={!!form.id} value={form.id_carrera} onChange={e => field('id_carrera', Number(e.target.value))}>
                        {form.id && !activeCarreras.find(c => c.id_carrera === form.id_carrera) && (
                            <option value={form.id_carrera}>{carreras.find(c => c.id_carrera === form.id_carrera)?.nombre}</option>
                        )}
                        {activeCarreras.map(c => <option key={c.id_carrera} value={c.id_carrera}>{c.nombre}</option>)}
                    </select>
                </label>
                <label>Código<input required maxLength={20} value={form.codigo} onChange={e => field('codigo', e.target.value)} /></label>
                <label>Nombre de la asignatura<input required maxLength={100} value={form.nombre} onChange={e => field('nombre', e.target.value)} /></label>
                <label>Año de estudio<input type="number" min="1" max="10" required value={form.ano_estudio} onChange={e => field('ano_estudio', Number(e.target.value))} /></label>
                <label>Horas teóricas<input type="number" min="0" required value={form.horas_teoricas} onChange={e => field('horas_teoricas', Number(e.target.value))} /></label>
                <label>Horas prácticas<input type="number" min="0" required value={form.horas_practicas} onChange={e => field('horas_practicas', Number(e.target.value))} /></label>
                {form.id && <label>Estado<select value={form.estado} onChange={e => field('estado', e.target.value)}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>}
            </div>
                <div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…' : 'Guardar asignatura'}</button><button className="secondary" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
            </fieldset>
        </form>}
        <div className="list-toolbar">
            <label>Buscar asignaturas<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Código, nombre o carrera" /></label>
            <label>Filtrar por carrera<select value={careerFilter} onChange={e => setCareerFilter(e.target.value)}><option value="">Todas las carreras</option>{carreras.map(c => <option key={c.id_carrera} value={c.id_carrera}>{c.nombre}</option>)}</select></label>
            <label>Filtrar por año<select value={yearFilter} onChange={e => setYearFilter(e.target.value)}><option value="">Todos los años</option>{[...new Set(rows.map(r => r.ano_estudio))].sort((a,b) => a-b).map(year => <option key={year} value={year}>{year}</option>)}</select></label>
            <button className="secondary" disabled={busy || loading} onClick={() => load()}>Actualizar lista</button>
        </div>
        {loading ? <p role="status">Cargando asignaturas…</p> : <div className="table-scroll"><table><caption>{filtered.length} asignaturas</caption><thead><tr><th>Código</th><th>Asignatura</th><th>Carrera</th><th>Año</th><th>HT</th><th>HP</th><th>Estado</th>{canManage && <th>Acciones</th>}</tr></thead><tbody>
            {filtered.map(row => <tr key={row.id_asignatura}>
                <td>{row.codigo}</td><td>{row.nombre}</td><td>{row.carrera_nombre}</td><td>{row.ano_estudio}</td><td>{row.horas_teoricas}</td><td>{row.horas_practicas}</td>
                <td><span className={row.estado === 'activo' ? 'badge active' : 'badge'}>{row.estado}</span></td>
                {canManage && <td>{canEdit(row.id_carrera) && <button className="secondary" disabled={busy} aria-label={`Editar ${row.nombre}`} onClick={() => { setForm({ ...row, id: row.id_asignatura }); setMessage('') }}>Editar</button>}</td>}
            </tr>)}
            {!filtered.length && <tr><td colSpan={canManage ? 8 : 7}>No hay asignaturas que coincidan.</td></tr>}
        </tbody></table></div>}
    </section>
}
