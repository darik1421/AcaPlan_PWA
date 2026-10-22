import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'
export default function RevisionPreparacion({periodId,revision}){
 const [report,setReport]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),generation=useRef(0),previous=useRef(null)
 useEffect(()=>{previous.current=null},[periodId])
 useEffect(()=>{generation.current++;setReport(null);setError('');setBusy(false);return()=>{generation.current++}},[periodId,revision])
 async function review(){
  if(busy||!periodId)return
  const current=generation.current;setBusy(true);setError('');setReport(null)
  try{
   const data=await api('/preparacion/diagnostico',{method:'POST',data:{id_periodo:periodId}})
   if(current!==generation.current)return
   if(!Array.isArray(data?.pendientes))throw new Error('No se recibió una revisión completa. Vuelve a consultar.')
   const versioned=/^[a-f0-9]{64}$/.test(data.huella_datos)&&typeof data.version_reglas==='string'
   const changed=versioned&&previous.current?previous.current.huella!==data.huella_datos||previous.current.reglas!==data.version_reglas:null
   previous.current=versioned?{huella:data.huella_datos,reglas:data.version_reglas}:null
   setReport({...data,cambios_desde_consulta:changed})
  }
  catch(e){if(current===generation.current)setError(e.message)}finally{if(current===generation.current)setBusy(false)}
 }
 return <section aria-labelledby="preparation-review-title"><h3 id="preparation-review-title">Revisar datos para el horario</h3>
  <p>Consulta la entrega académica, los datos de cada año, el inventario, los tiempos y las reglas registradas. No necesitas subir otro archivo. La revisión indica qué falta y dónde corregirlo.</p>
  <button className="secondary" disabled={busy||!periodId} onClick={review}>{busy?'Revisando datos…':'Revisar datos guardados'}</button>
  {busy&&<p role="status">Consultando Supabase; una entrega grande puede tardar unos momentos.</p>}{error&&<p role="alert">{error}</p>}
  {report&&<><p>{report.alcance} · {report.semestre} · {report.asignaturas} asignaturas · {report.anos} años de carrera.</p>
   <p>Consulta realizada: {new Date(report.consultado_en).toLocaleString('es-NI')}. Actualiza la revisión después de corregir datos.</p>
   {report.cambios_desde_consulta!==null&&<p className="notice">{report.cambios_desde_consulta?'Los datos o las reglas cambiaron desde tu consulta anterior. Usa esta nueva revisión.':'Los datos y las reglas consultados coinciden con tu revisión anterior.'}</p>}
   <p role="status">{report.pendientes.length?`${report.pendientes.length} aspectos pendientes de revisión.`:'No se detectaron pendientes en estas comprobaciones. Esto todavía no demuestra que exista un horario posible.'}</p>
   <p className="notice">{report.aviso}</p>
   {!!report.pendientes.length&&<div className="table-scroll"><table><caption>Datos pendientes y dónde corregirlos</caption><thead><tr><th>Asignatura o año</th><th>Qué falta revisar</th><th>Dónde corregir</th></tr></thead><tbody>{report.pendientes.map((p,index)=><tr key={index}><td>{p.asignatura}</td><td>{p.mensaje}</td><td>{p.donde}</td></tr>)}</tbody></table></div>}
  </>}
 </section>
}
