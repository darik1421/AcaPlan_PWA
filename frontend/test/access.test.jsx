import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
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
afterEach(cleanup)
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
