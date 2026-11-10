import { AccessError } from './auth.js'
import { academicRule } from './academic-rules.js'
import { positiveId } from './validation.js'
export function gridInput(data) {
  const fail = message => { throw new AccessError(400,message) }
  const rule=academicRule(data.turno)
  if(!rule) fail('Selecciona el turno de la cuadrícula.')
  if(typeof data.nombre!=='string'||!data.nombre.trim()||data.nombre.trim().length>100) fail('Indica un nombre de hasta 100 caracteres.')
  if(!Array.isArray(data.bloques)||!data.bloques.length||data.bloques.length>140) fail('Añade entre 1 y 140 bloques o recesos.')
  const minutes=value=>Number(value.slice(0,2))*60+Number(value.slice(3))
  const bloques=data.bloques.map((b,index)=>{
    if(!b||!['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].includes(b.dia)||typeof b.es_receso!=='boolean') fail(`Fila ${index+1}: día o tipo no válido.`)
    if(![b.hora_inicio,b.hora_fin].every(t=>typeof t==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) fail(`Fila ${index+1}: indica las horas de inicio y fin.`)
    const duration=minutes(b.hora_fin)-minutes(b.hora_inicio)
    if(duration<=0) fail(`Fila ${index+1}: la hora final debe ser posterior al inicio.`)
    if(b.es_receso&&!rule.admite_recesos) fail('El turno nocturno no tiene recesos.')
    if(!b.es_receso&&duration!==rule.minutos_bloque) fail(`Fila ${index+1}: el bloque debe durar ${rule.minutos_bloque} minutos.`)
    return {dia:b.dia,hora_inicio:b.hora_inicio,hora_fin:b.hora_fin,es_receso:b.es_receso}
  })
  for(let i=0;i<bloques.length;i++) for(let j=0;j<i;j++) {
    const a=bloques[i],b=bloques[j]
    if(a.dia===b.dia&&a.hora_inicio<b.hora_fin&&b.hora_inicio<a.hora_fin) fail(`Las filas ${j+1} y ${i+1} se superponen.`)
  }
  return {id_periodo:positiveId(data.id_periodo),nombre:data.nombre.trim(),turno:data.turno,bloques,...(data.id===undefined?{}:{id:positiveId(data.id),version:positiveId(data.version)})}
}
