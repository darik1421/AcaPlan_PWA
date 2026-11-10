import test from 'node:test'
import assert from 'node:assert/strict'
import {preparationVersion} from '../src/preparation-version.js'

test('La huella no cambia por el orden de filas, columnas o recursos',()=>{
 const a={rooms:[{id:1,recursos:[2,3]},{id:2,recursos:[]}],period:1}
 const b={period:1,rooms:[{recursos:[],id:2},{recursos:[3,2],id:1}]}
 assert.deepEqual(preparationVersion(a),preparationVersion(b))
})

test('Cada fuente relevante invalida la revisión sin exponer datos personales',()=>{
 const data={semester:{id:1},details:[{cedula:'PRIVADA',horas:56}],years:[{cantidad:20}],rooms:[{capacidad:25}],grids:[{hora:'08:00'}],restrictions:[],rules:[]}
 const before=structuredClone(data),base=preparationVersion(data)
 for(const key of Object.keys(data)){
  const changed=structuredClone(data);changed[key]=null
  assert.notEqual(preparationVersion(changed).huella_datos,base.huella_datos,key)
 }
 assert.deepEqual(data,before)
 assert.match(base.huella_datos,/^[a-f0-9]{64}$/)
 assert.ok(!JSON.stringify(base).includes('PRIVADA'))
 assert.throws(()=>preparationVersion({missing:undefined}),/incompletos/)
})
