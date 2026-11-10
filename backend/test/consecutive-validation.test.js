import test from 'node:test'
import assert from 'node:assert/strict'
import {validateConsecutive} from '../src/consecutive-validation.js'
const fixture=()=>({
 reglas:[{id:1,activa:true,asignacion_a:101,asignacion_b:102}],
 programacion:[{id_asignacion:101,id_seccion:1,id_periodo:1,id_asignatura:10},{id_asignacion:102,id_seccion:1,id_periodo:1,id_asignatura:20}],
 intervals:[{id:1,period:1,day:'Lunes',start:28800,end:34200,row:{id_seccion:1,id_asignatura:10}},{id:2,period:1,day:'Lunes',start:34800,end:40200,row:{id_seccion:1,id_asignatura:20}}],
 turns:new Map([[1,{id_cuadricula:1}]]),cuadriculas:[{id_cuadricula:1,id_periodo:1,bloques:[{dia:'Lunes',hora_inicio:'09:30',hora_fin:'09:40',es_receso:true}]}]
})
test('Permite receso oficial y ambos órdenes sin modificar sesiones',()=>{
 const data=fixture(),before=structuredClone(data);assert.deepEqual(validateConsecutive(data),{conflictos:[],pendientes:[]});assert.deepEqual(data,before)
 data.reglas[0].asignacion_a=102;data.reglas[0].asignacion_b=101;assert.equal(validateConsecutive(data).conflictos.length,0)
 data.intervals[1].start=34200;assert.equal(validateConsecutive(data).conflictos.length,0)
})
test('No inventa recesos ni toma descansos de otro día, turno o semestre',()=>{
 for(const edit of [d=>{d.cuadriculas[0].bloques=[]},d=>{d.cuadriculas[0].bloques[0].dia='Martes'},d=>{d.cuadriculas[0].id_cuadricula=2},d=>{d.cuadriculas[0].id_periodo=2},d=>{d.intervals[1].start+=60}]){
  const data=fixture();edit(data);assert.equal(validateConsecutive(data).conflictos[0].codigo,'CLASES_NO_CONSECUTIVAS')
 }
})
test('Otra clase en medio, solapamiento o diferente día incumple la regla',()=>{
 for(const edit of [d=>{d.intervals.push({...d.intervals[0],id:3,start:34300,end:34400,row:{id_seccion:1,id_asignatura:30}})},d=>{d.intervals[1].start=34000},d=>{d.intervals[1].day='Martes'}]){const data=fixture();edit(data);assert.equal(validateConsecutive(data).conflictos.length,1)}
})
test('Dos sesiones de la misma asignatura son distintas; faltar una deja la regla pendiente',()=>{
 const data=fixture();data.reglas[0].asignacion_b=101;data.intervals[1].row.id_asignatura=10;assert.equal(validateConsecutive(data).conflictos.length,0)
 data.intervals.pop();assert.equal(validateConsecutive(data).pendientes[0].id_regla_consecutiva,1)
})
test('Consulta ausente, referencias ambiguas y estados inválidos no se interpretan como ausencia de reglas',()=>{
 const data=fixture();delete data.reglas;assert.equal(validateConsecutive(data).conflictos[0].codigo,'CONSECUTIVAS_SIN_CARGAR')
 data.reglas=[];assert.equal(validateConsecutive(data).conflictos.length,0)
 data.reglas=fixture().reglas;data.programacion.push({...data.programacion[0]});assert.equal(validateConsecutive(data).conflictos[0].codigo,'REGLA_CONSECUTIVA_INVALIDA')
 data.reglas[0].activa=false;assert.equal(validateConsecutive(data).conflictos.length,0)
 data.reglas[0].activa='false';assert.equal(validateConsecutive(data).conflictos[0].codigo,'REGLA_CONSECUTIVA_INVALIDA')
})
