import { useEffect, useState } from 'react'
import { api } from '../../services/management'

const diasSeleccion = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']

export default function BloquesPage({ context }) {
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Filtros UI
    const [filtroDia, setFiltroDia] = useState('Lunes')

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

    // Render format
    const fmt = t => t.substring(0, 5)
    const duration = row => {
        const minutes = value => value.split(':').reduce((total, part, index) => total + Number(part) * [60, 1, 1 / 60][index], 0)
        return Number((minutes(row.hora_fin) - minutes(row.hora_inicio)).toFixed(2))
    }
    const visibles = rows.filter(r => r.id_periodo === context?.activePeriod?.id_periodo && r.dia === filtroDia)

    return <section aria-labelledby="bloques-title">
        <div className="section-heading">
            <div><h2 id="bloques-title">Bloques anteriores</h2><p className="muted">Estructura horaria de {context?.activePeriod?.nombre || 'ningún semestre'}.</p></div>
        </div>

        {!context?.activePeriod && <div className="banner info">No hay un semestre académico activo definido. No se pueden gestionar bloques sin semestre.</div>}

        {error && <p role="alert" className="error">{error}</p>}

        {context?.activePeriod && <nav className="workspace-nav" style={{ marginBottom: '1rem' }}>
            {diasSeleccion.map(d => <button key={d} className={filtroDia === d ? 'selected' : ''} onClick={() => setFiltroDia(d)}>{d}</button>)}
        </nav>}

        {loading ? <p role="status" style={{ marginTop: '1rem' }}>Cargando bloques…</p> : context?.activePeriod && <div className="table-scroll" style={{ marginTop: '1rem' }}><table><caption>{visibles.length} bloques configurados para el día {filtroDia.toLowerCase()}</caption><thead><tr><th>Inicio</th><th>Fin</th><th>Duración / Tipo</th></tr></thead><tbody>
            {visibles.map(row => <tr key={row.id_bloque}>
                <td><strong style={{ fontSize: '1.1em' }}>{fmt(row.hora_inicio)}</strong></td>
                <td><strong style={{ fontSize: '1.1em' }}>{fmt(row.hora_fin)}</strong></td>
                <td>{row.es_receso ? <span className="badge active" style={{ backgroundColor: 'var(--border)' }}>☕ Receso</span> : <span className="badge">Clase</span>} <span>{duration(row)} min</span></td>
            </tr>)}
            {!visibles.length && <tr><td colSpan={3}>No hay bloques creados en este día.</td></tr>}
        </tbody></table></div>}
    </section>
}
