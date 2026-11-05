import test from 'node:test'
import assert from 'node:assert/strict'
import {generateProposal,generationInput,generationVersion} from '../src/generation.js'
import {proposeGeneration,saveGeneration,runGeneration} from '../src/generation-service.js'
import {createManagement} from '../src/management.js'

const fixture=()=>({version_reglas:'test',huella_sql:'a'.repeat(32),cycle:{canPlan:true,estado:'borrador'},snapshot:{
 borrador:{id:1,id_periodo:1,id_departamento:3,revision:1},semestre_activo:true,
 asignaciones:[{id:1,id_carrera:1,carrera:'Sistemas',nombre:'Web',estado_carrera:'activo',ano_estudio:3,codigo:'WEB',turno:'matutino',horas_semestre:56,docentes:[{id:1,nombre:'Ana',activo:true},{id:2,nombre:'Luis',activo:true}],componentes:null,componentes_vigentes:true,necesidades:{definidas:true,tipo_espacio:'aula'}}],
 anos:[{id_carrera:1,ano_estudio:3,cantidad_estudiantes:20,sede:'CUR'}],
 tiempos:[{id_cuadricula:1,id_periodo:1,nombre:'Mañana',turno:'matutino',bloques:['Lunes','Martes','Jueves'].flatMap(dia=>[{dia,hora_inicio:'08:00',hora_fin:'08:45',es_receso:false},{dia,hora_inicio:'08:45',hora_fin:'09:30',es_receso:false}])}],
 espacios:[{id_aula:1,codigo:'A1',estado:'activo',capacidad:30,sede:'CUR',tipo:'aula'}],restricciones:[],consecutivas:[],sedes:null,clases:[],ocupaciones_externas:[],movimientos:[]
}})

