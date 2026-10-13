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

test('Dos grupos con el mismo código conservan identidad y asignación independientes',async()=>{
 const sameCode=groups.map(g=>({...g,codigo:'A',ano_estudio:1,cantidad_estudiantes:20}))
 mocks.api.mockImplementation(async(path,options)=>options?.method==='POST'?{...options.data,id_cuadricula:5,version:1}:[])
 render(<GruposTurnos context={{...context,isAdmin:true}} groups={sameCode} configurations={grids}/>)
 const selector=await screen.findByLabelText('Bloques de A · Otra · ID 2')
 fireEvent.change(selector,{target:{value:'5'}})
 fireEvent.click(screen.getByRole('button',{name:'Guardar A · Otra · ID 2'}))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/grupos-turnos',{method:'POST',data:{id_seccion:2,id_cuadricula:5,version:0}}))
 expect(screen.getByLabelText('Bloques de A · Sistemas · ID 1').value).toBe('')
})

test('Combina filtros de carrera, año, turno y búsqueda sin mezclar semestres',async()=>{
 const data=[{...groups[0],ano_estudio:1},{...groups[1],ano_estudio:2},{...groups[0],id_seccion:3,id_periodo:2,codigo:'HISTORICO'}]
 mocks.api.mockResolvedValue([{id_seccion:1,id_cuadricula:5,version:1}])
 render(<GruposTurnos context={context} groups={data} configurations={[{...grids[0],turno:'matutino'}]}/>)
 await screen.findByText('A')
 fireEvent.change(screen.getByLabelText('Filtrar grupos por turno'),{target:{value:'sin_asignar'}})
 expect(screen.queryByText('A')).toBeNull()
 expect(screen.getByText('B')).toBeTruthy()
 fireEvent.change(screen.getByLabelText('Filtrar grupos por carrera'),{target:{value:'1'}})
 expect(screen.getByText('No hay grupos que coincidan con los filtros.')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Limpiar filtros'}))
 fireEvent.change(screen.getByLabelText('Filtrar grupos por año'),{target:{value:'1'}})
 fireEvent.change(screen.getByLabelText('Buscar grupos'),{target:{value:'Sistemas'}})
 expect(screen.getByText('A')).toBeTruthy()
 expect(screen.queryByText('B')).toBeNull()
 expect(screen.queryByText('HISTORICO')).toBeNull()
})

test('Perder carreras autorizadas descarta la selección no guardada',async()=>{
 mocks.api.mockResolvedValue([])
 const view=render(<GruposTurnos context={context} groups={groups} configurations={grids}/>)
 fireEvent.change(await screen.findByLabelText('Bloques de A'),{target:{value:'5'}})
 view.rerender(<GruposTurnos context={{...context,carreras:[]}} groups={groups} configurations={grids}/>)
 expect(screen.queryByLabelText('Bloques de A')).toBeNull()
 view.rerender(<GruposTurnos context={context} groups={groups} configurations={grids}/>)
 expect(screen.getByLabelText('Bloques de A').value).toBe('')
 expect(mocks.api.mock.calls.some(([,options])=>options?.method==='POST')).toBe(false)
})

test('Un error de consulta no equivale a no tener grupos ni oculta una matrícula desconocida',async()=>{
 mocks.api.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue([])
 render(<GruposTurnos context={context} groups={[groups[0]]} configurations={grids} onEdit={vi.fn()}/>)
 await screen.findByRole('alert')
 expect(screen.queryByText('No hay grupos registrados en este semestre.')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Recargar asignaciones'}))
 await screen.findByText('Cantidad de estudiantes pendiente')
})
