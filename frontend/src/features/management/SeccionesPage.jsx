import { useEffect, useState } from 'react'
import { api } from '../../services/management'

const emptySeccion = (id_carrera, id_periodo) => ({ codigo: '', id_carrera, id_periodo, ano_estudio: 1, cantidad_estudiantes: 30, asignaturas: [] })

export default function SeccionesPage({ context, onChanged }) {
    const [rows, setRows] = useState([])
    const [carreras, setCarreras] = useState([])
    const [asignaturas, setAsignaturas] = useState([])

    const [form, setForm] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    // Extraer las carreras en las que el usuario es coordinador
    const managedCarrerasIds = context?.permisos?.reduce((acc, p) => p.startsWith('coordinador:') ? [...acc, Number(p.split(':')[1])] : acc, []) || []
    const isAdmin = context?.perfil?.rol === 'administrador'

    async function load(signal) {
        setLoading(true); setError('')
        try {
            const [dataSecciones, dataCarreras, dataAsig] = await Promise.all([
                api('/secciones', { signal }),
                api('/carreras', { signal }),
                api('/asignaturas', { signal })
            ])
            if (!signal?.aborted) {
                setRows(dataSecciones)
                setCarreras(dataCarreras)
                setAsignaturas(dataAsig)
            }
        } catch (e) {
            if (!signal?.aborted) setError(e.message)
        } finally {
            if (!signal?.aborted) setLoading(false)
        }
    }

    useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort() }, [])

    const activeCarreras = carreras.filter(c => c.estado === 'activo' && (isAdmin || managedCarrerasIds.includes(c.id_carrera)))

    async function save(e) {
        e.preventDefault()
        if (busy) return
        setBusy(true); setError(''); setMessage('')
        try {
            await api('/secciones', { method: form.id ? 'PATCH' : 'POST', data: form })
            setMessage(form.id ? 'Sección actualizada.' : 'Sección registrada.')
            setForm(null); await load(); onChanged()
        } catch (err) { setError(err.message) }
        finally { setBusy(false) }
    }

    const field = (name, value) => setForm(current => ({ ...current, [name]: value }))

    const toggleAsignatura = (id_asig) => {
        setForm(current => {
            const selected = current.asignaturas.includes(id_asig)
            return { ...current, asignaturas: selected ? current.asignaturas.filter(id => id !== id_asig) : [...current.asignaturas, id_asig] }
        })
    }

    const availableAsignaturas = form ? asignaturas.filter(a => a.id_carrera === form.id_carrera && a.ano_estudio === form.ano_estudio) : []

    // Vista general filtrando a las que es coordinador (si no es admin)
    const visibleRows = rows.filter(r => isAdmin || managedCarrerasIds.includes(r.id_carrera))

    return <section aria-labelledby="secciones-title">
        <div className="section-heading">
            <div><h2 id="secciones-title">Secciones Académicas</h2><p className="muted">Grupos para el período {context?.activePeriod?.nombre || 'vigente'}.</p></div>
            {context?.canManageSecciones && context?.activePeriod && <button className="secondary" disabled={busy || activeCarreras.length === 0} onClick={() => {
                setForm(emptySeccion(activeCarreras[0]?.id_carrera, context.activePeriod.id_periodo));
                setMessage('')
            }}>Nueva sección</button>}
        </div>

        {!context?.activePeriod && <div className="banner info">No hay un período académico activo definido.</div>}

        {error && <p role="alert" className="error">{error}</p>}
        {message && <p role="status" className="success">{message}</p>}

        {form && <form className="management-form" onSubmit={save}>
            <h3>{form.id ? 'Editar sección' : 'Nueva sección'}</h3>
            <fieldset disabled={busy}><div className="form-grid">
                <label>Carrera
                    <select required disabled={!!form.id} value={form.id_carrera} onChange={e => field('id_carrera', Number(e.target.value))}>
                        {form.id && !activeCarreras.find(c => c.id_carrera === form.id_carrera) && (
                            <option value={form.id_carrera}>{carreras.find(c => c.id_carrera === form.id_carrera)?.nombre}</option>
                        )}
                        {activeCarreras.map(c => <option key={c.id_carrera} value={c.id_carrera}>{c.nombre}</option>)}
                    </select>
                </label>
                <label>Código se sección (Ej. GRUPO-A)<input required maxLength={20} value={form.codigo} onChange={e => field('codigo', e.target.value)} /></label>
                <label>Año de estudio<input type="number" min="1" max="10" required value={form.ano_estudio} onChange={e => { field('ano_estudio', Number(e.target.value)); field('asignaturas', []) }} /></label>
                <label>Cantidad aprox. estudiantes<input type="number" min="1" required value={form.cantidad_estudiantes} onChange={e => field('cantidad_estudiantes', Number(e.target.value))} /></label>

                <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Asignaturas del bloque (deben estar en la misma carrera y año)</strong>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {availableAsignaturas.map(a => <label key={a.id_asignatura} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal' }}>
                            <input type="checkbox" checked={form.asignaturas.includes(a.id_asignatura)} onChange={() => toggleAsignatura(a.id_asignatura)} />
                            {a.codigo} - {a.nombre}
                        </label>)}
                        {!availableAsignaturas.length && <em className="muted">No hay asignaturas en este nivel para la carrera elegida.</em>}
                    </div>
                </div>
            </div>
                <div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…' : 'Guardar sección'}</button><button className="secondary" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
            </fieldset>
        </form>}

        {loading ? <p role="status">Cargando…</p> : <div className="table-scroll"><table><caption>{visibleRows.length} secciones en {context?.activePeriod?.nombre}</caption><thead><tr><th>Carrera</th><th>Año</th><th>Sección</th><th>Estudiantes</th><th>Cant. Asignaturas</th>{context.canManageSecciones && <th>Acciones</th>}</tr></thead><tbody>
            {visibleRows.map(row => <tr key={row.id_seccion}>
                <td>{row.carrera_nombre}</td><td>{row.ano_estudio}</td><td>{row.codigo}</td><td>{row.cantidad_estudiantes}</td>
                <td>{row.asignaturas.length}</td>
                {context.canManageSecciones && <td><button className="secondary" disabled={busy} onClick={() => { setForm({ ...row, id: row.id_seccion }); setMessage('') }}>Editar</button></td>}
            </tr>)}
            {!visibleRows.length && <tr><td colSpan={context.canManageSecciones ? 6 : 5}>No hay secciones visibles en tu carrera u organización.</td></tr>}
        </tbody></table></div>}
    </section>
}
