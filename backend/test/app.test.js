import assert from 'node:assert/strict'
import { once } from 'node:events'
import test from 'node:test'
import { createApp } from '../src/app.js'

test('Salud, métodos no admitidos y rutas inexistentes', async () => {
  const app = createApp()
  app.listen(0, '127.0.0.1')
  await once(app, 'listening')
  const base = `http://127.0.0.1:${app.address().port}`
  try {
    const health = await fetch(base + '/api/health')
    assert.equal(health.status, 200)
    assert.equal(health.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await health.json(), { status: 'ok', service: 'acaplan-api' })
    const head = await fetch(base + '/api/health', { method: 'HEAD' })
    assert.equal(head.status, 200)
    assert.equal(await head.text(), '')
    const write = await fetch(base + '/api/health', { method: 'POST' })
    assert.equal(write.status, 405)
    assert.equal(write.headers.get('allow'), 'GET, HEAD')
    assert.equal((await fetch(base + '/api/usuarios')).status, 404)
    const unauthenticated = await fetch(base + '/api/me')
    assert.equal(unauthenticated.status, 401)
    assert.equal((await unauthenticated.json()).error, 'Inicia sesión para continuar.')
    const unsupported = await fetch(base + '/api/me', { method: 'POST' })
    assert.equal(unsupported.status, 405)
  } finally {
    app.closeAllConnections()
    await new Promise((resolve, reject) => app.close(error => error ? reject(error) : resolve()))
  }
})

test('Las rutas de gestión autentican y validan el cuerpo antes de ejecutar operaciones', async () => {
  const calls=[]
  const app=createApp({authenticateRequest:async()=>({id_usuario:1,rol:'administrador'}),management:{execute:async(request,profile,route,data)=>{calls.push({route,data});return {ok:true}}}})
  app.listen(0,'127.0.0.1');await once(app,'listening')
  const base=`http://127.0.0.1:${app.address().port}`
  try {
    const post=(body,type='application/json')=>fetch(base+'/api/accounts',{method:'POST',headers:{'Content-Type':type},body})
    assert.equal((await post('{"nombre":"José"}')).status,200)
    assert.deepEqual(calls[0],{route:'accounts.create',data:{nombre:'José'}})
    assert.equal((await post('{}','text/plain')).status,415)
    assert.equal((await post('{')).status,400)
    assert.equal((await post(JSON.stringify({value:'x'.repeat(17000)}))).status,413)
    assert.equal(calls.length,1)
    const unsupported=await fetch(base+'/api/accounts',{method:'DELETE'})
    assert.equal(unsupported.status,405)
    assert.equal(unsupported.headers.get('allow'),'GET, POST, PATCH')
  } finally {app.closeAllConnections();await new Promise(resolve=>app.close(resolve))}
})
test('Sin sesión no se ejecuta ninguna ruta de gestión',async()=>{
  const app=createApp({management:{execute:async()=>{throw new Error('No debe invocarse')}}})
  app.listen(0,'127.0.0.1');await once(app,'listening')
  const base=`http://127.0.0.1:${app.address().port}`
  try {
    for(const [path,method] of [['/workspace','GET'],['/accounts','GET'],['/accounts','POST'],['/accounts','PATCH'],['/periods','GET'],['/periods','POST'],['/periods/active','POST']]){
      assert.equal((await fetch(base+'/api'+path,{method})).status,401)
    }
  } finally {app.closeAllConnections();await new Promise(resolve=>app.close(resolve))}
})
