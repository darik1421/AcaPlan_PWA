import { AccessError } from './auth.js'
import { positiveId } from './validation.js'
export function restrictionInput(data) {
 const fail=()=>{throw new AccessError(400,'Indica docente, semestre, día y un intervalo válido de horas no disponibles.')}
 if(!['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].includes(data.dia)||typeof data.activa!=='boolean') fail()
 if(![data.hora_inicio,data.hora_fin].every(t=>typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t))||data.hora_inicio>=data.hora_fin) fail()
 if(data.id===undefined&&!data.activa) fail()
 return {id_docente:positiveId(data.id_docente),id_periodo:positiveId(data.id_periodo),dia:data.dia,hora_inicio:data.hora_inicio,hora_fin:data.hora_fin,activa:data.activa,
 ...(data.id===undefined?{}:{id:positiveId(data.id),version:positiveId(data.version)})}
}
