import {useEffect,useId,useRef,useState} from 'react'
import {api} from '../../services/management'
export default function SedesTraslado({periodId,editable}){
 const [form,setForm]=useState(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[suggestions,setSuggestions]=useState([]),generation=useRef(0),listId=useId()
 useEffect(()=>{generation.current++;setForm(null);setSuggestions([]);setError('');setMessage('');setBusy(false);return()=>{generation.current++}},[periodId,editable])
 async function load(){
  const token=generation.current;setBusy(true);setForm(null);setError('');setMessage('')
  try{
   const [result,inventory]=await Promise.all([api('/sedes-traslado/contexto',{method:'POST',data:{id_periodo:periodId}}),api('/inventario')])
   if(!result||!Object.hasOwn(result,'configuracion')||!Array.isArray(inventory))throw new Error('No se recibió la configuración completa de sedes e inventario.')
   if(token===generation.current){
    const names=new Map()
    inventory.filter(r=>r.estado==='activo'&&typeof r.sede==='string'&&r.sede.trim()).forEach(r=>names.set(r.sede.trim().toLocaleLowerCase('es'),r.sede.trim()))
    setSuggestions([...names.values()].sort((a,b)=>a.localeCompare(b,'es')))
    setForm(result.configuracion||{sede_cur:'',sede_instituto:'',version:0})
   }
  }catch(e){if(token===generation.current)setError(e.message)}finally{if(token===generation.current)setBusy(false)}
 }
 async function save(e){
  e.preventDefault();if(busy||!editable||!form)return
  const token=generation.current;setBusy(true);setError('');setMessage('')
  try{
   const result=await api('/sedes-traslado',{method:'POST',data:{id_periodo:periodId,sede_cur:form.sede_cur,sede_instituto:form.sede_instituto,version:form.version}})
   if(token===generation.current){setForm(result.configuracion);setMessage('Sedes guardadas para este semestre. No se movió ninguna clase; vuelve a revisar las propuestas cuando estén disponibles.')}
  }catch(e){if(token===generation.current){setError(`${e.message} Consulta nuevamente antes de guardar.`);setForm(null)}}finally{if(token===generation.current)setBusy(false)}
 }
 return <section aria-label="Sedes para traslados del sábado"><h3>Sedes para traslados del sábado</h3>
  <p>Indica qué nombre del inventario corresponde al CUR y cuál al instituto. Usa los mismos nombres que aparecen en las aulas. No se cambia la ubicación de ningún espacio.</p>
  <p>El docente necesita un bloque completo de 60 minutos libre para cambiar entre estas sedes el sábado. Un receso corto no sustituye ese bloque. La comprobación de propuestas todavía está en preparación.</p>
  <button type="button" className="secondary" disabled={busy||!periodId} onClick={load}>{busy?'Procesando…':'Consultar sedes del semestre'}</button>
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  {form&&<form onSubmit={save}><fieldset disabled={busy||!editable}>
   <p>{suggestions.length?'Puedes elegir un nombre ya registrado en el inventario. Indica cuál corresponde a cada sede; no se selecciona automáticamente.':'El inventario todavía no ofrece nombres de sedes activas. Puedes indicar sus nombres oficiales y completar el inventario después.'}</p>
   <datalist id={listId}>{suggestions.map(name=><option key={name} value={name}/>)}</datalist>
   <label>Nombre de la sede CUR<input required list={listId} maxLength={100} value={form.sede_cur} onChange={e=>setForm({...form,sede_cur:e.target.value})}/></label>
   <label>Nombre de la sede del instituto<input required list={listId} maxLength={100} value={form.sede_instituto} onChange={e=>setForm({...form,sede_instituto:e.target.value})}/></label>
   {editable&&<button className="primary">Guardar sedes del semestre</button>}
  </fieldset></form>}
 </section>
}
