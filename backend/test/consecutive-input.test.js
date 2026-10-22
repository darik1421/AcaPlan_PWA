import test from 'node:test'
import assert from 'node:assert/strict'
import {consecutiveInput} from '../src/consecutive-input.js'
import {createManagement} from '../src/management.js'
const input={id_periodo:1,asignacion_a:2,asignacion_b:3,activa:true,motivo:'Prácticas',huella:'a'.repeat(32)}
test('Reglas consecutivas validan identidad, versión, estado y autorización descrita',()=>{
 assert.deepEqual(consecutiveInput({...input,asignacion_a:3,asignacion_b:2,admin:true},true),input)
 for(const change of [{asignacion_a:'2'},{activa:'true'},{activa:false},{motivo:' '},{huella:''},{id:1,version:0}])assert.throws(()=>consecutiveInput({...input,...change},true),{status:400})
 assert.equal(consecutiveInput({...input,asignacion_b:2},true).asignacion_b,2)
})
test('Guardar regla conserva el JWT y comunica duplicado sin usar credenciales administrativas',async()=>{
 let sent;const m=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{sent={url,options};return Response.json({message:'REGLA_CONSECUTIVA_EXISTENTE'},{status:400})}})
 await assert.rejects(m.execute({headers:{authorization:'Bearer user'}},{rol:'docente'},'consecutive.save',input),e=>e.status===409&&e.message.includes('pareja'))
 assert.ok(sent.url.endsWith('/pwa_clases_consecutivas'));assert.equal(sent.options.headers.Authorization,'Bearer user')
})
