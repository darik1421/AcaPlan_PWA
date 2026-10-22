import {AccessError} from './auth.js'
export function assignmentNeeds(data,save=false){
 const id=v=>Number.isSafeInteger(v)&&v>0
 if(!data||!id(data.id)||!id(data.id_periodo)||data.id_periodo>2147483647)throw new AccessError(400,'Selecciona una asignación del semestre activo.')
 const result={id:data.id,id_periodo:data.id_periodo}
 if(!save)return result
 if(!id(data.revision)||data.revision>2147483647||(data.tipo_espacio!==null&&(typeof data.tipo_espacio!=='string'||!data.tipo_espacio.trim()||data.tipo_espacio.trim().length>50))||!Array.isArray(data.recursos)||data.recursos.length>100||data.recursos.some(v=>!id(v)||v>2147483647)||new Set(data.recursos).size!==data.recursos.length)throw new AccessError(400,'Revisa el tipo de espacio, el equipamiento y la versión de la asignación.')
 return {...result,revision:data.revision,tipo_espacio:data.tipo_espacio?.trim()??null,recursos:[...data.recursos]}
}
