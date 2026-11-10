import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,expect,test,vi} from 'vitest'
import ProgramacionPage from '../src/features/management/ProgramacionPage'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
vi.mock('../src/features/management/PreparacionExcel',()=>({default:()=>null}))
vi.mock('../src/features/management/DatosAnos',()=>({default:({onDataChanged})=><button onClick={onDataChanged}>Datos del año confirmados</button>}))
vi.mock('../src/features/management/AsignacionesImportadas',()=>({default:({onDataChanged})=><button onClick={onDataChanged}>Corrección confirmada</button>}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
test('Una corrección confirmada retira el diagnóstico anterior sin volver a consultarlo automáticamente',async()=>{
 mocks.api.mockResolvedValue({semestre:'Semestre ficticio',pendientes:[{asignatura:'Web',mensaje:'Falta revisar necesidades',donde:'Asignación académica',responsable:'Coordinador de carrera'}]})
 render(<ProgramacionPage context={{canManageSecciones:true,activePeriod:{id_periodo:1,nombre:'Prueba'}}}/>)
 fireEvent.click(screen.getByText('3. Verificar datos'))
 fireEvent.click(screen.getByRole('button',{name:'Revisar datos guardados'}))
 await screen.findByText('Falta revisar necesidades')
 expect(screen.getByText('Coordinador de carrera')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Corrección confirmada'}))
 expect(screen.queryByText('Falta revisar necesidades')).toBeNull()
 expect(mocks.api).toHaveBeenCalledTimes(1)
})

test('Completar estudiantes y sede invalida el diagnóstico sin recargar las asignaciones ni borrar la confirmación',async()=>{
 mocks.api.mockResolvedValue({semestre:'Semestre ficticio',pendientes:[{asignatura:'Web',mensaje:'Faltan estudiantes y sede',donde:'Años de carrera y turnos'}]})
 render(<ProgramacionPage context={{canManageSecciones:true,activePeriod:{id_periodo:1,nombre:'Prueba'}}}/>)
 fireEvent.click(screen.getByText('3. Verificar datos'))
 fireEvent.click(screen.getByRole('button',{name:'Revisar datos guardados'}))
 await screen.findByText('Faltan estudiantes y sede')
 fireEvent.click(screen.getByText('Completar o corregir datos de los años de carrera'))
 fireEvent.click(screen.getByRole('button',{name:'Datos del año confirmados'}))
 expect(screen.queryByText('Faltan estudiantes y sede')).toBeNull()
 expect(mocks.api).toHaveBeenCalledTimes(1)
})
