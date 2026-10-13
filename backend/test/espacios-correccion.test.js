import assert from 'node:assert/strict'
import test from 'node:test'
import {aulaInput} from '../src/validation.js'
const room={id:1,codigo:'B4',tipo:'laboratorio',capacidad:30,recursos:[2,3],estado:'activo'}
test('Corregir un aula exige recursos explícitos y no cambia su tipo por omisión',()=>{
 for(const recursos of [undefined,null,'2',{}]) assert.throws(()=>aulaInput({...room,recursos}),{status:400})
 for(const tipo of [undefined,null,'']) assert.throws(()=>aulaInput({...room,tipo}),{status:400})
 assert.deepEqual(aulaInput(room).recursos,[2,3])
 assert.deepEqual(aulaInput({...room,recursos:[]}).recursos,[])
 assert.equal(aulaInput(room).tipo,'laboratorio')
})
