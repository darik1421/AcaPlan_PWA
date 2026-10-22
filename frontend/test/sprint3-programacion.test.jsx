import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import ProgramacionResumen from '../src/features/management/ProgramacionResumen'
const mocks = vi.hoisted(() => ({ api: vi.fn() }))
vi.mock('../src/services/management', () => ({ api: mocks.api }))
afterEach(() => { cleanup(); mocks.api.mockReset() })
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
