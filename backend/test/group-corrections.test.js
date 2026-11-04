import test from 'node:test'
import assert from 'node:assert/strict'
import {createManagement} from '../src/management.js'
const data={id:4,codigo:'SIS-3A',ano_estudio:3,cantidad_estudiantes:24,asignaturas:[1,2]}

test('Las escrituras de grupos históricos se rechazan sin consultar Supabase',async()=>{
 let calls=0
 const service=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>{calls++;return Response.json({ok:true})}})
 for(const route of ['secciones.create','secciones.update','groupGrids.save'])await assert.rejects(service.execute({headers:{authorization:'Bearer usuario'}},{rol:'administrador'},route,data),{status:404})
 assert.equal(calls,0)
})
