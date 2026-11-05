import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'

export default function NuevaVersionBorrador({id,revision,version,onCreated,disabled=false}) {
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[accepted,setAccepted]=useState(false),[error,setError]=useState('')
  const request=useRef(null),generation=useRef(0)
  useEffect(()=>{generation.current++;setOpen(false);setBusy(false);setAccepted(false);setError('');request.current=null;return()=>{generation.current++}},[id,revision,version])
  async function create(){
    if(busy||disabled||!accepted)return
    const current=generation.current;setBusy(true);setError('')
    request.current??=crypto.randomUUID()
    try{
      const result=await api('/borradores/versiones',{method:'POST',data:{id,revision,version,request_id:request.current}})
      if(!Number.isSafeInteger(result?.id)||result.id<1)throw new Error('Respuesta incompleta. Consulta Borradores antes de reintentar.')
      if(current===generation.current)onCreated(result.id)
    }catch(e){if(current===generation.current)setError(e.message)}finally{if(current===generation.current)setBusy(false)}
  }
  return <section aria-label="Nueva versión del horario">
    {!open ? <button className="secondary" disabled={disabled} onClick={()=>{setOpen(true);setAccepted(false)}}>Crear nueva versión</button> : <div className="management-form">
      <h3>Crear una copia editable</h3>
      <p>Conserva sus clases y las fijadas. El horario original mantiene su estado; la copia necesitará revisión, aprobación y publicación.</p>
      <label className="check-label"><input type="checkbox" checked={accepted} disabled={busy||disabled} onChange={e=>setAccepted(e.target.checked)}/>Confirmo crear una nueva versión.</label>
      {error&&<p role="alert" className="error">{error}</p>}
      <div className="form-actions"><button className="primary" disabled={busy||disabled||!accepted} onClick={create}>{busy?'Creando copia…':'Confirmar nueva versión'}</button><button className="secondary" disabled={busy} onClick={()=>setOpen(false)}>Cancelar nueva versión</button></div>
    </div>}
  </section>
}
