import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import GruposTurnos from '../src/features/management/GruposTurnos'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const context={activePeriod:{id_periodo:1},funciones:['coordinador'],carreras:[1]}
const groups=[{id_seccion:1,id_periodo:1,id_carrera:1,codigo:'A',carrera_nombre:'Sistemas'},{id_seccion:2,id_periodo:1,id_carrera:2,codigo:'B',carrera_nombre:'Otra'}]
const grids=[{id_cuadricula:5,id_periodo:1,nombre:'Matutino'},{id_cuadricula:6,id_periodo:2,nombre:'Otro semestre'}]
test('Coordinador asigna solo su grupo y envía versión de concurrencia',async()=>{
 mocks.api.mockImplementation(async(path,options)=>options?.method==='POST'?{id_seccion:1,id_cuadricula:5,version:1}:path==='/secciones'?groups:[])
 render(<GruposTurnos context={context} configurations={grids}/> )
 const select=await screen.findByLabelText('Bloques de A')
 expect(screen.queryByLabelText('Bloques de B')).toBeNull()
 expect(screen.queryByRole('option',{name:'Otro semestre'})).toBeNull()
 fireEvent.change(select,{target:{value:'5'}})
 fireEvent.click(screen.getByRole('button',{name:'Guardar A'}))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/grupos-turnos',{method:'POST',data:{id_seccion:1,id_cuadricula:5,version:0}}))
 await screen.findByText('Bloques asignados a A.')
})

test('Un guardado incierto exige recargar antes de volver a escribir',async()=>{
 let assigned=[]
 mocks.api.mockImplementation(async(path,options)=>{
  if(options?.method==='POST'){
   assigned=[{id_seccion:1,id_cuadricula:5,version:1}]
   throw new Error('No se pudo confirmar la operación.')
  }
  return path==='/secciones'?groups:assigned
 })
 render(<GruposTurnos context={context} configurations={grids}/> )
 fireEvent.change(await screen.findByLabelText('Bloques de A'),{target:{value:'5'}})
 fireEvent.click(screen.getByRole('button',{name:'Guardar A'}))
 await screen.findByRole('alert')
 expect(screen.getByRole('button',{name:'Guardar A'}).disabled).toBe(true)
 expect(screen.getByLabelText('Bloques de A').disabled).toBe(true)
 fireEvent.click(screen.getByRole('button',{name:'Recargar asignaciones'}))
 await waitFor(()=>expect(screen.getByLabelText('Bloques de A').disabled).toBe(false))
 expect(screen.getByLabelText('Bloques de A').value).toBe('5')
 expect(screen.getByRole('button',{name:'Guardar A'}).disabled).toBe(true)
 expect(mocks.api.mock.calls.filter(([,options])=>options?.method==='POST')).toHaveLength(1)
})
