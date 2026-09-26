import { afterEach, expect, test, vi } from 'vitest'
import { endSession } from '../src/services/endSession'

afterEach(() => { vi.useRealTimers(); localStorage.clear(); sessionStorage.clear() })
function setup(signOut) {
  localStorage.setItem('acaplan-pwa-auth', 'sesion-de-prueba')
  localStorage.setItem('acaplan-pwa-auth-code-verifier', 'verificador')
  localStorage.setItem('otra-aplicacion', 'conservar')
  sessionStorage.setItem('acaplan-recovery', 'id-de-prueba')
  return { auth: { signOut, stopAutoRefresh: vi.fn().mockResolvedValue() },
    storage: localStorage, sessionStorage, navigate: vi.fn() }
}
function assertCleared(ctx, destination) {
  expect(localStorage.getItem('acaplan-pwa-auth')).toBeNull()
  expect(localStorage.getItem('acaplan-pwa-auth-code-verifier')).toBeNull()
  expect(sessionStorage.getItem('acaplan-recovery')).toBeNull()
  expect(localStorage.getItem('otra-aplicacion')).toBe('conservar')
  expect(ctx.navigate).toHaveBeenCalledWith(destination)
}
test('Cierre confirmado limita el alcance a esta sesión y limpia datos privados', async () => {
  const ctx = setup(vi.fn().mockResolvedValue({ error: null }))
  await endSession(ctx)
  expect(ctx.auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  assertCleared(ctx, '/?salida=ok')
})
test('Sin conexión completa la salida local y comunica su alcance', async () => {
  const ctx = setup(vi.fn().mockRejectedValue(new Error('sin conexión')))
  await endSession(ctx)
  assertCleared(ctx, '/?salida=local')
})
test('Una petición de cierre colgada no retiene la sesión local', async () => {
  vi.useFakeTimers()
  const ctx = setup(vi.fn(() => new Promise(() => {})))
  const pending = endSession(ctx)
  await vi.advanceTimersByTimeAsync(3500)
  await pending
  assertCleared(ctx, '/?salida=local')
})
test('Un fallo al detener el refresco no bloquea la navegación al acceso', async () => {
  const ctx = setup(vi.fn().mockResolvedValue({ error: null }))
  ctx.auth.stopAutoRefresh.mockRejectedValue(new Error('SDK'))
  await endSession(ctx)
  assertCleared(ctx, '/?salida=ok')
})
