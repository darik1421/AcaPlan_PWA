import { AccessError } from './auth.js'

const fail = message => { throw new AccessError(400, message) }
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
