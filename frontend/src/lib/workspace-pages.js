// La navegación refleja permisos del servidor; no sustituye sus validaciones.
export function workspacePages(context) {
  if (!context) return new Set()
  const pages = new Set(['publicados'])
  if (context.personalScheduleVersion >= 1) pages.add('personal')
  const academic = context.isAdmin || context.canManageAsignaturas || (context.esDirectorDepartamento && context.id_departamento)
  if (academic || context.departmentScopeVersion < 1 || context.departmentScopeVersion == null) {
    for (const page of ['periods','carreras','asignaturas','espacios','programacion','disponibilidad']) pages.add(page)
  }
  if (context.canManageBloques) pages.add('generador')
  if (context.canReadDrafts) pages.add('borradores')
  if (context.canManageAccounts) pages.add('accounts')
  return pages
}
export function workspacePage(requested, context) {
  const pages = workspacePages(context)
  return pages.has(requested) ? requested : pages.has('personal') ? 'personal' : 'publicados'
}
