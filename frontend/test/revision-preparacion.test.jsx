import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import RevisionPreparacion from '../src/features/management/RevisionPreparacion'
const mocks=vi.hoisted(()=>({api:vi.fn()}));vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const report={pendientes:[{codigo:'SEDE',asignatura:'Sistemas',mensaje:'Falta la sede',donde:'Datos complementarios'}],consultado_en:'2026-10-14T12:00:00Z',asignaturas:1,anos:1}

test('Compara consultas, detecta cambios tras corregir y no mezcla semestres',async()=>{
 const first={...report,huella_datos:'a'.repeat(64),version_reglas:'1'}
 mocks.api.mockResolvedValue(first)
 const view=render(<RevisionPreparacion periodId={1} revision={1}/>)
 const consult=()=>fireEvent.click(screen.getByRole('button',{name:'Revisar datos guardados'}))
 consult();await screen.findByText('Falta la sede')
 expect(screen.queryByText(/coinciden con tu revisión/)).toBeNull()
 consult();await screen.findByText(/coinciden con tu revisión anterior/)
 view.rerender(<RevisionPreparacion periodId={1} revision={2}/>)
 mocks.api.mockResolvedValue({...first,huella_datos:'b'.repeat(64)})
 consult();await screen.findByText(/cambiaron desde tu consulta anterior/)
 view.rerender(<RevisionPreparacion periodId={2} revision={2}/>)
 consult();await screen.findByText('Falta la sede')
 expect(screen.queryByText(/cambiaron desde tu consulta anterior/)).toBeNull()
 expect(screen.queryByText(/coinciden con tu revisión/)).toBeNull()
})
test('Revisión bajo demanda muestra pendientes y dónde corregirlos sin archivos adicionales',async()=>{
 mocks.api.mockResolvedValue(report);render(<RevisionPreparacion periodId={1}/>);expect(mocks.api).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Revisar datos guardados'}));await screen.findByText('Falta la sede');expect(screen.getByText('Datos complementarios')).toBeTruthy();expect(document.querySelector('input[type=file]')).toBeNull()
})
test('Consulta fallida no aparece como preparación completa y oculta resultados anteriores',async()=>{
 mocks.api.mockResolvedValueOnce(report).mockRejectedValueOnce(new Error('Consulta fallida'));render(<RevisionPreparacion periodId={1}/>);fireEvent.click(screen.getByRole('button',{name:'Revisar datos guardados'}));await screen.findByText('Falta la sede');fireEvent.click(screen.getByRole('button',{name:'Revisar datos guardados'}));await screen.findByRole('alert');expect(screen.queryByText('Falta la sede')).toBeNull()
})
test('Una respuesta tardía del semestre anterior no se presenta en el nuevo',async()=>{
 let finish;mocks.api.mockImplementation(()=>new Promise(r=>{finish=r}));const view=render(<RevisionPreparacion periodId={1}/>);fireEvent.click(screen.getByRole('button',{name:'Revisar datos guardados'}));view.rerender(<RevisionPreparacion periodId={2}/>);finish(report);await waitFor(()=>expect(screen.getByRole('button',{name:'Revisar datos guardados'}).disabled).toBe(false));expect(screen.queryByText('Falta la sede')).toBeNull()
})
