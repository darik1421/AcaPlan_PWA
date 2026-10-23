import test from 'node:test'
import assert from 'node:assert/strict'
import {transitionDraft,publicationRows} from '../src/draft-lifecycle.js'
import {createManagement} from '../src/management.js'
const input={id:1,revision:4,version:0,estado:'en_revision'}
const empty={borrador:{id:1,id_periodo:1,revision:4},asignaciones:[],anos:[],tiempos:[],espacios:[],restricciones:[],consecutivas:[],sedes:null,clases:[]}

test('Cada transición exige su función antes de revisar o usar la clave privada',async()=>{
 for(const [estado,canPlan,canApprove] of [['aprobado',true,false],['publicado',true,false],['en_revision',false,true],['en_revision',false,false]]){
  let calls=0,confirmed=false
  await assert.rejects(transitionDraft({input:{...input,estado},actor:7,call:async()=>{calls++;return {canPlan,canApprove}},confirm:async()=>{confirmed=true}}),{status:403})
  assert.equal(calls,1);assert.equal(confirmed,false)
 }
})
test('Enviar a revisión no transforma un borrador incompleto en aprobado',async()=>{
 let saved;const run={input,actor:7,call:async fn=>fn==='pwa_ciclo_contexto'?{estado:'borrador',version:0,revision_datos:8,canPlan:true,canApprove:true}:empty,confirm:async(action,payload)=>{saved={action,payload};return saved}}
 await transitionDraft(run);assert.equal(saved.action,'en_revision');assert.equal(saved.payload.completo,false);assert.equal(saved.payload.actor,7)
 await assert.rejects(transitionDraft({...run,input:{...input,estado:'aprobado'},call:async fn=>fn==='pwa_ciclo_contexto'?{estado:'en_revision',version:0,revision_datos:8,canPlan:true,canApprove:true}:empty}),{status:409})
 await assert.rejects(transitionDraft({...run,input:{...input,revision:3}}),{status:409})
})
test('Una publicación exporta solo campos de horario, sin cédulas ni restricciones',()=>{
 const data={clases:[{id_asignacion:1,componente:'teoria',id_aula:2,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:30:00'}],asignaciones:[{id:1,carrera:'Sistemas',ano_estudio:3,turno:'matutino',nombre:'Web',docentes:[{id:1,nombre:'Ana',cedula:'privada'},{id:2,nombre:'Luis'}],componentes:[{tipo:'teoria',docentes:[1]}]}],espacios:[{id_aula:2,codigo:'B4',sede:'CUR'}]}
 const rows=publicationRows(data);assert.deepEqual(rows[0].docentes,['Ana']);assert.equal(JSON.stringify(rows).includes('privada'),false);assert.equal(rows[0].inicio,'08:00')
})
test('El actor sale de la sesión y la escritura usa clave privada solo después de revisar',async()=>{
 const calls=[],service=createManagement({url:'https://example.test',key:'anon-test',serviceKey:'private-test',fetchImpl:async(url,options)=>{
  calls.push({url,options});if(url.endsWith('pwa_ciclo_contexto'))return Response.json({estado:'borrador',version:0,revision_datos:8,canPlan:true,canApprove:true});if(url.endsWith('pwa_borrador_trabajo'))return Response.json(empty);return Response.json({guardado:true,estado:'en_revision'})
 }})
 await service.execute({headers:{authorization:'Bearer user'}},{id_usuario:7},'lifecycle.transition',{...input,actor:99,completo:true,filas:[{malicioso:true}]})
 const final=calls.at(-1),body=JSON.parse(final.options.body);assert.equal(final.options.headers.Authorization,'Bearer private-test');assert.equal(body.payload.actor,7);assert.equal(body.payload.completo,false);assert.deepEqual(body.payload.filas,[])
 assert.equal(calls[0].options.headers.Authorization,'Bearer user')
})
