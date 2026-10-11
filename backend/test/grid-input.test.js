import test from 'node:test'
import assert from 'node:assert/strict'
import {gridInput} from '../src/grid-input.js'
const data=()=>({nombre:'Matutino',turno:'matutino',id_periodo:1,bloques:[{dia:'Lunes',hora_inicio:'08:00',hora_fin:'08:45',es_receso:false},{dia:'Lunes',hora_inicio:'08:45',hora_fin:'09:30',es_receso:false}]})
test('Dos bloques de 45 forman 90 y los 80 heredados se rechazan',()=>{
 assert.equal(gridInput(data()).bloques.length,2)
 const bad=data();bad.bloques[0].hora_fin='09:20';assert.throws(()=>gridInput(bad),/45 minutos/)
})
test('Recesos configurables, nocturno sin receso y encuentros de 60',()=>{
 const d=data();d.bloques.push({dia:'Lunes',hora_inicio:'09:30',hora_fin:'09:40',es_receso:true});assert.equal(gridInput(d).bloques.length,3)
 d.turno='nocturno';d.bloques=[{dia:'Lunes',hora_inicio:'18:00',hora_fin:'19:00',es_receso:false}];assert.equal(gridInput(d).turno,'nocturno')
 d.bloques[0].es_receso=true;assert.throws(()=>gridInput(d),/nocturno/)
 d.turno='encuentros';d.bloques[0].es_receso=false;d.bloques[0].dia='Viernes';assert.equal(gridInput(d).bloques[0].dia,'Viernes')
})
test('Rechaza solapes, horas invertidas y edición sin versión',()=>{
 const d=data();d.bloques[1].hora_inicio='08:30';d.bloques[1].hora_fin='09:15';assert.throws(()=>gridInput(d),/superponen/)
 assert.throws(()=>gridInput({...data(),id:1}),{status:400})
 const reverse=data();reverse.bloques[0].hora_fin='07:00';assert.throws(()=>gridInput(reverse),/posterior/)
})
