import test from 'node:test'
import assert from 'node:assert/strict'
import {draftVersionInput} from '../src/draft-version.js'
const base={id:4,revision:7,version:3,request_id:'10000000-0000-4000-8000-000000000001'}
test('La nueva versión solo acepta identidad y revisiones; descarta actores y clases enviados por cliente',()=>{
 assert.deepEqual(draftVersionInput({...base,actor:999,clases:[{id:123}]}),base)
})
test('Rechaza solicitudes sin versión, revisión, ID o clave de idempotencia válida',()=>{
 for(const bad of [null,{...base,id:0},{...base,revision:0},{...base,version:-1},{...base,request_id:'otra'},{...base,version:1.2}])assert.throws(()=>draftVersionInput(bad),{status:400})
})
