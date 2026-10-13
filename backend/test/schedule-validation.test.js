import test from 'node:test'
import assert from 'node:assert/strict'
import { validateSchedule } from '../src/schedule-validation.js'
export function snapshot() {
  return {
    clases: [{ id_horario: 1, id_seccion: 1, id_asignatura: 1, id_docente: 4, id_aula: 1, id_bloque: 1 }],
    secciones: [{ id_seccion: 1, id_periodo: 1, id_carrera: 1, ano_estudio: 1, cantidad_estudiantes: 20, asignaturas: [1] }],
    asignaturas: [{ id_asignatura: 1, id_carrera: 1, ano_estudio: 1, estado: 'activo', horas_teoricas: 1, horas_practicas: 0 }],
    docentes: [{ id_docente: 4, estado: 'activo' }],
    aulas: [{ id_aula: 1, capacidad: 25, estado: 'activo', tipo: 'aula', recursos: [1] }],
    recursos: [{ id_recurso: 1 }],
    bloques: [{ id_bloque: 1, id_periodo: 1, dia: 'Lunes', hora_inicio: '08:00', hora_fin: '09:00', es_receso: false }],
    restricciones: [],
    cuadriculas: [{id_cuadricula:1,id_periodo:1,nombre:'Encuentro',turno:'encuentros',bloques:[{dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:00',es_receso:false}]}],
    gruposTurnos: [{id_seccion:1,id_periodo:1,id_cuadricula:1}],
    programacion: [{ id_programacion: 1, id_periodo: 1, id_seccion: 1, id_asignatura: 1, id_docente: 4, sesiones_semanales: 1, duracion_bloques: 1, recursos_requeridos: [1], requisito_laboratorio: false }],
  }
}
const codes = data => validateSchedule(data).conflictos.map(c => c.codigo)
test('Una propuesta válida y completa nunca se aprueba automáticamente', () => {
  const data = snapshot(), before = structuredClone(data)
  assert.deepEqual(validateSchedule(data), { valido: true, completo: true, aprobado: false, conflictos: [], pendientes: [] })
  assert.deepEqual(data, before)
})
test('Detecta traslapes parciales entre carreras y señala clases y recurso', () => {
  const data = snapshot()
  data.secciones.push({ ...data.secciones[0], id_seccion: 2, id_carrera: 2, asignaturas: [2] })
  data.asignaturas.push({ ...data.asignaturas[0], id_asignatura: 2, id_carrera: 2 })
  data.programacion.push({ ...data.programacion[0], id_programacion: 2, id_seccion: 2, id_asignatura: 2 })
  data.bloques.push({ ...data.bloques[0], id_bloque: 2, hora_inicio: '08:30', hora_fin: '09:30' })
  data.clases.push({ ...data.clases[0], id_horario: 2, id_seccion: 2, id_asignatura: 2, id_bloque: 2 })
  const conflicts = validateSchedule(data).conflictos.filter(c => c.codigo === 'TRASLAPE')
  assert.deepEqual(conflicts.map(c => c.recurso.tipo), ['docente', 'aula'])
  assert.deepEqual(conflicts[0].clases, [1, 2])
})
test('Extremos consecutivos y períodos distintos no producen traslapes', () => {
  const data = snapshot()
  data.bloques.push({ ...data.bloques[0], id_bloque: 2, hora_inicio: '09:00', hora_fin: '10:00' })
  data.clases.push({ ...data.clases[0], id_horario: 2, id_bloque: 2 })
  assert.ok(!codes(data).includes('TRASLAPE'))
  data.bloques[1] = { ...data.bloques[0], id_bloque: 2, id_periodo: 2 }
  data.secciones.push({ ...data.secciones[0], id_seccion: 2, id_periodo: 2 })
  data.clases[1].id_seccion = 2
  assert.ok(!codes(data).includes('TRASLAPE'))
})
test('Sin restricciones no hay bloqueo; una restricción parcial bloquea la sesión', () => {
  const data=snapshot()
  assert.equal(validateSchedule(data).completo,true)
  data.restricciones=[{id_docente:4,id_periodo:1,dia:'Lunes',hora_inicio:'08:59',hora_fin:'10:00'}]
  assert.ok(codes(data).includes('RESTRICCION_DOCENTE'))
  data.restricciones[0].hora_inicio='09:00'
  assert.ok(!codes(data).includes('RESTRICCION_DOCENTE'))
})

test('Capacidad, laboratorio, recursos y recesos son restricciones obligatorias', () => {
  const data = snapshot(); data.aulas[0].capacidad = 19; data.aulas[0].recursos = []
  data.programacion[0].requisito_laboratorio = true; data.bloques[0].es_receso = true
  for (const code of ['CAPACIDAD', 'RECURSO_FALTANTE', 'LABORATORIO', 'RECESO']) assert.ok(codes(data).includes(code))
})
test('Regular exige dos sesiones de 90 formadas por bloques de 45, sin equivalencia con horas del catálogo', () => {
  const data=snapshot()
  data.cuadriculas[0].turno='matutino'
  data.bloques=[{...data.bloques[0],hora_fin:'08:45'},{...data.bloques[0],id_bloque:2,hora_inicio:'08:45',hora_fin:'09:30'}]
  data.cuadriculas[0].bloques=data.bloques.map(b=>({...b}))
  data.programacion[0].sesiones_semanales=2; data.programacion[0].duracion_bloques=2
  data.clases[0].id_bloques=[1,2]
  assert.equal(validateSchedule(data).valido,true)
  assert.equal(validateSchedule(data).pendientes[0].sesiones_pendientes,1)
  data.asignaturas[0].horas_teoricas=999
  assert.equal(validateSchedule(data).valido,true)
  data.bloques[1].hora_inicio='08:50';data.bloques[1].hora_fin='09:35'
  assert.ok(codes(data).includes('BLOQUES_NO_CONSECUTIVOS'))
  data.bloques[0].hora_fin='09:20'
  assert.ok(codes(data).includes('DURACION_BLOQUE'))
})

test('No compara una clase consigo misma y rechaza identidades duplicadas', () => {
  const data = snapshot(); assert.ok(!codes(data).includes('TRASLAPE'))
  data.clases.push({ ...data.clases[0] }); assert.ok(codes(data).includes('IDENTIDAD_INVALIDA'))
})
test('Referencias ausentes, estados inactivos y datos incompletos impiden validar', () => {
  const data = snapshot(); data.clases[0].id_aula = 99; assert.ok(codes(data).includes('REFERENCIA_INVALIDA'))
  data.clases[0].id_aula = 1; data.docentes[0].estado = 'inactivo'; data.programacion[0].recursos_requeridos = null
  assert.ok(codes(data).includes('RECURSO_INACTIVO')); assert.ok(codes(data).includes('RECURSOS_SIN_DECLARAR'))
})
test('Expone sesiones pendientes y excedidas; una propuesta vacía no está completa', () => {
  const data = snapshot(); data.clases = []
  assert.deepEqual(validateSchedule(data).pendientes, [{ id_programacion: 1, sesiones_pendientes: 1 }])
  data.programacion = []; assert.equal(validateSchedule(data).completo, false)
  const extra = snapshot(); extra.clases.push({ ...extra.clases[0], id_horario: 2 })
  assert.ok(codes(extra).includes('SESIONES_EXCEDIDAS'))
})
test('No declara completa una necesidad inválida sin clases ni una malla sin programación', () => {
  const data = snapshot(); data.clases = []; data.programacion[0].sesiones_semanales = null
  assert.equal(validateSchedule(data).completo, false)
  assert.ok(codes(data).includes('NECESIDAD_INCOMPLETA'))
  data.programacion = []
  assert.ok(codes(data).includes('PROGRAMACION_FALTANTE'))
})

test('Una asignación con tres docentes reserva a todos aunque la clase conserve el campo singular', () => {
  const data = snapshot()
  data.programacion[0].id_docentes = [4, 5, 6]
  for (const id of [5, 6]) {
    data.docentes.push({ id_docente: id, estado: 'activo' })

  }
  assert.equal(validateSchedule(data).completo, true)
  data.secciones.push({ ...data.secciones[0], id_seccion: 2 })
  data.aulas.push({ ...data.aulas[0], id_aula: 2 })
  data.programacion.push({ ...data.programacion[0], id_programacion: 2, id_seccion: 2, id_docente: 6, id_docentes: [6] })
  data.clases.push({ ...data.clases[0], id_horario: 2, id_seccion: 2, id_docente: 6, id_aula: 2 })
  const result = validateSchedule(data)
  assert.deepEqual(result.conflictos.filter(c => c.codigo === 'TRASLAPE').map(c => c.recurso), [{ tipo: 'docente', id: 6 }])
})

test('No permite omitir docentes asignados mediante una lista parcial ni duplicada', () => {
  const data = snapshot()
  data.docentes.push({ id_docente: 5, estado: 'activo' })
  data.programacion[0].id_docentes = [4, 5]
  data.clases[0].id_docentes = [4]
  assert.ok(codes(data).includes('PROGRAMACION_INVALIDA'))
  for (const ids of [[], [4, 4], [4, '5'], null]) {
    data.programacion[0].id_docentes = ids
    assert.ok(codes(data).includes('NECESIDAD_INCOMPLETA'))
  }
})

test('Comprueba estado y restricciones también de docentes adicionales', () => {
  const data = snapshot()
  data.docentes.push({ id_docente: 5, estado: 'inactivo' })
  data.programacion[0].id_docentes = [4, 5]
  assert.ok(codes(data).includes('RECURSO_INACTIVO'))
  data.docentes[1].estado = 'activo'
  data.restricciones=[{id_docente:5,id_periodo:1,dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:00'}]
  assert.deepEqual(validateSchedule(data).conflictos.find(c => c.codigo === 'RESTRICCION_DOCENTE').recurso, { tipo: 'docente', id: 5 })
  data.restricciones=[]
  data.clases[0].id_docentes = [5, 4]
  assert.equal(validateSchedule(data).completo, true)
})

test('No confunde restricciones no consultadas o inválidas con ausencia confirmada',()=>{
 const data=snapshot()
 for(const restricciones of [undefined,null,{},[{id_docente:4,id_periodo:1,dia:'Lunes',hora_inicio:'mal',hora_fin:'09:00'}]]) {
  data.restricciones=restricciones
  assert.equal(validateSchedule(data).valido,false)
 }
 data.restricciones=[]
 assert.equal(validateSchedule(data).completo,true)
})
test('Las restricciones respetan docente, día y semestre y no mutan la entrada',()=>{
 for(const change of [{id_docente:5},{dia:'Martes'},{id_periodo:2}]) {
  const data=snapshot();data.docentes.push({id_docente:5,estado:'activo'})
  data.restricciones=[{id_docente:4,id_periodo:1,dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:00',...change}]
  const before=structuredClone(data)
  assert.equal(validateSchedule(data).completo,true)
  assert.deepEqual(data,before)
 }
})
test('No valida sin turno asignado ni permite clases fuera de sus bloques',()=>{
 const data=snapshot();data.gruposTurnos=[]
 assert.ok(codes(data).includes('TURNO_PENDIENTE'))
 data.gruposTurnos=[{id_seccion:1,id_periodo:1,id_cuadricula:1}]
 data.bloques[0].hora_inicio='09:00';data.bloques[0].hora_fin='10:00'
 assert.ok(codes(data).includes('BLOQUE_FUERA_TURNO'))
})
test('Una necesidad duplicada no puede considerarse programación válida',()=>{
 const data=snapshot();data.programacion.push({...data.programacion[0],id_programacion:2})
 assert.ok(codes(data).includes('NECESIDAD_DUPLICADA'))
})

test('Una semana regular completa usa dos sesiones explícitas de 90 minutos',()=>{
 const data=snapshot()
 data.cuadriculas[0].turno='vespertino'
 data.bloques=['Lunes','Miercoles'].flatMap((dia,index)=>[
  {id_bloque:index*2+1,id_periodo:1,dia,hora_inicio:'13:00',hora_fin:'13:45',es_receso:false},
  {id_bloque:index*2+2,id_periodo:1,dia,hora_inicio:'13:45',hora_fin:'14:30',es_receso:false}
 ])
 data.cuadriculas[0].bloques=data.bloques.map(b=>({...b}))
 data.programacion[0].duracion_bloques=2;data.programacion[0].sesiones_semanales=2
 data.clases=[{...data.clases[0],id_bloques:[1,2]},{...data.clases[0],id_horario:2,id_bloques:[3,4]}]
 assert.equal(validateSchedule(data).completo,true)
 data.programacion[0].sesiones_semanales=1
 assert.ok(codes(data).includes('NECESIDAD_INCOMPLETA'))
})
test('Disponibilidad histórica no se interpreta como restricciones ni reemplaza su consulta',()=>{
 const data=snapshot()
 data.disponibilidad=[{id_docente:4,id_periodo:1,dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:00'}]
 assert.equal(validateSchedule(data).completo,true)
 delete data.restricciones
 assert.ok(codes(data).includes('RESTRICCIONES_SIN_CARGAR'))
})

test('Las restricciones retiradas no bloquean y un estado ambiguo no se admite',()=>{
 const data=snapshot();data.restricciones=[{id_docente:4,id_periodo:1,dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:00',activa:false}]
 assert.equal(validateSchedule(data).completo,true)
 data.restricciones[0].activa=true
 assert.ok(codes(data).includes('RESTRICCION_DOCENTE'))
 data.restricciones[0].activa='false'
 assert.ok(codes(data).includes('RESTRICCION_INVALIDA'))
})
