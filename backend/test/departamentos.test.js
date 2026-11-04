import test from 'node:test'
import assert from 'node:assert/strict'
import { createManagement } from '../src/management.js'

test('Departamentos: rechaza perfiles sin gestión y conserva JWT al asignar carreras', async () => {
  const calls = []
  const service = createManagement({url:'https://example.test', key:'public', fetchImpl:async (url, options) => {
    calls.push({url, options})
    return new Response(JSON.stringify({guardado:true}),{status:200})
  }})
  const request = {headers:{authorization:'Bearer prueba'}}
  await assert.rejects(service.execute(request,{rol:'docente'},'departments.context',{}), /Solo administración/)
  await assert.rejects(service.execute(request,{rol:'administrador'},'departments.assign',{id_carrera:1,id_departamento:4,revision:0}), /Selecciona/)
  assert.equal(calls.length,0)
  await service.execute(request,{rol:'administrador'},'departments.assign',{id_carrera:1,id_departamento:3,revision:0})
  assert.equal(calls[0].options.headers.Authorization,'Bearer prueba')
  assert.deepEqual(JSON.parse(calls[0].options.body),{action:'assign',payload:{id_carrera:1,id_departamento:3,revision:0}})
})

test('La falta de migración informa departamentos sin ocultar el error', async () => {
  const service = createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>new Response(JSON.stringify({code:'PGRST202'}),{status:404})})
  await assert.rejects(service.execute({headers:{authorization:'Bearer prueba'}},{rol:'administrador'},'departments.context',{}),/departamentos-base.sql/)
})

test('Director tiene gestión global; las funciones de un docente no se toman del cuerpo de la solicitud', async () => {
  let calls=0
  const service=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>{calls++;return new Response('{}')}})
  const request={headers:{authorization:'Bearer prueba'}}
  await service.execute(request,{rol:'director'},'departments.context',{})
  await assert.rejects(service.execute(request,{rol:'docente'},'departments.context',{rol:'director'}),error=>error.status===403)
  assert.equal(calls,1)
})

test('El contexto institucional no revive funciones retiradas ni conserva la carrera de un coordinador anterior', async () => {
 let context={departmentScopeVersion:1,esDirectorDepartamento:false,funciones:['planificador','aprobador'],carreras:[]}
 const service=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>new Response(JSON.stringify(context))})
 const request={headers:{authorization:'Bearer prueba'}}
 const retired=await service.execute(request,{rol:'docente'},'context',{})
 for(const flag of ['canManageCarreras','canManageEspacios','canManageBloques','canReadDrafts','canManageAsignaturas']) assert.equal(retired[flag],false,flag)
 context={...context,funciones:['coordinador'],carreras:[7]}
 const coordinator=await service.execute(request,{rol:'docente'},'context',{})
 assert.equal(coordinator.canManageAsignaturas,true)
 assert.deepEqual(coordinator.carreras,[7])
 context={...context,funciones:[],carreras:[]}
 const previous=await service.execute(request,{rol:'docente'},'context',{})
 assert.equal(previous.canManageAsignaturas,false)
 assert.deepEqual(previous.carreras,[])
})
test('Un director de departamento sin vínculo no puede gestionar restricciones ni consultar borradores',async()=>{
 let context={departmentScopeVersion:1,esDirectorDepartamento:true,funciones:['jefe_departamento'],id_departamento:null}
 const service=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>new Response(JSON.stringify(context))})
 const request={headers:{authorization:'Bearer prueba'}}
 const pending=await service.execute(request,{rol:'docente'},'context',{})
 assert.equal(pending.canReadDrafts,false);assert.equal(pending.canManageDisponibilidad,false)
 context={...context,id_departamento:3}
 const linked=await service.execute(request,{rol:'docente'},'context',{})
 assert.equal(linked.canReadDrafts,true);assert.equal(linked.canManageDisponibilidad,true)
 assert.equal(linked.canManageBloques,false);assert.equal(linked.canManageAsignaturas,false)
})
