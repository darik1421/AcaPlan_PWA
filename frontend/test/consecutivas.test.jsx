import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import ConsecutivasPanel from '../src/features/management/ConsecutivasPanel'
const mocks=vi.hoisted(()=>({api:vi.fn()}));vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const context={activePeriod:{id_periodo:1},canManageDisponibilidad:true}
const subject={id:1,id_carrera:1,ano_estudio:3,turno:'matutino',codigo:'WEB',nombre:'Web',carrera:'Sistemas',estado_carrera:'activo'}
const data={asignaturas:[subject,{...subject,id:2,codigo:'BD',nombre:'Bases'},{...subject,id:3,id_carrera:2,carrera:'Otra'}],reglas:[],huella:'a'.repeat(32)}
test('Ofrece asignaturas del mismo año y exige autorización antes del guardado',async()=>{
 mocks.api.mockResolvedValue(data);render(<ConsecutivasPanel context={context}/>);fireEvent.click(await screen.findByRole('button',{name:'Registrar clases consecutivas'}));fireEvent.change(screen.getByLabelText('Primera asignatura'),{target:{value:'1'}})
 const second=screen.getByLabelText('Segunda asignatura');expect([...second.options].map(o=>o.value)).toEqual(['','1','2']);fireEvent.change(second,{target:{value:'1'}})
 fireEvent.change(screen.getByLabelText('Motivo de la solicitud autorizada'),{target:{value:'Prácticas'}});expect(screen.getByRole('button',{name:'Guardar regla consecutiva'}).disabled).toBe(true)
 fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Guardar regla consecutiva'}));await screen.findByText(/Regla guardada/)
 expect(mocks.api).toHaveBeenCalledWith('/restricciones/consecutivas',{method:'POST',data:{id_periodo:1,asignacion_a:1,asignacion_b:1,activa:true,motivo:'Prácticas',huella:data.huella}})
})
test('Coordinadores consultan pero no registran ni corrigen reglas',async()=>{
 mocks.api.mockResolvedValue({...data,reglas:[{id:1,asignacion_a:1,asignacion_b:2,motivo:'Juntas',activa:true,version:1}]});render(<ConsecutivasPanel context={{...context,canManageDisponibilidad:false}}/>);await screen.findByText('Juntas');expect(screen.queryByRole('button',{name:'Registrar clases consecutivas'})).toBeNull();expect(screen.queryByRole('button',{name:'Corregir regla 1'})).toBeNull()
})
test('Conflicto de guardado bloquea el formulario hasta recargar',async()=>{
 mocks.api.mockResolvedValueOnce({...data,reglas:[{id:1,asignacion_a:1,asignacion_b:2,motivo:'Juntas',activa:true,version:1}]}).mockRejectedValueOnce(new Error('Otro usuario cambió la regla'))
 render(<ConsecutivasPanel context={context}/>);fireEvent.click(await screen.findByRole('button',{name:'Corregir regla 1'}));fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Guardar regla consecutiva'}));await screen.findByRole('alert');await waitFor(()=>expect(screen.queryByRole('button',{name:'Guardar regla consecutiva'})).toBeNull())
})
