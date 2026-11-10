import test from 'node:test'
import assert from 'node:assert/strict'
import {validateSaturdayTravel} from '../src/saturday-travel.js'
const block=(start,end,es_receso=false)=>({dia:'Sabado',hora_inicio:start,hora_fin:end,es_receso})
function fixture(){return {
 sites:{sede_cur:'Recinto principal',sede_instituto:'Instituto autorizado'},
 rooms:new Map([[1,{sede:' RECINTO PRINCIPAL '}],[2,{sede:'Instituto autorizado'}]]),
 turns:new Map([[1,{id_cuadricula:1}],[2,{id_cuadricula:1}]]),
 grids:[{id_cuadricula:1,id_periodo:1,turno:'encuentros',bloques:[block('08:00','09:00'),block('09:10','10:10'),block('10:20','11:20')]}],
 intervals:[{id:1,row:{id_aula:1,id_seccion:1},teacherIds:[4,5],period:1,day:'Sabado',start:28800,end:32400},
 {id:2,row:{id_aula:2,id_seccion:2},teacherIds:[4],period:1,day:'Sabado',start:37200,end:40800}]
}}
test('Un bloque libre permite el traslado en ambos sentidos sin modificar datos',()=>{
 const data=fixture(),before=structuredClone(data)
 assert.deepEqual(validateSaturdayTravel(data),[]);assert.deepEqual(data,before)
 data.rooms=new Map([[1,{sede:data.sites.sede_instituto}],[2,{sede:data.sites.sede_cur}]])
 assert.deepEqual(validateSaturdayTravel(data),[])
})
test('Receso, intervalo corto o bloque de otro turno/semestre no sustituyen el bloque libre',()=>{
 for(const change of [d=>{d.intervals[1].start=33000},d=>{d.grids[0].bloques[1].es_receso=true},d=>{d.grids[0].id_periodo=2},d=>{d.grids[0].turno='matutino'}]){
  const data=fixture();change(data)
  assert.equal(validateSaturdayTravel(data)[0].codigo,'TRASLADO_SABATINO')
 }
})
test('La regla no se extiende al domingo, a otra persona, otro semestre o a la misma sede',()=>{
 for(const change of [d=>{d.intervals.forEach(c=>c.day='Domingo')},d=>{d.intervals[1].teacherIds=[6]},d=>{d.intervals[1].period=2},d=>{d.rooms.set(2,{sede:d.sites.sede_cur})}]){
  const data=fixture();data.intervals[1].start=33000;change(data)
  assert.deepEqual(validateSaturdayTravel(data),[])
 }
})
test('No inventa sedes y comprueba todos los docentes de una clase compartida',()=>{
 const data=fixture();data.sites=null
 assert.equal(validateSaturdayTravel(data)[0].codigo,'SEDES_TRASLADO_PENDIENTES')
 data.sites=fixture().sites;data.rooms.set(1,{sede:null})
 assert.equal(validateSaturdayTravel(data)[0].codigo,'SEDE_TRASLADO_DESCONOCIDA')
 data.rooms=fixture().rooms;data.intervals[1].teacherIds=[5];data.intervals[1].start=33000
 const conflict=validateSaturdayTravel(data)[0];assert.equal(conflict.recurso.id,5);assert.deepEqual(conflict.clases,[1,2])
})
test('Una clase intermedia impide considerar libre el bloque de traslado',()=>{
 const data=fixture();data.intervals.push({...data.intervals[0],id:3,start:33000,end:36600})
 const conflict=validateSaturdayTravel(data)[0]
 assert.equal(conflict.codigo,'TRASLADO_SABATINO');assert.deepEqual(conflict.clases,[3,2])
})
