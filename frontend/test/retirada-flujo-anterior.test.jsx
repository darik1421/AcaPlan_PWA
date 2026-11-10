import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import DisponibilidadPage from '../src/features/management/DisponibilidadPage'
import EspaciosPage from '../src/features/management/EspaciosPage'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})

test('Restricciones retira las consultas de disponibilidad anterior y no exige declarar ausencia de restricciones',async()=>{
 mocks.api.mockImplementation(async path=>path==='/restricciones/unificadas'?{version:2,docentes:[],restricciones:[]}:path==='/restricciones/consecutivas/contexto'?{asignaturas:[],reglas:[],huella:'a'.repeat(32)}:[])
 render(<DisponibilidadPage context={{activePeriod:{id_periodo:1},canManageDisponibilidad:true}}/> )
 await screen.findByText('No hay restricciones comunicadas en este semestre.')
 expect(mocks.api.mock.calls.some(([path])=>path==='/disponibilidad'||path==='/docentes')).toBe(false)
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
 expect(screen.queryByRole('button',{name:'Catálogo de Recursos'})).toBeNull()
 expect(screen.queryByRole('button',{name:'Nuevo recurso'})).toBeNull()
 expect(mocks.api.mock.calls.some(([,options])=>options?.method==='POST')).toBe(false)
})
