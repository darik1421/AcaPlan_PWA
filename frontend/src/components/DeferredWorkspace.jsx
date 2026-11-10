import { Component, Suspense, lazy, useMemo, useState } from 'react'
import AppLayout from './AppLayout'
import AccessPending from './AccessPending'

class ScreenBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed ? <AppLayout><section className="recovery-wrap"><div className="auth-card">
      <h2>No se pudo abrir el espacio de trabajo</h2>
      <p role="alert">Comprueba tu conexión y vuelve a intentarlo.</p>
      <button className="primary" onClick={this.props.onRetry}>Volver a intentar</button>
    </div></section></AppLayout> : this.props.children
  }
}

function WorkspaceContent({load}) {
  const Screen = useMemo(() => lazy(load), [load])
  return <Suspense fallback={<AccessPending message="Abriendo tu espacio de trabajo…"/>}>
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
