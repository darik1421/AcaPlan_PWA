import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import DashboardPage from '../src/pages/DashboardPage'
const mocks=vi.hoisted(()=>({api:vi.fn(),logout:vi.fn(),profile:{id_usuario:1,rol:'administrador'}}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
vi.mock('../src/features/auth/AuthContext',()=>({useAuth:()=>({profile:mocks.profile,logout:mocks.logout})}))
afterEach(()=>{cleanup();mocks.api.mockReset()})

test('El flujo reúne los ejemplos con asignaciones y retira la pantalla de preferencias',async()=>{
 const context={isAdmin:true,canManageSecciones:true,canManageCarreras:true,activePeriod:{id_periodo:1,nombre:'Semestre'}}
 mocks.api.mockImplementation(async path=>path==='/workspace'?context:path==='/programacion/resumen'?{detalles:[],secciones_sin_asignaturas:[]}:[])
 render(<DashboardPage/> )
 await screen.findByText('Semestre Activo: Semestre')
 expect(screen.queryByRole('button',{name:'Reglas y conflictos'})).toBeNull()
 expect(screen.queryByRole('button',{name:'Importar Excel'})).toBeNull()
 expect(screen.queryByPlaceholderText('Buscar...')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Asignación académica'}))
 await screen.findByRole('button',{name:'Descargar ejemplo XLSX'})
 expect(screen.queryByRole('button',{name:'Registrar Impartición'})).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Restricciones'}))
 await screen.findByRole('heading',{name:'Restricciones'})
 expect(screen.getByText('Consultar disponibilidad del modelo anterior')).toBeTruthy()
 expect(mocks.api.mock.calls.some(([path])=>path.startsWith('/planificacion/'))).toBe(false)
})

test('Cambiar de perfil oculta los permisos anteriores mientras consulta los actuales',async()=>{
 const context={canManageAccounts:true,activePeriod:{id_periodo:1,nombre:'Semestre'}}
 mocks.api.mockImplementation(async path=>path==='/workspace'?context:[])
 const view=render(<DashboardPage/>)
 await screen.findByRole('button',{name:'Gestión de Cuentas'})
 mocks.api.mockImplementation(()=>new Promise(()=>{}))
 mocks.profile={id_usuario:2,rol:'docente'}
 view.rerender(<DashboardPage/>)
 expect(screen.queryByRole('button',{name:'Gestión de Cuentas'})).toBeNull()
 expect(screen.getByText('Cargando tu espacio de trabajo…')).toBeTruthy()
 expect(screen.queryByText('Semestre Activo: Semestre')).toBeNull()
})

test('Asignación académica integra años de carrera y tiempos quedan en Semestres para el encargado',async()=>{
 const context={isAdmin:true,canManageSecciones:true,canManageBloques:true,activePeriod:{id_periodo:1,nombre:'Semestre'}}
 mocks.api.mockImplementation(async path=>path==='/workspace'?context:path==='/programacion/resumen'?{detalles:[],secciones_sin_asignaturas:[]}:[])
 render(<DashboardPage/> )
 await screen.findByText('Configuración de tiempos del semestre')
 expect(screen.queryByRole('button',{name:'Grupos',exact:true})).toBeNull()
 expect(screen.queryByRole('button',{name:'Demanda de carga',exact:true})).toBeNull()
 expect(screen.queryByRole('button',{name:'Bloques y recesos',exact:true})).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Asignación académica',exact:true}))
 await screen.findByRole('heading',{name:'Asignaturas y docentes recibidos'})
 fireEvent.click(screen.getByRole('button',{name:'Años de carrera y turnos'}))
 await screen.findByRole('heading',{name:'Años de carrera',exact:true})
 expect(screen.queryByRole('heading',{name:'Asignaturas y docentes recibidos'})).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Semestres',exact:true}))
 expect(screen.getByText('Configuración de tiempos del semestre')).toBeTruthy()
})
