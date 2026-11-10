const modeKey = 'acaplan-auth-persistence'
export function createAuthStorage({persistent,temporary}) {
 return {
  getItem(key) { return temporary.getItem(key) ?? persistent.getItem(key) },
  setItem(key,value) {
   const sessionOnly = temporary.getItem(modeKey) === 'session'
   const destination = sessionOnly ? temporary : persistent
   const previous = sessionOnly ? persistent : temporary
   destination.setItem(key,value)
   previous.removeItem(key)
  },
  removeItem(key) { persistent.removeItem(key); temporary.removeItem(key) },
  remember(value) { temporary.setItem(modeKey,value ? 'local' : 'session') },
 }
}
export const authStorage = createAuthStorage({persistent:localStorage,temporary:sessionStorage})
export function setRememberSession(value) { authStorage.remember(value) }
