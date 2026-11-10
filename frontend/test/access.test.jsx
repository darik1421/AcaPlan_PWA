import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import AuthProvider from '../src/features/auth/AuthProvider'
import { useAuth } from '../src/features/auth/AuthContext'

const mocks = vi.hoisted(() => ({ callback:null, getProfile:vi.fn(), logout:vi.fn(), unsubscribe:vi.fn() }))
vi.mock('../src/lib/supabase', () => ({ supabase: { auth: {
  onAuthStateChange(callback) { mocks.callback=callback; return {data:{subscription:{unsubscribe:mocks.unsubscribe}}} },
} } }))
vi.mock('../src/services/session', () => ({ getProfile:mocks.getProfile, logout:mocks.logout }))
function Probe() {
  const { profile, session, error, loading, recovery } = useAuth()
  return <div>{loading ? 'Verificando' : recovery ? 'Recuperación' : profile ? 'Panel '+profile.nombre : session ? 'Bloqueado '+error : 'Acceso'}</div>
}
const session = { user:{ id:'usuario-de-prueba' },access_token:'token-de-prueba' }
const emit = (event,value) => act(() => mocks.callback(event,value))
beforeEach(() => { sessionStorage.clear(); mocks.getProfile.mockReset() })
afterEach(() => { cleanup(); vi.useRealTimers() })
test('Espera la inicialización y no muestra datos privados sin sesión', () => {
  render(<AuthProvider><Probe /></AuthProvider>)
  expect(screen.getByText('Verificando')).toBeTruthy()
  emit('INITIAL_SESSION',null)
  expect(screen.getByText('Acceso')).toBeTruthy()
  expect(mocks.getProfile).not.toHaveBeenCalled()
})
test('Perfil autorizado abre el panel y salir retira la información privada', async () => {
  mocks.getProfile.mockResolvedValue({nombre:'Persona de prueba'})
  render(<AuthProvider><Probe /></AuthProvider>)
  emit('SIGNED_IN',session)
  await screen.findByText('Panel Persona de prueba')
  emit('SIGNED_OUT',null)
  expect(screen.getByText('Acceso')).toBeTruthy()
  expect(screen.queryByText('Panel Persona de prueba')).toBeNull()
})
test('Un perfil inactivo no habilita el panel aunque exista sesión Auth', async () => {
  mocks.getProfile.mockRejectedValue(new Error('Cuenta inactiva'))
  render(<AuthProvider><Probe /></AuthProvider>)
  emit('SIGNED_IN',session)
  expect(await screen.findByText('Bloqueado Cuenta inactiva')).toBeTruthy()
})
test('Una respuesta tardía del perfil no restaura el panel después de salir', async () => {
  let complete
  mocks.getProfile.mockImplementation(() => new Promise(resolve=>{complete=resolve}))
  render(<AuthProvider><Probe /></AuthProvider>)
  emit('SIGNED_IN',session)
  await waitFor(()=>expect(mocks.getProfile).toHaveBeenCalled())
  emit('SIGNED_OUT',null)
  await act(async()=>complete({nombre:'Privado'}))
  expect(screen.getByText('Acceso')).toBeTruthy()
})
test('Recuperación no abre datos del panel y conserva el modo al recargar', () => {
  const first=render(<AuthProvider><Probe /></AuthProvider>)
  emit('PASSWORD_RECOVERY',session)
  expect(screen.getByText('Recuperación')).toBeTruthy()
  expect(mocks.getProfile).not.toHaveBeenCalled()
  first.unmount()
  render(<AuthProvider><Probe /></AuthProvider>)
  emit('INITIAL_SESSION',session)
  expect(screen.getByText('Recuperación')).toBeTruthy()
})

function EditingProbe() {
 const {profile,error,retry,accessRevision}=useAuth()
 return <><output aria-label="Verificación vigente">{accessRevision}</output>{profile&&<input aria-label="Edición pendiente" defaultValue=""/>}{error&&<p role="alert">{error}</p>}<button onClick={retry}>Comprobar perfil</button></>
}

