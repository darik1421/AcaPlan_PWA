import {academicRule} from './academic-rules.js'
import {turnSessions} from './turn-sessions.js'
import {spaceHierarchy} from './space-hierarchy.js'
import {validateSaturdayTravel} from './saturday-travel.js'
import {preparationVersion} from './preparation-version.js'
const time=s=>{if(typeof s!=='string'||!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(s))return null;const [h,m,x=0]=s.split(':').map(Number);return h*3600+m*60+x}
const normalize=s=>typeof s==='string'?s.trim().toLocaleLowerCase('es'):''
const overlap=(a,b)=>a.start<b.end&&b.start<a.end
export function assignmentParts(a){return a.componentes||[{tipo:'general',docentes:a.docentes.map(d=>d.id),sesiones:academicRule(a.turno)?.sesiones_semanales??null}]}
export function reviewDraft(data){
 const conflicts=[],pending=[],intervals=[],groups=new Map(),counts=new Map(),courses=new Map(data.asignaciones.map(a=>[a.id,a]))
 const rooms=new Map(data.espacios.map(r=>[r.id_aula,r])),turns=new Map()
 const issue=(codigo,motivo,clases=[])=>conflicts.push({codigo,motivo,clases})
 const restCovered=(start,end,grid,day)=>{
  if(end===start)return true
  let cursor=start
  for(const b of (grid?.bloques||[]).filter(b=>b.dia===day&&b.es_receso).map(b=>({start:time(b.hora_inicio),end:time(b.hora_fin)})).sort((a,b)=>a.start-b.start)){
   if(b.end<=cursor)continue
   if(b.start>cursor)break
   cursor=Math.max(cursor,b.end);if(cursor>=end)return true
  }
  return false
 }
 for(const a of data.asignaciones){
  const key=`${a.id_carrera}:${a.ano_estudio}`
  if(!groups.has(key))groups.set(key,{id:groups.size+1,year:data.anos.find(y=>y.id_carrera===a.id_carrera&&y.ano_estudio===a.ano_estudio),turno:a.turno})
  const group=groups.get(key),grids=data.tiempos.filter(g=>g.turno===a.turno)
  if(group.turno!==a.turno)issue('TURNOS_INCOMPATIBLES',`${a.codigo}: el año contiene turnos distintos.`)
  if(a.estado_carrera!=='activo')issue('CARRERA_INACTIVA',`${a.codigo}: carrera inactiva.`)
  if(!a.componentes_vigentes)issue('COMPONENTES_DESACTUALIZADOS',`${a.codigo}: revisa teoría/práctica después de los cambios académicos.`)
  if(!a.necesidades.definidas)pending.push({mensaje:`${a.codigo}: faltan necesidades de espacio revisadas.`})
  if(!group.year?.cantidad_estudiantes||!group.year?.sede)pending.push({mensaje:`Año ${a.ano_estudio} de ${a.carrera}: faltan estudiantes o sede.`})
  if(grids.length!==1)issue('TIEMPOS_PENDIENTES',`${a.codigo}: falta una configuración única de tiempos para el turno.`)
  else try{group.sessions=turnSessions(grids[0]);group.grid=grids[0];turns.set(group.id,{id_cuadricula:grids[0].id_cuadricula})}catch{issue('TIEMPOS_INVALIDOS',`${a.codigo}: los tiempos no cumplen la duración del turno.`)}
  for(const p of assignmentParts(a)){
   if(!p.docentes.length||p.docentes.some(id=>!a.docentes.some(d=>d.id===id&&d.activo)))issue('DOCENTES_INVALIDOS',`${a.codigo} (${p.tipo}): docentes ausentes o inactivos.`)
   if(p.sesiones===null)pending.push({mensaje:`${a.codigo} (${p.tipo}): frecuencia semanal del turno pendiente de confirmación.`})
  }
 }
 for(const c of data.clases){
  const a=courses.get(c.id_asignacion),room=rooms.get(c.id_aula)
  if(!a||!room){issue('REFERENCIA_INVALIDA','La clase referencia una asignación o aula inexistente en el contexto.',[c.id]);continue}
  const part=assignmentParts(a).find(p=>p.tipo===c.componente),group=groups.get(`${a.id_carrera}:${a.ano_estudio}`)
  if(!part){issue('COMPONENTE_INVALIDO',`${a.codigo}: el componente ya no pertenece a la asignación.`,[c.id]);continue}
  const start=time(c.hora_inicio),end=time(c.hora_fin)
  if(start===null||end===null||start>=end){issue('INTERVALO_INVALIDO','Horas de clase inválidas.',[c.id]);continue}
  if(!group.sessions?.candidatos.some(s=>s.dia===c.dia&&time(s.hora_inicio)===start&&time(s.hora_fin)===end))issue('SESION_FUERA_TURNO','La sesión no coincide con los tiempos y la duración del turno.',[c.id])
  if(room.estado!=='activo')issue('AULA_INACTIVA','El espacio no está activo.',[c.id])
  if(group.year?.cantidad_estudiantes>room.capacidad)issue('CAPACIDAD','La capacidad del aula es insuficiente.',[c.id])
  if(!room.sede||normalize(room.sede)!==normalize(group.year?.sede))issue('SEDE_INCOMPATIBLE','El aula no corresponde a la sede del año de carrera.',[c.id])
  if(a.necesidades.tipo_espacio&&a.necesidades.tipo_espacio!==room.tipo)issue('TIPO_ESPACIO','El tipo de espacio no cumple lo requerido.',[c.id])
  if(a.necesidades.recursos.some(id=>!room.recursos?.includes(id)))issue('EQUIPAMIENTO','Falta equipamiento requerido en el aula.',[c.id])
  if(data.restricciones.some(r=>part.docentes.includes(r.id_docente)&&r.dia===c.dia&&time(r.hora_inicio)<end&&start<time(r.hora_fin)))issue('RESTRICCION_DOCENTE','La clase coincide con una restricción comunicada.',[c.id])
  const key=`${a.id}:${part.tipo}`;counts.set(key,(counts.get(key)||0)+1)
  intervals.push({id:c.id,row:{id_aula:c.id_aula,id_seccion:group.id},teacherIds:part.docentes,period:data.borrador.id_periodo,day:c.dia,start,end,assignment:a.id,group})
 }
 const spaces=spaceHierarchy(data.espacios)
 if(spaces.invalid.length)issue('JERARQUIA_ESPACIOS','Corrige las relaciones de espacios padre e hijos.')
 for(let i=0;i<intervals.length;i++)for(let j=i+1;j<intervals.length;j++){
  const a=intervals[i],b=intervals[j];if(a.day!==b.day||!overlap(a,b))continue
  if(a.row.id_seccion===b.row.id_seccion)issue('CRUCE_GRUPO','Dos clases del mismo año se superponen.',[a.id,b.id])
  if(a.teacherIds.some(id=>b.teacherIds.includes(id)))issue('CRUCE_DOCENTE','Un docente está ocupado en ambas clases.',[a.id,b.id])
  if(spaces.sharedSpace(a.row.id_aula,b.row.id_aula)!==null)issue('CRUCE_ESPACIO','El aula o una de sus divisiones está ocupada.',[a.id,b.id])
 }
 for(const group of groups.values())for(const day of new Set(intervals.map(c=>c.day))){
  const rows=intervals.filter(c=>c.group===group&&c.day===day).sort((a,b)=>a.start-b.start)
  let previous=rows[0]
  for(const row of rows.slice(1)){
   if(row.start>previous.end&&!restCovered(previous.end,row.start,group.grid,day))issue('HUECO_ESTUDIANTIL','Hay un hueco entre clases del año, además del receso oficial.',[previous.id,row.id])
   if(row.end>previous.end)previous=row
  }
 }
 for(const a of data.asignaciones)for(const p of assignmentParts(a)){
  const count=counts.get(`${a.id}:${p.tipo}`)||0
  if(p.sesiones!==null&&count<p.sesiones)pending.push({mensaje:`${a.codigo} (${p.tipo}): faltan ${p.sesiones-count} sesiones.`})
  if(p.sesiones!==null&&count>p.sesiones)issue('SESIONES_EXCEDIDAS',`${a.codigo} (${p.tipo}): hay más sesiones de las requeridas.`)
 }
 for(const rule of data.consecutivas.filter(r=>r.activa)){
  if(!courses.has(rule.asignacion_a)&&!courses.has(rule.asignacion_b))continue
  const first=intervals.filter(c=>c.assignment===rule.asignacion_a),second=intervals.filter(c=>c.assignment===rule.asignacion_b)
  if(!first.length||!second.length){pending.push({mensaje:`Regla de clases consecutivas ${rule.id}: faltan sesiones o una carrera incluida en la pareja.`});continue}
  if(!first.some(a=>second.some(b=>{
   if(a.id===b.id||a.day!==b.day||a.group!==b.group)return false
   const [x,y]=a.start<b.start?[a,b]:[b,a]
   return x.end<=y.start&&restCovered(x.end,y.start,x.group.grid,x.day)&&!intervals.some(c=>c.id!==x.id&&c.id!==y.id&&c.group===x.group&&c.day===x.day&&c.start<y.start&&c.end>x.end)
  })))issue('CLASES_CONSECUTIVAS','Una pareja autorizada no está consecutiva, permitiendo solo el receso oficial.',[...first,...second].map(c=>c.id))
 }
 conflicts.push(...validateSaturdayTravel({intervals,rooms,turns,grids:data.tiempos,sites:data.sedes}))
 if(!data.asignaciones.length)pending.push({mensaje:'No hay asignaciones académicas para las carreras del borrador.'})
 return {...preparationVersion(data),id:data.borrador.id,revision:data.borrador.revision,conflictos:conflicts,pendientes:pending,valido:conflicts.length===0,completo:conflicts.length===0&&pending.length===0&&intervals.length>0,aprobado:false,aviso:'Revisión de este borrador con los datos actuales. No publica ni aprueba; no compara escenarios alternativos entre sí.'}
}
