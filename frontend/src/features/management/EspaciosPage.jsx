import { useEffect, useState } from 'react'
import { api } from '../../services/management'

const emptyAula = (id_pabellon) => ({ codigo: '', tipo: 'aula', capacidad: 30, id_pabellon, recursos: [] })

export default function EspaciosPage({ canManage, onChanged }) {
    const [tab, setTab] = useState('aulas')
    const [pabellones, setPabellones] = useState([])
    const [recursos, setRecursos] = useState([])
    const [aulas, setAulas] = useState([])
    const [capacityFilter, setCapacityFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [resourceFilter, setResourceFilter] = useState('')

    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    // Formularios
    const [formAula, setFormAula] = useState(null)
    const [formPabellon, setFormPabellon] = useState(null)
    const [formRecurso, setFormRecurso] = useState(null)

    async function load(signal) {
        setLoading(true); setError('')
        try {
            const [dataAulas, dataPabellones, dataRecursos] = await Promise.all([
                api('/aulas', { signal }),
                api('/pabellones', { signal }),
                api('/recursos', { signal })
            ])
            if (!signal?.aborted) {
                setAulas(dataAulas); setPabellones(dataPabellones); setRecursos(dataRecursos)
            }
        } catch (e) {
            if (!signal?.aborted) setError(e.message)
        } finally {
            if (!signal?.aborted) setLoading(false)
        }
    }

    useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort() }, [])

    async function saveEntity(endpoint, payload, resetForm, successMsg) {
        if (busy) return
        setBusy(true); setError(''); setMessage('')
        try {
            await api(endpoint, { method: payload.id ? 'PATCH' : 'POST', data: payload })
            setMessage(successMsg)
            resetForm(); await load(); onChanged()
        } catch (e) { setError(e.message) }
        finally { setBusy(false) }
    }

    const toggleRecurso = (id_recurso) => {
        setFormAula(current => {
            const selected = current.recursos.includes(id_recurso)
            return { ...current, recursos: selected ? current.recursos.filter(id => id !== id_recurso) : [...current.recursos, id_recurso] }
        })
    }

    const filteredAulas = aulas.filter(a => (!capacityFilter || a.capacidad >= Number(capacityFilter)) &&
        (!typeFilter || a.tipo === typeFilter) && (!resourceFilter || a.recursos.includes(Number(resourceFilter))))

    return <section aria-labelledby="espacios-title">
        <div className="section-heading">
            <div><h2 id="espacios-title">Gestión de espacios</h2><p className="muted">Administración de pabellones, aulas y recursos físicos.</p></div>
        </div>

        <nav className="workspace-nav" aria-label="Espacios">
            <button className={tab === 'aulas' ? 'selected' : ''} onClick={() => setTab('aulas')}>Aulas y Laboratorios</button>
            <button className={tab === 'pabellones' ? 'selected' : ''} onClick={() => setTab('pabellones')}>Pabellones</button>
            <button className={tab === 'recursos' ? 'selected' : ''} onClick={() => setTab('recursos')}>Catálogo de Recursos</button>
        </nav>

        {error && <p role="alert" className="error">{error}</p>}
        {message && <p role="status" className="success">{message}</p>}

        {/* TABS */}
        {tab === 'aulas' && <div>
            {canManage && <button className="secondary" style={{ marginBottom: '1rem' }} disabled={busy || !pabellones.length} onClick={() => { setFormAula(emptyAula(pabellones[0]?.id_pabellon)); setMessage('') }}>Nueva aula</button>}
            {!loading && canManage && !pabellones.length && <p>Registra primero un pabellón para añadir aulas.</p>}

            {formAula && <form className="management-form" onSubmit={(e) => { e.preventDefault(); saveEntity('/aulas', formAula, () => setFormAula(null), formAula.id ? 'Aula actualizada' : 'Aula creada') }}>
                <h3>{formAula.id ? 'Editar aula' : 'Nueva aula'}</h3>
                <fieldset disabled={busy}><div className="form-grid">
                    <label>Pabellón
                        <select required disabled={!!formAula.id} value={formAula.id_pabellon} onChange={e => setFormAula(c => ({ ...c, id_pabellon: Number(e.target.value) }))}>
                            {formAula.id && !pabellones.find(p => p.id_pabellon === formAula.id_pabellon) && <option value={formAula.id_pabellon}>{aulas.find(a => a.id_aula === formAula.id)?.pabellon_nombre}</option>}
                            {pabellones.map(p => <option key={p.id_pabellon} value={p.id_pabellon}>{p.nombre}</option>)}
                        </select>
                    </label>
                    <label>Código del espacio<input required maxLength={20} value={formAula.codigo} onChange={e => setFormAula(c => ({ ...c, codigo: e.target.value }))} /></label>
                    <label>Tipo (Ej. 'Laboratorio de Cómputo', 'Auditorio')<input required maxLength={50} value={formAula.tipo} onChange={e => setFormAula(c => ({ ...c, tipo: e.target.value }))} /></label>
                    <label>Capacidad (personas)<input required type="number" min="1" value={formAula.capacidad} onChange={e => setFormAula(c => ({ ...c, capacidad: Number(e.target.value) }))} /></label>
                    {formAula.id && <label>Estado<select value={formAula.estado} onChange={e => setFormAula(c => ({ ...c, estado: e.target.value }))}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>}
                    <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Recursos asignados al aula</strong>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            {recursos.map(r => <label key={r.id_recurso} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal' }}>
                                <input type="checkbox" checked={formAula.recursos.includes(r.id_recurso)} onChange={() => toggleRecurso(r.id_recurso)} />
                                {r.nombre}
                            </label>)}
                            {!recursos.length && <em className="muted">No hay recursos en el catálogo.</em>}
                        </div>
                    </div>
                </div>
                    <div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…' : 'Guardar aula'}</button><button className="secondary" type="button" onClick={() => setFormAula(null)}>Cancelar</button></div>
                </fieldset>
            </form>}

            <div className="list-toolbar">
                <label>Capacidad mínima<input type="number" min="1" value={capacityFilter} onChange={e => setCapacityFilter(e.target.value)} /></label>
                <label>Filtrar por tipo<select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="">Todos los tipos</option>{[...new Set(aulas.map(a => a.tipo))].sort().map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}</select></label>
                <label>Filtrar por recurso<select value={resourceFilter} onChange={e => setResourceFilter(e.target.value)}><option value="">Todos los recursos</option>{recursos.map(r => <option key={r.id_recurso} value={r.id_recurso}>{r.nombre}</option>)}</select></label>
            </div>
            {loading ? <p role="status">Cargando aulas…</p> : <div className="table-scroll"><table><caption>{filteredAulas.length} aulas encontradas</caption><thead><tr><th>Pabellón</th><th>Código</th><th>Tipo</th><th>Capacidad</th><th>Recursos</th><th>Estado</th>{canManage && <th>Acciones</th>}</tr></thead><tbody>
                {filteredAulas.map(row => <tr key={row.id_aula}>
                    <td>{row.pabellon_nombre}</td><td>{row.codigo}</td><td>{row.tipo}</td><td>{row.capacidad}</td>
                    <td>{row.recursos.map(rid => recursos.find(r => r.id_recurso === rid)?.nombre).join(', ') || '-'}</td>
                    <td><span className={row.estado === 'activo' ? 'badge active' : 'badge'}>{row.estado}</span></td>
                    {canManage && <td><button className="secondary" disabled={busy} onClick={() => { setFormAula({ ...row, id: row.id_aula }); setMessage('') }}>Editar</button></td>}
                </tr>)}
                {!filteredAulas.length && <tr><td colSpan={canManage ? 7 : 6}>No hay aulas que coincidan con los filtros.</td></tr>}
            </tbody></table></div>}
        </div>}

        {tab === 'pabellones' && <div>
            {canManage && <button className="secondary" style={{ marginBottom: '1rem' }} disabled={busy} onClick={() => { setFormPabellon({ nombre: '' }); setMessage('') }}>Nuevo pabellón</button>}
            {formPabellon && <form className="management-form" onSubmit={(e) => { e.preventDefault(); saveEntity('/pabellones', formPabellon, () => setFormPabellon(null), 'Pabellón creado') }}>
                <h3>Nuevo pabellón</h3>
                <fieldset disabled={busy}><div className="form-grid">
                    <label>Nombre<input required maxLength={50} value={formPabellon.nombre} onChange={e => setFormPabellon(c => ({ ...c, nombre: e.target.value }))} /></label>
                </div><div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…' : 'Guardar'}</button><button className="secondary" type="button" onClick={() => setFormPabellon(null)}>Cancelar</button></div></fieldset>
            </form>}
            {loading ? <p role="status">Cargando pabellones…</p> : <ul>{pabellones.map(p => <li key={p.id_pabellon}>{p.nombre}</li>)}{!pabellones.length && <li>Vacío.</li>}</ul>}
        </div>}

        {tab === 'recursos' && <div>
            {canManage && <button className="secondary" style={{ marginBottom: '1rem' }} disabled={busy} onClick={() => { setFormRecurso({ nombre: '' }); setMessage('') }}>Nuevo recurso</button>}
            {formRecurso && <form className="management-form" onSubmit={(e) => { e.preventDefault(); saveEntity('/recursos', formRecurso, () => setFormRecurso(null), 'Recurso creado') }}>
                <h3>Nuevo recurso</h3>
                <fieldset disabled={busy}><div className="form-grid">
                    <label>Nombre del recurso (Ej. Proyector, Aire Acondicionado)<input required maxLength={50} value={formRecurso.nombre} onChange={e => setFormRecurso(c => ({ ...c, nombre: e.target.value }))} /></label>
                </div><div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…' : 'Guardar'}</button><button className="secondary" type="button" onClick={() => setFormRecurso(null)}>Cancelar</button></div></fieldset>
            </form>}
            {loading ? <p role="status">Cargando recursos…</p> : <ul>{recursos.map(p => <li key={p.id_recurso}>{p.nombre}</li>)}{!recursos.length && <li>Vacío.</li>}</ul>}
        </div>}
    </section>
}
