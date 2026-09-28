import { useEffect, useState } from 'react'
import { api } from '../../services/management'

const empty = () => ({ nombre: '' })

export default function CarrerasPage({ canManage, onChanged }) {
    const [rows, setRows] = useState([])
    const [form, setForm] = useState(null)
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    async function load(signal) {
        setLoading(true); setError('')
        try { const data = await api('/carreras', { signal }); if (!signal?.aborted) setRows(data) }
        catch (e) { if (!signal?.aborted) setError(e.message) }
        finally { if (!signal?.aborted) setLoading(false) }
    }

    useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort() }, [])

    const field = (name, value) => setForm(current => ({ ...current, [name]: value }))

    async function save(event) {
        event.preventDefault()
        if (busy) return
        setBusy(true); setError(''); setMessage('')
        try {
            await api('/carreras', { method: form.id ? 'PATCH' : 'POST', data: form })
            setMessage(form.id ? 'Carrera actualizada.' : 'Carrera registrada.')
            setForm(null); await load(); onChanged()
        } catch (e) { setError(e.message) }
        finally { setBusy(false) }
    }

    const filtered = rows.filter(r => r.nombre.toLowerCase().includes(query.toLowerCase()))

    return <section aria-labelledby="carreras-title">
        <div className="section-heading">
            <div><h2 id="carreras-title">Gestión de carreras</h2><p className="muted">Catálogo institucional de carreras.</p></div>
            {canManage && <button className="secondary" disabled={busy} onClick={() => { setForm(empty()); setMessage('') }}>Nueva carrera</button>}
        </div>
        {error && <p role="alert" className="error">{error}</p>}
        {message && <p role="status" className="success">{message}</p>}
        {form && <form className="management-form" onSubmit={save}>
            <h3>{form.id ? 'Editar carrera' : 'Nueva carrera'}</h3>
            <fieldset disabled={busy}><div className="form-grid">
                <label>Nombre de la carrera<input required maxLength={150} value={form.nombre} onChange={e => field('nombre', e.target.value)} /></label>
                {form.id && <label>Estado<select value={form.estado} onChange={e => field('estado', e.target.value)}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>}
            </div>
                <div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…' : 'Guardar carrera'}</button><button className="secondary" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
            </fieldset>
        </form>}
        <div className="list-toolbar"><label>Buscar carreras<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nombre de la carrera" /></label><button className="secondary" disabled={busy || loading} onClick={() => load()}>Actualizar lista</button></div>
        {loading ? <p role="status">Cargando carreras…</p> : <div className="table-scroll"><table><caption>{filtered.length} carreras</caption><thead><tr><th>Nombre</th><th>Estado</th>{canManage && <th>Acciones</th>}</tr></thead><tbody>
            {filtered.map(row => <tr key={row.id_carrera}><td>{row.nombre}</td><td><span className={row.estado === 'activo' ? 'badge active' : 'badge'}>{row.estado}</span></td>{canManage && <td><button className="secondary" disabled={busy} aria-label={`Editar ${row.nombre}`} onClick={() => { setForm({ ...row, id: row.id_carrera }); setMessage('') }}>Editar</button></td>}</tr>)}
            {!filtered.length && <tr><td colSpan={canManage ? 3 : 2}>No hay carreras que coincidan.</td></tr>}
        </tbody></table></div>}
    </section>
}
