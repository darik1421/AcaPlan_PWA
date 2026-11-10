import {afterEach,expect,test} from 'vitest'
import {createAuthStorage} from '../src/lib/auth-storage'
afterEach(()=>{localStorage.clear();sessionStorage.clear()})
const create=()=>createAuthStorage({persistent:localStorage,temporary:sessionStorage})
test('Recordarme conserva la sesión en almacenamiento persistente y elimina la copia temporal',()=>{
 const storage=create();sessionStorage.setItem('acaplan-pwa-auth','anterior');storage.remember(true);storage.setItem('acaplan-pwa-auth','nueva')
 expect(localStorage.getItem('acaplan-pwa-auth')).toBe('nueva')
 expect(sessionStorage.getItem('acaplan-pwa-auth')).toBeNull()
 sessionStorage.clear()
 expect(create().getItem('acaplan-pwa-auth')).toBe('nueva')
})
test('Sin Recordarme la sesión sobrevive a recargar la pestaña pero no al eliminar su almacenamiento temporal',()=>{
 const storage=create();localStorage.setItem('acaplan-pwa-auth','anterior');storage.remember(false);storage.setItem('acaplan-pwa-auth','temporal')
 expect(create().getItem('acaplan-pwa-auth')).toBe('temporal')
 expect(localStorage.getItem('acaplan-pwa-auth')).toBeNull()
 sessionStorage.clear()
 expect(create().getItem('acaplan-pwa-auth')).toBeNull()
})
test('Las sesiones persistentes anteriores se leen y renuevan sin exigir otro inicio',()=>{
 localStorage.setItem('acaplan-pwa-auth','existente');const storage=create()
 expect(storage.getItem('acaplan-pwa-auth')).toBe('existente')
 storage.setItem('acaplan-pwa-auth','renovada')
 expect(localStorage.getItem('acaplan-pwa-auth')).toBe('renovada')
})
test('Retirar una sesión limpia ambas ubicaciones y conserva los datos ajenos',()=>{
 localStorage.setItem('otra-app','conservar');localStorage.setItem('acaplan-pwa-auth','local');sessionStorage.setItem('acaplan-pwa-auth','temporal')
 create().removeItem('acaplan-pwa-auth')
 expect(localStorage.getItem('acaplan-pwa-auth')).toBeNull();expect(sessionStorage.getItem('acaplan-pwa-auth')).toBeNull();expect(localStorage.getItem('otra-app')).toBe('conservar')
})
