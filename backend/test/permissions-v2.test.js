import test from 'node:test'
import assert from 'node:assert/strict'
import { createManagement } from '../src/management.js'
import { accountInput } from '../src/validation.js'

test('Contexto separa coordinadores de jefes incluso sin versión SQL actualizada', async () => {
  for (const [permissionVersion, rol, funciones, expected] of [
    [1,'docente',['coordinador'],false],
    [undefined,'docente',['coordinador'],false],
    [2,'docente',['coordinador'],false],
    [2,'docente',['jefe_departamento'],true],
    [2,'docente',['planificador'],false],
    [2,'docente',[],false],
    [2,'administrador',[],true],
  ]) {
    const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>Response.json({permissionVersion,funciones})})
    const result=await management.execute({headers:{authorization:'Bearer test'}},{rol},'context',{})
    assert.equal(result.canManageDisponibilidad,expected)
    if (funciones.includes('jefe_departamento')) assert.equal(result.canManageSecciones,false)
  }
})
test('Cuenta admite jefe de departamento sin inventar carreras ni privilegios', () => {
  const data={id:3,nombre:'Jefe',cedula:'3',rol:'docente',funciones:['jefe_departamento'],carreras:[]}
  assert.deepEqual(accountInput(data).funciones,['jefe_departamento'])
  assert.throws(()=>accountInput({...data,funciones:['superuser']}),{status:400})
  assert.throws(()=>accountInput({...data,funciones:['jefe_departamento','coordinador']}),{status:400})
})
