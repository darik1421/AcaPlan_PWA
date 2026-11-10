import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import CuadriculasPage from '../src/features/management/CuadriculasPage'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const context={canManageBloques:true,activePeriod:{id_periodo:1,nombre:'Primer semestre'}}
const slot={dia:'Lunes',hora_inicio:'08:00',hora_fin:'08:45',es_receso:false}
const rows=[{id_cuadricula:1,id_periodo:1,nombre:'Mañana CUR',turno:'matutino',version:1,bloques:[slot]},
{id_cuadricula:2,id_periodo:1,nombre:'Tarde CUR',turno:'vespertino',version:1,bloques:[slot]}]
test('Una pantalla filtra turnos y usa el seleccionado al crear',async()=>{
 mocks.api.mockResolvedValue(rows)
 render(<CuadriculasPage context={context}/> )
 await screen.findByText(/Mañana CUR ·/)
 expect(screen.queryByText(/Tarde CUR ·/)).toBeNull()
 fireEvent.change(screen.getByLabelText('Turno a consultar'),{target:{value:'vespertino'}})
 expect(screen.queryByText(/Mañana CUR ·/)).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Añadir configuración de turno'}))
 expect(screen.getByLabelText('Turno',{exact:true}).value).toBe('vespertino')
 fireEvent.change(screen.getByLabelText('Nombre de la configuración'),{target:{value:'Nueva tarde'}})
 fireEvent.change(screen.getByLabelText('Inicio 1'),{target:{value:'13:00'}})
 fireEvent.change(screen.getByLabelText('Fin 1'),{target:{value:'13:45'}})
 fireEvent.submit(screen.getByRole('button',{name:'Guardar bloques y recesos'}).closest('form'))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/cuadriculas',expect.objectContaining({method:'POST',data:expect.objectContaining({turno:'vespertino',id_periodo:1})})))
})
test('Los bloques anteriores se consultan sin ofrecer escritura antigua',async()=>{
 mocks.api.mockImplementation(async path=>path==='/cuadriculas'?rows:[{...slot,id_bloque:1,id_periodo:1}])
 render(<CuadriculasPage context={context}/> )
 await screen.findByText(/Mañana CUR ·/)
 const details=screen.getByText('Consultar bloques anteriores sin turno asignado').closest('details')
 details.open=true;fireEvent(details,new Event('toggle'))
 await screen.findByText('08:00')
 expect(screen.queryByRole('button',{name:'Nuevo bloque lunes'})).toBeNull()
 expect(mocks.api).toHaveBeenCalledWith('/bloques',expect.anything())
})

test('Un rechazo por clases existentes conserva la corrección sin anunciar éxito',async()=>{
 mocks.api.mockImplementation(async(path,options)=>{
  if(options?.method==='POST') throw new Error('No puedes cambiar los tiempos: hay grupos con clases registradas.')
  return rows
 })
 render(<CuadriculasPage context={context}/> )
 await screen.findByText(/Mañana CUR ·/)
 const details=screen.getByText(/Mañana CUR ·/).closest('details');details.open=true
 fireEvent.click(screen.getByRole('button',{name:'Editar Mañana CUR'}))
 fireEvent.submit(screen.getByRole('button',{name:'Guardar bloques y recesos'}).closest('form'))
 await screen.findByRole('alert')
 expect(screen.queryByText('Bloques y recesos guardados.')).toBeNull()
 expect(screen.getByLabelText('Nombre de la configuración').value).toBe('Mañana CUR')
})
