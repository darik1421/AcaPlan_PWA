import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, test, expect, vi } from 'vitest'
import AsignacionesImportadas from '../src/features/management/AsignacionesImportadas'

const mocks = vi.hoisted(() => ({ api: vi.fn() }))
vi.mock('../src/services/management', () => ({ api: mocks.api }))
afterEach(() => {
  cleanup()
  mocks.api.mockReset()
})

const periodId = 1
const row = {
  id: 1,
  id_periodo: 1,
  carrera: 'Sistemas',
  ano_estudio: 1,
  codigo_asignatura: 'SIS-101',
  nombre_asignatura: 'Introducción a Sistemas',
  docentes: ['Ana'],
  turno: 'matutino',
  horas_semestre: 56,
}

test('Permite abrir el modal de nueva asignación y registrar una asignatura manualmente', async () => {
  mocks.api.mockImplementation(async (path, options) => {
    if (path === '/asignacion-academica') return [row]
    if (path === '/carreras') return [{ id_carrera: 1, nombre: 'Sistemas', estado: 'activo' }]
    if (path === '/departamentos/docentes') {
      return {
        docentes: [
          { id_usuario: 1, nombre: 'Ana García', cedula: '121-010180-0001A' }
        ]
      }
    }
    if (path === '/asignacion-academica/manual' && options?.method === 'POST') {
      return { guardado: true, mensaje: 'Asignación académica registrada exitosamente.' }
    }
    return []
  })

  render(<AsignacionesImportadas periodId={periodId} revision={0} />)

  // Abrir modal con botón Nueva asignación
  const btnNueva = await screen.findByRole('button', { name: /Nueva asignación/i })
  fireEvent.click(btnNueva)

  // Verificar campos del modal
  await screen.findByText('Nueva asignación académica')
  const inputCodigo = screen.getByPlaceholderText('Ej: DEMO26-ADM-103')
  const inputNombre = screen.getByPlaceholderText('Ej: Matemática Financiera')
  const selectDocente = screen.getByText('Selecciona un docente de la lista…').closest('select')

  fireEvent.change(inputCodigo, { target: { value: 'SIS-102' } })
  fireEvent.change(inputNombre, { target: { value: 'Estructuras Discretas' } })
  fireEvent.change(selectDocente, { target: { value: '121-010180-0001A' } })

  // Guardar asignación
  const btnGuardar = screen.getByRole('button', { name: /Guardar asignación/i })
  fireEvent.click(btnGuardar)

  await waitFor(() => {
    expect(mocks.api).toHaveBeenCalledWith(
      '/asignacion-academica/manual',
      expect.objectContaining({
        method: 'POST',
        data: expect.objectContaining({
          id_periodo: 1,
          carrera: 'Sistemas',
          ano_estudio: 1,
          turno: 'matutino',
          codigo_asignatura: 'SIS-102',
          nombre_asignatura: 'Estructuras Discretas',
          cedula_docente: '1210101800001A',
          nombre_docente: 'Ana García',
          horas_semestre: 56,
        }),
      })
    )
  })
})

