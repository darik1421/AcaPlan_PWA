import test from 'node:test'
import assert from 'node:assert/strict'
import {restrictionCapacity} from '../src/restriction-capacity.js'
const candidates=[{dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:30'},{dia:'Lunes',hora_inicio:'08:45',hora_fin:'10:15'},{dia:'Martes',hora_inicio:'08:00',hora_fin:'09:30'}]
test('No suma alternativas solapadas y una lista vacía no exige disponibilidad positiva',()=>{
 assert.equal(restrictionCapacity(candidates,[1,2],[]),2)
})
test('Cualquier docente asignado puede impedir una sesión; extremos contiguos están permitidos',()=>{
 const restriction={id_docente:2,dia:'Lunes',hora_inicio:'09:29:59',hora_fin:'09:31:00'}
 assert.equal(restrictionCapacity(candidates,[1,2],[restriction]),1)
 restriction.hora_inicio='10:15';restriction.hora_fin='11:00'
 assert.equal(restrictionCapacity(candidates,[1,2],[restriction]),2)
})
test('Datos no consultados, docentes ajenos y tiempos inválidos no se tratan como ausencia de restricciones',()=>{
 assert.throws(()=>restrictionCapacity(candidates,[1],undefined),{status:503})
 assert.throws(()=>restrictionCapacity(candidates,[1],[{id_docente:2,dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:00'}]),{status:503})
 assert.throws(()=>restrictionCapacity(candidates,[1],[{id_docente:1,dia:'Lunes',hora_inicio:'09:00',hora_fin:'08:00'}]),{status:503})
})
