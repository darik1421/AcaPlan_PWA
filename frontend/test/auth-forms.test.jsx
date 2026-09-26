import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AuthContext } from '../src/features/auth/AuthContext'
import LoginPage from '../src/features/auth/LoginPage'
import RecoveryPage from '../src/features/auth/RecoveryPage'

const mocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn(), linkError: false,
}))
vi.mock('../src/lib/supabase', () => ({
  supabase: { auth: mocks }, supabaseConfigured: true,
  get authLinkError() { return mocks.linkError },
}))
beforeEach(() => { mocks.linkError = false; window.history.replaceState({}, '', '/') })
afterEach(cleanup)
function recovery(active = false) {
  return render(<AuthContext.Provider value={{ recovery: active, logout: vi.fn() }}><RecoveryPage /></AuthContext.Provider>)
}
test('Acceso envía el correo normalizado y no modifica la contraseña', async () => {
  mocks.signInWithPassword.mockResolvedValue({ error: null })
  render(<LoginPage />)
  fireEvent.change(screen.getByLabelText('Correo institucional'), { target: { value: 'DOCENTE@EXAMPLE.TEST' } })
  fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'Clave Prueba9!' } })
  fireEvent.submit(screen.getByRole('button', { name: 'Iniciar sesión' }).closest('form'))
  await waitFor(() => expect(mocks.signInWithPassword).toHaveBeenCalledWith({ email:'docente@example.test', password:'Clave Prueba9!' }))
})
test('Credenciales inválidas muestran un mensaje genérico', async () => {
  mocks.signInWithPassword.mockResolvedValue({ error: { status:400, message:'datos internos' } })
  render(<LoginPage />)
  fireEvent.submit(screen.getByRole('button', { name:'Iniciar sesión' }).closest('form'))
  expect((await screen.findByRole('alert')).textContent).toContain('Revisa tus credenciales')
  expect(screen.getByRole('alert').textContent).not.toContain('datos internos')
})
test.each([null, { status:400 }])('Recuperación no revela si existe el correo (%j)', async failure => {
  mocks.resetPasswordForEmail.mockResolvedValue({ error: failure })
  recovery()
  fireEvent.change(screen.getByLabelText('Correo institucional'), { target: { value:'DOCENTE@EXAMPLE.TEST' } })
  fireEvent.submit(screen.getByRole('button', { name:'Enviar enlace' }).closest('form'))
  expect((await screen.findByRole('status')).textContent).toContain('Si el correo corresponde a una cuenta')
  expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('docente@example.test', { redirectTo:'http://127.0.0.1:5173/recuperar' })
})
test('Recuperación informa límite de solicitudes sin afirmar envío', async () => {
  mocks.resetPasswordForEmail.mockResolvedValue({ error: { status:429 } })
  recovery()
  fireEvent.submit(screen.getByRole('button', { name:'Enviar enlace' }).closest('form'))
  expect((await screen.findByRole('alert')).textContent).toContain('Espera unos minutos')
  expect(screen.queryByRole('status')).toBeNull()
})
test('Enlace rechazado conserva el aviso aunque el SDK limpie la URL', () => {
  mocks.linkError = true
  recovery()
  expect(screen.getByRole('alert').textContent).toContain('ha vencido')
  expect(screen.queryByLabelText('Nueva contraseña')).toBeNull()
})
test('Contraseñas distintas no se envían a Supabase', () => {
  recovery(true)
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target:{value:'PrimeraClave9!'} })
  fireEvent.change(screen.getByLabelText('Repite la contraseña'), { target:{value:'OtraClave9!'} })
  fireEvent.submit(screen.getByRole('button', { name:'Guardar contraseña' }).closest('form'))
  expect(screen.getByRole('alert').textContent).toContain('no coinciden')
  expect(mocks.updateUser).not.toHaveBeenCalled()
})
test('Sesión de recuperación actualiza contraseña y permite volver al acceso', async () => {
  mocks.updateUser.mockResolvedValue({ error:null })
  recovery(true)
  for (const label of ['Nueva contraseña','Repite la contraseña']) fireEvent.change(screen.getByLabelText(label), { target:{value:'NuevaClave9!'} })
  fireEvent.submit(screen.getByRole('button', { name:'Guardar contraseña' }).closest('form'))
  expect((await screen.findByRole('status')).textContent).toContain('Contraseña actualizada')
  expect(mocks.updateUser).toHaveBeenCalledWith({ password:'NuevaClave9!' })
  expect(screen.getByRole('button', { name:'Volver al inicio de sesión' })).toBeTruthy()
})
