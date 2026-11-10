import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import TurnoAno from '../src/features/management/TurnoAno'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const row={id_carrera:1,ano_estudio:3,carrera:'Sistemas'}
const context={huella:'a'.repeat(32),asignaturas:[{id:1,codigo:'WEB',nombre:'Web',turno:'matutino'},{id:2,codigo:'BD',nombre:'Bases',turno:'matutino'}]}
test('Muestra todas las asignaturas y exige confirmar un turno distinto',async()=>{
 mocks.api.mockResolvedValue(context);const onSaved=vi.fn();render(<TurnoAno row={row} periodId={1} onSaved={onSaved}/>);
 const select=await screen.findByLabelText('Nuevo turno'),button=screen.getByRole('button',{name:'Guardar turno del año'});
 expect(button.disabled).toBe(true);fireEvent.change(select,{target:{value:'vespertino'}});expect(button.disabled).toBe(true)
 expect(screen.getByText('BD · Bases: Matutino → Vespertino')).toBeTruthy();fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(button)
 await waitFor(()=>expect(onSaved).toHaveBeenCalledTimes(1));expect(mocks.api).toHaveBeenCalledWith('/asignacion-academica/turno',{method:'PATCH',data:{id_periodo:1,...{id_carrera:1,ano_estudio:3},turno:'vespertino',huella:context.huella}})
})
test('Un conflicto exige recargar y no permite repetir la huella anterior',async()=>{
 mocks.api.mockResolvedValueOnce(context).mockRejectedValueOnce(new Error('Otro usuario modificó este registro.'));
 render(<TurnoAno row={row} periodId={1}/>);fireEvent.change(await screen.findByLabelText('Nuevo turno'),{target:{value:'nocturno'}});fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Guardar turno del año'}))
 await screen.findByRole('alert');expect(screen.queryByRole('button',{name:'Guardar turno del año'})).toBeNull();expect(screen.getByRole('button',{name:'Volver a cargar asignaturas'})).toBeTruthy()
})
test('No comunica éxito de otro semestre después de cambiar de contexto',async()=>{
 let finish;mocks.api.mockImplementation(async(path,options)=>options.method==='PATCH'?new Promise(resolve=>{finish=resolve}):context)
 const onSaved=vi.fn(),view=render(<TurnoAno row={row} periodId={1} onSaved={onSaved}/>);
 fireEvent.change(await screen.findByLabelText('Nuevo turno'),{target:{value:'nocturno'}});fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Guardar turno del año'}));await waitFor(()=>expect(finish).toBeTruthy());view.rerender(<TurnoAno row={row} periodId={2} onSaved={onSaved}/>);finish({guardado:true});await screen.findByLabelText('Nuevo turno');expect(onSaved).not.toHaveBeenCalled()
})
