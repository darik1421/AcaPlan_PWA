import test from 'node:test'
import assert from 'node:assert/strict'
import {assignmentNeeds} from '../src/assignment-needs.js'
import {createManagement} from '../src/management.js'
const input={id:1,id_periodo:2,revision:3,tipo_espacio:null,recursos:[]}
test('Necesidades exigen una revisión y selección explícita; no coercionan IDs ni equipamiento',()=>{
 assert.deepEqual(assignmentNeeds(input,true),input)
 for(const change of [{recursos:undefined},{recursos:[1,1]},{recursos:['1']},{recursos:[0]},{tipo_espacio:''},{tipo_espacio:42},{revision:0},{id:true}])assert.throws(()=>assignmentNeeds({...input,...change},true),{status:400})
 assert.deepEqual(assignmentNeeds({...input,isAdmin:true},true),input)
})
test('Necesidades envían el JWT del usuario y conservan el conflicto de revisión',async()=>{
 let call;const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{call={url,options};return Response.json({message:'VERSION_CAMBIO',code:'P0001'},{status:400})}})
 await assert.rejects(management.execute({headers:{authorization:'Bearer user'}},{rol:'docente'},'academicNeeds.save',input),{status:409})
 assert.ok(call.url.endsWith('/pwa_necesidades_academicas'));assert.equal(call.options.headers.Authorization,'Bearer user');assert.deepEqual(JSON.parse(call.options.body),{action:'save',payload:input})
})
test('La falta de migración no permite guardar por una ruta alternativa',async()=>{
 let calls=0;const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>{calls++;return Response.json({code:'PGRST202'},{status:404})}})
 await assert.rejects(management.execute({headers:{authorization:'Bearer user'}},{rol:'administrador'},'academicNeeds.context',input),e=>e.status===503&&e.message.includes('migración'))
 assert.equal(calls,1)
})
