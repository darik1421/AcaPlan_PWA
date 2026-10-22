import {useEffect,useRef,useState} from 'react'
import {api} from '../../services/management'
const labels={cedula_docente:'Cédula',nombre_docente:'Docente',codigo_asignatura:'Código de asignatura',nombre_asignatura:'Asignatura',carrera:'Carrera',horas_semestre:'Horas del semestre',docente_estado:'Docente: acción',asignatura_estado:'Asignatura: acción',carrera_id:'Carrera (ID)',ano_estudio:'Año',turno:'Turno',modalidad:'Modalidad',sede:'Sede',cantidad_estudiantes:'Estudiantes',asignatura_id:'Asignatura (ID)',docentes_ids:'Docentes (IDs)',tipo_espacio:'Espacio requerido',recursos_ids:'Recursos (IDs)',sesiones_semanales:'Sesiones por semana',pabellon:'Pabellón',codigo:'Código',tipo:'Tipo de espacio',capacidad:'Capacidad',recursos:'Equipamiento',espacio_padre:'Espacio principal',accion:'Acción'}
const names={asignaciones:'asignación académica',espacios:'inventario de espacios'}
export default function PreparacionExcel({tipo,periodId,onConfirmed}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[preview,setPreview]=useState(null),[filename,setFilename]=useState('')
 const [original,setOriginal]=useState(''),[accepted,setAccepted]=useState(false),[message,setMessage]=useState('')
 const input=useRef(null),generation=useRef(0)
 useEffect(()=>{generation.current++;setPreview(null);setOriginal('');setAccepted(false);setMessage('');setFilename('');setError('');setBusy(false);if(input.current)input.current.value='';return()=>{generation.current++}},[tipo,periodId])
 async function download(){
  if(busy)return
  const current=generation.current;setBusy(true);setError('')
  try{
   const data=await api('/preparacion/plantilla',{method:'POST',data:{tipo}})
   if(current!==generation.current)return
   const bytes=Uint8Array.from(atob(data.base64),c=>c.charCodeAt(0))
   const url=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}))
   const a=document.createElement('a');a.href=url;a.download=data.archivo;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }catch(e){if(current===generation.current)setError(e.message)}finally{if(current===generation.current)setBusy(false)}
 }
 async function review(e){
  const file=e.target.files?.[0];setPreview(null);setOriginal('');setAccepted(false);setMessage('');setError('');setFilename('')
  if(!file||busy)return
  if(!file.name.toLowerCase().endsWith('.xlsx')||!file.size||file.size>2*1024*1024){setError('Selecciona un archivo .xlsx de hasta 2 MB.');return}
  const current=generation.current;setBusy(true);setFilename(file.name)
  try{
   const bytes=new Uint8Array(await file.arrayBuffer());let binary=''
   for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192))
   const result=await api('/preparacion/revisar',{method:'POST',data:{tipo,base64:btoa(binary),id_periodo:periodId}})
   if(current===generation.current){if(result.semestre!==periodId)throw new Error('El semestre activo cambió. Actualiza la página y vuelve a revisar el archivo.');setPreview(result);setOriginal(btoa(binary))}
  }catch(err){if(current===generation.current)setError(err.message)}finally{if(current===generation.current)setBusy(false);if(input.current)input.current.value=''}
 }
 async function confirm(){
  if(busy||!accepted||!preview?.valido||!preview?.huella||!original)return
  const current=generation.current;setBusy(true);setError('')
  try{
   await api('/preparacion/confirmar',{method:'POST',data:{tipo,base64:original,id_periodo:periodId,huella:preview.huella}})
   if(current!==generation.current)return
   setPreview(null);setOriginal('');setAccepted(false);setMessage(tipo==='asignaciones'?'Asignación académica guardada. No se crearon cuentas de acceso.':'Inventario guardado. Se conservaron los espacios y recursos anteriores.');onConfirmed?.()
  }catch(e){if(current===generation.current){setError(`${e.message} Vuelve a seleccionar el archivo para revisar el estado actual antes de confirmar.`);setPreview(null);setOriginal('');setAccepted(false)}}finally{if(current===generation.current)setBusy(false)}
 }
 return <section aria-label={`Excel de ${names[tipo]}`}>
  <h3>Revisar Excel de {names[tipo]}</h3>
  <p>{tipo==='asignaciones'?'Plantilla provisional única: completa cédulas, nombres, códigos de asignatura, carrera, año, turno y horas totales del semestre. Revisa qué se reconoce y qué se creará antes de confirmar. No se generan horarios ni cuentas de acceso.':'Sube el inventario, revisa las coincidencias y confirma su guardado. Se añaden espacios y equipamiento; los datos existentes que no coincidan requieren revisión.'}</p>
  <button type="button" className="secondary" disabled={busy} onClick={download}>{tipo==='asignaciones'?'Descargar plantilla de asignación':'Descargar plantilla provisional'}</button>
  <label>Seleccionar Excel de {names[tipo]}<input ref={input} type="file" accept=".xlsx" disabled={busy||!periodId} onChange={review}/></label>
  {!periodId&&<p className="notice">Se necesita un semestre activo para revisar archivos.</p>}
  {message&&<p role="status" className="success">{message}</p>}
  {busy&&<p role="status">Procesando archivo…</p>}{error&&<p role="alert" className="error">{error}</p>}
  {preview&&<div>
   <p role="status">{filename}: {preview.filas.length} filas; {preview.errores.length} errores. {preview.valido?'La revisión preliminar pasó. No se ha guardado el archivo.':'Corrige el Excel y vuelve a seleccionarlo.'}</p>
   {!!preview.errores.length&&<div className="table-scroll"><table><caption>Errores del archivo</caption><thead><tr><th>Hoja</th><th>Fila</th><th>Campo</th><th>Qué corregir</th></tr></thead><tbody>{preview.errores.map((err,i)=><tr key={i}><td>{err.hoja||(tipo==='asignaciones'?'Asignaciones':'Espacios')}</td><td>{err.fila}</td><td>{labels[err.campo]||err.campo}</td><td>{err.motivo}</td></tr>)}</tbody></table></div>}
   {!!preview.filas.length&&<div className="table-scroll"><table><caption>Vista previa de datos recibidos</caption><thead><tr><th>Fila</th>{preview.columnas.map(c=><th key={c}>{labels[c]||c}</th>)}</tr></thead><tbody>{preview.filas.map(row=><tr key={row.fila}><td>{row.fila}</td>{preview.columnas.map(c=><td key={c}>{row[c]}</td>)}</tr>)}</tbody></table></div>}
   {preview.valido&&preview.huella&&<div><label className="check-label"><input type="checkbox" checked={accepted} disabled={busy} onChange={e=>setAccepted(e.target.checked)}/>{tipo==='asignaciones'?'Revisé las coincidencias y autorizo crear los registros nuevos y añadir estas asignaciones, sin retirar docentes anteriores.':'Revisé los espacios y autorizo crear los nuevos y añadir su equipamiento, sin retirar recursos existentes.'}</label><button className="primary" disabled={busy||!accepted} onClick={confirm}>{tipo==='asignaciones'?'Confirmar y guardar asignación':'Confirmar y guardar inventario'}</button></div>}
   {preview.avisos.map((message,i)=><p key={i} className="notice">{message}</p>)}
  </div>}
 </section>
}
