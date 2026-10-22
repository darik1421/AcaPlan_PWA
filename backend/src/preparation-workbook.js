import ExcelJS from 'exceljs'
import {inspectZip} from './import-workbook.js'
import {AccessError} from './auth.js'

export const PREPARATION = {
 espacios: {sheet:'Espacios', fields:['sede','pabellon','codigo','tipo','capacidad','recursos','espacio_padre']},
}
const text=value=>String(value??'').trim()
const positive=value=>/^[1-9]\d*$/.test(text(value))&&Number(value)<=2147483647
const definition=kind=>{if(!Object.hasOwn(PREPARATION,kind))throw new AccessError(400,'Tipo de archivo no válido.');return PREPARATION[kind]}
export async function preparationTemplate(kind,catalog={}) {
 const {sheet,fields}=definition(kind), book=new ExcelJS.Workbook()
 const main=book.addWorksheet(sheet);main.addRow(fields);main.getRow(1).font={bold:true};main.views=[{state:'frozen',ySplit:1}];main.columns.forEach(c=>{c.width=25})
 const help=book.addWorksheet('Instrucciones')
 for(const line of ['PLANTILLA PROVISIONAL V1. Revisa los datos y confirma el guardado desde la aplicación. No genera horarios.',
 'Una fila por espacio. Hasta 500 filas. No usar fórmulas ni combinar celdas.',
 'Inventario: recursos son nombres separados por punto y coma. espacio_padre es opcional y usa el código del espacio principal dentro de la misma sede y pabellón.',
 'No incluir contraseñas ni identificadores personales en la plantilla de inventario. La cédula se solicita únicamente en la plantilla de asignación académica.'])help.addRow([line])
 help.getColumn(1).width=110
 for(const [name,key,columns] of [['Recursos','recursos',['id_recurso','nombre']]]) {
  const tab=book.addWorksheet(name);tab.addRow(columns);tab.getRow(1).font={bold:true};for(const row of catalog[key]||[])tab.addRow(columns.map(k=>row[k]??''));tab.columns.forEach(c=>{c.width=25})
 }
 return Buffer.from(await book.xlsx.writeBuffer())
}
export async function previewPreparation(kind,buffer,{period}={}) {
 const {sheet,fields}=definition(kind)
 if(!buffer.length||buffer.length>2*1024*1024)throw new AccessError(400,'El Excel debe pesar entre 1 byte y 2 MB.')
 try{await inspectZip(buffer)}catch(e){throw new AccessError(400,e.message)}
 const book=new ExcelJS.Workbook()
 try{await book.xlsx.load(buffer)}catch{throw new AccessError(400,'No se pudo leer el archivo XLSX.')}
 const rows=[],errors=[],warnings=[]
 const issue=(row,field,message)=>errors.push({fila:row,campo:field,motivo:message})
 const tab=book.getWorksheet(sheet)
 if(!tab)issue(1,'hoja',`Falta la hoja ${sheet}. Descarga la plantilla provisional correspondiente.`)
 if(!period)issue(1,'semestre','Activa un semestre antes de revisar este archivo.')
 if(tab){
  if(tab.rowCount>501||tab.columnCount>fields.length)throw new AccessError(400,'Usa hasta 500 filas y solo las columnas de la plantilla.')
  if(tab.model.merges?.length)issue(1,'estructura','No se admiten celdas combinadas.')
  fields.forEach((field,i)=>{if(tab.getRow(1).getCell(i+1).value!==field)issue(1,field,'Encabezado ausente o diferente de la plantilla.')})
  const seen=new Set()
  for(let n=2;n<=tab.rowCount;n++){
   const values=fields.map((_,i)=>tab.getRow(n).getCell(i+1).value)
   if(values.every(v=>v===null||v===''))continue
   const row={fila:n}
   fields.forEach((field,i)=>{
    const v=values[i]
    if(v!==null&&typeof v==='object'){issue(n,field,'Usa texto o números; no fórmulas, fechas ni vínculos.');row[field]='';return}
    row[field]=text(v)
    if(row[field].length>500)issue(n,field,'Máximo 500 caracteres por celda.')
    if(!row[field]&&!['recursos_ids','recursos','espacio_padre'].includes(field))issue(n,field,'Campo obligatorio.')
   })
   if(kind==='espacios'){
    for(const [field,max] of [['sede',100],['pabellon',50],['codigo',20],['tipo',50],['espacio_padre',20]])if(row[field].length>max)issue(n,field,`Máximo ${max} caracteres.`)
    if(row.recursos.split(';').some(v=>v.trim().length>50))issue(n,'recursos','Cada recurso admite hasta 50 caracteres.')
    if(!positive(row.capacidad))issue(n,'capacidad','Indica una capacidad real mayor que cero.')
    if(row.espacio_padre&&row.espacio_padre===row.codigo)issue(n,'espacio_padre','Un espacio no puede ser su propio padre.')
    const resources=row.recursos.split(';').map(v=>v.trim().toLocaleLowerCase()).filter(Boolean)
    if(new Set(resources).size!==resources.length)issue(n,'recursos','No repitas un recurso dentro del espacio.')
   }
   const key=JSON.stringify([row.sede,row.pabellon,row.codigo].map(v=>String(v).toLocaleLowerCase()))
   if(seen.has(key))issue(n,'duplicado','Registro repetido en el archivo.')
   seen.add(key);rows.push(row)
  }
 }
 if(kind==='espacios'){
  const key=(row,code=row.codigo)=>JSON.stringify([row.sede,row.pabellon,code].map(v=>v.toLocaleLowerCase()))
  const spaces=new Map(rows.map(row=>[key(row),row]))
  for(const row of rows){
   const visited=new Set([key(row)]);let current=row
   while(current.espacio_padre){
    const parentKey=key(current,current.espacio_padre)
    if(visited.has(parentKey)){issue(row.fila,'espacio_padre','La relación de espacios contiene un ciclo.');break}
    const parent=spaces.get(parentKey)
    if(!parent){issue(row.fila,'espacio_padre','Incluye el espacio principal en este archivo, con la misma sede y pabellón.');break}
    visited.add(parentKey);current=parent
   }
  }
 }
 if(!rows.length)issue(2,'archivo','No hay filas con datos.')
 for(const other of book.worksheets)if(![sheet,'Instrucciones','Carreras','Asignaturas','Docentes','Recursos'].includes(other.name))issue(1,'hoja',`Hoja no reconocida: ${other.name}. No se importará silenciosamente.`)
 warnings.push('La revisión no guarda datos; confirma desde la aplicación después de comprobar las coincidencias.')
 return {tipo:kind,semestre:period?.id_periodo,columnas:fields,filas:rows,errores:errors,avisos:warnings,valido:errors.length===0,guardado:false}
}
