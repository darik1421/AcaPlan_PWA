import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import DepartamentosPage from '../src/features/management/DepartamentosPage'

const mocks = vi.hoisted(() => ({ api: vi.fn() }))
vi.mock('../src/services/management', () => ({ api: mocks.api }))

afterEach(() => {
  cleanup()
  mocks.api.mockReset()
})

const sampleDepts = {
  departamentos: [
    { id: 1, nombre: 'Ciencias Económicas y Administrativas' },
    { id: 2, nombre: 'Ciencias de la Educación y Humanidades' },
    { id: 3, nombre: 'Ciencias, Tecnología y Salud' },
  ],
}
const sampleCarreras = [
  { id_carrera: 6, nombre: 'Administración de Empresas', id_departamento: 1, estado: 'activo' },
  { id_carrera: 18, nombre: 'Ingeniería en Sistemas', id_departamento: 3, estado: 'activo' },
]
const sampleDocentes = [
  { id_usuario: 10, nombre: 'Lic. Director Económicas', cedula: '001-100290-0001A', id_departamento: 1, departamento_nombre: 'Ciencias Económicas y Administrativas' },
  { id_usuario: 25, nombre: 'Prof. Mario Miranda', cedula: '121-250388-0002B', id_departamento: null, departamento_nombre: null },
]

