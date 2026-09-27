import { useEffect, useState } from 'react'
import { api } from '../../services/management'

const emptyForm = (id_periodo, id_seccion) => ({
    id_periodo, id_seccion: id_seccion || '', id_asignatura: '', id_docente: '',
    sesiones_semanales: 2, duracion_bloques: 1, requisito_laboratorio: false
})

export default function ProgramacionPage({ context, onChanged }) {
    const [rows, setRows] = useState([])
    const [secciones, setSecciones] = useState([])
    const [asignaturas, setAsignaturas] = useState([])
    const [docentes, setDocentes] = useState([])

    const [form, setForm] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const [filtroSeccion, setFiltroSeccion] = useState('')

    // El coordinador solo puede gestionar las carreras donde tiene permisos
    const managedCarrerasIds = context?.permisos?.reduce((acc, p) => p.startsWith('coordinador:') ? [...acc, Number(p.split(':')[1])] : acc, []) || []
    const isAdmin = context?.perfil?.rol === 'administrador'

    async function load(signal) {
        setLoading(true); setError('')
        try {
            const [dataProg, dataSec, dataAsig, dataDocentes] = await Promise.all([
                api('/programacion', { signal }),
                api('/secciones', { signal }),
                api('/asignaturas', { signal }),
                api('/docentes', { signal })
            ])
            if (!signal?.aborted) {
                setRows(dataProg)
                setDocentes(dataDocentes)
                setAsignaturas(dataAsig)
                // Filtramos las secciones a solo aquellas visibles para este coordinador
                const visibles = dataSec.filter(s => isAdmin || managedCarrerasIds.includes(s.id_carrera))
                setSecciones(visibles)
                if (visibles.length > 0 && !filtroSeccion) setFiltroSeccion(visibles[0].id_seccion)
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
            await api('/programacion', { method: 'POST', data: form })
            setMessage('Necesidad académica registrada con éxito.')
            setForm(null); await load(); onChanged()
        } catch (err) { setError(err.message) }
        finally { setBusy(false) }
    }

    async function remove(id) {
        if (!window.confirm('¿Eliminar esta programación?')) return
        setBusy(true); setError(''); setMessage('')
        try {
            await api('/programacion/delete', { method: 'POST', data: { id } })
            setMessage('Registro eliminado.')
            await load(); onChanged()
        } catch (err) { setError(err.message) }
        finally { setBusy(false) }
    }

    const field = (name, value) => setForm(current => ({ ...current, [name]: value }))

    const visibles = rows.filter(r => r.id_periodo === context?.activePeriod?.id_periodo && r.id_seccion === Number(filtroSeccion))
    const asignaturasParaSeccion = asignaturas.filter(a => secciones.find(s => s.id_seccion === Number(filtroSeccion))?.asignaturas.includes(a.id_asignatura))

    return <section aria-labelledby="prog-title" className="management-page">
        <div className="section-heading">
            <div>
                <h2 id="prog-title">Programación Académica</h2>
                <p className="muted">Define los requerimientos (asignaturas y docentes) de cada grupo para el motor de generación en {context?.activePeriod?.nombre || 'ningún periodo'}.</p>
            </div>
            {context?.activePeriod && <button className="primary" disabled={busy || !filtroSeccion} onClick={() => { setForm(emptyForm(context.activePeriod.id_periodo, Number(filtroSeccion))); setMessage('') }}>Registrar Impartición</button>}
        </div>

        {!context?.activePeriod && <div className="banner info">No hay un período académico activo definido.</div>}

        {error && <p role="alert" className="error">{error}</p>}
        {message && <p role="status" className="success">{message}</p>}

        {context?.activePeriod && <div className="list-toolbar">
            <label>Sección a planificar:
                <select value={filtroSeccion} onChange={e => { setFiltroSeccion(e.target.value); setForm(null); setMessage('') }}>
                    {secciones.map(d => <option key={d.id_seccion} value={d.id_seccion}>{d.codigo} · {d.carrera_nombre}</option>)}
                    {!secciones.length && <option value="">Sin secciones disponibles</option>}
                </select>
            </label>
        </div>}

        {form && <form className="management-form" onSubmit={save}>
            <h3>Nueva Asignación de Grupo</h3>
            <fieldset disabled={busy}><div className="form-grid">
                <label>Sección seleccionada <input disabled value={secciones.find(s => s.id_seccion === form.id_seccion)?.codigo || ''} /></label>

                <label>Asignatura de la malla
                    <select required value={form.id_asignatura} onChange={e => field('id_asignatura', Number(e.target.value))}>
                        <option value="">-- Seleccione una Asignatura --</option>
                        {asignaturasParaSeccion.map(a => <option key={a.id_asignatura} value={a.id_asignatura}>{a.nombre}</option>)}
                    </select>
                </label>

                <label>Docente requerido
                    <select required value={form.id_docente} onChange={e => field('id_docente', Number(e.target.value))}>
                        <option value="">-- Asigne un Docente --</option>
                        {docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
                    </select>
                </label>

                <label>Cantidad de Sesiones a la semana<input type="number" min="1" max="10" required value={form.sesiones_semanales} onChange={e => field('sesiones_semanales', Number(e.target.value))} /></label>
                <label>Duración (cant. de bloques por sesión)<input type="number" min="1" max="5" required value={form.duracion_bloques} onChange={e => field('duracion_bloques', Number(e.target.value))} /></label>

                <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><input type="checkbox" checked={form.requisito_laboratorio} onChange={e => field('requisito_laboratorio', e.target.checked)} /> Obligar a programar esta clase en un Laboratorio</label></div>
            </div>
                <div className="form-actions"><button className="primary" type="submit">{busy ? 'Registrando…' : 'Registrar'}</button><button className="secondary" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
            </fieldset>
        </form>}

        {loading ? <p role="status" style={{ marginTop: '1rem' }}>Cargando requerimientos de currícula…</p> : context?.activePeriod && <div className="table-scroll" style={{ marginTop: '1rem' }}><table><caption>Demanda de Impartición (Intenciones) para la sección seleccionada</caption><thead><tr><th>Asignatura</th><th>Docente</th><th>Cant. Sesiones</th><th>Bloques</th><th>Laboratorio</th><th>Acciones</th></tr></thead><tbody>
            {visibles.map(row => <tr key={row.id_programacion}>
                <td><strong style={{ fontSize: '1em' }}>{row.asignatura_nombre}</strong></td>
                <td>{row.docente_nombres} {row.docente_apellidos}</td>
                <td>{row.sesiones_semanales} a la semana</td>
                <td>{row.duracion_bloques} consecutivos</td>
                <td>{row.requisito_laboratorio ? 'Sí' : 'Normal'}</td>
                <td><button className="secondary" disabled={busy} onClick={() => remove(row.id_programacion)}>Eliminar</button></td>
            </tr>)}
            {!visibles.length && <tr><td colSpan="6">No se han registrado pre-asignaciones docentes para esta sección.</td></tr>}
        </tbody></table></div>}
    </section>
}
