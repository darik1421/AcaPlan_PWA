import test from 'node:test'
import assert from 'node:assert/strict'
import {travelSitesInput} from '../src/travel-sites-input.js'
import {createManagement} from '../src/management.js'
const input={id_periodo:1,sede_cur:' CUR ',sede_instituto:'Instituto',version:0}
test('Sedes exige identidad, nombres distintos y versión explícita',()=>{
 assert.equal(travelSitesInput(input,true).sede_cur,'CUR')
 for(const bad of [{...input,id_periodo:'1'},{...input,version:undefined},{...input,sede_instituto:'cur'},{...input,sede_cur:''}])assert.throws(()=>travelSitesInput(bad,true),{status:400})
})
test('Configurar sedes usa el JWT y la RPC autorizada sin escritura alternativa',async()=>{
 const calls=[]
 const service=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{calls.push({url,options});return Response.json({configuracion:null})}})
 await service.execute({headers:{authorization:'Bearer usuario'}},{rol:'docente'},'travel.save',input)
 assert.ok(calls[0].url.endsWith('/pwa_sedes_traslado_api'))
 assert.equal(calls[0].options.headers.Authorization,'Bearer usuario')
 assert.equal(JSON.parse(calls[0].options.body).payload.version,0)
})
