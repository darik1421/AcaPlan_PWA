import test from 'node:test'
import assert from 'node:assert/strict'
import { programacionReport } from '../src/programacion-report.js'
import { programacionDetalleInput } from '../src/validation.js'
import { createManagement } from '../src/management.js'
const need = { id_programacion: 1, id_periodo: 1, id_seccion: 1, id_asignatura: 1, id_docente: 4, sesiones_semanales: 3, duracion_bloques: 1, requisito_laboratorio: false, recursos_requeridos: [2] }
function data() {
  return { periodos: [{ id_periodo: 1, nombre: '2026' }], carreras: [{ id_carrera: 1, nombre: 'C1', estado: 'activo' }],
    secciones: [{ id_seccion: 1, id_periodo: 1, id_carrera: 1, ano_estudio: 1, codigo: 'S1', asignaturas: [1] }],
    asignaturas: [{ id_asignatura: 1, id_carrera: 1, ano_estudio: 1, nombre: 'A1', estado: 'activo', horas_teoricas: 2, horas_practicas: 1 }],
    docentes: [{ id_docente: 4, nombres: 'Docente', estado: 'activo' }], recursos: [{ id_recurso: 2 }], programacion: [{ ...need }] }
}
test('La carga declarada no se convierte en minutos sin una cuadrícula confirmada', () => {
  const result = programacionReport(data())
  assert.equal(result.detalles[0].minutos_semanales, null)
  assert.equal(result.detalles[0].estado, 'por_verificar')
  assert.equal(result.habilita_generacion, false)
})
test('Incluye necesidades sin capturar y secciones sin malla', () => {
  const input = data(); input.programacion = []; input.secciones.push({ id_seccion: 2, id_periodo: 1, codigo: 'VACIA', asignaturas: [] })
  const result = programacionReport(input)
  assert.equal(result.detalles[0].estado, 'sin_registrar')
  assert.equal(result.secciones_sin_asignaturas[0].codigo, 'VACIA')
})
test('Detecta carga incompatible, recursos sin declarar y docente inactivo sin inferir equivalencias', () => {
  const input = data(); input.programacion[0].sesiones_semanales = 2; input.programacion[0].recursos_requeridos = null; input.docentes[0].estado = 'inactivo'
  const row = programacionReport(input).detalles[0]
  assert.equal(row.estado, 'por_verificar'); assert.equal(row.pendientes.length, 3)
})
test('No esconde programaciones desvinculadas, duplicadas o con recursos eliminados', () => {
  const input = data(); input.recursos = []; input.programacion.push({ ...need, id_programacion: 2 }, { ...need, id_programacion: 3, id_seccion: 99 })
  const rows = programacionReport(input).detalles
  assert.equal(rows.length, 3)
  assert.ok(rows[0].pendientes.some(p => p.includes('más de una')))
  assert.ok(rows[0].pendientes.some(p => p.includes('recurso')))
  assert.ok(rows[2].pendientes.some(p => p.includes('sección ya no existe')))
})
test('Validación HTTP distingue recursos no declarados de ninguno y exige ID para editar', () => {
  assert.deepEqual(programacionDetalleInput({ ...need, recursos_requeridos: [] }).recursos_requeridos, [])
  for (const recursos_requeridos of [null, undefined, '2', [2, 2], [0], [1.5]]) assert.throws(() => programacionDetalleInput({ ...need, recursos_requeridos }), { status: 400 })
  assert.throws(() => programacionDetalleInput(need, true), { status: 400 })
})
test('Resumen combina lecturas autenticadas y no oculta una fuente que falla', async () => {
  const fixture = data(), calls = [], request = { headers: { authorization: 'Bearer usuario' } }
  const responses = { 'periods.list': fixture.periodos, 'carreras.list': fixture.carreras, 'secciones.list': fixture.secciones, 'asignaturas.list': fixture.asignaturas, 'docentes.list': fixture.docentes, 'recursos.list': fixture.recursos, list: fixture.programacion }
  const management = createManagement({ url: 'https://example.test', key: 'public', fetchImpl: async (url, options) => {
    calls.push(options.headers.Authorization)
    return Response.json(url.endsWith('/pwa_cuadriculas_api') || url.endsWith('/pwa_grupos_turnos_api') ? [] : responses[JSON.parse(options.body).action])
  } })
  assert.equal((await management.execute(request, { rol: 'docente' }, 'programacion.report', {})).detalles[0].estado, 'por_verificar')
  assert.deepEqual(calls, Array(9).fill('Bearer usuario'))
  const failing = createManagement({ url: 'https://example.test', key: 'public', fetchImpl: async () => Response.json({ code: 'PGRST202' }, { status: 404 }) })
  await assert.rejects(failing.execute(request, { rol: 'docente' }, 'programacion.report', {}), { status: 503 })
})

test('Conecta los bloques asignados sin reinterpretar la programación histórica como sesiones nuevas', () => {
  const input = data()
  input.gruposTurnos=[{id_seccion:1,id_periodo:1,id_cuadricula:2}]
  input.cuadriculas=[{id_cuadricula:2,id_periodo:1,nombre:'Matutino CUR',turno:'matutino',version:1,bloques:[
    {dia:'Lunes',hora_inicio:'08:00',hora_fin:'08:45',es_receso:false},
    {dia:'Lunes',hora_inicio:'08:45',hora_fin:'09:30',es_receso:false},
  ]}]
  const result=programacionReport(input), row=result.detalles[0]
  assert.equal(row.turno_configurado.minutos_sesion,90)
  assert.equal(row.turno_configurado.capacidad_sesiones_sin_solapar,1)
  assert.ok(row.pendientes.some(p=>p.includes('no alcanzan')))
  assert.equal(row.minutos_semanales,null)
  assert.equal(row.estado,'por_verificar')
  assert.equal(result.habilita_generacion,false)
})

test('El resumen muestra todos los docentes recibidos y señala cualquier docente no habilitado', () => {
  const input = data()
  input.programacion[0].id_docentes = [4, 5]
  input.docentes.push({ id_docente: 5, nombres: 'Ana', apellidos: 'López', estado: 'activo' })
  assert.equal(programacionReport(input).detalles[0].docente_nombre, 'Docente, Ana López')
  assert.equal(programacionReport(input).detalles[0].estado, 'por_verificar')
  input.docentes[1].estado = 'inactivo'
  assert.equal(programacionReport(input).detalles[0].estado, 'por_verificar')
})
