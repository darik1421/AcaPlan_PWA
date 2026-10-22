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
      'POST /api/borradores/estado': 'lifecycle.context',
      'POST /api/borradores/transicion': 'lifecycle.transition',
      'GET /api/horarios/publicados': 'publications.list',
      'POST /api/borradores/consultar': 'drafts.context',
      'POST /api/borradores': 'drafts.create',
      'POST /api/borradores/detalle': 'draftWork.context',
      'POST /api/borradores/clase': 'draftWork.save',
      'POST /api/borradores/fijar': 'draftWork.fix',
      'POST /api/borradores/retirar': 'draftWork.retire',
      'POST /api/borradores/revisar': 'draftWork.review',
      'POST /api/asignacion-academica/componentes': 'components.context',
      'PATCH /api/asignacion-academica/componentes': 'components.save',
      'POST /api/preparacion/diagnostico': 'preparation.review',
      'POST /api/sedes-traslado/contexto': 'travel.context',
      'POST /api/sedes-traslado': 'travel.save',
      'GET /api/accounts': 'accounts.list',
      'POST /api/accounts': 'accounts.create',
      'PATCH /api/accounts': 'accounts.update',
      'GET /api/periods': 'periods.list',
      'POST /api/periods': 'periods.save',
      'POST /api/periods/active': 'periods.activate',
      'GET /api/carreras': 'carreras.list',
      'POST /api/carreras': 'carreras.create',
      'PATCH /api/carreras': 'carreras.update',
      'GET /api/asignaturas': 'asignaturas.list',
      'GET /api/asignaturas/importadas': 'academicSubjects.list',
      'PATCH /api/asignaturas/importadas': 'academicSubjects.save',
      'GET /api/asignacion-academica/anos': 'academicYears.list',
      'PATCH /api/asignacion-academica/anos': 'academicYears.save',
      'POST /api/asignacion-academica/turno': 'academicTurn.context',
      'PATCH /api/asignacion-academica/turno': 'academicTurn.save',
      'GET /api/inventario': 'inventory.list',

      'PATCH /api/asignaturas': 'asignaturas.update',
      'GET /api/pabellones': 'pabellones.list',
      'GET /api/recursos': 'recursos.list',
      'GET /api/aulas': 'aulas.list',
      'PATCH /api/aulas': 'aulas.update',
      'GET /api/secciones': 'secciones.list',
      'PATCH /api/secciones': 'secciones.update',
      'GET /api/bloques': 'bloques.list',
      'GET /api/cuadriculas': 'grids.list',
      'POST /api/cuadriculas': 'grids.save',
      'GET /api/grupos-turnos': 'groupGrids.list',
      'POST /api/grupos-turnos': 'groupGrids.save',
      'GET /api/docentes': 'docentes.list',
      'GET /api/restricciones': 'restrictions.list',
      'GET /api/restricciones/unificadas': 'restrictions.context',
      'POST /api/restricciones/unificadas': 'restrictions.unifiedSave',
      'POST /api/restricciones/consecutivas/contexto': 'consecutive.context',
      'POST /api/restricciones/consecutivas': 'consecutive.save',
      'POST /api/restricciones': 'restrictions.save',
      'GET /api/disponibilidad': 'disponibilidad.list',
      'GET /api/programacion': 'programacion.list',
      'GET /api/programacion/resumen': 'programacion.report',
      'GET /api/programacion/detalle': 'programacion.detalle.list',
      'POST /api/preparacion/plantilla': 'preparation.template',
      'POST /api/preparacion/confirmar': 'preparation.confirm',
      'POST /api/asignacion-academica/correccion': 'academicAssignments.context',
      'POST /api/asignacion-academica/necesidades': 'academicNeeds.context',
      'PATCH /api/asignacion-academica/necesidades': 'academicNeeds.save',
      'PATCH /api/asignacion-academica/correccion': 'academicAssignments.save',
      'GET /api/asignacion-academica': 'academicAssignments.list',
      'POST /api/preparacion/revisar': 'preparation.preview',
      'GET /api/importacion/plantilla': 'import.template',
      'GET /api/importacion/historial': 'import.history',
    }
    const route = routes[`${request.method} ${path}`]
    if (route) {
      try {
        const profile = await authenticateRequest(request)
        const data = request.method === 'GET' ? {} : await readBody(request, ['preparation.preview','preparation.confirm'].includes(route) ? 2900000 : 16384)
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
