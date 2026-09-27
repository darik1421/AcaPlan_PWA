import { useEffect, useState } from 'react'
import { api } from '../../services/management'

const emptyBloque = (id_periodo, dia) => ({ dia, hora_inicio: '08:00', hora_fin: '09:00', es_receso: false, id_periodo })
const diasSeleccion = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']

export default function BloquesPage({ context, onChanged }) {
    const [rows, setRows] = useState([])
    const [form, setForm] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    // Filtros UI
    const [filtroDia, setFiltroDia] = useState('LUNES')

    async function load(signal) {
        setLoading(true); setError('')
        try {
            const dataBloques = await api('/bloques', { signal })
            if (!signal?.aborted) setRows(dataBloques)
        } catch (e) {
            if (!signal?.aborted) setError(e.message)
        } finally {
            if (!signal?.aborted) setLoading(false)
        }
    }

    useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort() }, [])

    async function save(e) {
        e.preventDefault()
        if (busy) return
        setBusy(true); setError(''); setMessage('')
        try {
            await api('/bloques', { method: form.id ? 'PATCH' : 'POST', data: form })
            setMessage(form.id ? 'Bloque actualizado.' : 'Bloque registrado.')
            setForm(null); await load(); onChanged()
        } catch (err) { setError(err.message) }
        finally { setBusy(false) }
    }

    const field = (name, value) => setForm(current => ({ ...current, [name]: value }))

    // Render format
    const fmt = t => t.substring(0, 5)
    const visibles = rows.filter(r => r.id_periodo === context?.activePeriod?.id_periodo && r.dia === filtroDia)

    return <section aria-labelledby="bloques-title">
        <div className="section-heading">
            <div><h2 id="bloques-title">Bloques y Recesos</h2><p className="muted">Estructura horaria de {context?.activePeriod?.nombre || 'ningún periodo'}.</p></div>
            {context?.canManageBloques && context?.activePeriod && <button className="secondary" disabled={busy} onClick={() => { setForm(emptyBloque(context.activePeriod.id_periodo, filtroDia)); setMessage('') }}>Nuevo bloque {filtroDia.toLowerCase()}</button>}
        </div>

        {!context?.activePeriod && <div className="banner info">No hay un período académico activo definido. No se pueden gestionar bloques sin período.</div>}

        {error && <p role="alert" className="error">{error}</p>}
        {message && <p role="status" className="success">{message}</p>}

        {context?.activePeriod && <nav className="workspace-nav" style={{ marginBottom: '1rem' }}>
            {diasSeleccion.map(d => <button key={d} className={filtroDia === d ? 'selected' : ''} onClick={() => { setFiltroDia(d); if (form) setForm(c => ({ ...c, dia: d })) }}>{d}</button>)}
        </nav>}

        {form && <form className="management-form" onSubmit={save}>
            <h3>{form.id ? 'Editar bloque' : 'Nuevo bloque de clase / receso'}</h3>
            <fieldset disabled={busy}><div className="form-grid">
                <label>Día<select required value={form.dia} onChange={e => field('dia', e.target.value)}>{diasSeleccion.map(d => <option key={d}>{d}</option>)}</select></label>
                <label>Hora Inicio<input type="time" required value={form.hora_inicio} onChange={e => field('hora_inicio', e.target.value)} /></label>
                <label>Hora Fin<input type="time" required value={form.hora_fin} onChange={e => field('hora_fin', e.target.value)} /></label>
                <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><input type="checkbox" checked={form.es_receso} onChange={e => field('es_receso', e.target.checked)} /> Marcar como Receso (El sistema no permitirá agendar clases aquí)</label></div>
            </div>
                <div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…' : 'Guardar'}</button><button className="secondary" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
            </fieldset>
        </form>}

        {loading ? <p role="status" style={{ marginTop: '1rem' }}>Cargando bloques…</p> : context?.activePeriod && <div className="table-scroll" style={{ marginTop: '1rem' }}><table><caption>{visibles.length} bloques configurados para el día {filtroDia.toLowerCase()}</caption><thead><tr><th>Inicio</th><th>Fin</th><th>Duración / Tipo</th>{context?.canManageBloques && <th>Acciones</th>}</tr></thead><tbody>
            {visibles.map(row => <tr key={row.id_bloque}>
                <td><strong style={{ fontSize: '1.1em' }}>{fmt(row.hora_inicio)}</strong></td>
                <td><strong style={{ fontSize: '1.1em' }}>{fmt(row.hora_fin)}</strong></td>
                <td>{row.es_receso ? <span className="badge active" style={{ backgroundColor: 'var(--border)' }}>☕ Receso</span> : <span className="badge">Clase</span>}</td>
                {context?.canManageBloques && <td><button className="secondary" disabled={busy} onClick={() => { setForm({ ...row, hora_inicio: fmt(row.hora_inicio), hora_fin: fmt(row.hora_fin), id: row.id_bloque }); setMessage('') }}>Editar</button></td>}
            </tr>)}
            {!visibles.length && <tr><td colSpan={context?.canManageBloques ? 4 : 3}>No hay bloques creados en este día.</td></tr>}
        </tbody></table></div>}
    </section>
}
