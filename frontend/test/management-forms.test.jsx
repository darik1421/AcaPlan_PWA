import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import PeriodsPage from '../src/features/management/PeriodsPage'
import AccountsPage from '../src/features/management/AccountsPage'
import { AuthContext } from '../src/features/auth/AuthContext'

const mocks = vi.hoisted(() => ({ api:vi.fn() }))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(() => { cleanup(); mocks.api.mockReset() })
const period = {id_periodo:1,nombre:'Semestre de prueba',ano_lectivo:2026,fecha_inicio:'2026-01-01',fecha_fin:'2026-06-01',es_activo:true}
const account = {id_usuario:1,nombre:'Cuenta de prueba',correo:'prueba@example.test',cedula:'TEST',rol:'administrador',estado:'activo',funciones:[],carreras:[]}
const context = {canCreateAccounts:true,catalogoCarreras:[{id_carrera:1,nombre:'Carrera de prueba'}]}
function accounts() {
  return render(<AuthContext.Provider value={{ profile:account,retry:vi.fn() }}><AccountsPage context={context} onChanged={vi.fn()}/></AuthContext.Provider>)
}
test('Un docente consulta períodos sin controles de modificación', async () => {
  mocks.api.mockResolvedValue([period])
  render(<PeriodsPage canManage={false} onChanged={vi.fn()}/>)
  await screen.findByText('Semestre de prueba')
  expect(screen.queryByRole('button',{name:'Nuevo período'})).toBeNull()
  expect(screen.queryByRole('button',{name:/Editar/})).toBeNull()
  expect(screen.queryByRole('button',{name:/Desactivar/})).toBeNull()
})
test('Fechas invertidas no salen del formulario hacia la API', async () => {
  mocks.api.mockResolvedValue([])
  render(<PeriodsPage canManage onChanged={vi.fn()}/>)
  await screen.findByText('Aún no hay períodos académicos registrados.')
  fireEvent.click(screen.getByRole('button',{name:'Nuevo período'}))
  fireEvent.change(screen.getByLabelText('Fecha inicial'),{target:{value:'2026-06-01'}})
  fireEvent.change(screen.getByLabelText('Fecha final'),{target:{value:'2026-01-01'}})
  fireEvent.submit(screen.getByRole('button',{name:'Guardar período'}).closest('form'))
  expect(screen.getByRole('alert').textContent).toContain('anterior a la final')
  expect(mocks.api.mock.calls.filter(([,options])=>options?.method==='POST')).toHaveLength(0)
})
test('Cancelar un período no modifica registros', async () => {
  mocks.api.mockResolvedValue([period])
  render(<PeriodsPage canManage onChanged={vi.fn()}/>)
  await screen.findByText('Semestre de prueba')
  fireEvent.click(screen.getByRole('button',{name:'Editar Semestre de prueba'}))
  fireEvent.click(screen.getByRole('button',{name:'Cancelar'}))
  expect(screen.queryByRole('button',{name:'Guardar período'})).toBeNull()
  expect(mocks.api).toHaveBeenCalledTimes(1)
})
test('Editar una cuenta conserva el correo compartido y muestra sus funciones', async () => {
  mocks.api.mockResolvedValue([account])
  accounts()
  fireEvent.click(await screen.findByRole('button',{name:'Editar cuenta de Cuenta de prueba'}))
  expect(screen.getByLabelText('Correo').readOnly).toBe(true)
  expect(screen.queryByLabelText('Contraseña inicial')).toBeNull()
  fireEvent.click(screen.getByLabelText('Coordinación'))
  expect(screen.getByLabelText('Carrera de prueba')).toBeTruthy()
})
test('Error de duplicado conserva el formulario para corregirlo', async () => {
  mocks.api.mockImplementation((path,options)=>options?.method==='POST'
    ? Promise.reject(new Error('El correo o la cédula ya están registrados.'))
    : Promise.resolve([account]))
  accounts()
  await screen.findByText('Cuenta de prueba')
  fireEvent.click(screen.getByRole('button',{name:'Nueva cuenta'}))
  fireEvent.change(screen.getByLabelText('Nombre completo'),{target:{value:'Persona de prueba'}})
  fireEvent.submit(screen.getByRole('button',{name:'Guardar cuenta'}).closest('form'))
  expect((await screen.findByRole('alert')).textContent).toContain('ya están registrados')
  expect(screen.getByLabelText('Nombre completo').value).toBe('Persona de prueba')
})
