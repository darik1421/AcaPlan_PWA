import {test,expect} from 'vitest'
import {workspacePages,workspacePage,workspaceScope} from '../src/lib/workspace-pages'
const base={departmentScopeVersion:1,personalScheduleVersion:1}
test('El docente de consulta solo recibe horarios',()=>{
 expect([...workspacePages(base)]).toEqual(['publicados','personal'])
 expect(workspacePage('accounts',base)).toBe('personal')
})
test('El coordinador conserva consultas académicas y pierde la página al retirarle el cargo',()=>{
 const coordinator={...base,canManageAsignaturas:true}
 expect(workspacePage('programacion',coordinator)).toBe('programacion')
 expect(workspacePages(coordinator).has('accounts')).toBe(false)
 expect(workspacePage('programacion',base)).toBe('personal')
})
test('El director departamental sin vínculo no abre consultas departamentales',()=>{
 const head={...base,esDirectorDepartamento:true,id_departamento:null}
 expect(workspacePages(head).has('programacion')).toBe(false)
 expect(workspacePages({...head,id_departamento:3,canReadDrafts:true}).has('borradores')).toBe(true)
 expect(workspacePages({...head,id_departamento:3}).has('generador')).toBe(false)
})
test('La gestión global usa capacidades comprobadas y la falta de contexto no habilita páginas',()=>{
 expect(workspacePages(null).size).toBe(0)
 const global={...base,isAdmin:true,canManageBloques:true,canReadDrafts:true,canManageAccounts:true}
 expect(workspacePages(global).has('personal')).toBe(false)
 for(const page of ['accounts','generador','programacion','borradores','carreras']) expect(workspacePages(global).has(page)).toBe(true)
})

test('El ámbito ignora el orden de carreras y funciones pero detecta permisos y departamento distintos',()=>{
 const a={...base,carreras:[1,2],funciones:['coordinador','jefe_departamento'],id_departamento:3,canReadDrafts:true}
 expect(workspaceScope(a)).toBe(workspaceScope({...a,carreras:[2,1],funciones:['jefe_departamento','coordinador']}))
 expect(workspaceScope(a)).not.toBe(workspaceScope({...a,id_departamento:1}))
 expect(workspaceScope(a)).not.toBe(workspaceScope({...a,canReadDrafts:false}))
 expect(workspaceScope(a)).toBe(workspaceScope({...a,catalogoCarreras:[{id_carrera:1,nombre:'Nuevo nombre'}]}))
})


test('La entrada inicial corresponde al trabajo del perfil y no fuerza Semestres',()=>{
 expect(workspacePage(null,{...base,isAdmin:true,canManageBloques:true})).toBe('generador')
 expect(workspacePage(null,{...base,esDirectorDepartamento:true,id_departamento:3,canReadDrafts:true})).toBe('borradores')
 expect(workspacePage(null,{...base,canManageSecciones:true,canManageAsignaturas:true})).toBe('programacion')
 expect(workspacePage(null,base)).toBe('personal')
 expect(workspacePage('periods',{...base,isAdmin:true,canManageBloques:true})).toBe('periods')
})
