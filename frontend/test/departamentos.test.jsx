import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import CarrerasPage from '../src/features/management/CarrerasPage'
const { api } = vi.hoisted(() => ({api:vi.fn()}))
vi.mock('../src/services/management', () => ({api}))
afterEach(() => {cleanup(); api.mockReset()})
test('No crea la carrera cuando falta seleccionar su departamento',async()=>{
 api.mockImplementation(async path=>path==='/departamentos'?{departamentos:[{id:3,nombre:'Tecnológicas y Salud'}],carreras:[]}:[])
 render(<CarrerasPage canManage manageDepartments onChanged={vi.fn()} />)
 await screen.findByText('No hay carreras que coincidan.')
 fireEvent.click(screen.getByRole('button',{name:'Nueva carrera'}))
 fireEvent.change(screen.getByLabelText('Nombre de la carrera'),{target:{value:'Sistemas'}})
 fireEvent.submit(screen.getByRole('button',{name:'Guardar carrera'}).closest('form'))
 await screen.findByText('Selecciona el departamento de la carrera antes de guardarla.')
 expect(api.mock.calls.some(([,options])=>options?.method==='POST')).toBe(false)
})

test('El guardado atómico envía carrera y departamento en una sola escritura',async()=>{
 api.mockImplementation(async(path,options)=>path==='/departamentos'?{departamentos:[{id:3,nombre:'Tecnológicas y Salud'}],carreras:[]}:options?.method?{id:7}:[])
 render(<CarrerasPage canManage manageDepartments onChanged={vi.fn()}/>)
 await screen.findByText('No hay carreras que coincidan.')
 fireEvent.click(screen.getByRole('button',{name:'Nueva carrera'}))
 fireEvent.change(screen.getByLabelText('Nombre de la carrera'),{target:{value:'Sistemas'}})
 fireEvent.change(screen.getByLabelText('Departamento de la carrera'),{target:{value:'3'}})
 fireEvent.click(screen.getByRole('button',{name:'Guardar carrera'}))
 await screen.findByText('Carrera registrada.')
 expect(api).toHaveBeenCalledWith('/carreras',{method:'POST',data:{nombre:'Sistemas',id_departamento:3,revision_departamento:0}})
 expect(api.mock.calls.filter(([,options])=>options?.method)).toHaveLength(1)
})

test('Un fallo de consulta de carreras no se presenta como catálogo vacío ni permite dar altas',async()=>{
 api.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce([{id_carrera:1,nombre:'Sistemas',estado:'activo'}])
 render(<CarrerasPage canManage onChanged={vi.fn()}/>)
 await screen.findByRole('alert')
 expect(screen.queryByText('No hay carreras que coincidan.')).toBeNull()
 expect(screen.getByRole('button',{name:'Nueva carrera'}).disabled).toBe(true)
 fireEvent.click(screen.getByRole('button',{name:'Actualizar lista'}))
 await screen.findByText('Sistemas')
 expect(screen.getByRole('button',{name:'Nueva carrera'}).disabled).toBe(false)
})

test('Retirar la gestión de carreras descarta la edición y no permite recuperarla al devolver el permiso',async()=>{
 api.mockResolvedValue([{id_carrera:1,nombre:'Sistemas',estado:'activo'}])
 const view=render(<CarrerasPage canManage onChanged={vi.fn()}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Editar Sistemas'}))
 fireEvent.change(screen.getByLabelText('Nombre de la carrera'),{target:{value:'Cambio sin guardar'}})
 view.rerender(<CarrerasPage canManage={false} onChanged={vi.fn()}/>)
 expect(screen.queryByRole('button',{name:'Guardar carrera'})).toBeNull()
 view.rerender(<CarrerasPage canManage onChanged={vi.fn()}/>)
 expect(screen.queryByRole('button',{name:'Guardar carrera'})).toBeNull()
 expect(api.mock.calls.some(([,options])=>options?.method)).toBe(false)
})

test('Un guardado de carrera anterior no anuncia éxito ni refresca después de retirar y devolver el permiso',async()=>{
 let finish
 api.mockImplementation((_,options)=>options?.method?new Promise(resolve=>{finish=resolve}):Promise.resolve([{id_carrera:1,nombre:'Sistemas',estado:'activo'}]))
 const changed=vi.fn(),view=render(<CarrerasPage canManage onChanged={changed}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Editar Sistemas'}))
 fireEvent.click(screen.getByRole('button',{name:'Guardar carrera'}))
 view.rerender(<CarrerasPage canManage={false} onChanged={changed}/>)
 view.rerender(<CarrerasPage canManage onChanged={changed}/>)
 await act(async()=>{finish({guardado:true})})
 expect(screen.queryByText('Carrera actualizada.')).toBeNull()
 expect(screen.queryByRole('button',{name:'Guardar carrera'})).toBeNull()
 expect(changed).not.toHaveBeenCalled()
})
