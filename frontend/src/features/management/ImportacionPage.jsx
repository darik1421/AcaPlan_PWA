import { useEffect, useState } from 'react'
import { api } from '../../services/management'

// La plantilla se conserva como referencia; no admite cargas con el contrato anterior.
export default function ImportacionPage() {
  const [history, setHistory] = useState([])
  const [opened, setOpened] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!opened) return
    const controller = new AbortController()
    setLoading(true); setHistoryError('')
    api('/importacion/historial', { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setHistory(data) })
      .catch(e => { if (!controller.signal.aborted) setHistoryError(e.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [opened, attempt])
  async function download() {
    if (busy) return
    setBusy(true); setError('')
    try {
      const data = await api('/importacion/plantilla')
      const bytes = Uint8Array.from(atob(data.base64), char => char.charCodeAt(0))
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const link = document.createElement('a'); link.href = url; link.download = `EJEMPLO_${data.archivo}`; link.click()
      const revoke = URL.revokeObjectURL.bind(URL)
      setTimeout(() => revoke(url), 1000)
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  return <section aria-labelledby="import-title">
    <h3 id="import-title">Archivos de los coordinadores</h3>
    <p>El flujo será descargar la plantilla definitiva, completarla, subir el Excel, revisar sus datos y confirmar la carga. Por ahora conservamos únicamente el ejemplo anterior; no se pueden subir ni confirmar archivos con ese formato.</p>
    <button type="button" className="secondary" disabled={busy} onClick={download}>{busy ? 'Descargando…' : 'Descargar ejemplo XLSX'}</button>
    {error && <p role="alert" className="error">{error}</p>}
    <details onToggle={e => setOpened(e.currentTarget.open)}><summary>Mis importaciones anteriores</summary>
      {historyError ? <p role="alert" className="error">{historyError} <button className="secondary" onClick={() => setAttempt(n => n + 1)}>Reintentar historial</button></p> : loading ? <p role="status">Cargando historial…</p> : <div className="table-scroll"><table>
        <caption>Últimos intentos realizados con el modelo anterior</caption><thead><tr><th>Archivo</th><th>Fecha</th><th>Estado registrado</th></tr></thead>
        <tbody>{history.map(h => <tr key={h.id}><td>{h.archivo}</td><td>{new Date(h.creado).toLocaleString()}</td><td>{({preview:'Vista previa anterior',confirmed:'Confirmada en el modelo anterior',error:'Con errores',stale:'Datos cambiaron'})[h.estado] || h.estado}</td></tr>)}{!history.length && <tr><td colSpan="3">No hay importaciones anteriores.</td></tr>}</tbody>
      </table></div>}
    </details>
  </section>
}
