import { Component, Suspense, lazy, useMemo, useState } from 'react'

class ScreenBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <section className="recovery-wrap"><div className="auth-card">
      <h2>No se pudo abrir el espacio de trabajo</h2>
      <p role="alert">Comprueba tu conexión y vuelve a intentarlo.</p>
      <button className="primary" onClick={this.props.onRetry}>Volver a intentar</button>
    </div></section> : this.props.children
  }
}

function WorkspaceContent({load}) {
  const Screen = useMemo(() => lazy(load), [load])
  return <Suspense fallback={<section className="recovery-wrap"><p role="status">Abriendo tu espacio de trabajo…</p></section>}>
      <Screen />
    </Suspense>
}

export default function DeferredWorkspace({load}) {
  const [attempt,setAttempt] = useState(0)
  // Al reintentar se desmonta también la instancia lazy que conserva el rechazo anterior.
  return <ScreenBoundary key={attempt} onRetry={()=>setAttempt(n=>n+1)}>
    <WorkspaceContent load={load}/>
  </ScreenBoundary>
}
