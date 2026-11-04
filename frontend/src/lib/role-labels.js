// Las etiquetas institucionales no conceden permisos; estos proceden del servidor.
export const FUNCTION_LABELS = {
  coordinador: 'Coordinador de carrera',
  jefe_departamento: 'Director de departamento',
  planificador: 'Preparación de horarios',
  aprobador: 'Aprobación de horarios',
}

export function roleLabel(profile, functions = profile?.funciones || []) {
  if (profile?.rol === 'administrador') return 'Administrador'
  if (profile?.rol === 'director') return 'Director'
  if (profile?.rol === 'director_departamento' || functions.includes('jefe_departamento')) return 'Director de departamento'
  if (profile?.rol === 'coordinador' || functions.includes('coordinador')) return 'Coordinador de carrera'
  return 'Docente'
}
