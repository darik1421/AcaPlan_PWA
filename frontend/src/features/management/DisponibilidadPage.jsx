import { useCallback, useEffect, useState } from 'react'
import RestriccionesPanel from './RestriccionesPanel'
import { api } from '../../services/management'


export default function DisponibilidadPage({ context }) {
    const [rows, setRows] = useState([])
    const [docentes, setDocentes] = useState([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [filtroDocente, setFiltroDocente] = useState('')

    const load = useCallback(async (signal) => {
        setLoading(true); setError('')
        try {
            const [dataDisp, dataDoc] = await Promise.all([
                api('/disponibilidad', { signal }),
                api('/docentes', { signal })
            ])
            if (!signal?.aborted) {
                setRows(dataDisp)
                setDocentes(dataDoc)
                setFiltroDocente(current => dataDoc.some(d => d.id_docente === Number(current)) ? current : (dataDoc[0]?.id_docente || ''))
            }
        } catch (e) {
            if (!signal?.aborted) setError(e.message)
        } finally {
            if (!signal?.aborted) setLoading(false)
        }
    }, [])

    useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort() }, [load])

    const fmt = t => t.substring(0, 5)
    const visibles = rows.filter(r => r.id_periodo === context?.activePeriod?.id_periodo && r.id_docente === Number(filtroDocente))

    return <section aria-labelledby="disp-title">
        <div className="section-heading">
            <div><h2 id="disp-title">Restricciones</h2><p className="muted">Restricciones comunicadas para {context?.activePeriod?.nombre || 'ningún semestre'}.</p></div>
        </div>

        {!context?.activePeriod && <div className="banner info">No hay un semestre académico activo.</div>}

        {error && <p role="alert" className="error">{error}</p>}

        <RestriccionesPanel context={context} docentes={docentes}/>
        <details><summary>Consultar disponibilidad del modelo anterior</summary>
        <p>Estos intervalos son disponibilidad histórica; no se convierten en restricciones.</p>
        {context?.activePeriod && <div className="list-toolbar">
            <label>Docente seleccionado para ver su disponibilidad:
                <select value={filtroDocente} onChange={e => { setFiltroDocente(e.target.value) }}>
                    {docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
                    {!docentes.length && <option value="">Sin docentes registrados</option>}
                </select>
            </label>
        </div>}

        {loading ? <p role="status" style={{ marginTop: '1rem' }}>Cargando agenda de disponibilidad…</p> : context?.activePeriod && <div className="table-scroll" style={{ marginTop: '1rem' }}><table><caption>Disponibilidad para el docente elegido</caption><thead><tr><th>Día de la semana</th><th>Hora de Inicio</th><th>Hora de Fin</th></tr></thead><tbody>
            {visibles.map(row => <tr key={row.id_disponibilidad}>
                <td>{row.dia}</td>
                <td><strong style={{ fontSize: '1em' }}>{fmt(row.hora_inicio)}</strong></td>
                <td><strong style={{ fontSize: '1em' }}>{fmt(row.hora_fin)}</strong></td>
            </tr>)}
            {!visibles.length && <tr><td colSpan={3}>No hay intervalos anteriores registrados para este docente.</td></tr>}
        </tbody></table></div>}
        </details>
    </section>
}
