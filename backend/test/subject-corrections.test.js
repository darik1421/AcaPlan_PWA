import test from 'node:test'
import assert from 'node:assert/strict'
import { asignaturaInput } from '../src/validation.js'
import { createManagement } from '../src/management.js'
const data={id:1,nombre:'Matemática',codigo:'MAT',ano_estudio:1,horas_teoricas:2,horas_practicas:1}
test('Corregir asignaturas no convierte horas vacías en cero ni admite años fuera de rango',()=>{
 for(const key of ['horas_teoricas','horas_practicas']) {
  for(const value of [undefined,null,'', ' ',false,[],{},-1,1.5]) assert.throws(()=>asignaturaInput({...data,[key]:value}),{status:400})
  assert.equal(asignaturaInput({...data,[key]:0})[key],0)
 }
 assert.throws(()=>asignaturaInput({...data,ano_estudio:11}),{status:400})
 assert.deepEqual(asignaturaInput(data),data)
})
test('El despachador de asignaturas conserva correcciones y retira el alta manual',async()=>{
 const calls=[]
 const service=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{calls.push(JSON.parse(options.body));return Response.json({ok:true})}})
 const request={headers:{authorization:'Bearer usuario'}}
 await service.execute(request,{rol:'administrador'},'asignaturas.update',data)
 assert.deepEqual(calls[0].payload,data)
 await assert.rejects(service.execute(request,{rol:'administrador'},'asignaturas.create',data),{status:404})
 assert.equal(calls.length,1)
})
