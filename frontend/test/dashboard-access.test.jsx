import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react'
import {afterEach,expect,test,vi} from 'vitest'
import DashboardPage from '../src/pages/DashboardPage'
import {AuthContext} from '../src/features/auth/AuthContext'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
vi.mock('../src/features/management/GeneradorPage',()=>({default:()=> <p>GeneradorPage</p>}))
vi.mock('../src/features/management/HorariosPublicados',()=>({default:()=> <p>HorariosPublicados</p>}))
vi.mock('../src/features/management/BorradoresPage',()=>({default:()=> <p>BorradoresPage</p>}))
vi.mock('../src/features/management/AccountsPage',()=>({default:()=> <><p>AccountsPage</p><input aria-label="Cuenta sin guardar" defaultValue=""/></>}))
vi.mock('../src/features/management/PeriodsPage',()=>({default:()=> <p>PeriodsPage</p>}))
vi.mock('../src/features/management/CarrerasPage',()=>({default:()=> <p>CarrerasPage</p>}))
vi.mock('../src/features/management/AsignaturasPage',()=>({default:()=> <p>AsignaturasPage</p>}))
vi.mock('../src/features/management/EspaciosPage',()=>({default:()=> <p>EspaciosPage</p>}))
vi.mock('../src/features/management/AsignacionAcademicaPage',()=>({default:()=> <p>AsignacionAcademicaPage</p>}))
vi.mock('../src/features/management/CuadriculasPage',()=>({default:()=> <p>CuadriculasPage</p>}))
vi.mock('../src/features/management/DisponibilidadPage',()=>({default:()=> <p>DisponibilidadPage</p>}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const base={departmentScopeVersion:1,personalScheduleVersion:1,funciones:[],activePeriod:null}
function view(profile,accessRevision=0){return <AuthContext.Provider value={{profile,accessRevision,logout:vi.fn()}}><DashboardPage/></AuthContext.Provider>}

test('Navegar vuelve al inicio; revalidar la misma pantalla conserva el desplazamiento',async()=>{
 mocks.api.mockResolvedValue({...base,isAdmin:true,canManageAccounts:true,canManageBloques:true})
 const profile={nombre:'Director',rol:'director'}, rendered=render(view(profile,1))
 await screen.findByText('GeneradorPage')
 const content=screen.getByRole('main')
 content.scrollTop=180;content.scrollLeft=40
 fireEvent.click(screen.getByRole('button',{name:'Gestión de Cuentas'}))
 expect(content.scrollTop).toBe(0);expect(content.scrollLeft).toBe(0)
 content.scrollTop=120
 rendered.rerender(view(profile,2))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledTimes(2))
 expect(content.scrollTop).toBe(120)
})
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
 await screen.findByText('GeneradorPage')
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

test('Revalidar el acceso actualiza permisos sin desmontar un formulario si el ámbito sigue igual',async()=>{
 let context={...base,isAdmin:true,canManageAccounts:true,carreras:[1,2]}
 mocks.api.mockImplementation(async()=>context)
 const profile={nombre:'Director',rol:'director'},page=render(view(profile,1))
 fireEvent.click(await screen.findByRole('button',{name:'Gestión de Cuentas'}))
 fireEvent.change(screen.getByLabelText('Cuenta sin guardar'),{target:{value:'Conservar edición'}})
 context={...context,carreras:[2,1]}
 page.rerender(view(profile,2))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledTimes(2))
 expect(screen.getByLabelText('Cuenta sin guardar').value).toBe('Conservar edición')
})

test('La misma cuenta pierde la pantalla al retirarse sus permisos en la siguiente verificación',async()=>{
 let context={...base,isAdmin:true,canManageAccounts:true}
 mocks.api.mockImplementation(async()=>context)
 const profile={nombre:'Persona',rol:'docente'},page=render(view(profile,1))
 fireEvent.click(await screen.findByRole('button',{name:'Gestión de Cuentas'}))
 await screen.findByText('AccountsPage')
 context=base
 page.rerender(view(profile,2))
 await waitFor(()=>expect(screen.queryByText('AccountsPage')).toBeNull())
 expect(screen.queryByRole('button',{name:'Gestión de Cuentas'})).toBeNull()
})

test('Una interrupción de consulta del espacio no borra el formulario ya abierto',async()=>{
 mocks.api.mockResolvedValueOnce({...base,isAdmin:true,canManageAccounts:true}).mockRejectedValueOnce(Object.assign(new Error('Sin conexión'),{status:503}))
 const profile={nombre:'Director',rol:'director'},page=render(view(profile,1))
 fireEvent.click(await screen.findByRole('button',{name:'Gestión de Cuentas'}))
 fireEvent.change(screen.getByLabelText('Cuenta sin guardar'),{target:{value:'No borrar'}})
 page.rerender(view(profile,2))
 await screen.findByText('Sin conexión')
 expect(screen.getByLabelText('Cuenta sin guardar').value).toBe('No borrar')
})

test.each([401,403])('Una denegación del espacio %s retira los controles y el formulario',async status=>{
 mocks.api.mockResolvedValueOnce({...base,isAdmin:true,canManageAccounts:true}).mockRejectedValueOnce(Object.assign(new Error('Acceso denegado'),{status}))
 const profile={nombre:'Persona',rol:'docente'},page=render(view(profile,1))
 fireEvent.click(await screen.findByRole('button',{name:'Gestión de Cuentas'}))
 page.rerender(view(profile,2))
 await screen.findByText('Acceso denegado')
 expect(screen.queryByLabelText('Cuenta sin guardar')).toBeNull()
 expect(screen.queryByRole('button',{name:'Gestión de Cuentas'})).toBeNull()
})


test('El menú agrupa las funciones sin ocultar las opciones autorizadas',async()=>{
 mocks.api.mockResolvedValue({...base,isAdmin:true,canManageAccounts:true,canManageBloques:true,canReadDrafts:true})
 render(view({nombre:'Director',rol:'director'}));await screen.findByText('GeneradorPage')
 const plan=screen.getByRole('group',{name:'Planificación'}),setup=screen.getByRole('group',{name:'Configuración'})
 expect(within(plan).getAllByRole('button').map(b=>b.textContent)).toEqual(['Asignación académica','Restricciones','Generador de horarios','Borradores'])
 expect(within(setup).getByRole('button',{name:'Gestión de Cuentas'})).toBeTruthy()
 fireEvent.click(within(setup).getByRole('button',{name:'Semestres'}));expect(screen.getByText('PeriodsPage')).toBeTruthy()
})
