const destinations={
 DOCENTES_INVALIDOS:'Asignación académica → Corregir docentes',
 COMPONENTES_DESACTUALIZADOS:'Asignación académica → Teoría y práctica',
 TIEMPOS_PENDIENTES:'Semestres → Configuración de tiempos',
 TIEMPOS_INVALIDOS:'Semestres → Configuración de tiempos',
 RESTRICCION_DOCENTE:'Restricciones → Restricciones docentes',
 JERARQUIA_ESPACIOS:'Aulas y Recursos → Inventario',
 CARRERA_INACTIVA:'Carreras',
 SEDES_TRASLADO_PENDIENTES:'Semestres → Traslados entre sedes',
}
export default function RevisionBorrador({report,detail,onEdit,disabled}){
 const label=c=>{
  const a=detail.asignaciones.find(a=>a.id===c.id_asignacion),room=detail.espacios.find(r=>r.id_aula===c.id_aula)
  return `${a?.carrera||'Carrera pendiente'} · Año ${a?.ano_estudio||'?'} · ${a?.nombre||'Asignatura pendiente'} · ${c.dia} ${c.hora_inicio.slice(0,5)}–${c.hora_fin.slice(0,5)} · ${room?.codigo||'Aula pendiente'}`
 }
 return <section aria-label="Resultado de revisión"><h3>{report.completo?'Sin conflictos ni pendientes detectados':'Propuesta pendiente de revisión'}</h3>
  <p>{report.conflictos.length} conflictos · {report.pendientes.length} pendientes · Versión {report.revision}</p>
  <p>{report.aviso}</p><p>La comprobación corresponde a los datos de esta consulta. Vuelve a revisarla después de cualquier cambio académico.</p>
  {!!report.conflictos.length&&<><h4>Conflictos por corregir</h4><ul>{report.conflictos.map((c,i)=><li key={i}><p>{c.motivo||c.mensaje}</p>
   {destinations[c.codigo]&&<p>Revisar en: {destinations[c.codigo]}.</p>}
   {!!c.clases?.length&&<ul>{[...new Set(c.clases)].map(id=>{const row=detail.clases.find(r=>r.id===id);return <li key={id}>{row?label(row):`Clase ${id}: consulta nuevamente la propuesta.`}{row&&<><span> · {row.fijada?'Fijada: requiere autorización para cambiar':'Editable'}</span> <button className="secondary" disabled={disabled} onClick={()=>onEdit(row,'clase')}>Corregir clase {id}</button></>}</li>})}</ul>}
  </li>)}</ul></>}
  {!!report.pendientes.length&&<><h4>Información o sesiones pendientes</h4><ul>{report.pendientes.map((p,i)=><li key={i}>{p.mensaje}</li>)}</ul></>}
 </section>
}
