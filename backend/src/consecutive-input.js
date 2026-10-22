import {AccessError} from './auth.js'
export function consecutiveInput(data,save=false){
 const id=v=>Number.isSafeInteger(v)&&v>0
 if(!data||!id(data.id_periodo)||data.id_periodo>2147483647)throw new AccessError(400,'Selecciona el semestre activo.')
 if(!save)return {id_periodo:data.id_periodo}
 if(!id(data.asignacion_a)||!id(data.asignacion_b)||typeof data.activa!=='boolean'||typeof data.motivo!=='string'||!data.motivo.trim()||data.motivo.trim().length>500||typeof data.huella!=='string'||!/^[a-f0-9]{32}$/.test(data.huella)|| (data.id!==undefined&&(!id(data.id)||!id(data.version))) || (data.id===undefined&&!data.activa))throw new AccessError(400,'Selecciona las asignaturas, explica la regla autorizada y recarga los datos si cambiaron.')
 return {id_periodo:data.id_periodo,asignacion_a:Math.min(data.asignacion_a,data.asignacion_b),asignacion_b:Math.max(data.asignacion_a,data.asignacion_b),activa:data.activa,motivo:data.motivo.trim(),huella:data.huella,...(data.id===undefined?{}:{id:data.id,version:data.version})}
}
