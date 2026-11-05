import {useEffect,useState} from 'react'
import {api} from '../../services/management'

export function useDraftCycle(id, periodId) {
  const [result,setResult]=useState(null),[attempt,setAttempt]=useState(0)
  useEffect(()=>{
    const controller=new AbortController()
    setResult(null)
    if(id && periodId) api('/borradores/estado',{method:'POST',data:{id:Number(id)},signal:controller.signal})
      .then(data=>{
        if(!['borrador','en_revision','aprobado','publicado'].includes(data?.estado)||!Number.isInteger(data.version))throw new Error('No se pudo comprobar el estado del borrador.')
        if(!controller.signal.aborted)setResult({id,periodId,data})
      })
      .catch(error=>{if(!controller.signal.aborted)setResult({id,periodId,error:error.message})})
    return()=>controller.abort()
  },[id,periodId,attempt])
  const current=result?.id===id && result?.periodId===periodId ? result : null
  return {data:current?.data,error:current?.error,loading:Boolean(id&&periodId&&!current),retry:()=>setAttempt(n=>n+1)}
}
