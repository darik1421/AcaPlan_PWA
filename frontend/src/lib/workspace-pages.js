// La navegación refleja permisos del servidor; no sustituye sus validaciones.
export function workspacePages(context) {
  if (!context) return new Set()
  const pages = new Set(['publicados'])
  if (!context.isAdmin && context.personalScheduleVersion >= 1) pages.add('personal')
  const academic = context.isAdmin || context.canManageAsignaturas || (context.esDirectorDepartamento && context.id_departamento)
  if (academic || context.departmentScopeVersion < 1 || context.departmentScopeVersion == null) {
    for (const page of ['periods','carreras','asignaturas','espacios','programacion','disponibilidad']) pages.add(page)
  }
  if (context.canManageBloques) pages.add('generador')
  if (context.canReadDrafts) pages.add('borradores')
  if (context.canManageAccounts) pages.add('accounts')
  if (context.isAdmin) pages.add('departamentos')
  return pages
}
export function workspacePage(requested, context) {
  const pages = workspacePages(context)
  if (requested == null) {
    if (context?.canManageBloques && pages.has('generador')) return 'generador'
    if (context?.esDirectorDepartamento && pages.has('borradores')) return 'borradores'
    if (context?.canManageSecciones && pages.has('programacion')) return 'programacion'
  }
  return pages.has(requested) ? requested : pages.has('personal') ? 'personal' : 'publicados'
}

// Invalida pantallas únicamente cuando cambia el ámbito de acceso, no en cada consulta.
export function workspaceScope(context) {
 const flags = Object.keys(context || {}).filter(k=>k.startsWith('can')||k.endsWith('Version')||['isAdmin','esDirectorDepartamento','id_departamento'].includes(k)).sort()
 return JSON.stringify({flags:flags.map(k=>[k,context[k]]),carreras:[...(context?.carreras||[])].sort((a,b)=>a-b),funciones:[...(context?.funciones||[])].sort()})
}
