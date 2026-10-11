import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import DashboardPage from '../src/pages/DashboardPage'
const mocks=vi.hoisted(()=>({api:vi.fn(),logout:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
vi.mock('../src/features/auth/AuthContext',()=>({useAuth:()=>({profile:{rol:'administrador'},logout:mocks.logout})}))
afterEach(()=>{cleanup();mocks.api.mockReset()})

test('El flujo reúne los ejemplos con asignaciones y retira la pantalla de preferencias',async()=>{
 const context={isAdmin:true,canManageSecciones:true,canManageCarreras:true,activePeriod:{id_periodo:1,nombre:'Semestre'}}
 mocks.api.mockImplementation(async path=>path==='/workspace'?context:path==='/programacion/resumen'?{detalles:[],secciones_sin_asignaturas:[]}:[])
 render(<DashboardPage/> )
 await screen.findByText('Semestre Activo: Semestre')
 expect(screen.queryByRole('button',{name:'Reglas y conflictos'})).toBeNull()
 expect(screen.queryByRole('button',{name:'Importar Excel'})).toBeNull()
 expect(screen.queryByPlaceholderText('Buscar...')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Demanda de carga'}))
 await screen.findByRole('button',{name:'Descargar ejemplo XLSX'})
 expect(screen.queryByRole('button',{name:'Registrar Impartición'})).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Restricciones'}))
 await screen.findByRole('heading',{name:'Restricciones'})
 expect(screen.getByText('Consultar disponibilidad del modelo anterior')).toBeTruthy()
 expect(mocks.api.mock.calls.some(([path])=>path.startsWith('/planificacion/'))).toBe(false)
})
