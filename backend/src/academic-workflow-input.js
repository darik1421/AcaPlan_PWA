import {AccessError} from './auth.js'
const positive=v=>Number.isSafeInteger(v)&&v>0&&v<=2147483647
const fail=()=>{throw new AccessError(400,'Revisa la selección, los docentes, las horas y la versión del registro.')}
export function componentsInput(data,save=false){
 if(!positive(data?.id)||!positive(data.id_periodo))fail()
 const result={id:data.id,id_periodo:data.id_periodo}
 if(!save)return result
 if(!positive(data.revision)||!Array.isArray(data.componentes)||!data.componentes.length||data.componentes.length>2)fail()
 const parts=data.componentes.map(p=>{
  if(!p||!['general','teoria','practica'].includes(p.tipo)||!Array.isArray(p.docentes)||!p.docentes.length||p.docentes.length>100||p.docentes.some(id=>!positive(id))||new Set(p.docentes).size!==p.docentes.length||![null,1,2].includes(p.sesiones))fail()
  return {tipo:p.tipo,docentes:[...p.docentes],sesiones:p.sesiones}
 })
 if(new Set(parts.map(p=>p.tipo)).size!==parts.length||parts.length===2&&parts.some(p=>p.tipo==='general'))fail()
 return {...result,revision:data.revision,componentes:parts}
}
export function draftWorkInput(data,action){
 if(!positive(data?.id))fail()
 const result={id:data.id}
 if(action==='context')return result
 if(action==='review'){if(!positive(data.revision))fail();return {...result,revision:data.revision}}
 if(!positive(data.revision))fail()
 result.revision=data.revision
 if(data.id_clase!==undefined&&data.id_clase!==null){if(!positive(data.id_clase))fail();result.id_clase=data.id_clase}
 if(data.autorizar!==undefined){if(typeof data.autorizar!=='boolean')fail();result.autorizar=data.autorizar}
 if(data.motivo!==undefined){if(typeof data.motivo!=='string'||data.motivo.trim().length>500)fail();result.motivo=data.motivo.trim()}
 if(action==='save'){
  if(!positive(data.id_asignacion)||!positive(data.id_aula)||!['general','teoria','practica'].includes(data.componente)||!['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].includes(data.dia)||![data.hora_inicio,data.hora_fin].every(s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s))||data.hora_inicio>=data.hora_fin)fail()
  Object.assign(result,{id_asignacion:data.id_asignacion,id_aula:data.id_aula,componente:data.componente,dia:data.dia,hora_inicio:data.hora_inicio,hora_fin:data.hora_fin})
 }else if(action==='fix'){
  if(!result.id_clase||typeof data.fijada!=='boolean')fail();result.fijada=data.fijada
 }else if(action!=='retire'||!result.id_clase)fail()
 return result
}


