export default function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="AcaPlan, inicio">
          <span className="brand-mark" aria-hidden="true">A</span>
          <span>AcaPlan<small>PLANIFICACIÓN ACADÉMICA</small></span>
        </a>
        <span className="institution">UNAN-Managua <strong>CUR-Chontales</strong></span>
      </header>
      <main>{children}</main>
      <footer>UNAN-Managua · CUR-Chontales <span>AcaPlan PWA · En desarrollo</span></footer>
    </div>
  )
}
