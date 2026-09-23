import { createServer } from 'node:http'

export function createApp() {
  return createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8')
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    const path = new URL(request.url, 'http://localhost').pathname
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
