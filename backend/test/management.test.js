import assert from 'node:assert/strict'
import test from 'node:test'
import { createManagement } from '../src/management.js'
import { accountInput,periodInput,positiveId } from '../src/validation.js'
import { readBody } from '../src/body.js'
import { Readable } from 'node:stream'

const req={headers:{authorization:'Bearer personal-token'}}
const admin={rol:'administrador'}
const input={nombre:'Ana Pérez',correo:'ana@example.test',cedula:'CED-1',password:'initial-test-password',rol:'docente',estado:'activo',funciones:[],carreras:[]}
const response=(body,status=200)=>new Response(JSON.stringify(body),{status})
function setup(responses) {
 const calls=[]
 const management=createManagement({url:'https://example.test',key:'public-key',serviceKey:'server-only-key',fetchImpl:async(url,options)=>{
   calls.push({url,...options})
   const next=responses.shift()
   if(next instanceof Error)throw next
   if(!next)throw new Error('Unexpected call')
   return next
 }})
 return {management,calls}
}
test('Un docente no puede administrar cuentas ni invoca la RPC',async()=>{
 const {management,calls}=setup([])
 await assert.rejects(management.execute(req,{rol:'docente'},'accounts.create',input),{status:403})
 assert.equal(calls.length,0)
})
test('Crea cuenta: clave privada solo en Auth, contraseña nunca en la RPC',async()=>{
 const {management,calls}=setup([response({ok:true}),response({id:'new-user'}),response({ok:true,id:8})])
 assert.deepEqual(await management.execute(req,admin,'accounts.create',input),{ok:true,id:8})
 assert.equal(calls.length,3)
 assert.equal(calls[0].headers.Authorization,'Bearer personal-token')
 assert.equal(calls[1].headers.apikey,'server-only-key')
 assert.equal(calls[2].headers.apikey,'public-key')
 assert.equal(JSON.parse(calls[2].body).payload.password,undefined)
 assert.equal(JSON.parse(calls[1].body).email_confirm,true)
})
test('Duplicados se rechazan antes de crear Auth',async()=>{
 const {management,calls}=setup([response({message:'DUPLICADO'},400)])
 await assert.rejects(management.execute(req,admin,'accounts.create',input),{status:409})
 assert.equal(calls.length,1)
})
test('Rechazo confirmado revierte únicamente la cuenta Auth recién creada',async()=>{
 const {management,calls}=setup([response({ok:true}),response({id:'new-user'}),response({message:'DATOS_INVALIDOS'},400),response({})])
 await assert.rejects(management.execute(req,admin,'accounts.create',input),{status:400})
 assert.equal(calls[3].method,'DELETE')
 assert.equal(calls[3].url,'https://example.test/auth/v1/admin/users/new-user')
})
test('Resultado incierto del perfil nunca borra una cuenta que podría haberse guardado',async()=>{
 const {management,calls}=setup([response({ok:true}),response({id:'new-user'}),new Error('network')])
 await assert.rejects(management.execute(req,admin,'accounts.create',input),{status:503,uncertain:true})
 assert.equal(calls.length,3)
})
test('RPC ausente comunica la migración pendiente sin crear cuentas',async()=>{
 const {management,calls}=setup([response({code:'PGRST202'},404)])
 await assert.rejects(management.execute(req,admin,'accounts.create',input),e=>e.status===503 && e.message.includes('SQL'))
 assert.equal(calls.length,1)
})
test('Protección del último administrador se comunica como conflicto',async()=>{
 const {management}=setup([response({message:'ULTIMO_ADMIN'},400)])
 await assert.rejects(management.execute(req,admin,'accounts.update',{...input,id:1,estado:'inactivo'}),{status:409})
})
test('Contexto informa capacidad de creación sin devolver claves',async()=>{
 const {management}=setup([response({canManageAccounts:true})])
 const result=await management.execute(req,admin,'context',{})
 assert.deepEqual(result,{canManageAccounts:true,canCreateAccounts:true})
 assert.ok(!JSON.stringify(result).includes('server-only-key'))
})
test('Valida identificadores, fechas imposibles, rangos y coordinación',()=>{
 for(const bad of [true,null,0,-1,1.2,'1e2','',{},undefined])assert.throws(()=>positiveId(bad),{status:400})
 assert.equal(positiveId('2'),2)
 assert.throws(()=>accountInput({...input,funciones:['coordinador']},true),{status:400})
 assert.throws(()=>accountInput({...input,rol:'superadmin'},true),{status:400})
 assert.throws(()=>periodInput({nombre:'2026',ano_lectivo:2026,fecha_inicio:'2026-02-30',fecha_fin:'2026-06-01'}),{status:400})
 assert.throws(()=>periodInput({nombre:'2026',ano_lectivo:2026,fecha_inicio:'2026-06-01',fecha_fin:'2026-02-01'}),{status:400})
})
test('JSON admite caracteres UTF8 divididos entre paquetes y rechaza arrays',async()=>{
 const bytes=Buffer.from('{"nombre":"José"}')
 const index=bytes.indexOf(0xc3)+1
 const stream=Readable.from([bytes.subarray(0,index),bytes.subarray(index)])
 stream.headers={'content-type':'application/json'}
 assert.deepEqual(await readBody(stream),{nombre:'José'})
 const invalid=Readable.from([Buffer.from('[]')]);invalid.headers=stream.headers
 await assert.rejects(readBody(invalid),{status:400})
})
