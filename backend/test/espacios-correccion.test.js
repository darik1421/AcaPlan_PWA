import assert from 'node:assert/strict'
import test from 'node:test'
import {aulaInput} from '../src/validation.js'
const room={id:1,codigo:'B4',tipo:'laboratorio',capacidad:30,recursos:[2,3],estado:'activo'}
test('Corregir un aula conserva tipo obligatorio y excluye equipamiento del contrato',()=>{
 for(const recursos of [undefined,null,'2',{},[2,3]]) assert.equal(Object.hasOwn(aulaInput({...room,recursos}),'recursos'),false)
 for(const tipo of [undefined,null,'']) assert.throws(()=>aulaInput({...room,tipo}),{status:400})
 assert.equal(aulaInput(room).recursos,undefined)
 assert.equal(aulaInput({...room,recursos:[]}).recursos,undefined)
 assert.equal(aulaInput(room).tipo,'laboratorio')
})
