import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,expect,test,vi} from 'vitest'
import ProgramacionPage from '../src/features/management/ProgramacionPage'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
vi.mock('../src/features/management/PreparacionExcel',()=>({default:()=>null}))
vi.mock('../src/features/management/DatosAnos',()=>({default:()=>null}))
vi.mock('../src/features/management/AsignacionesImportadas',()=>({default:({onDataChanged})=><button onClick={onDataChanged}>Corrección confirmada</button>}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
test('Una corrección confirmada retira el diagnóstico anterior sin volver a consultarlo automáticamente',async()=>{
 mocks.api.mockResolvedValue({semestre:'Semestre ficticio',pendientes:[{asignatura:'Web',mensaje:'Falta revisar necesidades',donde:'Asignación académica',responsable:'Coordinador de carrera'}]})
 render(<ProgramacionPage context={{canManageSecciones:true,activePeriod:{id_periodo:1,nombre:'Prueba'}}}/>)
 fireEvent.click(screen.getByRole('button',{name:'Revisar datos guardados'}))
 await screen.findByText('Falta revisar necesidades')
 expect(screen.getByText('Coordinador de carrera')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Corrección confirmada'}))
 expect(screen.queryByText('Falta revisar necesidades')).toBeNull()
 expect(mocks.api).toHaveBeenCalledTimes(1)
})