describe('DepartamentosPage CRUD & Docente Director Assignment', () => {
  test('Carga y muestra el catálogo de departamentos, carreras adscritas y docentes directores', async () => {
    mocks.api.mockImplementation(async path => {
      if (path === '/departamentos') return sampleDepts
      if (path === '/carreras') return sampleCarreras
      if (path === '/departamentos/docentes') return { docentes: sampleDocentes }
      return []
    })

    render(<DepartamentosPage canManage={true} onChanged={vi.fn()} />)
    await screen.findByText('Ciencias Económicas y Administrativas')
    expect(screen.getByText('Ciencias de la Educación y Humanidades')).toBeTruthy()
    expect(screen.getByText('Ciencias, Tecnología y Salud')).toBeTruthy()
    expect(screen.getByText('Lic. Director Económicas')).toBeTruthy()
    expect(screen.getByText('Cédula: 001-100290-0001A')).toBeTruthy()
    expect(screen.getAllByText('Sin docente asignado')).toHaveLength(2)
  })

  test('Filtra departamentos por búsqueda de texto', async () => {
    mocks.api.mockImplementation(async path => {
      if (path === '/departamentos') return sampleDepts
      if (path === '/carreras') return sampleCarreras
      if (path === '/departamentos/docentes') return { docentes: sampleDocentes }
      return []
    })

    render(<DepartamentosPage canManage={true} onChanged={vi.fn()} />)
    await screen.findByText('Ciencias Económicas y Administrativas')

    fireEvent.change(screen.getByPlaceholderText('Nombre del departamento…'), {
      target: { value: 'Salud' },
    })
    expect(screen.getByText('Ciencias, Tecnología y Salud')).toBeTruthy()
    expect(screen.queryByText('Ciencias Económicas y Administrativas')).toBeNull()
  })

  test('Permite crear un nuevo departamento y buscar un docente para asignarlo como Director', async () => {
    mocks.api.mockImplementation(async (path, options) => {
      if (options?.method === 'POST') return { ok: true, departamento: { id: 4, nombre: 'Facultad Multidisciplinaria' } }
      if (options?.method === 'PATCH' && path === '/departamentos/director') return { guardado: true }
      if (path === '/departamentos') return sampleDepts
      if (path === '/carreras') return sampleCarreras
      if (path === '/departamentos/docentes') return { docentes: sampleDocentes }
      return []
    })

    const onChanged = vi.fn()
    render(<DepartamentosPage canManage={true} onChanged={onChanged} />)
    await screen.findByText('Ciencias Económicas y Administrativas')

    fireEvent.click(screen.getByRole('button', { name: 'Nuevo departamento' }))
    const input = screen.getByLabelText('Nombre del departamento')
    expect(input.value).toBe('')

    fireEvent.change(input, { target: { value: 'Facultad Multidisciplinaria' } })

    // Buscar docente por nombre
    const searchDocente = screen.getByPlaceholderText('Buscar docente por nombre o cédula…')
    fireEvent.change(searchDocente, { target: { value: 'Mario' } })
    expect(screen.getByText('Prof. Mario Miranda')).toBeTruthy()

    // Asignar al docente Mario Miranda
    fireEvent.click(screen.getAllByRole('button', { name: 'Asignar como Director' })[0])
    expect(screen.getByText('Prof. Mario Miranda')).toBeTruthy()
    expect(screen.getByText('Cédula docente:')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Registrar departamento' }))

    await screen.findByText('Departamento y director docente registrados exitosamente.')
    expect(mocks.api).toHaveBeenCalledWith('/departamentos', {
      method: 'POST',
      data: { nombre: 'Facultad Multidisciplinaria' },
    })
    expect(mocks.api).toHaveBeenCalledWith('/departamentos/director', {
      method: 'PATCH',
      data: { id_usuario: 25, id_departamento: 4 },
    })
    expect(onChanged).toHaveBeenCalled()
  })

  test('Permite editar un departamento y asignarle un docente como Director', async () => {
    mocks.api.mockImplementation(async (path, options) => {
      if (options?.method === 'PATCH') return { ok: true, guardado: true }
      if (path === '/departamentos') return sampleDepts
      if (path === '/carreras') return sampleCarreras
      if (path === '/departamentos/docentes') return { docentes: sampleDocentes }
      return []
    })

    const onChanged = vi.fn()
    render(<DepartamentosPage canManage={true} onChanged={onChanged} />)
    await screen.findByText('Ciencias de la Educación y Humanidades')

    fireEvent.click(screen.getByRole('button', { name: 'Editar Ciencias de la Educación y Humanidades' }))
    const nameInput = screen.getByLabelText('Nombre del departamento')
    expect(nameInput.value).toBe('Ciencias de la Educación y Humanidades')

    // Asignar a Prof. Mario Miranda
    const assignButtons = screen.getAllByRole('button', { name: 'Asignar como Director' })
    fireEvent.click(assignButtons[1]) // Mario Miranda (id: 25)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar departamento' }))

    await screen.findByText('Departamento y director docente actualizados exitosamente.')
    expect(mocks.api).toHaveBeenCalledWith('/departamentos/director', {
      method: 'PATCH',
      data: { id_usuario: 25, id_departamento: 2 },
    })
    expect(onChanged).toHaveBeenCalled()
  })

  test('Permite quitar la asignación de director a un departamento', async () => {
    mocks.api.mockImplementation(async (path, options) => {
      if (options?.method === 'PATCH') return { ok: true, guardado: true }
      if (path === '/departamentos') return sampleDepts
      if (path === '/carreras') return sampleCarreras
      if (path === '/departamentos/docentes') return { docentes: sampleDocentes }
      return []
    })

    const onChanged = vi.fn()
    render(<DepartamentosPage canManage={true} onChanged={onChanged} />)
    await screen.findByText('Ciencias Económicas y Administrativas')

    fireEvent.click(screen.getByRole('button', { name: 'Editar Ciencias Económicas y Administrativas' }))
    expect(screen.getAllByText('Lic. Director Económicas')[0]).toBeTruthy()

    // Quitar asignación
    fireEvent.click(screen.getByRole('button', { name: 'Quitar director' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar departamento' }))

    await screen.findByText('Departamento y director docente actualizados exitosamente.')
    expect(mocks.api).toHaveBeenCalledWith('/departamentos/director', {
      method: 'PATCH',
      data: { id_usuario: 10, id_departamento: null },
    })
    expect(onChanged).toHaveBeenCalled()
  })

  test('Permite eliminar un departamento sin dependencias mediante DELETE /api/departamentos', async () => {
    mocks.api.mockImplementation(async (path, options) => {
      if (options?.method === 'DELETE') return { ok: true }
      if (path === '/departamentos') return sampleDepts
      if (path === '/carreras') return sampleCarreras
      if (path === '/departamentos/docentes') return { docentes: sampleDocentes }
      return []
    })

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    const onChanged = vi.fn()
    render(<DepartamentosPage canManage={true} onChanged={onChanged} />)
    await screen.findByText('Ciencias de la Educación y Humanidades')

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Ciencias de la Educación y Humanidades' }))

    await screen.findByText('Departamento eliminado exitosamente.')
    expect(mocks.api).toHaveBeenCalledWith('/departamentos', {
      method: 'DELETE',
      data: { id: 2 },
    })
    expect(onChanged).toHaveBeenCalled()
  })
})
