import test from 'node:test'
import assert from 'node:assert/strict'
import {createManagement} from '../src/management.js'
const snapshot=()=>({borrador:{id:1,id_periodo:1,revision:4},asignaciones:[],anos:[],tiempos:[],espacios:[],restricciones:[],consecutivas:[],sedes:null,clases:[]})
const request={headers:{authorization:'Bearer usuario'}},profile={rol:'administrador'}
test('Revisión usa el JWT, versión de pantalla y dos lecturas sin ninguna escritura',async()=>{
 const calls=[],d=snapshot();const service=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{calls.push({url,options});return Response.json(d)}})
 const result=await service.execute(request,profile,'draftWork.review',{id:1,revision:4});assert.equal(result.aprobado,false);assert.equal(calls.length,2)
 for(const c of calls){assert.equal(c.options.headers.Authorization,'Bearer usuario');assert.equal(JSON.parse(c.options.body).action,'context')}
})
test('Rechaza pantalla obsoleta antes de calcular y cambios durante la revisión',async()=>{
 let count=0;const service=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>{count++;return Response.json(snapshot())}})
 await assert.rejects(service.execute(request,profile,'draftWork.review',{id:1,revision:3}),{status:409});assert.equal(count,1)
 count=0;const changing=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>{const d=snapshot();if(++count===2)d.restricciones=[{id_docente:2}];return Response.json(d)}})
 await assert.rejects(changing.execute(request,profile,'draftWork.review',{id:1,revision:4}),{status:409});assert.equal(count,2)
})
