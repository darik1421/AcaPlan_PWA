import test from 'node:test'
import assert from 'node:assert/strict'
import { turnSessions, groupTurn } from '../src/turn-sessions.js'
const block = (start, end, rest = false, day = 'Lunes') => ({ dia: day, hora_inicio: start, hora_fin: end, es_receso: rest })
const grid = blocks => ({ id_cuadricula: 1, id_periodo: 1, nombre: 'Mañana', turno: 'matutino', version: 1, bloques: blocks })

test('Regular forma sesiones de 90 y no cuenta alternativas solapadas como capacidad adicional', () => {
  const result = turnSessions(grid([block('08:00','08:45'), block('08:45','09:30'), block('09:30','10:15')]))
  assert.equal(result.candidatos.length, 2)
  assert.equal(result.capacidad_sesiones_sin_solapar, 1)
  assert.equal(result.minutos_sesion, 90)
  assert.equal(result.minutos_semanales_regla_general, 180)
})
test('No une mitades de sesión separadas por receso, hueco ni cambio de día', () => {
  for (const blocks of [
    [block('08:00','08:45'),block('08:45','08:55',true),block('08:55','09:40')],
    [block('08:00','08:45'),block('08:55','09:40')],
    [block('08:00','08:45'),block('08:45','09:30',false,'Martes')],
  ]) assert.equal(turnSessions(grid(blocks)).capacidad_sesiones_sin_solapar, 0)
})
test('Cuenta dos sesiones completas a ambos lados de un receso sin ocuparlo', () => {
  const result = turnSessions(grid([block('09:40','10:25'),block('08:45','09:30'),block('10:25','11:10'),block('08:00','08:45'),block('09:30','09:40',true)]))
  assert.deepEqual(result.candidatos, [
    {dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:30'},
    {dia:'Lunes',hora_inicio:'09:40',hora_fin:'11:10'},
  ])
  assert.equal(result.capacidad_sesiones_sin_solapar, 2)
})
test('Encuentros y nocturno conservan 60 sin inventar frecuencia semanal', () => {
  for (const turno of ['encuentros','nocturno']) {
    const result = turnSessions({...grid([block('18:00','19:00',false,'Viernes')]),turno})
    assert.equal(result.minutos_sesion,60)
    assert.equal(result.sesiones_semanales_regla_general,null)
    assert.equal(result.minutos_semanales_regla_general,null)
  }
})
test('Rechaza 80 minutos y configuraciones de otro semestre sin inferir su turno', () => {
  const section={id_seccion:1,id_periodo:1},link={id_seccion:1,id_periodo:1,id_cuadricula:1}
  assert.equal(groupTurn(section,[],[]).estado,'sin_asignar')
  assert.equal(groupTurn(section,[grid([block('08:00','09:20')])],[link]).estado,'incompatible')
  const valid=grid([block('08:00','08:45'),block('08:45','09:30')])
  assert.equal(groupTurn(section,[valid],[{...link,id_periodo:2}]).estado,'incompatible')
  assert.equal(groupTurn(section,[{...valid,id_periodo:2}],[link]).estado,'incompatible')
  assert.equal(groupTurn(section,[valid],[link]).estado,'configurado')
})
