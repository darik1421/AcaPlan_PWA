import {AccessError} from './auth.js'
import {turnSessions} from './turn-sessions.js'
import {preparationVersion} from './preparation-version.js'
import {restrictionCapacity} from './restriction-capacity.js'
// Consulta orientativa, no una reserva de recursos ni un certificado para generar.
export async function collectPreparation(call,id_periodo){
 if(!Number.isInteger(id_periodo)||id_periodo<1||id_periodo>2147483647)throw new AccessError(400,'Selecciona el semestre activo.')
 const [periods,assignments,years,rooms,grids,restrictions,rules,travel]=await Promise.all([
  call('pwa_sprint1','periods.list'),call('pwa_importar_asignacion','list'),call('pwa_preparacion_academica','years'),call('pwa_inventario','list'),call('pwa_cuadriculas_api','list'),call('pwa_restricciones_unificadas','context'),call('pwa_clases_consecutivas','context',{id_periodo}),call('pwa_sedes_traslado_api','context',{id_periodo})
 ])
 if(![periods,assignments,years,rooms,grids,rules?.asignaturas,rules?.reglas,restrictions?.restricciones].every(Array.isArray))throw new AccessError(503,'La consulta está incompleta. No se puede revisar la preparación; vuelve a intentarlo.')
 if(!travel||!Object.hasOwn(travel,'configuracion')||travel.configuracion!==null&&(!travel.configuracion.sede_cur||!travel.configuracion.sede_instituto||travel.configuracion.id_periodo!==id_periodo))throw new AccessError(503,'No se pudo consultar la configuración de sedes. Vuelve a intentarlo.')
 const semester=periods.find(p=>p.id_periodo===id_periodo&&p.es_activo)
 if(!semester)throw new AccessError(409,'El semestre activo cambió. Actualiza la página.')
 const selected=assignments.filter(a=>a.id_periodo===id_periodo),details=[]
 // Limita concurrencia: las consultas respetan los permisos de cada usuario.
 for(let offset=0;offset<selected.length;offset+=4){
  details.push(...await Promise.all(selected.slice(offset,offset+4).map(async row=>{
   const identity=rules.asignaturas.find(s=>s.id===row.id)
   if(!identity)throw new AccessError(409,'Las asignaciones cambiaron durante la revisión. Vuelve a consultar.')
   if(identity.estado_carrera!=='activo')return {...row,id_carrera:identity.id_carrera,estado_carrera:identity.estado_carrera}
   const [needs,teachers,availability,components]=await Promise.all([call('pwa_necesidades_academicas','context',{id:row.id,id_periodo}),call('pwa_corregir_asignacion','context',{id:row.id,id_periodo}),call('pwa_restricciones_asignacion','context',{id:row.id,id_periodo}),call('pwa_componentes_api','context',{id:row.id,id_periodo})])
   if(!identity||identity.revision!==needs?.asignacion?.revision||identity.revision!==teachers?.asignacion?.revision)throw new AccessError(409,'Las asignaciones cambiaron durante la revisión. Vuelve a consultar.')
   if(typeof components?.vigente!=='boolean'||components.asignacion?.revision!==identity.revision)throw new AccessError(409,'La distribución de sesiones cambió. Vuelve a consultar.')
   if(!Array.isArray(availability?.restricciones))throw new AccessError(503,'No se recibieron las restricciones de la asignatura. Vuelve a consultar.')
   if(identity.revision!==availability.revision)throw new AccessError(409,'La asignación cambió al consultar sus restricciones. Vuelve a consultar.')
   if(!Array.isArray(teachers?.asignacion?.docentes)||!Array.isArray(teachers?.disponibles)||typeof needs?.definidas!=='boolean'||!Array.isArray(needs.recursos))throw new AccessError(503,'Faltan datos de docentes o necesidades. Vuelve a consultar.')
   return {...row,id_carrera:identity.id_carrera,estado_carrera:identity.estado_carrera,needs,teachers,components,restricciones:availability.restricciones}
  })))
 }
 const [final,finalTravel,finalPeriods,finalYears,finalRooms,finalGrids,finalRestrictions]=await Promise.all([
  call('pwa_clases_consecutivas','context',{id_periodo}),call('pwa_sedes_traslado_api','context',{id_periodo}),
  call('pwa_sprint1','periods.list'),call('pwa_preparacion_academica','years'),call('pwa_inventario','list'),call('pwa_cuadriculas_api','list'),call('pwa_restricciones_unificadas','context')
 ])
 const same=(a,b)=>preparationVersion(a).huella_datos===preparationVersion(b).huella_datos
 const inSemester=rows=>rows.filter(r=>r.id_periodo===id_periodo)
 if(![final?.reglas,finalPeriods,finalYears,finalRooms,finalGrids,finalRestrictions?.restricciones].every(Array.isArray))throw new AccessError(503,'La comprobación final está incompleta. Vuelve a consultar.')
 if(final.huella!==rules.huella||!same(final.reglas,rules.reglas))throw new AccessError(409,'La entrega o sus reglas cambiaron durante la revisión. Vuelve a consultar.')
 if(!finalTravel||!Object.hasOwn(finalTravel,'configuracion'))throw new AccessError(503,'No se pudo comprobar la configuración de sedes. Vuelve a intentarlo.')
 if(!same(travel.configuracion,finalTravel.configuracion))throw new AccessError(409,'Las sedes cambiaron durante la revisión. Vuelve a consultar.')
 // Detecta cambios observables entre consultas; no equivale a una transacción
 // global ni protege una futura aprobación. No reintenta con datos mezclados.
 for(const [before,after,label] of [
  [inSemester(periods),inSemester(finalPeriods),'El semestre'],
  [inSemester(years),inSemester(finalYears),'Los datos de los años de carrera'],
  [rooms,finalRooms,'El inventario'],
  [inSemester(grids),inSemester(finalGrids),'Los tiempos de los turnos'],
  [inSemester(restrictions.restricciones),inSemester(finalRestrictions.restricciones),'Las restricciones docentes']
 ])if(!same(before,after))throw new AccessError(409,`${label}: hubo cambios durante la revisión. Vuelve a consultar.`)
 const ids=new Set(selected.map(a=>a.id))
 return {semester,details,sites:travel.configuracion,years:years.filter(y=>y.id_periodo===id_periodo),rooms,grids:grids.filter(g=>g.id_periodo===id_periodo),restrictions:restrictions.restricciones.filter(r=>r.id_periodo===id_periodo),rules:rules.reglas.filter(r=>ids.has(r.asignacion_a)&&ids.has(r.asignacion_b))}
}
export function preparationReview({semester,details,years,rooms,grids,restrictions,rules,sites=null}){
 const version=preparationVersion({semester,details,years,rooms,grids,restrictions,rules,sites})
 const findings=[]
 const add=(codigo,mensaje,donde,row)=>findings.push({codigo,mensaje,donde,asignatura:row?`${row.carrera} · Año ${row.ano_estudio} · ${row.codigo_asignatura}`:'General'})
 if(!details.length)add('SIN_ENTREGA','No hay asignaciones importadas para tus carreras en este semestre.','Asignación académica → Entrega del coordinador')
 if(!rooms.some(r=>r.estado==='activo'))add('SIN_INVENTARIO','No hay aulas o laboratorios activos en el inventario.','Espacios → Inventario')
 const saturday=details.some(a=>a.turno==='encuentros')&&grids.some(g=>g.turno==='encuentros'&&g.bloques.some(b=>b.dia==='Sabado'&&!b.es_receso))
 const normalize=s=>typeof s==='string'?s.trim().toLocaleLowerCase('es'):''
 const travelSites=sites?[normalize(sites.sede_cur),normalize(sites.sede_instituto)]:[]
 if(saturday&&!sites)add('SEDES_TRASLADO_PENDIENTES','Falta identificar las sedes CUR e instituto para comprobar los traslados del sábado.','Semestres → Tiempos → Traslados entre CUR e instituto')
 const checkedYears=new Set()
 for(const row of details){
  if(row.estado_carrera!=='activo'){add('CARRERA_INACTIVA','La carrera no está activa. Reactívala antes de revisar sus datos de preparación.','Carreras',row);continue}
  const year=years.find(y=>y.id_carrera===row.id_carrera&&y.ano_estudio===row.ano_estudio),key=`${row.id_carrera}:${row.ano_estudio}`
  if(!checkedYears.has(key)){
   checkedYears.add(key)
   if(new Set(details.filter(a=>a.id_carrera===row.id_carrera&&a.ano_estudio===row.ano_estudio).map(a=>a.turno)).size>1)add('TURNOS_INCOMPATIBLES','Este año de carrera tiene asignaturas en turnos distintos. Corrige conjuntamente su turno.','Asignación académica → Datos complementarios → Turno',row)
   if(!Number.isInteger(year?.cantidad_estudiantes)||year.cantidad_estudiantes<1)add('ESTUDIANTES_PENDIENTES','Falta la cantidad de estudiantes de este año.','Asignación académica → Datos complementarios',row)
   if(!year?.sede)add('SEDE_PENDIENTE','Falta indicar la sede de este año.','Asignación académica → Datos complementarios',row)
   if(saturday&&row.turno==='encuentros'&&sites&&year?.sede&&!travelSites.includes(normalize(year.sede)))add('SEDE_ANO_NO_RECONOCIDA',`La sede «${year.sede}» de este año no coincide con las sedes configuradas para traslados. Revisa los nombres; no se supone que sean el mismo lugar.`,'Asignación académica → Datos complementarios y Semestres → Tiempos → Traslados entre CUR e instituto',row)
   const matches=grids.filter(g=>g.turno===row.turno)
   if(matches.length!==1)add('TIEMPOS_PENDIENTES',matches.length?'Hay varias configuraciones para este turno; falta resolver cuál corresponde a este año.':'Faltan los tiempos de clase del turno.','Semestres → Tiempos de clase',row)
   else try{
    const sessions=turnSessions(matches[0])
    if(!sessions.sesiones_semanales_regla_general)add('FRECUENCIA_PENDIENTE','La frecuencia semanal de este turno sigue pendiente de definición; no se deduce de las horas semestrales.','Reglas académicas del turno',row)
    else if(sessions.capacidad_sesiones_sin_solapar<details.filter(a=>a.id_carrera===row.id_carrera&&a.ano_estudio===row.ano_estudio).length*sessions.sesiones_semanales_regla_general)add('TIEMPO_INSUFICIENTE','Los tiempos configurados no alcanzan para las dos sesiones de 90 minutos por asignatura.','Semestres → Tiempos de clase',row)
   }catch{add('TIEMPOS_INVALIDOS','Los tiempos del turno no cumplen las duraciones acordadas.','Semestres → Tiempos de clase',row)}
  }
  if(!row.teachers.asignacion.docentes.length||row.teachers.asignacion.docentes.some(id=>!row.teachers.disponibles.some(d=>d.id===id&&d.activo)))add('DOCENTES_PENDIENTES','Faltan docentes asociados o hay docentes inactivos.','Asignación académica → Corregir',row)
  if(row.components?.vigente===false)add('COMPONENTES_DESACTUALIZADOS','Revisa la distribución de teoría y práctica después de los cambios académicos.','Asignación académica → Teoría y práctica',row)
  if(row.turno==='matutino'||row.turno==='vespertino'){
   const gridsForTurn=grids.filter(g=>g.turno===row.turno)
   let sessions
   if(gridsForTurn.length===1){try{sessions=turnSessions(gridsForTurn[0])}catch{/* El diagnóstico de tiempos ya indica qué corregir. */}}
   if(sessions&&row.teachers.asignacion.docentes.length){
    for(const part of row.components?.componentes||[{tipo:'general',docentes:row.teachers.asignacion.docentes,sesiones:2}]){
    const capacity=restrictionCapacity(sessions.candidatos,part.docentes,row.restricciones?.filter(r=>part.docentes.includes(r.id_docente)))
    if(capacity<part.sesiones)add('RESTRICCIONES_SIN_TIEMPO',`Con las restricciones comunicadas quedan ${capacity} sesiones de 90 minutos sin solaparse para esta asignatura; se necesitan ${part.sesiones} (${part.tipo}). Revisa los tiempos y solicita a los jefes de departamento revisar las restricciones. No se retiran automáticamente.`,'Semestres → Tiempos y Restricciones docentes',row)
    }
   }
  }
  if(!Number.isInteger(row.horas_semestre)||row.horas_semestre<=0)add('HORAS_PENDIENTES','Revisa las horas totales del semestre; no se convierten automáticamente en sesiones.','Asignación académica → Corregir',row)
  if(!row.needs.definidas)add('NECESIDADES_PENDIENTES','Falta revisar el tipo de espacio y el equipamiento requerido.','Asignación académica → Necesidades',row)
  else if(year?.sede&&Number.isInteger(year.cantidad_estudiantes)&&year.cantidad_estudiantes>0){
   const compatible=r=>r.estado==='activo'&&r.capacidad>=year.cantidad_estudiantes&&(!row.needs.tipo_espacio||r.tipo===row.needs.tipo_espacio)&&row.needs.recursos.every(id=>r.recursos?.includes(id))
   if(!rooms.some(r=>compatible(r)&&r.sede&&normalize(r.sede)===normalize(year.sede)))add('ESPACIO_PENDIENTE',rooms.some(r=>compatible(r)&&!r.sede)?'Hay espacios compatibles sin sede registrada; completa el inventario para comprobarlos.':'No se encontró un espacio activo en la sede con capacidad, tipo y equipamiento compatibles.','Espacios → Inventario y Asignación académica → Necesidades',row)
  }
 }
 return {...version,id_periodo:semester.id_periodo,semestre:semester.nombre,consultado_en:new Date().toISOString(),alcance:'Carreras autorizadas para tu usuario',asignaturas:details.length,anos:checkedYears.size,reglas_consecutivas:rules.filter(r=>r.activa).length,restricciones_comunicadas:restrictions.filter(r=>r.activa!==false).length,pendientes:findings,preparacion_sin_pendientes:findings.length===0,habilita_generacion:false,aviso:'Revisión orientativa de datos consultados. No comprueba la viabilidad global, no reserva espacios y no genera ni aprueba horarios. Actualiza después de corregir.'}
}

