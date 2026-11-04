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
