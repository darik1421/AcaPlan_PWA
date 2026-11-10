import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'
import ComprobacionPublicacion from './ComprobacionPublicacion'
const labels={borrador:'En edición',en_revision:'En revisión',aprobado:'Aprobado',publicado:'Publicado'}
const next={borrador:['en_revision','Enviar a revisión'],en_revision:['aprobado','Aprobar borrador'],aprobado:['publicado','Publicar horario']}
export default function EstadoBorrador({id,revision,active,onChanged,onStateLoaded}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[accepted,setAccepted]=useState(false),[attempt,setAttempt]=useState(0)
 const generation=useRef(0)
 const [reviewReady,setReviewReady]=useState(false)
 useEffect(()=>{onStateLoaded?.(data?{...data,id,revision}:null)},[data,id,revision,onStateLoaded])
 const allowed=data&&(data.estado==='borrador'?data.canPlan:data.estado==='aprobado'?(data.canPublish??data.canApprove):data.canApprove)
 const canAdvance=data?.estado==='borrador'||reviewReady
 useEffect(()=>{
  const controller = new AbortController()
  let waitingForReview = false
  let checking = false
  generation.current++
  setReviewReady(false)
  setBusy(false)
  setData(null)
  setError('')
  setAccepted(false)

  async function loadState() {
   if (checking) return
   checking = true
   try {
    const state = await api('/borradores/estado', {method:'POST', data:{id}, signal:controller.signal})
    if (controller.signal.aborted) return
    if (!Object.hasOwn(labels,state?.estado) || !Number.isInteger(state.version) || !Array.isArray(state.historial)) {
     throw new Error('No se pudo comprobar el estado del horario.')
    }
    waitingForReview = active && state.estado === 'borrador' && state.canApprove && !state.canPlan
    setData(state)
    setError('')
   } catch (e) {
    if (!controller.signal.aborted) setError(e.message)
   } finally {
    checking = false
   }
  }

  function checkForReview() {
   if (waitingForReview && !document.hidden) void loadState()
  }

  void loadState()
  const interval = window.setInterval(checkForReview, 15000)
  window.addEventListener('focus', checkForReview)
  document.addEventListener('visibilitychange', checkForReview)
  return ()=>{
   controller.abort()
   generation.current++
   window.clearInterval(interval)
   window.removeEventListener('focus', checkForReview)
   document.removeEventListener('visibilitychange', checkForReview)
  }
 },[id,revision,active,attempt])
 async function change(){if(busy||!active||!accepted||!data||!allowed||!canAdvance||!next[data.estado])return;const g=generation.current;const estado=next[data.estado][0];setBusy(true);try{await api('/borradores/transicion',{method:'POST',data:{id,revision,version:data.version,estado}});if(g===generation.current)onChanged(estado)}catch(e){if(g===generation.current){setError(e.message);setData(null)}}finally{if(g===generation.current)setBusy(false)}}
 return <section aria-label="Revisión y publicación"><h3>Revisión y publicación</h3>{error&&<><p role="alert">{error} Consulta nuevamente antes de continuar.</p><button className="secondary" disabled={busy} onClick={()=>setAttempt(n=>n+1)}>Consultar nuevamente</button></>}
 {data&&<><p>Estado: <strong>{labels[data.estado]}</strong></p>{data.desactualizado&&<p className="notice">La revisión anterior perdió vigencia. El Director general o el Administrador debe enviar el borrador a revisión nuevamente.</p>}
 <p>Enviar a revisión no publica. Aprobar y publicar vuelven a comprobar las reglas en el servidor. La publicación estará disponible para usuarios con perfil activo.</p>
 {next[data.estado]&&allowed&&<>{data.estado!=='borrador'&&<ComprobacionPublicacion key={`${id}:${revision}:${data.version}`} id={id} revision={revision} onChecked={setReviewReady}/>}<label className="check-label"><input type="checkbox" disabled={busy||!active||!canAdvance} checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>Confirmo: {next[data.estado][1].toLowerCase()}.</label><button className="primary" disabled={!accepted||busy||!active||!canAdvance} onClick={change}>{busy?'Comprobando…':next[data.estado][1]}</button></>}
 {next[data.estado]&&!allowed&&!data.desactualizado&&<p className="notice">{data.estado==='borrador'?'El Director o el Administrador debe enviar este borrador a revisión.':data.estado==='aprobado'&&data.canPublish===false?'La publicación corresponde al Director o al Administrador.':'La aprobación corresponde al director del departamento, al Director o al Administrador; la publicación corresponde al Director o al Administrador.'}</p>}
 {data.estado==='publicado'&&<p>Consulta este horario en «Horarios publicados». Seguirá vigente hasta que se publique su reemplazo.</p>}
 <details><summary>Historial de estados</summary><ul>{data.historial.map(h=><li key={h.id}>{labels[h.estado]} · Usuario {h.actor} · {new Date(h.fecha).toLocaleString()}</li>)}</ul></details></>}
 </section>
}
