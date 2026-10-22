import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import NecesidadesAsignacion from '../src/features/management/NecesidadesAsignacion'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const data={asignacion:{id:1,id_periodo:2,revision:5,codigo:'WEB',nombre:'Web',ano_estudio:3},definidas:false,tipo_espacio:null,recursos:[],tipos:['aula','laboratorio'],catalogo:[{id:4,nombre:'Computadora'},{id:5,nombre:'Televisor'}]}
test('Necesidades pendientes se guardan únicamente después de revisión expresa',async()=>{
 mocks.api.mockResolvedValueOnce(data).mockResolvedValueOnce({guardado:true});const saved=vi.fn()
 render(<NecesidadesAsignacion id={1} periodId={2} onSaved={saved} onClose={vi.fn()}/>)
 fireEvent.change(await screen.findByLabelText('Tipo de espacio necesario'),{target:{value:'laboratorio'}});fireEvent.click(screen.getByLabelText('Computadora'))
 expect(screen.getByRole('button',{name:'Guardar necesidades'}).disabled).toBe(true)
 fireEvent.click(screen.getByLabelText('Revisé las necesidades de esta asignatura y confirmo estos datos.'));fireEvent.click(screen.getByRole('button',{name:'Guardar necesidades'}))
 await waitFor(()=>expect(saved).toHaveBeenCalledTimes(1))
 expect(mocks.api).toHaveBeenLastCalledWith('/asignacion-academica/necesidades',{method:'PATCH',data:{id:1,id_periodo:2,revision:5,tipo_espacio:'laboratorio',recursos:[4]}})
})
test('No confunde pendiente con revisado sin requisitos especiales',async()=>{
 mocks.api.mockResolvedValueOnce({...data,definidas:true})
 render(<NecesidadesAsignacion id={1} periodId={2} onSaved={vi.fn()} onClose={vi.fn()}/>)
 await screen.findByText('El coordinador ya revisó estas necesidades.')
 expect(screen.queryByLabelText('Revisé las necesidades de esta asignatura y confirmo estos datos.')).toBeNull()
 expect(screen.getByRole('button',{name:'Guardar necesidades'}).disabled).toBe(true)
})
test('Un conflicto bloquea el reintento hasta consultar una nueva revisión',async()=>{
 mocks.api.mockResolvedValueOnce(data).mockRejectedValueOnce(new Error('Otro usuario modificó esta asignación')).mockResolvedValueOnce({...data,asignacion:{...data.asignacion,revision:6}})
 render(<NecesidadesAsignacion id={1} periodId={2} onSaved={vi.fn()} onClose={vi.fn()}/>)
 fireEvent.click(await screen.findByLabelText('Revisé las necesidades de esta asignatura y confirmo estos datos.'));fireEvent.click(screen.getByRole('button',{name:'Guardar necesidades'}));await screen.findByRole('alert')
 expect(screen.getByLabelText('Tipo de espacio necesario').closest('fieldset').disabled).toBe(true)
 fireEvent.click(screen.getByRole('button',{name:'Recargar necesidades'}));await waitFor(()=>expect(screen.queryByRole('alert')).toBeNull())
})
test('Una respuesta tardía del semestre anterior no confirma en el nuevo',async()=>{
 let complete;mocks.api.mockResolvedValueOnce(data).mockImplementationOnce(()=>new Promise(r=>{complete=r})).mockResolvedValueOnce({...data,asignacion:{...data.asignacion,id_periodo:3}})
 const saved=vi.fn(),view=render(<NecesidadesAsignacion id={1} periodId={2} onSaved={saved} onClose={vi.fn()}/>)
 fireEvent.click(await screen.findByLabelText('Revisé las necesidades de esta asignatura y confirmo estos datos.'));fireEvent.click(screen.getByRole('button',{name:'Guardar necesidades'}))
 await waitFor(()=>expect(complete).toBeTruthy());view.rerender(<NecesidadesAsignacion id={1} periodId={3} onSaved={saved} onClose={vi.fn()}/>);complete({guardado:true})
 await screen.findByLabelText('Tipo de espacio necesario');expect(saved).not.toHaveBeenCalled()
})
