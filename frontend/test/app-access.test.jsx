import {cleanup,render,screen} from '@testing-library/react'
import {afterEach,expect,test,vi} from 'vitest'
import App from '../src/App'
const mocks=vi.hoisted(()=>({auth:{},workspace:vi.fn()}))
vi.mock('../src/features/auth/AuthProvider',()=>({default:({children})=>children}))
vi.mock('../src/features/auth/AuthContext',()=>({useAuth:()=>mocks.auth}))
vi.mock('../src/features/auth/LoginPage',()=>({default:()=> <p>Acceso institucional</p>}))
vi.mock('../src/features/auth/RecoveryPage',()=>({default:()=> <p>Recuperación institucional</p>}))
vi.mock('../src/pages/DashboardPage',()=>({default:()=>{mocks.workspace();return <p>Espacio autorizado</p>}}))
afterEach(()=>{cleanup();mocks.workspace.mockClear()})
test('Sin sesión o sin perfil no se monta el espacio de trabajo',()=>{
 mocks.auth={session:null,loading:false}
 const view=render(<App/>);expect(screen.getByText('Acceso institucional')).toBeTruthy()
 mocks.auth={session:{},profile:null,loading:false,retry:vi.fn(),logout:vi.fn()}
 view.rerender(<App/>);expect(screen.getByText('No se pudo habilitar el acceso')).toBeTruthy()
 expect(mocks.workspace).not.toHaveBeenCalled()
})
test('Recuperar una contraseña mantiene su pantalla aunque haya sesión',()=>{
 mocks.auth={session:{},profile:{},recovery:true}
 render(<App/>);expect(screen.getByText('Recuperación institucional')).toBeTruthy()
 expect(mocks.workspace).not.toHaveBeenCalled()
})
test('Una sesión con perfil puede abrir el espacio de trabajo',async()=>{
 mocks.auth={session:{},profile:{}}
 render(<App/>);await screen.findByText('Espacio autorizado')
 expect(mocks.workspace).toHaveBeenCalled()
})

test('La carga inicial utiliza el logo actual y no el contenedor provisional',()=>{
 mocks.auth={session:null,loading:true}
 const view=render(<App/>)
 expect(screen.getByRole('status').textContent).toBe('Verificando tu acceso…')
 expect(screen.getByRole('img',{name:'AcaPlan'})).toBeTruthy()
 expect(view.container.querySelector('.brand-mark')).toBeNull()
 expect(view.container.querySelector('.access-status')).toBeTruthy()
})
