import test from 'node:test'
import assert from 'node:assert/strict'
import {collectPreparation,preparationReview} from '../src/preparation-review.js'
const fixture=()=>({semester:{id_periodo:1,nombre:'Semestre'},details:[{id:1,id_carrera:1,estado_carrera:'activo',restricciones:[],carrera:'Sistemas',ano_estudio:3,codigo_asignatura:'WEB',turno:'matutino',horas_semestre:56,needs:{definidas:true,tipo_espacio:'laboratorio',recursos:[1]},teachers:{asignacion:{docentes:[1]},disponibles:[{id:1,activo:true}]}}],years:[{id_carrera:1,ano_estudio:3,cantidad_estudiantes:20,sede:'CUR'}],rooms:[{estado:'activo',capacidad:25,sede:'CUR',tipo:'laboratorio',recursos:[1]}],grids:[{id_periodo:1,nombre:'Mañana',turno:'matutino',bloques:['Lunes','Martes'].flatMap(dia=>[{dia,hora_inicio:'08:00',hora_fin:'08:45',es_receso:false},{dia,hora_inicio:'08:45',hora_fin:'09:30',es_receso:false}])}],restrictions:[],rules:[]})
test('Datos completos no habilitan generación ni deducen sesiones de 56 horas semestrales',()=>{
 const data=fixture(),before=structuredClone(data),report=preparationReview(data)
 assert.deepEqual(report.pendientes,[]);assert.equal(report.habilita_generacion,false);assert.deepEqual(data,before)
})

test('Una entrega ya guardada con dos turnos para el mismo año exige corrección conjunta',()=>{
 const data=fixture();data.details.push({...structuredClone(data.details[0]),id:2,turno:'vespertino',codigo_asignatura:'BD'})
 assert.ok(preparationReview(data).pendientes.some(p=>p.codigo==='TURNOS_INCOMPATIBLES'))
 assert.equal(preparationReview(data).preparacion_sin_pendientes,false)
})
test('Ausencia de entrega e inventario indica pendientes sin inventar registros',()=>{
 const data=fixture();data.details=[];data.rooms=[];assert.deepEqual(preparationReview(data).pendientes.map(p=>p.codigo),['SIN_ENTREGA','SIN_INVENTARIO'])
})

test('Encuentros del sábado pide configurar sedes y sus cambios invalidan la huella',()=>{
 const data=fixture();data.details[0].turno='encuentros';data.grids[0].turno='encuentros'
 data.grids[0].bloques=[{dia:'Sabado',hora_inicio:'08:00',hora_fin:'09:00',es_receso:false}]
 const missing=preparationReview(data)
 assert.ok(missing.pendientes.some(p=>p.codigo==='SEDES_TRASLADO_PENDIENTES'))
 data.sites={id_periodo:1,sede_cur:'CUR',sede_instituto:'Instituto',version:1}
 const configured=preparationReview(data)
 assert.ok(!configured.pendientes.some(p=>p.codigo==='SEDES_TRASLADO_PENDIENTES'))
 assert.notEqual(configured.huella_datos,missing.huella_datos)
 data.years[0].sede='Instituto diferente'
 assert.ok(preparationReview(data).pendientes.some(p=>p.codigo==='SEDE_ANO_NO_RECONOCIDA'))
 data.years[0].sede=' cur '
 assert.ok(!preparationReview(data).pendientes.some(p=>p.codigo==='SEDE_ANO_NO_RECONOCIDA'))
 data.sites=null;data.grids[0].bloques[0].dia='Domingo'
 assert.ok(!preparationReview(data).pendientes.some(p=>p.codigo==='SEDES_TRASLADO_PENDIENTES'))
})
test('Distingue necesidades sin revisar, matrícula/sede faltantes y catálogo insuficiente',()=>{
 const data=fixture();data.details[0].needs.definidas=false;data.years=[]
 assert.deepEqual(preparationReview(data).pendientes.map(p=>p.codigo),['ESTUDIANTES_PENDIENTES','SEDE_PENDIENTE','NECESIDADES_PENDIENTES'])
 const full=fixture();full.rooms[0].sede=null;assert.match(preparationReview(full).pendientes[0].mensaje,/sin sede/)
 full.rooms[0].sede='OTRA';assert.match(preparationReview(full).pendientes[0].mensaje,/No se encontró/)
})
test('Sin restricciones comunicadas no agrega bloqueo; docentes inactivos y tiempos insuficientes sí',()=>{
 const data=fixture();data.details[0].teachers.disponibles[0].activo=false;data.grids[0].bloques=data.grids[0].bloques.slice(0,2)
 assert.deepEqual(preparationReview(data).pendientes.map(p=>p.codigo),['TIEMPO_INSUFICIENTE','DOCENTES_PENDIENTES','RESTRICCIONES_SIN_TIEMPO'])
})

