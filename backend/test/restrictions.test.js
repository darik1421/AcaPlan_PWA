import test from 'node:test'
import assert from 'node:assert/strict'
import {restrictionInput} from '../src/restriction-input.js'
import {createManagement} from '../src/management.js'
const input={id_docente:4,id_periodo:1,dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:00',activa:true}
test('Restricciones requieren intervalo y estado explícitos y versión para corregir',()=>{
 assert.deepEqual(restrictionInput(input),input)
 for(const change of [{hora_fin:'07:59'},{hora_fin:'08:00'},{hora_inicio:'25:00'},{activa:'true'},{activa:false},{dia:'Otro'},{id:1},{id:1,version:0}])assert.throws(()=>restrictionInput({...input,...change}),{status:400})
 assert.equal(restrictionInput({...input,id:1,version:2,activa:false}).activa,false)
})
test('El servicio usa la RPC nueva con el JWT del usuario, sin editar disponibilidad histórica',async()=>{
 const calls=[]
 const service=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{calls.push({url,options});return Response.json([])}})
 const request={headers:{authorization:'Bearer usuario'}}
 await service.execute(request,{rol:'docente'},'restrictions.list',{})
 await service.execute(request,{rol:'docente'},'restrictions.save',input)
 assert.ok(calls.every(c=>c.url.endsWith('/pwa_restricciones_api')&&c.options.headers.Authorization==='Bearer usuario'))
 assert.deepEqual(JSON.parse(calls[1].options.body),{action:'save',payload:input})
})
