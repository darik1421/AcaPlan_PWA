import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,expect,test,vi} from 'vitest'
import EspaciosPage from '../src/features/management/EspaciosPage'
import AsignaturasPage from '../src/features/management/AsignaturasPage'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const room={id_aula:1,id_pabellon:1,codigo:'QA-1',pabellon_nombre:'QA',sede:'CUR',tipo:'aula',capacidad:30,estado:'activo'}
const subject={id_asignatura:1,id_carrera:1,codigo:'QA',nombre:'Asignatura QA',ano_estudio:1,horas_teoricas:2,horas_practicas:1,carrera_nombre:'Carrera QA',estado:'activo'}
test('Una carga fallida de inventario no aparenta estar vacía y permite recuperarse',async()=>{
 let failed=true
 mocks.api.mockImplementation(async path=>{if(failed)throw new Error('Consulta interrumpida');return path==='/inventario'?[room]:[]})
 render(<EspaciosPage canManage periodId={1}/>)
 await screen.findByRole('alert')
 expect(screen.queryByText('No hay aulas que coincidan con los filtros.')).toBeNull()
 expect(screen.queryByText('Ningún espacio seleccionado')).toBeNull()
 failed=false;fireEvent.click(screen.getByRole('button',{name:'Actualizar inventario'}))
 await screen.findByText('QA-1')
 expect(screen.getByRole('button',{name:'Editar',exact:true})).toBeTruthy()
})
test('Si falla actualizar inventario se retiran las filas anteriores y sus controles de corrección',async()=>{
 let failed=false
 mocks.api.mockImplementation(async path=>{if(failed)throw new Error('Sin conexión');return path==='/inventario'?[room]:[]})
 render(<EspaciosPage canManage periodId={1}/>)
 await screen.findByText('QA-1')
 failed=true;fireEvent.click(screen.getByRole('button',{name:'Actualizar inventario'}))
 await screen.findByRole('alert')
 expect(screen.queryByText('QA-1')).toBeNull()
 expect(screen.queryByRole('button',{name:'Editar',exact:true})).toBeNull()
 expect(mocks.api.mock.calls.some(([,o])=>o?.method==='PATCH')).toBe(false)
})
test('Los pabellones tampoco se muestran vacíos cuando la consulta ha fallado',async()=>{
 mocks.api.mockRejectedValue(new Error('Sin conexión'))
 render(<EspaciosPage/>)
 await screen.findByRole('alert')
 fireEvent.click(screen.getByRole('button',{name:'Pabellones',exact:true}))
 expect(screen.queryByText('Vacío.')).toBeNull()
 expect(screen.getByRole('button',{name:'Actualizar inventario'}).disabled).toBe(false)
})
test('Una actualización fallida del catálogo anterior retira la edición sin afectar el catálogo importado',async()=>{
 let failed=false
 mocks.api.mockImplementation(async path=>{
  if(path==='/asignaturas/importadas')return []
  if(failed)throw new Error('Consulta interrumpida')
  return path==='/asignaturas'?[subject]:[{id_carrera:1,nombre:'Carrera QA',estado:'activo'}]
 })
 render(<AsignaturasPage context={{isAdmin:true}} canManage onChanged={vi.fn()}/>)
 fireEvent.click(screen.getByText('Catálogo anterior'))
 await screen.findByText('Asignatura QA')
 failed=true;fireEvent.click(screen.getByRole('button',{name:'Actualizar lista'}))
 await screen.findByRole('alert')
 await waitFor(()=>expect(screen.queryByRole('button',{name:'Editar Asignatura QA'})).toBeNull())
 expect(screen.queryByText('No hay asignaturas que coincidan.')).toBeNull()
 expect(screen.getByText('No hay asignaturas importadas.')).toBeTruthy()
})

test('Actualizar el inventario retira un filtro de tipo que ya no existe',async()=>{
 let rooms=[room]
 mocks.api.mockImplementation(async path=>path==='/inventario'?rooms:[])
 render(<EspaciosPage/>)
 await screen.findByText('QA-1')
 fireEvent.change(screen.getByLabelText('Filtrar por tipo'),{target:{value:'aula'}})
 rooms=[{...room,tipo:'laboratorio'}]
 fireEvent.click(screen.getByRole('button',{name:'Actualizar inventario'}))
 await screen.findByText('QA-1')
 await waitFor(()=>expect(screen.getByLabelText('Filtrar por tipo').value).toBe(''))
 expect(screen.queryByText('No hay aulas que coincidan con los filtros.')).toBeNull()
})
