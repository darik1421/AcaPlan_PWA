import test from 'node:test'
import assert from 'node:assert/strict'
import {seccionInput} from '../src/validation.js'
import {createManagement} from '../src/management.js'
const data={id:4,codigo:'SIS-3A',ano_estudio:3,cantidad_estudiantes:24,asignaturas:[1,2]}

test('Una lista de asignaturas omitida no vacía el grupo por defecto',()=>{
 for(const asignaturas of [undefined,null,'1,2',{}]) assert.throws(()=>seccionInput({...data,asignaturas}),{status:400})
 assert.deepEqual(seccionInput({...data,asignaturas:[]}).asignaturas,[])
 assert.deepEqual(seccionInput(data).asignaturas,[1,2])
 for(const ano_estudio of [0,11,2.5]) assert.throws(()=>seccionInput({...data,ano_estudio}),{status:400})
 assert.throws(()=>seccionInput({...data,cantidad_estudiantes:undefined}),{status:400})
})
test('La corrección conserva el contrato compartido y no permite alta por el servicio retirado',async()=>{
 const calls=[]
 const service=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{calls.push({url,...JSON.parse(options.body)});return Response.json({ok:true})}})
 const request={headers:{authorization:'Bearer usuario'}}
 await service.execute(request,{rol:'administrador'},'secciones.update',data)
 assert.deepEqual(calls[0].payload,data)
 assert.equal(calls[0].action,'secciones.update')
 await assert.rejects(service.execute(request,{rol:'administrador'},'secciones.create',data),{status:404})
 assert.equal(calls.length,1)
})
