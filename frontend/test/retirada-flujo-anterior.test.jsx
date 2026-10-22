import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import DisponibilidadPage from '../src/features/management/DisponibilidadPage'
import EspaciosPage from '../src/features/management/EspaciosPage'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})

test('La disponibilidad anterior se consulta sin permisos de tiempo libre ni bloqueo por ausencia',async()=>{
 mocks.api.mockImplementation(async path=>path==='/docentes'?[{id_docente:1,nombres:'Ana'}]:path==='/restricciones/consecutivas/contexto'?{asignaturas:[],reglas:[],huella:'a'.repeat(32)}:[])
 render(<DisponibilidadPage context={{activePeriod:{id_periodo:1},canManageDisponibilidad:true}}/> )
 await screen.findByText('No hay intervalos anteriores registrados para este docente.')
 expect(screen.queryByRole('button',{name:'Nuevo Permiso'})).toBeNull()
 expect(screen.queryByText(/no se le podrán asignar clases/)).toBeNull()
 expect(mocks.api.mock.calls.every(([path,options])=>!options?.method||(path==='/restricciones/consecutivas/contexto'&&options.method==='POST'))).toBe(true)
})

test('Inventario elimina altas manuales pero permite corregir aulas existentes',async()=>{
 const aula={id_aula:1,id_pabellon:1,codigo:'A1',tipo:'aula',capacidad:20,recursos:[],estado:'activo',pabellon_nombre:'A'}
 mocks.api.mockImplementation(async path=>({'/inventario':[aula],'/pabellones':[{id_pabellon:1,nombre:'A'}],'/recursos':[]}[path]||[]))
 render(<EspaciosPage canManage onChanged={vi.fn()}/> )
 fireEvent.click(await screen.findByRole('button',{name:'Editar'}))
 fireEvent.change(screen.getByLabelText('Capacidad (personas)'),{target:{value:'25'}})
 fireEvent.submit(screen.getByRole('button',{name:'Guardar aula'}).closest('form'))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/aulas',expect.objectContaining({method:'PATCH',data:expect.objectContaining({id:1,capacidad:25})})))
 expect(screen.queryByRole('button',{name:'Nueva aula'})).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Pabellones',exact:true}))
 expect(screen.queryByRole('button',{name:'Nuevo pabellón'})).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Catálogo de Recursos'}))
 expect(screen.queryByRole('button',{name:'Nuevo recurso'})).toBeNull()
 expect(mocks.api.mock.calls.some(([,options])=>options?.method==='POST')).toBe(false)
})
