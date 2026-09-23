import { useState } from 'react'
import { getApiHealth } from '../services/api'
import { supabaseConfigured } from '../lib/supabase'

const modules = [
  ['01', 'Programación académica', 'Organizar carreras, docentes, asignaturas y espacios.'],
  ['02', 'Planificación de horarios', 'Distribuir las clases y revisar posibles conflictos.'],
  ['03', 'Consulta institucional', 'Consultar la programación revisada y publicada.'],
]

export default function HomePage() {
  const [status, setStatus] = useState('idle')
  async function checkConnection() {
    setStatus('loading')
    try {
      await getApiHealth()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }
  return (
    <>
      <section className="welcome">
        <p className="eyebrow">ORGANIZACIÓN · COORDINACIÓN · PLANIFICACIÓN</p>
        <h1>Un espacio para organizar<br />la vida académica.</h1>
        <p className="intro">AcaPlan reunirá la programación de las carreras y facilitará la elaboración de los horarios del CUR-Chontales.</p>
        <span className="stage">Base del proyecto · Desarrollo en curso</span>
      </section>
      <section aria-labelledby="modules-title">
        <div className="section-heading">
          <h2 id="modules-title">Lo que estamos construyendo</h2>
          <span>Próximos módulos</span>
        </div>
        <div className="module-grid">
          {modules.map(([number, title, description]) => (
            <article className="module-card" key={number}>
              <span className="module-number">{number}</span>
              <h3>{title}</h3><p>{description}</p>
              <span className="pending">Pendiente de implementación</span>
            </article>
          ))}
        </div>
      </section>
      <section className="setup-panel" aria-labelledby="setup-title">
        <div>
          <h2 id="setup-title">Comprobación del entorno de desarrollo</h2>
          <p>{supabaseConfigured
            ? 'La configuración pública de Supabase está cargada. La autenticación y el acceso a datos aún no se han comprobado.'
            : 'Falta una configuración pública válida de Supabase en frontend/.env.'}</p>
          <p role="status" aria-live="polite">
            {status === 'idle' && 'Puedes comprobar si el servidor local está disponible.'}
            {status === 'loading' && 'Comprobando el servidor…'}
            {status === 'success' && 'El backend de AcaPlan está disponible.'}
            {status === 'error' && 'No se pudo contactar con el backend. Comprueba que esté iniciado en el puerto 3001.'}
          </p>
        </div>
        <button type="button" onClick={checkConnection} disabled={status === 'loading'}>
          {status === 'loading' ? 'Comprobando…' : 'Comprobar servidor'}
        </button>
      </section>
    </>
  )
}
