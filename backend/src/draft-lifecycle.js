import {AccessError} from './auth.js'
import {reviewDraft} from './draft-review.js'
import {PREPARATION_RULE_VERSION} from './preparation-version.js'
export {PREPARATION_RULE_VERSION}
export function publicationRows(data){
 return data.clases.map(c=>{
  const a=data.asignaciones.find(a=>a.id===c.id_asignacion),room=data.espacios.find(r=>r.id_aula===c.id_aula)
  const ids=a.componentes?.find(p=>p.tipo===c.componente)?.docentes||a.docentes.map(d=>d.id)
  return {carrera:a.carrera,ano:a.ano_estudio,turno:a.turno,asignatura:a.nombre,componente:c.componente,docentes:a.docentes.filter(d=>ids.includes(d.id)).map(d=>d.nombre),aula:room.codigo,sede:room.sede,dia:c.dia,inicio:c.hora_inicio.slice(0,5),fin:c.hora_fin.slice(0,5)}
 })
}
export async function transitionDraft({input,actor,call,confirm}){
 if(!Number.isInteger(input?.id)||input.id<1||!Number.isInteger(input.revision)||input.revision<1||!Number.isInteger(input.version)||input.version<0||!['en_revision','aprobado','publicado'].includes(input.estado))throw new AccessError(400,'Selecciona un borrador y su versión actual.')
 const identity={id:input.id,version_reglas:PREPARATION_RULE_VERSION}
 const before=await call('pwa_ciclo_contexto','context',identity)
 if(before.version!==input.version)throw new AccessError(409,'El estado cambió. Consulta nuevamente.')
 const expected={en_revision:'borrador',aprobado:'en_revision',publicado:'aprobado'}
 if(before.estado!==expected[input.estado])throw new AccessError(409,'El estado actual no permite esta acción. Consulta nuevamente.')
 const snapshot=await call('pwa_borrador_trabajo','context',{id:input.id})
 if(snapshot.borrador.revision!==input.revision)throw new AccessError(409,'El borrador cambió. Consulta nuevamente.')
 const result=reviewDraft(snapshot)
 if(input.estado!=='en_revision'&&!result.completo)throw new AccessError(409,`No se puede aprobar o publicar: ${result.conflictos.length} conflictos y ${result.pendientes.length} pendientes. Revisa el borrador.`)
 // SQL vuelve a comprobar la revisión global bajo bloqueo antes del commit.
 return confirm(input.estado,{id:input.id,revision:input.revision,version:input.version,revision_datos:before.revision_datos,actor,version_reglas:PREPARATION_RULE_VERSION,huella:result.huella_datos,completo:result.completo,filas:input.estado==='publicado'?publicationRows(snapshot):[]})
}
