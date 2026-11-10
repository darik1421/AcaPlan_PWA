import test from 'node:test'
import assert from 'node:assert/strict'
import { studentGaps } from '../src/student-gaps.js'
import { planningDiagnostic } from '../src/planning.js'

function snapshot() {
  const data = { id_periodo: 1, reglas: { version: 1, preferencias: { minimizar_huecos: 1, distribuir_sesiones: 1, priorizar_manana: 1 } },
    clases: [{ id_horario: 1, id_seccion: 1, id_bloque: 1 }, { id_horario: 2, id_seccion: 1, id_bloque: 2 }],
    secciones: [{ id_seccion: 1, id_periodo: 1 }],
    bloques: [
      { id_bloque: 1, id_periodo: 1, dia: 'Lunes', hora_inicio: '08:00', hora_fin: '09:30' },
      { id_bloque: 2, id_periodo: 1, dia: 'Lunes', hora_inicio: '09:40', hora_fin: '11:10' },
      { id_bloque: 3, id_periodo: 1, dia: 'Lunes', hora_inicio: '09:30', hora_fin: '09:40', es_receso: true },
    ], asignaturas: [], docentes: [], aulas: [], disponibilidad: [], programacion: [], recursos: [] }
  data.cuadriculas=[{id_cuadricula:1,id_periodo:1,bloques:data.bloques}]
  data.gruposTurnos=[{id_seccion:1,id_periodo:1,id_cuadricula:1}]
  return data
}
test('El receso común no es un hueco; tampoco se cuenta antes de entrar ni después de salir', () => {
  assert.deepEqual(studentGaps(snapshot()), [])
})
test('Descuenta solo la parte cubierta por recesos, sin duplicar descansos superpuestos', () => {
  const data = snapshot()
  data.bloques[1].hora_inicio = '10:00'
  data.bloques.push({ ...data.bloques[2], id_bloque: 4, hora_inicio: '09:35', hora_fin: '09:45' })
  assert.equal(studentGaps(data)[0].minutos, 15)
})
test('Un receso de otro día o período no oculta un hueco', () => {
  for (const change of [{ dia: 'Martes' }]) {
    const data = snapshot()
    Object.assign(data.bloques[2], change)
    assert.equal(studentGaps(data)[0].minutos, 10)
  }
})
test('Clases contenidas y duplicadas no producen huecos ficticios', () => {
  const data = snapshot()
  data.bloques.push({ ...data.bloques[0], id_bloque: 4, hora_inicio: '08:30', hora_fin: '09:00' })
  data.clases.push({ id_horario: 3, id_seccion: 1, id_bloque: 4 }, { ...data.clases[0], id_horario: 4 })
  assert.deepEqual(studentGaps(data), [])
})
test('Clases de días o secciones distintos no se comparan entre sí', () => {
  const data = snapshot()
  data.bloques[1].dia = 'Martes'
  assert.deepEqual(studentGaps(data), [])
  data.bloques[1].dia = 'Lunes'
  data.clases[1].id_seccion = 2
  data.secciones.push({ id_seccion: 2, id_periodo: 1 })
  assert.deepEqual(studentGaps(data), [])
})
test('El diagnóstico señala huecos como conflictos independientemente del peso', () => {
  const data = snapshot()
  data.bloques = data.bloques.filter(b => !b.es_receso)
  data.cuadriculas[0].bloques=data.bloques
  const result = planningDiagnostic(data)
  assert.equal(result.valido, false)
  assert.equal(result.completo, false)
  assert.equal(result.minutos_huecos, 10)
  assert.deepEqual(result.conflictos.find(c => c.codigo === 'HUECO_ESTUDIANTIL').clases, [1, 2])
})

test('Un receso de otro turno o semestre nunca oculta el hueco de este grupo',()=>{
 for(const change of ['otro-turno','otro-semestre','sin-asignacion']){
  const data=snapshot()
  if(change==='otro-turno') data.gruposTurnos[0].id_cuadricula=2
  if(change==='otro-semestre') data.cuadriculas[0].id_periodo=2
  if(change==='sin-asignacion') data.gruposTurnos=[]
  assert.equal(studentGaps(data)[0].minutos,10)
 }
})
test('Una sesión explícita de varios bloques conserva los huecos entre sesiones',()=>{
 const data=snapshot()
 data.clases[0].id_bloques=[1]
 delete data.clases[0].id_bloque
 data.cuadriculas[0].bloques=[]
 assert.equal(studentGaps(data)[0].minutos,10)
})
