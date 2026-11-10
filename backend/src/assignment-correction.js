import {AccessError} from './auth.js'
export function assignmentCorrection(data,save=false){
 const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max
 if(!data||!integer(data.id,1,Number.MAX_SAFE_INTEGER)||!integer(data.id_periodo,1,2147483647))throw new AccessError(400,'Selecciona una asignación y un semestre válidos.')
 const result={id:data.id,id_periodo:data.id_periodo}
 if(!save)return result
 if(!integer(data.revision,1,2147483647)||!integer(data.horas_semestre,0,10000)||!Array.isArray(data.docentes)||!data.docentes.length||data.docentes.length>100||data.docentes.some(id=>!integer(id,1,Number.MAX_SAFE_INTEGER))||new Set(data.docentes).size!==data.docentes.length)throw new AccessError(400,'Indica las horas totales del semestre y al menos un docente, sin duplicados. Recarga si falta la versión de la asignación.')
 return {...result,revision:data.revision,horas_semestre:data.horas_semestre,docentes:[...data.docentes]}
}
