import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'
const labels={borrador:'En edición',en_revision:'En revisión',aprobado:'Aprobado',publicado:'Publicado'}
const next={borrador:['en_revision','Enviar a revisión'],en_revision:['aprobado','Aprobar borrador'],aprobado:['publicado','Publicar horario']}
export default function EstadoBorrador({id,revision,active,onChanged}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[accepted,setAccepted]=useState(false),[attempt,setAttempt]=useState(0)
 const generation=useRef(0)
 const allowed=data&&(data.estado==='borrador'?data.canPlan:data.estado==='aprobado'?(data.canPublish??data.canApprove):data.canApprove)
 useEffect(()=>{const c=new AbortController();generation.current++;setBusy(false);setData(null);setError('');setAccepted(false);api('/borradores/estado',{method:'POST',data:{id},signal:c.signal}).then(d=>{if(!c.signal.aborted)setData(d)}).catch(e=>{if(!c.signal.aborted)setError(e.message)});return()=>{c.abort();generation.current++}},[id,revision,attempt])
 async function change(){if(busy||!active||!accepted||!data||!allowed||!next[data.estado])return;const g=generation.current;setBusy(true);try{await api('/borradores/transicion',{method:'POST',data:{id,revision,version:data.version,estado:next[data.estado][0]}});if(g===generation.current)onChanged()}catch(e){if(g===generation.current){setError(e.message);setData(null)}}finally{if(g===generation.current)setBusy(false)}}
 return <section aria-label="Revisión y publicación"><h3>Revisión y publicación</h3>{error&&<><p role="alert">{error} Consulta nuevamente antes de continuar.</p><button className="secondary" disabled={busy} onClick={()=>setAttempt(n=>n+1)}>Consultar nuevamente</button></>}
 {data&&<><p>Estado: <strong>{labels[data.estado]}</strong></p>{data.desactualizado&&<p className="notice">Los datos cambiaron. La aprobación anterior perdió vigencia; vuelve a enviar la propuesta a revisión. Por ahora, cualquier cambio en los datos de planificación exige revisar de nuevo.</p>}
 <p>Enviar a revisión no publica. Aprobar y publicar vuelven a comprobar las reglas en el servidor. La publicación estará disponible para usuarios con perfil activo.</p>
 {next[data.estado]&&allowed&&<><label className="check-label"><input type="checkbox" disabled={busy||!active} checked={accepted} onChange={e=>setAccepted(e.target.checked)}/>Confirmo: {next[data.estado][1].toLowerCase()}.</label><button className="primary" disabled={!accepted||busy||!active} onClick={change}>{busy?'Comprobando…':next[data.estado][1]}</button></>}
 {next[data.estado]&&!allowed&&<p className="notice">{data.estado==='borrador'?'El Director o el Administrador debe enviar este borrador a revisión.':data.estado==='aprobado'&&data.canPublish===false?'La publicación corresponde al Director o al Administrador.':'La aprobación corresponde al director del departamento, al Director o al Administrador; la publicación corresponde al Director o al Administrador.'}</p>}
 {data.estado==='publicado'&&<p>Consulta la publicación en «Horarios publicados». Si cambian los datos, dejará de mostrarse como vigente hasta una nueva revisión y publicación.</p>}
 <details><summary>Historial de estados</summary><ul>{data.historial.map(h=><li key={h.id}>{labels[h.estado]} · Usuario {h.actor} · {new Date(h.fecha).toLocaleString()}</li>)}</ul></details></>}
 </section>
}
