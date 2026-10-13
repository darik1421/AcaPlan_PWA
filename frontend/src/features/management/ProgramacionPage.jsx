import { useCallback, useEffect, useState } from 'react'
import { api } from '../../services/management'
import ProgramacionResumen from './ProgramacionResumen'
import ImportacionPage from './ImportacionPage'

export default function ProgramacionPage({ context }) {
    const [rows, setRows] = useState([])
    const [secciones, setSecciones] = useState([])

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [filtroSeccion, setFiltroSeccion] = useState('')

    const load = useCallback(async (signal) => {
        setLoading(true); setError('')
        try {
            const [dataProg, dataSec] = await Promise.all([
                api('/programacion/detalle', { signal }),
                api('/secciones', { signal }),

            ])
            if (!signal?.aborted) {
                setRows(dataProg)
                const visibles = dataSec.filter(s => s.id_periodo === context?.activePeriod?.id_periodo)
                setSecciones(visibles)
                setFiltroSeccion(current => visibles.some(s => s.id_seccion === Number(current)) ? current : (visibles[0]?.id_seccion || ''))
            }
        } catch (e) {
            if (!signal?.aborted) setError(e.message)
        } finally {
            if (!signal?.aborted) setLoading(false)
        }
    }, [context?.activePeriod?.id_periodo])

    useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort() }, [load])

    const visibles = rows.filter(r => r.id_periodo === context?.activePeriod?.id_periodo && r.id_seccion === Number(filtroSeccion))
    return <section aria-labelledby="prog-title" className="management-page">
        <div className="section-heading">
            <div>
                <h2 id="prog-title">Asignaturas y docentes recibidos</h2>
                <p className="muted">Consulta las asignaturas y los docentes registrados para cada año de carrera en {context?.activePeriod?.nombre || 'ningún semestre'}.</p>
            </div>
        </div>

        <p className="notice">Consulta de asignaciones existentes. La carga principal será por Excel de los coordinadores, con correcciones puntuales en la aplicación. La plantilla definitiva y la edición adaptada están pendientes. Los bloques de registros anteriores no se convierten automáticamente a las sesiones nuevas.</p>
        {context?.canManageSecciones && <ImportacionPage/>}
        {!context?.activePeriod && <div className="banner info">No hay un semestre académico activo definido.</div>}

        {error && <div><p role="alert" className="error">{error}</p><button className="secondary" disabled={loading} onClick={() => load()}>Reintentar asignaciones</button></div>}

        {context?.activePeriod && <div className="list-toolbar">
            <label>Año de carrera a consultar:
                <select value={filtroSeccion} onChange={e => { setFiltroSeccion(e.target.value) }}>
                    {secciones.map(d => <option key={d.id_seccion} value={d.id_seccion}>{d.carrera_nombre} · {d.ano_estudio ? `Año ${d.ano_estudio}` : 'Año pendiente'} · {d.codigo}</option>)}
                    {!secciones.length && <option value="">Sin años de carrera registrados</option>}
                </select>
            </label>
        </div>}

        {loading ? <p role="status" style={{ marginTop: '1rem' }}>Cargando asignaciones…</p> : !error && context?.activePeriod && <div className="table-scroll" style={{ marginTop: '1rem' }}><table><caption>Asignaciones registradas para el año de carrera seleccionado</caption><thead><tr><th>Asignatura</th><th>Docente</th><th>Sesiones del registro anterior</th><th>Bloques del registro anterior</th><th>Laboratorio</th></tr></thead><tbody>
            {visibles.map(row => <tr key={row.id_programacion}>
                <td><strong style={{ fontSize: '1em' }}>{row.asignatura_nombre}</strong></td>
                <td>{row.docente_nombres} {row.docente_apellidos}</td>
                <td>{row.sesiones_semanales} a la semana</td>
                <td>{row.duracion_bloques} consecutivos</td>
                <td>{row.requisito_laboratorio ? 'Sí' : 'No requerido'}</td>
            </tr>)}
            {!visibles.length && <tr><td colSpan="5">No se han registrado pre-asignaciones docentes para este año de carrera.</td></tr>}
        </tbody></table></div>}
        <ProgramacionResumen key={context?.activePeriod?.id_periodo || 'sin-periodo'} activePeriodId={context?.activePeriod?.id_periodo} revision={0} />
    </section>
}
