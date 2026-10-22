import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import DashboardPage from '../src/pages/DashboardPage'
const mocks=vi.hoisted(()=>({api:vi.fn(),logout:vi.fn(),profile:{id_usuario:1,rol:'administrador'}}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
vi.mock('../src/features/auth/AuthContext',()=>({useAuth:()=>({profile:mocks.profile,logout:mocks.logout})}))
afterEach(()=>{cleanup();mocks.api.mockReset()})

test('Revalidar el mismo perfil conserva la cuenta sin guardar; cambiar permisos retira el acceso',async()=>{
 mocks.profile={id_usuario:1,rol:'administrador'}
 const context={canManageAccounts:true,canCreateAccounts:true,catalogoCarreras:[]}
 mocks.api.mockImplementation(async path=>path==='/workspace'?context:[])
 const view=render(<DashboardPage/>)
 fireEvent.click(await screen.findByRole('button',{name:'Gestión de Cuentas'}))
 await waitFor(()=>expect(screen.getByRole('button',{name:'Nueva cuenta'}).disabled).toBe(false))
 fireEvent.click(screen.getByRole('button',{name:'Nueva cuenta'}))
 fireEvent.change(screen.getByLabelText('Nombre completo'),{target:{value:'Prueba sin guardar'}})
 fireEvent.change(screen.getByLabelText('Correo'),{target:{value:'prueba@example.com'}})
 fireEvent.change(screen.getByLabelText('Contraseña inicial'),{target:{value:'ClaveDePrueba'}})
 const workspaceCalls=mocks.api.mock.calls.filter(([path])=>path==='/workspace').length
 for(let i=0;i<3;i++) {
   mocks.profile={...mocks.profile}
   view.rerender(<DashboardPage/>)
   expect(screen.getByLabelText('Nombre completo').value).toBe('Prueba sin guardar')
   expect(screen.getByLabelText('Correo').value).toBe('prueba@example.com')
   expect(screen.getByLabelText('Contraseña inicial').value).toBe('ClaveDePrueba')
 }
 expect(mocks.api.mock.calls.filter(([path])=>path==='/workspace')).toHaveLength(workspaceCalls)
 mocks.api.mockImplementation(()=>new Promise(()=>{}))
 mocks.profile={id_usuario:1,rol:'docente'}
 view.rerender(<DashboardPage/>)
 expect(screen.queryByLabelText('Nombre completo')).toBeNull()
 expect(screen.queryByRole('button',{name:'Gestión de Cuentas'})).toBeNull()
 expect(screen.getByText('Cargando tu espacio de trabajo…')).toBeTruthy()
})

test('El flujo reúne los ejemplos con asignaciones y retira la pantalla de preferencias',async()=>{
 const context={isAdmin:true,canManageSecciones:true,canManageCarreras:true,activePeriod:{id_periodo:1,nombre:'Semestre'}}
 mocks.api.mockImplementation(async path=>path==='/workspace'?context:path==='/programacion/resumen'?{detalles:[],secciones_sin_asignaturas:[]}:[])
 render(<DashboardPage/> )
 await screen.findByText('Semestre Activo: Semestre')
 expect(screen.queryByRole('button',{name:'Reglas y conflictos'})).toBeNull()
 expect(screen.queryByRole('button',{name:'Importar Excel'})).toBeNull()
 expect(screen.queryByPlaceholderText('Buscar...')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Asignación académica'}))
 await screen.findByRole('button',{name:'Descargar plantilla de asignación'})
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
 await screen.findByRole('button',{name:'Descargar plantilla de asignación'})
 expect(screen.queryByRole('button',{name:'Años de carrera y turnos'})).toBeNull()
 expect(screen.getAllByLabelText('Seleccionar Excel de asignación académica')).toHaveLength(1)
 expect(screen.queryByLabelText('Seleccionar Excel de años de carrera')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Semestres',exact:true}))
 expect(screen.getByText('Configuración de tiempos del semestre')).toBeTruthy()
})
