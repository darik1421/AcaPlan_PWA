import { useEffect, useState } from 'react'
import { api } from '../../services/management'

const emptyDisponibilidad = (id_docente, id_periodo, dia) => ({ id_docente, dia, hora_inicio: '08:00', hora_fin: '12:00', id_periodo })
const diasSeleccion = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO']

export default function DisponibilidadPage({ context, onChanged }) {
    const [rows, setRows] = useState([])
    const [docentes, setDocentes] = useState([])
    const [form, setForm] = useState(null)

    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const [filtroDocente, setFiltroDocente] = useState('')

    async function load(signal) {
        setLoading(true); setError('')
        try {
            const [dataDisp, dataDoc] = await Promise.all([
                api('/disponibilidad', { signal }),
                api('/docentes', { signal })
            ])
            if (!signal?.aborted) {
                setRows(dataDisp)
                setDocentes(dataDoc)
                if (dataDoc.length > 0 && !filtroDocente) setFiltroDocente(dataDoc[0].id_docente)
            }
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
            await api('/disponibilidad', { method: form.id ? 'PATCH' : 'POST', data: form })
            setMessage(form.id ? 'Disponibilidad actualizada.' : 'Disponibilidad registrada.')
            setForm(null); await load(); onChanged()
        } catch (err) { setError(err.message) }
        finally { setBusy(false) }
    }

    const field = (name, value) => setForm(current => ({ ...current, [name]: value }))

    const fmt = t => t.substring(0, 5)
    const visibles = rows.filter(r => r.id_periodo === context?.activePeriod?.id_periodo && r.id_docente === Number(filtroDocente))

    return <section aria-labelledby="disp-title">
        <div className="section-heading">
            <div><h2 id="disp-title">Disponibilidad Docente</h2><p className="muted">Bloques preautorizados para programar clases en {context?.activePeriod?.nombre || 'ningún periodo'}.</p></div>
            {context?.canManageDisponibilidad && context?.activePeriod && <button className="secondary" disabled={busy || !filtroDocente} onClick={() => { setForm(emptyDisponibilidad(Number(filtroDocente), context.activePeriod.id_periodo, 'LUNES')); setMessage('') }}>Nuevo Permiso</button>}
        </div>

        {!context?.activePeriod && <div className="banner info">No hay un período académico activo.</div>}

        {error && <p role="alert" className="error">{error}</p>}
        {message && <p role="status" className="success">{message}</p>}

        {context?.activePeriod && <div className="list-toolbar">
            <label>Docente seleccionado para ver su disponibilidad:
                <select value={filtroDocente} onChange={e => { setFiltroDocente(e.target.value); setForm(null); setMessage('') }}>
                    {docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
                    {!docentes.length && <option value="">Sin docentes registrados</option>}
                </select>
            </label>
        </div>}

        {form && <form className="management-form" onSubmit={save}>
            <h3>{form.id ? 'Editar bloque libre' : 'Registrar tiempo libre'}</h3>
            <fieldset disabled={busy}><div className="form-grid">
                <label>Docente seleccionado <input disabled value={docentes.find(d => d.id_docente === form.id_docente)?.nombres || ''} /></label>
                <label>Día<select required value={form.dia} onChange={e => field('dia', e.target.value)}>{diasSeleccion.map(d => <option key={d}>{d}</option>)}</select></label>
                <label>Hora Inicio del permiso<input type="time" required value={form.hora_inicio} onChange={e => field('hora_inicio', e.target.value)} /></label>
                <label>Hora Fin máxima<input type="time" required value={form.hora_fin} onChange={e => field('hora_fin', e.target.value)} /></label>
            </div>
                <div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…' : 'Guardar'}</button><button className="secondary" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
            </fieldset>
        </form>}

        {loading ? <p role="status" style={{ marginTop: '1rem' }}>Cargando agenda de disponibilidad…</p> : context?.activePeriod && <div className="table-scroll" style={{ marginTop: '1rem' }}><table><caption>Disponibilidad para el docente elegido</caption><thead><tr><th>Día de la semana</th><th>Hora de Inicio</th><th>Hora de Fin</th>{context?.canManageDisponibilidad && <th>Acciones</th>}</tr></thead><tbody>
            {visibles.map(row => <tr key={row.id_disponibilidad}>
                <td>{row.dia}</td>
                <td><strong style={{ fontSize: '1em' }}>{fmt(row.hora_inicio)}</strong></td>
                <td><strong style={{ fontSize: '1em' }}>{fmt(row.hora_fin)}</strong></td>
                {context?.canManageDisponibilidad && <td><button className="secondary" disabled={busy} onClick={() => { setForm({ ...row, hora_inicio: fmt(row.hora_inicio), hora_fin: fmt(row.hora_fin), id: row.id_disponibilidad }); setMessage('') }}>Editar</button></td>}
            </tr>)}
            {!visibles.length && <tr><td colSpan={context?.canManageDisponibilidad ? 4 : 3}>Este docente no tiene disponibilidad registrada. En programación institucional no se le podrán asignar clases.</td></tr>}
        </tbody></table></div>}
    </section>
}
