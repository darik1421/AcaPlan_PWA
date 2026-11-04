import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react'
import {afterEach,expect,test,vi} from 'vitest'
import DashboardPage from '../src/pages/DashboardPage'
import {AuthContext} from '../src/features/auth/AuthContext'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
vi.mock('../src/features/management/GeneradorPage',()=>({default:()=> <p>GeneradorPage</p>}))
vi.mock('../src/features/management/HorariosPublicados',()=>({default:()=> <p>HorariosPublicados</p>}))
vi.mock('../src/features/management/BorradoresPage',()=>({default:()=> <p>BorradoresPage</p>}))
vi.mock('../src/features/management/AccountsPage',()=>({default:()=> <p>AccountsPage</p>}))
vi.mock('../src/features/management/PeriodsPage',()=>({default:()=> <p>PeriodsPage</p>}))
vi.mock('../src/features/management/CarrerasPage',()=>({default:()=> <p>CarrerasPage</p>}))
vi.mock('../src/features/management/AsignaturasPage',()=>({default:()=> <p>AsignaturasPage</p>}))
vi.mock('../src/features/management/EspaciosPage',()=>({default:()=> <p>EspaciosPage</p>}))
vi.mock('../src/features/management/AsignacionAcademicaPage',()=>({default:()=> <p>AsignacionAcademicaPage</p>}))
vi.mock('../src/features/management/CuadriculasPage',()=>({default:()=> <p>CuadriculasPage</p>}))
vi.mock('../src/features/management/DisponibilidadPage',()=>({default:()=> <p>DisponibilidadPage</p>}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const base={departmentScopeVersion:1,personalScheduleVersion:1,funciones:[],activePeriod:null}
function view(profile){return <AuthContext.Provider value={{profile,logout:vi.fn()}}><DashboardPage/></AuthContext.Provider>}
test('El docente consulta horarios sin entradas de gestión y sin Departamentos independiente',async()=>{
 mocks.api.mockResolvedValue(base)
 render(view({nombre:'Docente',rol:'docente'}))
 await screen.findByText('HorariosPublicados')
 const nav=screen.getByRole('navigation')
 expect(within(nav).getByRole('button',{name:'Mi horario'})).toBeTruthy()
 for(const name of ['Carreras','Semestres','Asignación académica','Restricciones','Gestión de Cuentas','Departamentos']) expect(within(nav).queryByRole('button',{name})).toBeNull()
 fireEvent.click(within(nav).getByRole('button',{name:'Mi horario'}))
 expect(within(nav).getByRole('button',{name:'Mi horario'}).className).toBe('selected')
})
test('Al cambiar el perfil se desmonta la gestión que el contexto nuevo no permite',async()=>{
 let context={...base,isAdmin:true,canManageAccounts:true,canManageBloques:true}
 mocks.api.mockImplementation(async()=>context)
 const rendered=render(view({nombre:'Director',rol:'director'}))
 await screen.findByText('PeriodsPage')
 fireEvent.click(screen.getByRole('button',{name:'Gestión de Cuentas'}))
 await screen.findByText('AccountsPage')
 context=base
 rendered.rerender(view({nombre:'Docente',rol:'docente'}))
 await waitFor(()=>expect(screen.queryByText('AccountsPage')).toBeNull())
 await screen.findByText('HorariosPublicados')
 expect(screen.queryByRole('button',{name:'Gestión de Cuentas'})).toBeNull()
})

test('El menú se abre, se cierra al navegar y responde a Escape',async()=>{
 mocks.api.mockResolvedValue(base)
 render(view({nombre:'Docente',rol:'docente'}))
 await screen.findByText('HorariosPublicados')
 const toggle=screen.getByRole('button',{name:'Menú',exact:true})
 expect(toggle.getAttribute('aria-expanded')).toBe('false')
 fireEvent.click(toggle);expect(toggle.getAttribute('aria-expanded')).toBe('true')
 fireEvent.click(screen.getByRole('button',{name:'Mi horario',exact:true}))
 expect(toggle.getAttribute('aria-expanded')).toBe('false')
 fireEvent.click(toggle);fireEvent.keyDown(toggle,{key:'Escape'})
 expect(toggle.getAttribute('aria-expanded')).toBe('false')
})
