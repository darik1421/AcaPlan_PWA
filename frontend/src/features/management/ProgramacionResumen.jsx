import { useEffect, useState } from 'react'
import { api } from '../../services/management'

export default function ProgramacionResumen({ activePeriodId, revision }) {
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [period, setPeriod] = useState(String(activePeriodId || ''))
  const [career, setCareer] = useState('')
  const [state, setState] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    setReport(null); setError('')
    api('/programacion/resumen', { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setReport(data)
    }).catch(e => { if (!controller.signal.aborted) setError(e.message) })
    return () => controller.abort()
  }, [revision, attempt, activePeriodId])
  const details = report?.detalles || []
  const periods = report?.periodos?.map(p => [p.id_periodo, p.nombre]) || [...new Map(details.map(r => [r.id_periodo, r.periodo_nombre])).entries()]
  const careers = report?.carreras?.map(c => [c.id_carrera, c.nombre]) || [...new Map(details.filter(r => !period || r.id_periodo === Number(period)).map(r => [r.id_carrera, r.carrera_nombre])).entries()]
  const selected = details.filter(r => (!period || r.id_periodo === Number(period)) && (!career || r.id_carrera === Number(career)))
  const rows = selected.filter(r => !state || r.estado === state)
  const empty = (report?.secciones_sin_asignaturas || []).filter(s => (!period || s.id_periodo === Number(period)) && (!career || s.id_carrera === Number(career)))
  return <section aria-labelledby="resumen-programacion-title">
    <h3 id="resumen-programacion-title">Consolidación institucional</h3>
    <p className="muted">Revisa la captura por semestre y carrera. Tener una programación registrada no significa que esté lista para generar o aprobar un horario.</p>
    <p className="muted">Los espacios de sesión indican lo que cabe en los bloques del turno, antes de comprobar ocupación de docentes, aulas y otras asignaturas.</p>
    {error ? <div role="alert" className="error">{error} <button type="button" className="secondary" onClick={() => setAttempt(n => n + 1)}>Reintentar resumen</button></div> : !report ? <p role="status">Cargando consolidación…</p> : <>
      <div className="list-toolbar">
        <label>Semestre del resumen<select value={period} onChange={e => { setPeriod(e.target.value); setCareer('') }}>
          <option value="">Todos los semestres</option>
          {activePeriodId && !periods.some(([id]) => id === activePeriodId) && <option value={activePeriodId}>Semestre activo (sin programación)</option>}
          {periods.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select></label>
        <label>Carrera del resumen<select value={career} onChange={e => setCareer(e.target.value)}><option value="">Todas las carreras</option>{careers.map(([id, name]) => <option key={id} value={id ?? ''}>{name}</option>)}</select></label>
        <label>Estado de captura<select value={state} onChange={e => setState(e.target.value)}><option value="">Todos</option><option value="sin_registrar">Sin registrar</option><option value="por_verificar">Registrada, por verificar</option><option value="captura_completa">Captura completa</option></select></label>
      </div>
      <p role="status">{selected.filter(r => r.id_programacion !== null).length} registradas · {selected.filter(r => r.estado === 'sin_registrar').length} sin registrar · {empty.length} secciones sin asignaturas.</p>
      {empty.length > 0 && <p className="banner info">Completa la malla de estas secciones: {empty.map(s => s.codigo).join(', ')}.</p>}
      <div className="table-scroll"><table>
        <caption>Programación registrada y pendientes de cada sección</caption>
        <thead><tr><th>Semestre / carrera</th><th>Sección / asignatura</th><th>Docente</th><th>Bloques del turno</th><th>Carga declarada</th><th>Estado y pendientes</th></tr></thead>
        <tbody>{rows.map((r, index) => <tr key={`${r.id_periodo}-${r.id_seccion}-${r.id_asignatura}-${r.id_programacion}-${index}`}>
          <td>{r.periodo_nombre}<span className="cell-detail">{r.carrera_nombre}</span></td>
          <td>{r.seccion_codigo}<span className="cell-detail">{r.asignatura_nombre}</span></td>
          <td>{r.docente_nombre || 'Sin docente'}</td>
          <td>{r.turno_configurado?.nombre ? <>
            <strong>{r.turno_configurado.nombre}</strong>
            <span className="cell-detail">Sesiones de {r.turno_configurado.minutos_sesion} minutos</span>
            <span className="cell-detail">{r.turno_configurado.capacidad_sesiones_sin_solapar} espacios de sesión sin solaparse</span>
            <span className="cell-detail">{r.turno_configurado.sesiones_semanales_regla_general
              ? `Regla general: ${r.turno_configurado.sesiones_semanales_regla_general} sesiones por asignatura a la semana`
              : 'Frecuencia semanal pendiente de definir'}</span>
            {r.turno_configurado.mensaje && <span className="cell-detail">{r.turno_configurado.mensaje}</span>}
          </> : r.turno_configurado?.mensaje || 'Sin configuración de turno comprobada'}</td>
          <td>{r.horas_carga ?? '—'} horas declaradas<span className="cell-detail">{r.sesiones_semanales ?? '—'} sesiones registradas</span><span className="cell-detail">Duración anterior pendiente de adaptación</span></td>
          <td><strong>{r.estado === 'sin_registrar' ? 'Sin registrar' : r.estado === 'captura_completa' ? 'Captura completa' : 'Registrada, por verificar'}</strong><ul>{r.pendientes.map(p => <li key={p}>{p}</li>)}</ul></td>
        </tr>)}{!rows.length && <tr><td colSpan="6">No hay necesidades que coincidan con los filtros.</td></tr>}</tbody>
      </table></div>
    </>}
  </section>
}
