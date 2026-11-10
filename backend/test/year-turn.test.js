import test from 'node:test'
import assert from 'node:assert/strict'
import {yearTurn} from '../src/year-turn.js'
import {createManagement} from '../src/management.js'
const data={id_periodo:1,id_carrera:2,ano_estudio:3,turno:'vespertino',huella:'a'.repeat(32)}
test('Corrección de turno valida identidad y huella sin aceptar IDs coercionados',()=>{
 assert.deepEqual(yearTurn({...data,isAdmin:true},true),data)
 for(const change of [{ano_estudio:11},{id_carrera:'2'},{turno:'viernes'},{huella:''},{id_periodo:null}])assert.throws(()=>yearTurn({...data,...change},true),{status:400})
})
test('El cambio conjunto conserva el JWT y comunica horarios existentes',async()=>{
 let sent;const m=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{sent={url,options};return Response.json({message:'ANO_CON_HORARIOS'},{status:400})}})
 await assert.rejects(m.execute({headers:{authorization:'Bearer user'}},{rol:'docente'},'academicTurn.save',data),e=>e.status===409&&e.message.includes('clases registradas'))
 assert.ok(sent.url.endsWith('/pwa_turno_academico'));assert.equal(sent.options.headers.Authorization,'Bearer user');assert.deepEqual(JSON.parse(sent.options.body),{action:'save',payload:data})
})
