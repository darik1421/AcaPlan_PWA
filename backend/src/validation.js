import { AccessError } from './auth.js'

const fail = message => { throw new AccessError(400, message) }
const boolean = value => {
  if (typeof value !== 'boolean') fail('Valor de casilla no válido.')
  return value
}
const weekDay = value => {
  const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo']
  const day = days.find(day => day.toUpperCase() === String(value).toUpperCase())
  if (!day) fail('Día no válido.')
  return day
}
const seconds = value => value.split(':').reduce((total, part, index) => total + Number(part) * [3600, 60, 1][index], 0)
const text = (value, label, max) => {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) fail(`${label}: completa un valor de hasta ${max} caracteres.`)
  return value.trim()
}
export const positiveId = value => {
  if (!['string', 'number'].includes(typeof value) || !/^[0-9]+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) fail('Identificador no válido.')
  return Number(value)
}
export function accountInput(data, create = false) {
  const result = {
    nombre: text(data.nombre, 'Nombre', 100),
    cedula: text(data.cedula, 'Cédula', 20),
    rol: data.rol,
    estado: data.estado || 'activo',
    funciones: data.funciones || [],
    carreras: data.carreras || [],
  }
  if (!['administrador', 'docente'].includes(result.rol)) fail('Rol no válido.')
  if (!['activo', 'inactivo'].includes(result.estado)) fail('Estado no válido.')
  if (!Array.isArray(result.funciones) || result.funciones.some(f => !['coordinador', 'planificador', 'aprobador'].includes(f))) fail('Funciones no válidas.')
  if (!Array.isArray(result.carreras) || result.carreras.length > 100) fail('Carreras no válidas.')
  result.funciones = [...new Set(result.funciones)]
  result.carreras = [...new Set(result.carreras.map(positiveId))]
  if (result.funciones.includes('coordinador') && !result.carreras.length) fail('Selecciona al menos una carrera para coordinación.')
  if (!result.funciones.includes('coordinador')) result.carreras = []
  if (create) {
    result.correo = text(data.correo, 'Correo', 100).toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.correo)) fail('Correo no válido.')
    if (typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 128) fail('La contraseña inicial debe tener entre 8 y 128 caracteres.')
    result.password = data.password
    result.estado = 'activo'
  } else result.id = positiveId(data.id)
  return result
}
export function carreraInput(data, create = false) {
  const result = {
    nombre: text(data.nombre, 'Nombre de la carrera', 150),
  }
  if (!create) {
    result.id = positiveId(data.id)
    if (data.estado !== undefined) {
      if (!['activo', 'inactivo'].includes(data.estado)) fail('Estado no válido.')
      result.estado = data.estado
    }
  }
  return result
}
export function asignaturaInput(data, create = false) {
  const result = {
    nombre: text(data.nombre, 'Nombre de la asignatura', 100),
    codigo: text(data.codigo, 'Código', 20),
    ano_estudio: positiveId(data.ano_estudio),
    horas_teoricas: Number(data.horas_teoricas),
    horas_practicas: Number(data.horas_practicas),
  }
  if (!Number.isSafeInteger(result.horas_teoricas) || result.horas_teoricas < 0) fail('Horas teóricas deben ser mayores o iguales a 0.')
  if (!Number.isSafeInteger(result.horas_practicas) || result.horas_practicas < 0) fail('Horas prácticas deben ser mayores o iguales a 0.')
  if (create) {
    result.id_carrera = positiveId(data.id_carrera)
  } else {
    result.id = positiveId(data.id)
    if (data.estado !== undefined) {
      if (!['activo', 'inactivo'].includes(data.estado)) fail('Estado no válido.')
      result.estado = data.estado
    }
  }
  return result
}
export function pabellonInput(data) { return { nombre: text(data.nombre, 'Nombre del pabellón', 50) } }
export function recursoInput(data) { return { nombre: text(data.nombre, 'Nombre del recurso', 50) } }
export function aulaInput(data, create = false) {
  const result = {
    codigo: text(data.codigo, 'Código del aula', 20),
    tipo: text(data.tipo || 'aula', 'Tipo', 50),
    capacidad: Number(data.capacidad),
    recursos: Array.isArray(data.recursos) ? [...new Set(data.recursos.map(positiveId))] : []
  }
  if (!Number.isSafeInteger(result.capacidad) || result.capacidad < 1) fail('La capacidad debe ser mayor a 0.')
  if (create) {
    result.id_pabellon = positiveId(data.id_pabellon)
  } else {
    result.id = positiveId(data.id)
    if (data.estado !== undefined) {
      if (!['activo', 'inactivo'].includes(data.estado)) fail('Estado no válido.')
      result.estado = data.estado
    }
  }
  return result
}
export function seccionInput(data, create = false) {
  const result = {
    codigo: text(data.codigo, 'Código de la sección', 20),
    ano_estudio: positiveId(data.ano_estudio),
    cantidad_estudiantes: positiveId(data.cantidad_estudiantes),
    asignaturas: Array.isArray(data.asignaturas) ? [...new Set(data.asignaturas.map(positiveId))] : []
  }
  if (create) {
    result.id_carrera = positiveId(data.id_carrera)
    result.id_periodo = positiveId(data.id_periodo)
  } else {
    result.id = positiveId(data.id)
  }
  return result
}
export function bloqueInput(data, create = false) {
  const result = {
    dia: weekDay(data.dia),
    hora_inicio: text(data.hora_inicio, 'Hora de inicio', 8),
    hora_fin: text(data.hora_fin, 'Hora de fin', 8),
    es_receso: boolean(data.es_receso)
  }
  if (!['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'].includes(result.dia.toUpperCase())) fail('Día no válido.')
  // Validates HH:mm or HH:mm:ss
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(result.hora_inicio)) fail('Hora de inicio inválida.')
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(result.hora_fin)) fail('Hora de fin inválida.')
  if (seconds(result.hora_inicio) >= seconds(result.hora_fin)) fail('La hora de inicio debe ser anterior a la hora de fin.')

  if (create) {
    result.id_periodo = positiveId(data.id_periodo)
  } else {
    result.id = positiveId(data.id)
  }
  return result
}
export function disponibilidadInput(data, create = false) {
  const result = {
    id_docente: positiveId(data.id_docente),
    dia: weekDay(data.dia),
    hora_inicio: text(data.hora_inicio, 'Hora de inicio', 8),
    hora_fin: text(data.hora_fin, 'Hora de fin', 8)
  }
  if (!['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'].includes(result.dia.toUpperCase())) fail('Día no válido.')
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(result.hora_inicio)) fail('Hora de inicio inválida.')
  if (!/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(result.hora_fin)) fail('Hora de fin inválida.')
  if (seconds(result.hora_inicio) >= seconds(result.hora_fin)) fail('La hora de inicio debe ser anterior a la hora de fin.')

  if (create) {
    result.id_periodo = positiveId(data.id_periodo)
  } else {
    result.id = positiveId(data.id)
  }
  return result
}
export function programacionInput(data) {
  return {
    id_periodo: positiveId(data.id_periodo),
    id_seccion: positiveId(data.id_seccion),
    id_asignatura: positiveId(data.id_asignatura),
    id_docente: positiveId(data.id_docente),
    sesiones_semanales: positiveId(data.sesiones_semanales),
    duracion_bloques: positiveId(data.duracion_bloques),
    requisito_laboratorio: boolean(data.requisito_laboratorio)
  }
}
export function periodInput(data) {
  const result = {
    nombre: text(data.nombre, 'Nombre del período', 50),
    ano_lectivo: Number(data.ano_lectivo),
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin,
  }
  if (!Number.isInteger(result.ano_lectivo) || result.ano_lectivo < 1900 || result.ano_lectivo > 2200) fail('El año lectivo debe estar entre 1900 y 2200.')
  for (const key of ['fecha_inicio', 'fecha_fin']) {
    const value = result[key]
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('Introduce fechas válidas.')
    const date = new Date(value + 'T00:00:00Z')
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) fail('Introduce fechas válidas.')
  }
  if (result.fecha_inicio >= result.fecha_fin) fail('La fecha de inicio debe ser anterior a la fecha final.')
  if (data.id !== undefined && data.id !== null) result.id = positiveId(data.id)
  return result
}
