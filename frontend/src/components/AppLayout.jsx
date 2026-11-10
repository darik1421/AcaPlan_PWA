import acaplanLogo from '../assets/acaplan-logo.png'

export default function AppLayout({ children }) {
  return <div className="login-viewport access-viewport">
    <div className="institutional-stripe" aria-hidden="true"><span className="stripe-blue"/><span className="stripe-yellow"/><span className="stripe-red"/></div>
    <div className="login-container">
      <header className="login-header"><a href="/" aria-label="AcaPlan, inicio"><img src={acaplanLogo} alt="AcaPlan" className="login-logo-img"/></a></header>
      <main className="access-main">{children}</main>
      <footer className="login-footer">AcaPlan · UNAN-Managua · CUR-Chontales</footer>
    </div>
  </div>
}
