import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import SeccionesPage from '../src/features/management/SeccionesPage'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const context={activePeriod:{id_periodo:1},carreras:[1]}
const rows=[{id_seccion:1,id_periodo:1,id_carrera:1,codigo:'SIS-1',carrera_nombre:'Sistemas',ano_estudio:1,cantidad_estudiantes:null},{id_seccion:2,id_periodo:1,id_carrera:2,codigo:'MED-1',carrera_nombre:'Medicina'},{id_seccion:3,id_periodo:2,id_carrera:1,codigo:'SEMESTRE-ANTERIOR'}]
function load(){mocks.api.mockImplementation(async path=>path==='/secciones'?rows:path==='/grupos-turnos'?[{id_seccion:1,id_cuadricula:5}]:[{id_cuadricula:5,id_periodo:2,nombre:'Vínculo de otro semestre'}])}
test('La consulta histórica respeta carrera y semestre y no permite escrituras',async()=>{
 load();render(<SeccionesPage context={context}/>)
 await screen.findByText('SIS-1')
 expect(screen.queryByText('MED-1')).toBeNull()
 expect(screen.queryByText('SEMESTRE-ANTERIOR')).toBeNull()
 expect(screen.queryByText('Vínculo de otro semestre')).toBeNull()
 expect(screen.getByText('Sin registrar')).toBeTruthy()
 expect(screen.queryByRole('button',{name:/guardar/i})).toBeNull()
 expect(mocks.api.mock.calls.every(([,options])=>!options.method)).toBe(true)
})
test('El administrador puede consultar otras carreras y filtrar sin formularios de edición',async()=>{
 load();render(<SeccionesPage context={{...context,isAdmin:true}}/>)
 await screen.findByText('MED-1')
 fireEvent.change(screen.getByLabelText('Buscar año histórico'),{target:{value:'Sistemas'}})
 expect(screen.queryByText('MED-1')).toBeNull()
 expect(screen.getByText('SIS-1')).toBeTruthy()
 expect(screen.queryByRole('spinbutton')).toBeNull()
})
test('Una consulta fallida muestra el error y permite volver a cargar',async()=>{
 mocks.api.mockRejectedValue(new Error('Sin conexión'))
 render(<SeccionesPage context={context}/>)
 await screen.findByRole('alert')
 expect(screen.queryByText('No hay años históricos que coincidan.')).toBeNull()
 load();fireEvent.click(screen.getByRole('button',{name:'Actualizar consulta histórica'}))
 await screen.findByText('SIS-1')
})