test('La preparación comunica sesiones regulares insuficientes sin retirar restricciones ni generar',()=>{
 const data=fixture();data.details[0].restricciones=[{id_docente:1,dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:30'}]
 const before=structuredClone(data),report=preparationReview(data)
 const finding=report.pendientes.find(p=>p.codigo==='RESTRICCIONES_SIN_TIEMPO')
 assert.match(finding.mensaje,/quedan 1 sesiones/)
 assert.equal(report.habilita_generacion,false);assert.deepEqual(data,before)
})
test('El recolector usa consultas autorizadas y rechaza fallos o revisiones cambiadas',async()=>{
 const calls=[],row={id:1,id_periodo:1},identity={id:1,revision:2,id_carrera:1,estado_carrera:'activo'},answers={
 pwa_componentes_api:{vigente:true,componentes:null,asignacion:{revision:2}},pwa_restricciones_asignacion:{revision:2,restricciones:[]},pwa_sedes_traslado_api:{configuracion:null},'pwa_sprint1':[{id_periodo:1,es_activo:true}],pwa_importar_asignacion:[row],pwa_preparacion_academica:[],pwa_inventario:[],pwa_cuadriculas_api:[],pwa_restricciones_unificadas:{restricciones:[]},pwa_clases_consecutivas:{asignaturas:[identity],reglas:[],huella:'a'},pwa_necesidades_academicas:{asignacion:{revision:2},definidas:false,recursos:[]},pwa_corregir_asignacion:{asignacion:{revision:2,docentes:[]},disponibles:[]}}
 const call=async(fn,action,payload)=>{calls.push({fn,action,payload});return answers[fn]}
 assert.equal((await collectPreparation(call,1)).details.length,1);assert.ok(calls.every(c=>['periods.list','list','years','context'].includes(c.action)))
 for(const [source,replacement] of [
  ['pwa_sprint1',[{id_periodo:1,es_activo:false}]],
  ['pwa_preparacion_academica',[{id_periodo:1,id_carrera:1,ano_estudio:1,cantidad_estudiantes:25}]],
  ['pwa_inventario',[{id_aula:1,capacidad:20}]],
  ['pwa_cuadriculas_api',[{id_periodo:1,version:2}]],
  ['pwa_restricciones_unificadas',{restricciones:[{id_periodo:1,id_restriccion:1,activa:true}]}]
 ]){
  let count=0
  await assert.rejects(collectPreparation(async(fn,action,payload)=>fn===source&&++count===2?replacement:call(fn,action,payload),1),{status:409},source)
 }
 let count=0
 await assert.rejects(collectPreparation(async(fn,action,payload)=>fn==='pwa_inventario'&&++count===2?null:call(fn,action,payload),1),{status:503})
 let roomReads=0
 assert.equal((await collectPreparation(async(fn,action,payload)=>{
  if(fn==='pwa_inventario')return ++roomReads===1?[{id:1},{id:2}]:[{id:2},{id:1}]
  if(fn==='pwa_preparacion_academica')return [{id_periodo:2,revision:roomReads}]
  return call(fn,action,payload)
 },1)).details.length,1,'El orden de filas y otro semestre no invalidan esta consulta')
 let siteCalls=0
 await assert.rejects(collectPreparation(async(fn,action,payload)=>{
  if(fn==='pwa_sedes_traslado_api'&&++siteCalls===2)return {configuracion:{id_periodo:1,sede_cur:'CUR',sede_instituto:'Instituto',version:1}}
  return call(fn,action,payload)
 },1),/sedes cambiaron/)
 answers.pwa_necesidades_academicas.asignacion.revision=3;await assert.rejects(collectPreparation(call,1),{status:409})
 answers.pwa_inventario=null;await assert.rejects(collectPreparation(call,1),{status:503})
 await assert.rejects(collectPreparation(async()=>{throw new Error('Sin acceso')},1),/Sin acceso/)
})



