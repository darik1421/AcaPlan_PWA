import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import ProgramacionPage from '../src/features/management/ProgramacionPage'
import ProgramacionResumen from '../src/features/management/ProgramacionResumen'
const mocks = vi.hoisted(() => ({ api: vi.fn() }))
vi.mock('../src/services/management', () => ({ api: mocks.api }))
afterEach(() => { cleanup(); mocks.api.mockReset() })
const context = { isAdmin: false, canManageSecciones: true, carreras: [1], activePeriod: { id_periodo: 1, nombre: '2026' } }
const program = { id_programacion: 1, id_periodo: 1, id_seccion: 1, id_asignatura: 1, id_docente: 4, sesiones_semanales: 3, duracion_bloques: 1, requisito_laboratorio: false, recursos_requeridos: [2], asignatura_nombre: 'Matemática', docente_nombres: 'Ana' }
function mockData(rows = []) {
  mocks.api.mockImplementation(async path => ({
    '/programacion/detalle': rows,
    '/secciones': [{ id_seccion: 1, id_periodo: 1, id_carrera: 1, codigo: 'S1', asignaturas: [1] }],
    '/asignaturas': [{ id_asignatura: 1, nombre: 'Matemática', estado: 'activo', horas_teoricas: 2, horas_practicas: 1 }],
    '/docentes': [{ id_docente: 4, nombres: 'Ana', estado: 'activo' }],
    '/recursos': [{ id_recurso: 2, nombre: 'Proyector' }],
    '/programacion/resumen': { detalles: [], secciones_sin_asignaturas: [] },
  }[path] || { ok: true }))
}
test('La programación conserva la consulta sin el formulario de 80 minutos ni acciones antiguas', async () => {
  mockData([program]); render(<ProgramacionPage context={context} />)
  await screen.findByText('Matemática')
  expect(screen.getByText('Ana')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Registrar Impartición' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
  expect(screen.queryByText(/240 minutos/)).toBeNull()
  expect(screen.queryByText(/80 minutos/)).toBeNull()
  expect(mocks.api.mock.calls.every(([,options])=>!options?.method)).toBe(true)
})

test('Consolidación distingue captura completa de pendiente y combina filtros sin ocultar faltantes', async () => {
  const row = { id_periodo: 1, periodo_nombre: '2026', id_carrera: 1, carrera_nombre: 'Ingeniería', id_seccion: 1, seccion_codigo: 'S1', id_asignatura: 1, asignatura_nombre: 'Matemática', id_programacion: 1, estado: 'captura_completa', pendientes: [], horas_carga: 3, minutos_semanales: 240 }
  mocks.api.mockResolvedValue({ detalles: [row, { ...row, id_carrera: 2, carrera_nombre: 'Medicina', id_programacion: null, id_seccion: 2, asignatura_nombre: 'Biología', estado: 'sin_registrar', pendientes: ['Falta asignar docente.'] }], secciones_sin_asignaturas: [] })
  render(<ProgramacionResumen activePeriodId={1} revision={0} />)
  await screen.findByText('Biología')
  fireEvent.change(screen.getByLabelText('Estado de captura'), { target: { value: 'sin_registrar' } })
  expect(screen.queryByText('Matemática')).toBeNull()
  expect(screen.getByText('Falta asignar docente.')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Carrera del resumen'), { target: { value: '1' } })
  expect(screen.getByText('No hay necesidades que coincidan con los filtros.')).toBeTruthy()
})
test('Una carga fallida no se muestra como cero pendientes y permite reintentar', async () => {
  mocks.api.mockRejectedValueOnce(new Error('Servidor no disponible')).mockResolvedValue({ detalles: [], secciones_sin_asignaturas: [] })
  render(<ProgramacionResumen activePeriodId={1} revision={0} />)
  await screen.findByRole('alert')
  expect(screen.queryByText(/0 registradas/)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Reintentar resumen' }))
  await screen.findByText(/0 registradas/)
})

test('El resumen distingue sesiones posibles de programación anterior y no convierte sus horas',async()=>{
 mocks.api.mockResolvedValue({detalles:[{
  id_periodo:1,id_seccion:1,id_asignatura:1,id_programacion:1,estado:'por_verificar',pendientes:[],
  seccion_codigo:'S1',asignatura_nombre:'Programación',horas_carga:3,sesiones_semanales:3,
  turno_configurado:{nombre:'Matutino CUR',minutos_sesion:90,capacidad_sesiones_sin_solapar:2,sesiones_semanales_regla_general:2},
 }],secciones_sin_asignaturas:[]})
 render(<ProgramacionResumen activePeriodId={1} revision={0}/> )
 await screen.findByText('Matutino CUR')
 expect(screen.getByText('Sesiones de 90 minutos')).toBeTruthy()
 expect(screen.getByText('2 espacios de sesión sin solaparse')).toBeTruthy()
 expect(screen.getByText('3 sesiones registradas')).toBeTruthy()
 expect(screen.getByText('Duración anterior pendiente de adaptación')).toBeTruthy()
 expect(screen.queryByText(/240 minutos/)).toBeNull()
})

test('Un fallo al consultar asignaciones no se presenta como un grupo sin clases',async()=>{
 mocks.api.mockImplementation(async path=>{
  if(path==='/programacion/detalle') throw new Error('Consulta no disponible')
  return path==='/programacion/resumen'?{detalles:[],secciones_sin_asignaturas:[]}:[]
 })
 render(<ProgramacionPage context={{...context,canManageSecciones:false}}/> )
 await screen.findByText('Consulta no disponible')
 expect(screen.queryByText(/No se han registrado pre-asignaciones/)).toBeNull()
 mockData([program])
 fireEvent.click(screen.getByRole('button',{name:'Reintentar asignaciones'}))
 await screen.findByText('Matemática')
 expect(screen.queryByText('Consulta no disponible')).toBeNull()
})
