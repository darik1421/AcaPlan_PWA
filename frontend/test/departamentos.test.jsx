import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import CarrerasPage from '../src/features/management/CarrerasPage'
const { api } = vi.hoisted(() => ({api:vi.fn()}))
vi.mock('../src/services/management', () => ({api}))
afterEach(() => {cleanup(); api.mockReset()})
test('La carrera elige departamento en su formulario y conserva el ID si falla esa relación', async () => {
 api.mockImplementation(async (path, options) => {
  if(path==='/departamentos') return {departamentos:[{id:3,nombre:'Ciencias Tecnológicas y Salud'}],carreras:[]}
  if(path==='/departamentos/carrera') throw new Error('Sin conexión')
  if(options?.method==='POST') return {id:7}
  if(options?.method==='PATCH') return {ok:true}
  return []
 })
 render(<CarrerasPage canManage manageDepartments onChanged={vi.fn()} />)
 await screen.findByText('No hay carreras que coincidan.')
 fireEvent.click(screen.getByRole('button',{name:'Nueva carrera'}))
 fireEvent.change(screen.getByLabelText('Nombre de la carrera'),{target:{value:'Sistemas'}})
 fireEvent.change(screen.getByLabelText('Departamento de la carrera'),{target:{value:'3'}})
 fireEvent.click(screen.getByRole('button',{name:'Guardar carrera'}))
 await screen.findByText('La carrera se guardó, pero su departamento no: Sin conexión')
 fireEvent.click(screen.getByRole('button',{name:'Guardar carrera'}))
 await waitFor(()=>expect(api).toHaveBeenCalledWith('/carreras',expect.objectContaining({method:'PATCH',data:expect.objectContaining({id:7})})))
 expect(api.mock.calls.filter(([,o])=>o?.method==='POST')).toHaveLength(1)
 expect(api).toHaveBeenCalledWith('/departamentos/carrera',{method:'PATCH',data:{id_carrera:7,id_departamento:3,revision:0}})
})
