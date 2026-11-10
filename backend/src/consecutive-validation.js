// Se comprueban sesiones completas, nunca se unen filas antiguas por intuición.
// id_asignacion enlaza cada necesidad con su identidad académica importada.
export function validateConsecutive({reglas,programacion,intervals,turns,cuadriculas}){
 const conflictos=[],pendientes=[]
 const issue=(codigo,motivo,rule,clases=[])=>conflictos.push({codigo,motivo,clases,recurso:rule?{tipo:'regla_consecutiva',id:rule.id}:null})
 if(!Array.isArray(reglas)){
  if(reglas!==undefined||programacion.some(p=>p.id_asignacion!==undefined))issue('CONSECUTIVAS_SIN_CARGAR','Falta consultar las reglas de clases consecutivas; no se puede asumir que no existen.')
  return {conflictos,pendientes}
 }
 const seconds=value=>{if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value))return NaN;const [h,m,s=0]=value.split(':').map(Number);return h*3600+m*60+s}
 const seen=new Set()
 for(const rule of reglas){
  if(rule?.activa===false)continue
  if(!rule||rule.activa!==true||!Number.isSafeInteger(rule.id)||rule.id<1||seen.has(rule.id)||![rule.asignacion_a,rule.asignacion_b].every(id=>Number.isSafeInteger(id)&&id>0)){
   issue('REGLA_CONSECUTIVA_INVALIDA','Hay una regla de clases consecutivas incompleta o duplicada.');continue
  }
  seen.add(rule.id)
  const needsA=programacion.filter(p=>p.id_asignacion===rule.asignacion_a),needsB=programacion.filter(p=>p.id_asignacion===rule.asignacion_b)
  const a=needsA[0],b=needsB[0]
  if(needsA.length!==1||needsB.length!==1||a.id_seccion!==b.id_seccion||a.id_periodo!==b.id_periodo){issue('REGLA_CONSECUTIVA_INVALIDA','La regla no corresponde a dos asignaciones únicas del mismo año y semestre.',rule);continue}
  const matches=need=>intervals.filter(i=>i.period===need.id_periodo&&i.row.id_seccion===need.id_seccion&&i.row.id_asignatura===need.id_asignatura)
  const first=matches(a),second=matches(b),same=a===b
  if(!first.length||!second.length||(same&&first.length<2)){
   pendientes.push({id_regla_consecutiva:rule.id,motivo:'Faltan sesiones para comprobar la pareja solicitada.'});continue
  }
  const turn=turns.get(a.id_seccion),grid=cuadriculas.find(g=>g.id_cuadricula===turn?.id_cuadricula&&g.id_periodo===a.id_periodo)
  const consecutive=(x,y)=>{
   if(x.id===y.id||x.day!==y.day||!grid)return false
   const [left,right]=x.start<=y.start?[x,y]:[y,x]
   if(left.end>right.start)return false
   if(intervals.some(i=>i.id!==left.id&&i.id!==right.id&&i.period===left.period&&i.day===left.day&&i.row.id_seccion===a.id_seccion&&i.start<right.start&&i.end>left.end))return false
   let cursor=left.end
   const breaks=grid.bloques.filter(s=>s.es_receso===true&&s.dia===left.day).map(s=>({start:seconds(s.hora_inicio),end:seconds(s.hora_fin)})).filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.start<s.end).sort((x,y)=>x.start-y.start)
   for(const recess of breaks){
    if(recess.end<=cursor)continue
    if(recess.start>cursor||cursor>=right.start)break
    cursor=Math.max(cursor,Math.min(recess.end,right.start))
   }
   return cursor===right.start
  }
  if(!first.some(x=>second.some(y=>consecutive(x,y))))issue('CLASES_NO_CONSECUTIVAS','No hay una pareja de sesiones que cumpla la regla: solo se admite el receso oficial entre ellas, sin otra clase ni tiempo libre adicional.',rule,[...new Set([...first,...second].map(i=>i.id))])
 }
 return {conflictos,pendientes}
}
