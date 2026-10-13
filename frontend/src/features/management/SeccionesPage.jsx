import { useEffect, useState } from 'react'
import { api } from '../../services/management'
import GruposTurnos from './GruposTurnos'


export default function SeccionesPage({ context, onChanged }) {
    const [rows, setRows] = useState([])
    const [carreras, setCarreras] = useState([])
    const [asignaturas, setAsignaturas] = useState([])

    const [configurations, setConfigurations] = useState([])
    const [form, setForm] = useState(null)
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    // Extraer las carreras en las que el usuario es coordinador
    const managedCarrerasIds = context?.carreras || []
    const isAdmin = context?.isAdmin === true

    async function load(signal) {
        setLoading(true); setError('')
        try {
            const [dataSecciones, dataCarreras, dataAsig, dataConfigurations] = await Promise.all([
                api('/secciones', { signal }),
                api('/carreras', { signal }),
                api('/asignaturas', { signal }), api('/cuadriculas', { signal })
            ])
            if (!signal?.aborted) {
                setRows(dataSecciones)
                setCarreras(dataCarreras)
                setAsignaturas(dataAsig)
                setConfigurations(dataConfigurations)
            }
        } catch (e) {
            if (!signal?.aborted) setError(e.message)
        } finally {
            if (!signal?.aborted) setLoading(false)
        }
    }

    useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort() }, [])

    const periodId = context?.activePeriod?.id_periodo
    const scope = JSON.stringify(context?.carreras || [])
    useEffect(() => { setForm(null); setMessage(''); setError('') }, [periodId, context?.canManageSecciones, isAdmin, scope])
    const canEditForm = form && context?.canManageSecciones && form.id_periodo === periodId && (isAdmin || managedCarrerasIds.includes(form.id_carrera))

    const activeCarreras = carreras.filter(c => c.estado === 'activo' && (isAdmin || managedCarrerasIds.includes(c.id_carrera)))

    async function save(e) {
        e.preventDefault()
        if (busy || !canEditForm) return
        setBusy(true); setError(''); setMessage('')
        try {
            await api('/secciones', { method: 'PATCH', data: form })
            setMessage('Grupo actualizado.')
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

    const availableAsignaturas = form ? asignaturas.filter(a => a.id_carrera === form.id_carrera && a.ano_estudio === form.ano_estudio && (a.estado === 'activo' || form.asignaturas.includes(a.id_asignatura))) : []

    return <section aria-labelledby="secciones-title">
        <div className="section-heading">
            <div><h2 id="secciones-title">Años de carrera</h2><p className="muted">Estudiantes y turno por año de carrera para el semestre {context?.activePeriod?.nombre || 'vigente'}.</p></div>
        </div>

        <p className="notice">Estos datos forman parte de la entrega del coordinador. Cada año de carrera reúne a sus estudiantes en un único grupo. Aquí se revisan los años ya registrados, su cantidad de estudiantes y el turno que les corresponde. No es un alta de secciones adicionales.</p>
        {!context?.activePeriod && <div className="banner info">No hay un semestre académico activo definido.</div>}

        {error && <p role="alert" className="error">{error} <button className="secondary" disabled={busy||loading} onClick={()=>load()}>Recargar grupos</button></p>}
        {message && <p role="status" className="success">{message}</p>}

        {canEditForm && <form className="management-form" onSubmit={save}>
            <h3>Corregir grupo</h3>
            <fieldset disabled={busy}><div className="form-grid">
                <label>Carrera
                    <select required disabled={!!form.id} value={form.id_carrera} onChange={e => { field('id_carrera', Number(e.target.value)); field('asignaturas', []) }}>
                        {form.id && !activeCarreras.find(c => c.id_carrera === form.id_carrera) && (
                            <option value={form.id_carrera}>{carreras.find(c => c.id_carrera === form.id_carrera)?.nombre}</option>
                        )}
                        {activeCarreras.map(c => <option key={c.id_carrera} value={c.id_carrera}>{c.nombre}</option>)}
                    </select>
                </label>
                <label>Código del grupo<input required maxLength={20} value={form.codigo} onChange={e => field('codigo', e.target.value)} /></label>
                <label>Año de estudio<input type="number" min="1" max="10" required value={form.ano_estudio} onChange={e => { field('ano_estudio', Number(e.target.value)); field('asignaturas', []) }} /></label>
                <label>Cantidad de estudiantes<input type="number" min="1" required value={form.cantidad_estudiantes} onChange={e => field('cantidad_estudiantes', Number(e.target.value))} /></label>

                <div style={{ gridColumn: '1 / -1' }}>
                    <strong>Asignaturas del grupo (misma carrera y año)</strong>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        {availableAsignaturas.map(a => <label key={a.id_asignatura} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal' }}>
                            <input type="checkbox" checked={form.asignaturas.includes(a.id_asignatura)} onChange={() => toggleAsignatura(a.id_asignatura)} />
                            {a.codigo} - {a.nombre}
                        </label>)}
                        {!availableAsignaturas.length && <em className="muted">No hay asignaturas en este nivel para la carrera elegida.</em>}
                    </div>
                </div>
            </div>
                <div className="form-actions"><button className="primary" type="submit">{busy ? 'Guardando…' : 'Guardar grupo'}</button><button className="secondary" type="button" onClick={() => setForm(null)}>Cancelar</button></div>
            </fieldset>
        </form>}

        {loading ? <p role="status">Cargando grupos…</p> : !error && context?.activePeriod && <GruposTurnos key={periodId} context={context} groups={rows} configurations={configurations} onEdit={row => { setForm({...row,id:row.id_seccion}); setMessage(''); setError('') }}/>}
    </section>
}
