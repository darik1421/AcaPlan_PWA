import ExcelJS from 'exceljs'
import {inspectZip} from './import-workbook.js'
import {AccessError} from './auth.js'
export const ASSIGNMENT_HEADERS=['Cédula del docente','Nombre del docente','Código de asignatura','Nombre de asignatura','Carrera','Año','Turno','Horas totales del semestre']
const keys=['cedula_docente','nombre_docente','codigo_asignatura','nombre_asignatura','carrera','ano_estudio','turno','horas_semestre']
export async function assignmentTemplate(carreras=[]){
 const book=new ExcelJS.Workbook(),sheet=book.addWorksheet('Asignaciones')
 sheet.addRow(ASSIGNMENT_HEADERS);sheet.getRow(1).font={bold:true};sheet.views=[{state:'frozen',ySplit:1}];sheet.columns.forEach(c=>{c.width=30});sheet.getColumn(1).numFmt='@';sheet.getColumn(3).numFmt='@'
 const help=book.addWorksheet('Instrucciones')
 for(const line of ['Plantilla de asignación académica. Una fila por docente y asignatura; repite la asignatura cuando tenga varios docentes.',
 'Cédula y código se escriben como texto para conservar ceros iniciales. No se necesitan IDs internos.',
 'Usa el nombre completo de la carrera y el año numérico. Turnos: Matutino, Vespertino, Nocturno, Por encuentros.',
 'Horas totales del semestre conserva la carga completa (por ejemplo 42 o 56); no equivale a sesiones semanales.',
 'Una misma asignatura con varios docentes conserva un único total de horas, no se suman las filas.',
 'La vista previa distingue registros reconocidos y nuevos. Las diferencias deben corregirse antes de confirmar.',
 'Registrar un docente académico no crea una cuenta, contraseña ni permiso de acceso.',
 'El semestre se toma de la aplicación. Capacidad, sede, necesidades de espacio y frecuencia de encuentros se completan en sus etapas correspondientes.'])help.addRow([line])
 help.getColumn(1).width=110
 const ref=book.addWorksheet('Carreras');ref.addRow(['Carrera']);carreras.forEach(c=>ref.addRow([c.nombre]));ref.getColumn(1).width=60
 return Buffer.from(await book.xlsx.writeBuffer())
}
export async function readAssignments(buffer){
 if(!buffer.length||buffer.length>2097152)throw new AccessError(400,'El XLSX debe pesar hasta 2 MB.')
 try{await inspectZip(buffer)}catch(e){throw new AccessError(400,e.message)}
 const book=new ExcelJS.Workbook();try{await book.xlsx.load(buffer)}catch{throw new AccessError(400,'Archivo XLSX inválido.')}
 const rows=[],errors=[],tab=book.getWorksheet('Asignaciones'),issue=(fila,campo,motivo,hoja='Asignaciones')=>errors.push({hoja,fila,campo,motivo})
 if(!tab)return{rows,errors:[{hoja:'Asignaciones',fila:1,campo:'hoja',motivo:'Falta la hoja Asignaciones.'}]}
 if(tab.rowCount>501||tab.columnCount>8)throw new AccessError(400,'Se admiten 500 filas y las ocho columnas de la plantilla.')
 if(tab.model.merges?.length)issue(1,'estructura','No combines celdas.')
 ASSIGNMENT_HEADERS.forEach((h,i)=>{if(tab.getRow(1).getCell(i+1).value!==h)issue(1,h,'Encabezado diferente de la plantilla acordada.')})
 for(const sheet of book.worksheets)if(!['Asignaciones','Instrucciones','Carreras'].includes(sheet.name))issue(1,'hoja',`Hoja no reconocida: ${sheet.name}.`,sheet.name)
 const teachers=new Map(),subjects=new Map(),assignments=new Map(),seen=new Set(),yearTurns=new Map()
 for(let n=2;n<=tab.rowCount;n++){
  const vals=keys.map((_,i)=>tab.getRow(n).getCell(i+1).value)
  if(vals.every(v=>v===null||v===''))continue
  const row={fila:n}
  keys.forEach((key,i)=>{
   const value=vals[i]
   if(value!==null&&typeof value==='object'){issue(n,ASSIGNMENT_HEADERS[i],'No se admiten fórmulas ni vínculos.');row[key]='';return}
   row[key]=String(value??'').trim().replace(/\s+/g,' ')
   if(!row[key]&&key!=='horas_semestre')issue(n,ASSIGNMENT_HEADERS[i],'Campo obligatorio.')
   if(row[key].length>150)issue(n,ASSIGNMENT_HEADERS[i],'Máximo 150 caracteres.')
  })
  if(typeof vals[0]!=='string'||typeof vals[2]!=='string')issue(n,'identificadores','Escribe cédula y código como texto; un número puede haber perdido ceros iniciales.')
  row.cedula_docente=row.cedula_docente.replace(/[\s-]/g,'').toUpperCase();row.codigo_asignatura=row.codigo_asignatura.toUpperCase()
  if(!/^[A-Z0-9]{1,40}$/.test(row.cedula_docente))issue(n,'cédula','Cédula inválida; usa letras, números y guiones.')
  if(!/^[1-9]\d?$/.test(row.ano_estudio)||Number(row.ano_estudio)>10)issue(n,'año','Indica un año entre 1 y 10.')
  if(!/^\d+$/.test(row.horas_semestre)||Number(row.horas_semestre)>10000)issue(n,'horas','Indica el total semestral entero, de cero a 10000; no se deduce de sesiones.')
  row.turno=({'matutino':'matutino','vespertino':'vespertino','nocturno':'nocturno','por encuentros':'encuentros','encuentros':'encuentros'})[row.turno.toLocaleLowerCase()]||''
  if(!row.turno)issue(n,'turno','Usa Matutino, Vespertino, Nocturno o Por encuentros.')
  const yearKey=JSON.stringify([row.carrera.toLocaleLowerCase(),row.ano_estudio])
  if(row.turno){
   const previousTurn=yearTurns.get(yearKey)
   if(previousTurn&&previousTurn.turno!==row.turno)issue(n,'turno',`Este año de carrera ya tiene otro turno en la fila ${previousTurn.fila}. Un año no se divide en grupos por turno.`)
   else if(!previousTurn)yearTurns.set(yearKey,{turno:row.turno,fila:n})
  }
  const teacher=teachers.get(row.cedula_docente),subjectKey=JSON.stringify([row.carrera.toLocaleLowerCase(),row.codigo_asignatura]),subject=subjects.get(subjectKey)
  if(teacher&&teacher.toLocaleLowerCase()!==row.nombre_docente.toLocaleLowerCase())issue(n,'docente','La misma cédula aparece con nombres diferentes.')
  if(subject&&(subject.nombre_asignatura.toLocaleLowerCase()!==row.nombre_asignatura.toLocaleLowerCase()||subject.ano_estudio!==row.ano_estudio))issue(n,'asignatura','El mismo código y carrera tienen distinto nombre o año.')
  teachers.set(row.cedula_docente,row.nombre_docente);subjects.set(subjectKey,row)
  const group=JSON.stringify([subjectKey,row.turno]),previous=assignments.get(group)
  if(previous!==undefined&&previous!==row.horas_semestre)issue(n,'horas','Los docentes de la misma asignatura deben indicar el mismo total semestral.')
  assignments.set(group,row.horas_semestre)
  const key=JSON.stringify([group,row.cedula_docente]);if(seen.has(key))issue(n,'duplicado','Este docente ya aparece en la misma asignación.');seen.add(key)
  rows.push({...row,ano_estudio:Number(row.ano_estudio),horas_semestre:Number(row.horas_semestre)})
 }
 if(!rows.length)issue(2,'archivo','No hay asignaciones para revisar.')
 return{rows,errors}
}
