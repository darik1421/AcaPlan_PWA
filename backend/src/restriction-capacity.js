import {AccessError} from './auth.js'
const seconds=value=>{
 if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value))return null
 const [h,m,s='0']=value.split(':');return Number(h)*3600+Number(m)*60+Number(s)
}
// Capacidad individual orientativa, nunca una asignación o solución global.
// La consulta SQL ya convirtió las restricciones históricas al ID académico real.
export function restrictionCapacity(candidates,teacherIds,restrictions){
 if(!Array.isArray(restrictions))throw new AccessError(503,'Falta consultar las restricciones de la asignatura.')
 const blocked=restrictions.map(r=>{
  const start=seconds(r.hora_inicio),end=seconds(r.hora_fin)
  if(!teacherIds.includes(r.id_docente)||!['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].includes(r.dia)||start===null||end===null||start>=end)throw new AccessError(503,'La consulta de restricciones está incompleta o contiene referencias incompatibles.')
  return {...r,start,end}
 })
 const available=candidates.map(c=>({...c,start:seconds(c.hora_inicio),end:seconds(c.hora_fin)})).filter(c=>!blocked.some(r=>r.dia===c.dia&&r.start<c.end&&c.start<r.end))
 const lastEnd=new Map();let count=0
 for(const c of available.sort((a,b)=>a.end-b.end))if(c.start>=(lastEnd.get(c.dia)??-1)){count++;lastEnd.set(c.dia,c.end)}
 return count
}