test('El adaptador conserva horas semestrales y genera dos sesiones de 90 con todos los docentes',()=>{
 const context=fixture(),before=structuredClone(context),r=generateProposal(context)
 assert.equal(r.listo_para_guardar,true);assert.equal(r.clases.length,2)
 assert.ok(r.clases.every(c=>c.hora_inicio==='08:00'&&c.hora_fin==='09:30'&&c.docente_nombre==='Ana, Luis'&&c.id_asignacion===1))
 assert.equal(r.estadisticas.optimoDemostrado,false);assert.deepEqual(context,before)
})
test('Una restricción del segundo docente y una reserva externa de aula no se omiten',()=>{
 const context=fixture()
 context.snapshot.restricciones=[{id_docente:2,dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:30'}]
 const r=generateProposal(context);assert.equal(r.listo_para_guardar,true);assert.ok(r.clases.every(c=>c.dia!=='Lunes'))
 context.snapshot.ocupaciones_externas=[{id_aula:1,docentes_ids:[],dia:'Martes',hora_inicio:'08:00',hora_fin:'09:30'}]
 const blocked=generateProposal(context);assert.equal(blocked.listo_para_guardar,false);assert.ok(blocked.clases.every(c=>c.dia!=='Martes'))
})
test('Docentes de componentes distintos no se reducen al principal ni se duplican las sesiones',()=>{
 const c=fixture();c.snapshot.asignaciones[0].componentes=[{tipo:'teoria',docentes:[1],sesiones:1},{tipo:'practica',docentes:[2],sesiones:1}]
 const r=generateProposal(c);assert.equal(r.listo_para_guardar,true);assert.deepEqual(r.clases.map(c=>c.componente).sort(),['practica','teoria']);assert.ok(r.clases.every(c=>!c.docente_nombre.includes(',')))
})
test('Una fijada conserva su identidad y no se retira ni mueve al guardar',async()=>{
 const c=fixture();c.snapshot.clases=[{id:9,id_asignacion:1,componente:'general',id_aula:1,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:30:00',fijada:true}]
 const r=generateProposal(c);assert.equal(r.listo_para_guardar,true);assert.equal(r.clases.find(c=>c.id===9).dia,'Lunes')
 const confirm=()=>assert.fail('No debe confirmar clases fijadas alteradas')
 await assert.rejects(saveGeneration({data:{id:1,huella:r.huella,clases:r.clases.filter(c=>c.id!==9)},load:async()=>c,confirm}),{status:409})
 const saved=await saveGeneration({data:{id:1,huella:r.huella,clases:r.clases},actor:7,load:async()=>c,confirm:async p=>p})
 assert.equal(saved.actor,7);assert.equal(saved.clases.length,2);assert.equal(saved.version_reglas,'test')
})
test('No supone frecuencia pendiente, no omite necesidades, ni admite un departamento sin editar',()=>{
 for(const change of [c=>c.cycle.canPlan=false,c=>c.snapshot.borrador.id_departamento=null,c=>c.snapshot.asignaciones[0].necesidades.definidas=false,c=>c.cycle.estado='aprobado']){
  const c=fixture();change(c);assert.throws(()=>generateProposal(c),e=>[403,409].includes(e.status))
 }
 const c=fixture();c.snapshot.asignaciones[0].turno='nocturno';c.snapshot.tiempos=[{id_periodo:1,nombre:'Noche',turno:'nocturno',bloques:[{dia:'Lunes',hora_inicio:'18:00',hora_fin:'19:00',es_receso:false}]}]
 assert.throws(()=>generateProposal(c),/frecuencia semanal/)
})
test('La propuesta desactualizada o forjada no se guarda; el servidor comprueba nuevamente',async()=>{
 const c=fixture(),r=generateProposal(c),confirm=()=>assert.fail('No debe confirmar')
 const altered=structuredClone(c);altered.snapshot.espacios[0].capacidad=10
 await assert.rejects(saveGeneration({data:{id:1,huella:r.huella,clases:r.clases},load:async()=>altered,confirm}),{status:409})
 await assert.rejects(saveGeneration({data:{id:1,huella:r.huella,clases:r.clases.map(c=>({...c,hora_fin:'09:20'}))},load:async()=>c,confirm}),{status:409})
 assert.throws(()=>generationInput({id:1,lockedDays:['Lunes','Lunes']}),{status:400})
 let reads=0
 await assert.rejects(proposeGeneration({data:{id:1},load:async()=>++reads===1?c:altered,solve:async()=>r}),{status:409})
 assert.notEqual(generationVersion(c),generationVersion(altered))
})
test('El worker ejecuta el mismo motor sin bloquear el servidor',async()=>{
 const r=await runGeneration(fixture(),{});assert.equal(r.listo_para_guardar,true)
})

test('Reserva también al docente compartido que no es principal en dos carreras',()=>{
 const c=fixture(),other=structuredClone(c.snapshot.asignaciones[0])
 Object.assign(other,{id:2,id_carrera:2,carrera:'Economía',codigo:'ECO',docentes:[{id:3,nombre:'Marta',activo:true},{id:2,nombre:'Luis',activo:true}]})
 c.snapshot.asignaciones.push(other);c.snapshot.anos.push({...c.snapshot.anos[0],id_carrera:2})
 c.snapshot.espacios.push({...c.snapshot.espacios[0],id_aula:2,codigo:'A2'})
 const r=generateProposal(c)
 assert.equal(r.listo_para_guardar,false)
 assert.equal(new Set(r.clases.map(c=>c.dia)).size,r.clases.length)
})
test('Una pareja de la misma asignatura puede ir seguida a ambos lados del receso oficial',()=>{
 const c=fixture()
 c.snapshot.tiempos[0].bloques=[['08:00','08:45',false],['08:45','09:30',false],['09:30','09:40',true],['09:40','10:25',false],['10:25','11:10',false]].map(([hora_inicio,hora_fin,es_receso])=>({dia:'Lunes',hora_inicio,hora_fin,es_receso}))
 c.snapshot.consecutivas=[{id:1,activa:true,asignacion_a:1,asignacion_b:1}]
 const r=generateProposal(c);assert.equal(r.listo_para_guardar,true);assert.deepEqual(r.clases.map(c=>c.hora_inicio).sort(),['08:00','09:40'])
})
test('Filtra aulas de otra sede o tipo y no omite clases fijadas inválidas',()=>{
 const c=fixture();c.snapshot.espacios[0].sede='Instituto'
 assert.equal(generateProposal(c).listo_para_guardar,false)
 c.snapshot.espacios[0].sede='CUR';c.snapshot.espacios[0].tipo='laboratorio'
 assert.equal(generateProposal(c).listo_para_guardar,false)
 c.snapshot.clases=[{id:9,id_asignacion:1,componente:'general',id_aula:1,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:30:00',fijada:true}]
 assert.equal(generateProposal(c).listo_para_guardar,false)
})

test('El backend usa el actor autenticado y reserva la clave privada para confirmar la transacción',async()=>{
 const c=fixture(),proposal=generateProposal(c),calls=[]
 const management=createManagement({url:'https://example.test',key:'public-test',serviceKey:'private-test',fetchImpl:async(url,options)=>{
  calls.push({url,options,payload:JSON.parse(options.body)})
  return Response.json(url.endsWith('/pwa_generador')?c:{guardado:true,id:1,clases:2})
 }})
 const saved=await management.execute({headers:{authorization:'Bearer user-test'}},{id_usuario:4,rol:'director'},'generation.save',{id:1,actor:999,huella:proposal.huella,clases:proposal.clases})
 assert.equal(saved.guardado,true);assert.equal(calls.length,2)
 assert.equal(calls[0].options.headers.Authorization,'Bearer user-test')
 assert.equal(calls[1].options.headers.Authorization,'Bearer private-test')
 assert.equal(calls[1].payload.payload.actor,4);assert.equal(calls[1].payload.payload.clases.length,2)
})

test('Las alternativas solo orientan la búsqueda; conservan reglas y se rechazan referencias malformadas',()=>{
 const context=fixture(),first=generateProposal(context)
 const previas=first.clases.map(c=>Object.fromEntries(['id_asignacion','componente','numero_sesion','dia','hora_inicio','hora_fin'].map(k=>[k,c[k]])))
 const options=generationInput({id:1,previas})
 assert.equal(generateProposal(context,options).listo_para_guardar,true)
 assert.throws(()=>generationInput({id:1,previas:[{...previas[0],numero_sesion:'1'}]}),{status:400})
})

export {fixture}
