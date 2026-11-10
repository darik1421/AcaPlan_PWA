import {useEffect,useState} from 'react'
import {api} from '../../services/management'

export default function ComprobacionPublicacion({id,revision,onChecked}) {
  const [result,setResult]=useState(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0)
  useEffect(()=>{
    const controller=new AbortController();setResult(null);setError('');onChecked(false)
    api('/borradores/revisar',{method:'POST',data:{id,revision},signal:controller.signal})
      .then(data=>{
        if(typeof data?.completo!=='boolean'||!Array.isArray(data.conflictos)||!Array.isArray(data.pendientes)
          ||data.conflictos.some(item=>typeof item?.motivo!=='string'||!item.motivo.trim())
          ||data.pendientes.some(item=>typeof item?.mensaje!=='string'||!item.mensaje.trim()))throw new Error('No se pudo comprobar la propuesta completa.')
        if(!controller.signal.aborted){setResult(data);onChecked(data.completo&&data.conflictos.length===0&&data.pendientes.length===0)}
      }).catch(e=>{if(!controller.signal.aborted)setError(e.message)})
    return()=>controller.abort()
  },[id,revision,onChecked,attempt])
  return <section aria-label="Comprobación antes de aprobar o publicar">
    {!result&&!error&&<p role="status">Comprobando clases y reservas de otros departamentos…</p>}
    {error&&<p role="alert" className="error">{error}</p>}
    {result?.completo&&result.conflictos.length===0&&result.pendientes.length===0&&<p role="status">Sin conflictos ni pendientes detectados.</p>}
    {result&&(!result.completo||result.conflictos.length>0||result.pendientes.length>0)&&<div className="notice"><p>Antes de aprobar o publicar: {result.conflictos.length} conflictos y {result.pendientes.length} pendientes.</p><ul>{[...result.conflictos.map(c=>c.motivo),...result.pendientes.map(p=>p.mensaje)].slice(0,3).map((text,index)=><li key={index}>{text}</li>)}</ul><p>Corrige el borrador o solicita al Director que lo vuelva a generar respetando los horarios ya aprobados.</p></div>}
    {(result||error)&&<button className="secondary" onClick={()=>setAttempt(n=>n+1)}>Revisar propuesta nuevamente</button>}
  </section>
}
