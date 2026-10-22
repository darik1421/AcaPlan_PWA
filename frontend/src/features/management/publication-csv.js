const columns=[['carrera','Carrera'],['ano','Año'],['turno','Turno'],['asignatura','Asignatura'],['componente','Sesión'],['docentes','Docentes'],['aula','Aula'],['sede','Sede'],['dia','Día'],['inicio','Inicio'],['fin','Fin']]
export function publicationCsv(rows){
 const escape=value=>{let s=Array.isArray(value)?value.join(', '):String(value??'');if(/^[\s]*[=+@-]/.test(s)||/^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}
 return '\uFEFF'+[columns.map(([,name])=>escape(name)).join(','),...rows.map(r=>columns.map(([key])=>escape(r[key])).join(','))].join('\r\n')
}