test('Un fallo temporal de red conserva el perfil verificado y el formulario abierto',async()=>{
 mocks.getProfile.mockResolvedValueOnce({nombre:'Persona'}).mockRejectedValueOnce(new TypeError('Sin conexión')).mockResolvedValueOnce({nombre:'Persona'})
 render(<AuthProvider><EditingProbe/></AuthProvider>)
 emit('SIGNED_IN',session)
 fireEvent.change(await screen.findByLabelText('Edición pendiente'),{target:{value:'Sin guardar'}})
 fireEvent.click(screen.getByRole('button',{name:'Comprobar perfil'}))
 await screen.findByRole('alert')
 expect(screen.getByLabelText('Edición pendiente').value).toBe('Sin guardar')
 fireEvent.click(screen.getByRole('button',{name:'Comprobar perfil'}))
 await waitFor(()=>expect(screen.queryByRole('alert')).toBeNull())
 expect(screen.getByLabelText('Edición pendiente').value).toBe('Sin guardar')
})

test.each([401,403])('Una denegación real %s retira el perfil aunque antes estuviera verificado',async status=>{
 mocks.getProfile.mockResolvedValueOnce({nombre:'Persona'}).mockRejectedValueOnce(Object.assign(new Error('Acceso retirado'),{status}))
 render(<AuthProvider><EditingProbe/></AuthProvider>)
 emit('SIGNED_IN',session)
 await screen.findByLabelText('Edición pendiente')
 fireEvent.click(screen.getByRole('button',{name:'Comprobar perfil'}))
 await screen.findByText('Acceso retirado')
 expect(screen.queryByLabelText('Edición pendiente')).toBeNull()
})

test('Notificaciones repetidas con el mismo token no vuelven a consultar ni desmontan el formulario',async()=>{
 mocks.getProfile.mockResolvedValue({nombre:'Persona'})
 render(<AuthProvider><EditingProbe/></AuthProvider>)
 emit('SIGNED_IN',session)
 fireEvent.change(await screen.findByLabelText('Edición pendiente'),{target:{value:'Conservar'}})
 for(let i=0;i<4;i++)emit('SIGNED_IN',{...session,user:{...session.user}})
 expect(mocks.getProfile).toHaveBeenCalledTimes(1)
 expect(screen.getByLabelText('Edición pendiente').value).toBe('Conservar')
 emit('TOKEN_REFRESHED',{...session,access_token:'token-renovado'})
 await waitFor(()=>expect(mocks.getProfile).toHaveBeenCalledTimes(2))
 expect(screen.getByLabelText('Edición pendiente').value).toBe('Conservar')
})

test('Volver a la pestaña no dispara comprobaciones duplicadas y revalida después de un minuto',async()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-04T18:00:00Z'))
 mocks.getProfile.mockResolvedValue({nombre:'Persona'})
 render(<AuthProvider><EditingProbe/></AuthProvider>)
 await act(async()=>mocks.callback('SIGNED_IN',session))
 expect(mocks.getProfile).toHaveBeenCalledTimes(1)
 await act(async()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'))})
 expect(mocks.getProfile).toHaveBeenCalledTimes(1)
 await act(async()=>vi.advanceTimersByTimeAsync(61000))
 expect(mocks.getProfile).toHaveBeenCalledTimes(2)
 await act(async()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'))})
 expect(mocks.getProfile).toHaveBeenCalledTimes(2)
})

test('Solo una verificación exitosa solicita actualizar los permisos del espacio de trabajo',async()=>{
 mocks.getProfile.mockResolvedValueOnce({nombre:'Persona'}).mockRejectedValueOnce(new TypeError('Sin conexión')).mockResolvedValueOnce({nombre:'Persona'})
 render(<AuthProvider><EditingProbe/></AuthProvider>)
 emit('SIGNED_IN',session)
 await screen.findByLabelText('Edición pendiente')
 expect(screen.getByLabelText('Verificación vigente').textContent).toBe('1')
 fireEvent.click(screen.getByRole('button',{name:'Comprobar perfil'}))
 await screen.findByRole('alert')
 expect(screen.getByLabelText('Verificación vigente').textContent).toBe('1')
 fireEvent.click(screen.getByRole('button',{name:'Comprobar perfil'}))
 await waitFor(()=>expect(screen.getByLabelText('Verificación vigente').textContent).toBe('2'))
})
