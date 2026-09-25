import { createServer } from 'node:http'
import { authenticate } from './auth.js'
import { createManagement } from './management.js'
import { readBody } from './body.js'

export function createApp({ authenticateRequest = authenticate, management = createManagement() } = {}) {
  return createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    const path = new URL(request.url, 'http://localhost').pathname
    const routes = {
      'GET /api/workspace': 'context',
      'GET /api/accounts': 'accounts.list',
      'POST /api/accounts': 'accounts.create',
      'PATCH /api/accounts': 'accounts.update',
      'GET /api/periods': 'periods.list',
      'POST /api/periods': 'periods.save',
      'POST /api/periods/active': 'periods.activate',
    }
    const route = routes[`${request.method} ${path}`]
    if (route) {
      try {
        const profile = await authenticateRequest(request)
        const data = request.method === 'GET' ? {} : await readBody(request)
        const result = await management.execute(request, profile, route, data)
        response.writeHead(200)
        response.end(JSON.stringify(result))
      } catch (error) {
        response.writeHead(error.status || 503)
        response.end(JSON.stringify({ error: error.status ? error.message : 'No se pudo completar la operación.' }))
      }
      return
    }
    const allowed = Object.keys(routes).filter(key => key.endsWith(` ${path}`)).map(key => key.split(' ')[0])
    if (allowed.length) {
      response.writeHead(405, { Allow: allowed.join(', ') })
      response.end(JSON.stringify({ error: 'Método no permitido' }))
      return
    }
    if (path === '/api/me') {
      if (request.method !== 'GET') {
        response.writeHead(405, { Allow: 'GET' })
        response.end(JSON.stringify({ error: 'Método no permitido' }))
        return
      }
      try {
        const profile = await authenticateRequest(request)
        response.writeHead(200)
        response.end(JSON.stringify({ profile }))
      } catch (error) {
        response.writeHead(error.status || 503)
        response.end(JSON.stringify({ error: error.status ? error.message : 'No se pudo comprobar el acceso.' }))
      }
      return
    }
    if (path === '/api/health') {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.writeHead(405, { Allow: 'GET, HEAD' })
        response.end(JSON.stringify({ error: 'Método no permitido' }))
        return
      }
      response.writeHead(200)
      response.end(request.method === 'HEAD' ? undefined
        : JSON.stringify({ status: 'ok', service: 'acaplan-api' }))
      return
    }
    response.writeHead(404)
    response.end(JSON.stringify({ error: 'Ruta no encontrada' }))
  })
}
