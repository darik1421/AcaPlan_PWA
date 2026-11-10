import test from 'node:test'
import assert from 'node:assert/strict'
import {assignmentCorrection} from '../src/assignment-correction.js'
import {createManagement} from '../src/management.js'
const payload={id:1,id_periodo:2,revision:3,horas_semestre:56,docentes:[4,5]}
test('Correcciones exigen identificadores, horas y docentes explícitos sin coerciones',()=>{
 assert.deepEqual(assignmentCorrection(payload,true),payload)
 for(const changed of [{horas_semestre:''},{horas_semestre:1.5},{horas_semestre:-1},{docentes:[]},{docentes:[4,4]},{docentes:['4']},{revision:0},{id:true}])assert.throws(()=>assignmentCorrection({...payload,...changed},true),{status:400})
 assert.deepEqual(assignmentCorrection({...payload,turno:'otro'},true),payload)
})
test('El servicio remite corrección con JWT del usuario y conserva errores de concurrencia',async()=>{
 const calls=[];const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{calls.push({url,options});return Response.json({message:'VERSION_CAMBIO',code:'P0001'},{status:400})}})
 await assert.rejects(management.execute({headers:{authorization:'Bearer test'}},{rol:'docente'},'academicAssignments.save',payload),{status:409})
 assert.ok(calls[0].url.endsWith('/pwa_corregir_asignacion'))
 assert.equal(calls[0].options.headers.Authorization,'Bearer test')
 assert.deepEqual(JSON.parse(calls[0].options.body),{action:'save',payload})
})
test('Sin migración la corrección informa pendiente y no usa otra escritura',async()=>{
 let calls=0;const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>{calls++;return Response.json({code:'PGRST202'},{status:404})}})
 await assert.rejects(management.execute({headers:{authorization:'Bearer test'}},{rol:'administrador'},'academicAssignments.context',payload),e=>e.status===503&&e.message.includes('migración'))
 assert.equal(calls,1)
})
