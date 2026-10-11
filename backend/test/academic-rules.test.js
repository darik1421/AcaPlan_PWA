import test from 'node:test'
import assert from 'node:assert/strict'
import { academicRule } from '../src/academic-rules.js'

test('Regular: dos sesiones de 90 minutos y unidad de 45; nunca 80', () => {
  for (const turno of ['matutino', 'vespertino']) {
    const rule = academicRule(turno)
    assert.equal(rule.minutos_bloque,45)
    assert.equal(rule.minutos_sesion,90)
    assert.equal(rule.sesiones_semanales,2)
    assert.equal(rule.minutos_semanales,180)
  }
})
test('Encuentros y nocturno no heredan las dos sesiones del regular', () => {
  for (const turno of ['encuentros','nocturno']) {
    assert.equal(academicRule(turno).minutos_sesion,60)
    assert.equal(academicRule(turno).sesiones_semanales,null)
  }
  assert.equal(academicRule('nocturno').admite_recesos,false)
})
test('Un turno desconocido no se convierte en regular ni en un turno viernes', () => {
  for(const turno of [undefined,null,'viernes','otro']) assert.equal(academicRule(turno),null)
})
