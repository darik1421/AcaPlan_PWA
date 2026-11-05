import AppLayout from './AppLayout'

export default function AccessPending({message}) {
 return <AppLayout><section className="recovery-wrap"><div className="auth-card access-status">
  <span className="access-spinner" aria-hidden="true"/>
  <p role="status">{message}</p>
 </div></section></AppLayout>
}
