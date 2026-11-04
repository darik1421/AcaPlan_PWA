import { expect, test } from 'vitest'
import { roleLabel } from '../src/lib/role-labels'

test('El encabezado distingue responsabilidades y no convierte aprobadores en directores', () => {
  expect(roleLabel({rol:'administrador'})).toBe('Administrador')
  expect(roleLabel({rol:'director'})).toBe('Director')
  expect(roleLabel({rol:'docente'}, ['jefe_departamento'])).toBe('Director de departamento')
  expect(roleLabel({rol:'docente'}, ['coordinador'])).toBe('Coordinador de carrera')
  expect(roleLabel({rol:'docente'}, ['aprobador'])).toBe('Docente')
})
