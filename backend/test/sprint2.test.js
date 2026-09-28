import assert from 'node:assert/strict'
import test from 'node:test'
import { createManagement } from '../src/management.js'
import { bloqueInput, disponibilidadInput, programacionInput } from '../src/validation.js'
const request = { headers: { authorization: 'Bearer test' } }
const block = { id: 1, id_periodo: 1, dia: 'LUNES', hora_inicio: '08:00', hora_fin: '09:00', es_receso: false }
const program = { id_periodo: 1, id_seccion: 1, id_asignatura: 1, id_docente: 1, sesiones_semanales: 2, duracion_bloques: 1, requisito_laboratorio: false }

test('Bloques y programación alcanzan la RPC con módulos ES y datos normalizados', async () => {
 const calls=[]
 const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{
  calls.push({url,...JSON.parse(options.body)}); return Response.json({ok:true})
 }})
 for(const [route,data] of [['bloques.create',block],['bloques.update',block],['programacion.create',program]]) {
  assert.deepEqual(await management.execute(request,{rol:'administrador'},route,data),{ok:true})
 }
 assert.equal(calls.length,3)
 assert.equal(calls[0].payload.dia,'Lunes')
 assert.equal(calls[1].payload.id,1)
 assert.equal(calls[2].payload.sesiones_semanales,2)
 assert.ok(calls.every(c=>c.url.endsWith('/rpc/pwa_sprint2')))
})

test('Contexto reconoce funciones y carreras del sprint 1 para cada rol', async () => {
 for(const [rol,funciones,expected] of [
  ['administrador',[],[true,true]], ['docente',['coordinador'],[false,true]],
  ['docente',['planificador'],[true,false]], ['docente',[],[false,false]]
 ]) {
  const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>Response.json({funciones,carreras:[2]})})
  const context=await management.execute(request,{rol},'context',{})
  assert.equal(context.isAdmin,rol==='administrador')
  assert.deepEqual([context.canManageCarreras,context.canManageSecciones],expected)
  assert.deepEqual(context.carreras,[2])
 }
})

test('Valida enteros, booleanos y horas sin coerciones silenciosas', () => {
 for(const value of [-1,0,1.5,Infinity,'abc',null]) {
  assert.throws(()=>programacionInput({...program,sesiones_semanales:value}),{status:400})
  assert.throws(()=>programacionInput({...program,duracion_bloques:value}),{status:400})
 }
 assert.throws(()=>programacionInput({...program,requisito_laboratorio:'false'}),{status:400})
 assert.throws(()=>bloqueInput({...block,es_receso:'false'},true),{status:400})
 assert.throws(()=>bloqueInput({...block,hora_inicio:'08:00',hora_fin:'08:00:00'},true),{status:400})
 assert.throws(()=>disponibilidadInput({...block,id_docente:2,dia:'otro'},true),{status:400})
 assert.equal(disponibilidadInput({...block,id_docente:2,dia:'MARTES'},true).dia,'Martes')
})

test('Los errores de solapamiento e integridad se comunican sin marcarlos como fallos de red', async () => {
 for(const [body,status] of [[{message:'INTERVALO_OCUPADO'},409],[{code:'23503'},409],[{code:'23502'},400]]) {
  const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>Response.json(body,{status:400})})
  await assert.rejects(management.execute(request,{rol:'administrador'},'bloques.create',block),e=>e.status===status && !e.uncertain)
 }
})

test('Identifica las clases afectadas sin exponer detalles arbitrarios de PostgreSQL', async () => {
 for (const [details,fragment] of [['[12,34]','12, 34'],['información interna','Revisa y resuelve']]) {
  const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>Response.json({message:'ASIGNACIONES_AFECTADAS',details},{status:400})})
  await assert.rejects(management.execute(request,{rol:'administrador'},'bloques.create',block),e=>e.status===409 && e.message.includes(fragment) && !e.message.includes('información interna'))
 }
})
