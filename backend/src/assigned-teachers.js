// Una asignación puede incluir varios docentes; no representa gestión de mentorías.
// El campo singular se conserva para los registros existentes.
export function assignedTeacherIds(record) {
  if (!record) return null
  const ids = record.id_docentes === undefined ? [record.id_docente] : record.id_docentes
  if (!Array.isArray(ids) || !ids.length || ids.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(ids).size !== ids.length) return null
  if (record.id_docente !== undefined && !ids.includes(record.id_docente)) return null
  return [...ids]
}
