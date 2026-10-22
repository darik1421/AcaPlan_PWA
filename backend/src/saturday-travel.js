// Regla confirmada en la entrevista: sábado, CUR ↔ instituto, un bloque libre.
// Los nombres oficiales de ambas sedes deben venir explícitos del contexto.
const normalize=value=>typeof value==='string'?value.trim().toLocaleLowerCase('es'):''
const time=value=>{
 if(typeof value!=='string'||!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value))return null
 const [h,m,s='0']=value.split(':');return Number(h)*3600+Number(m)*60+Number(s)
}
export function validateSaturdayTravel({intervals,rooms,turns,grids,sites}){
 const conflicts=[],saturday=intervals.filter(row=>row.day==='Sabado')
 const issue=(codigo,motivo,clases,recurso=null)=>conflicts.push({codigo,motivo,clases,recurso})
 if(!saturday.length)return conflicts
 const cur=normalize(sites?.sede_cur),institute=normalize(sites?.sede_instituto)
 if(!cur||!institute||cur===institute){
  issue('SEDES_TRASLADO_PENDIENTES','Falta identificar las sedes CUR e instituto para comprobar los traslados del sábado.',saturday.map(c=>c.id))
  return conflicts
 }
 const located=new Map()
 for(const row of saturday){
  const site=normalize(rooms.get(row.row.id_aula)?.sede)
  if(site!==cur&&site!==institute)issue('SEDE_TRASLADO_DESCONOCIDA','El espacio no tiene una sede reconocida para comprobar el traslado del sábado.',[row.id],{tipo:'aula',id:row.row.id_aula})
  else located.set(row.id,site)
 }
 const agendas=new Map()
 for(const row of saturday)for(const teacher of row.teacherIds){
  const key=`${row.period}:${teacher}`
  if(!agendas.has(key))agendas.set(key,{teacher,rows:[]})
  agendas.get(key).rows.push(row)
 }
 for(const {teacher,rows} of agendas.values()){
  rows.sort((a,b)=>a.start-b.start||a.end-b.end)
  for(let i=1;i<rows.length;i++){
   const a=rows[i-1],b=rows[i],from=located.get(a.id),to=located.get(b.id)
   if(!from||!to||from===to)continue
   const gridIds=new Set([a,b].map(c=>turns.get(c.row.id_seccion)?.id_cuadricula))
   // Un receso o 60 minutos arbitrarios no sustituyen un bloque de clase libre.
   const free=grids.filter(g=>g.id_periodo===a.period&&g.turno==='encuentros'&&gridIds.has(g.id_cuadricula)).some(g=>g.bloques.some(slot=>{
    const start=time(slot.hora_inicio),end=time(slot.hora_fin)
    return slot.dia==='Sabado'&&slot.es_receso===false&&start!==null&&end!==null&&end-start===3600&&start>=a.end&&end<=b.start&&
     !rows.some(c=>c.start<end&&start<c.end)
   }))
   if(!free)issue('TRASLADO_SABATINO','El docente necesita un bloque de 60 minutos libre entre clases en CUR e instituto el sábado.',[a.id,b.id],{tipo:'docente',id:teacher})
  }
 }
 return conflicts
}
