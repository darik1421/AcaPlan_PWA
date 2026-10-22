import {AccessError} from './auth.js'
export function draftInput(data,create=false){
 if(!Number.isInteger(data?.id_periodo)||data.id_periodo<1||data.id_periodo>2147483647)throw new AccessError(400,'Selecciona un semestre válido.')
 if(!create)return {id_periodo:data.id_periodo}
 if(typeof data.nombre!=='string'||!data.nombre.trim()||data.nombre.trim().length>100||!Array.isArray(data.carreras)||!data.carreras.length||data.carreras.length>100||data.carreras.some(id=>!Number.isInteger(id)||id<1||id>2147483647)||new Set(data.carreras).size!==data.carreras.length)throw new AccessError(400,'Indica el nombre del borrador y sus carreras, sin repetirlas.')
 return {id_periodo:data.id_periodo,nombre:data.nombre.trim(),carreras:[...data.carreras].sort((a,b)=>a-b)}
}
