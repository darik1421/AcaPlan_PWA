import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import {PREPARATION,preparationTemplate,previewPreparation} from '../src/preparation-workbook.js'
import {createManagement} from '../src/management.js'
const catalog={carreras:[{id_carrera:1,nombre:'Sistemas',estado:'activo'},{id_carrera:2,nombre:'Salud'}],asignaturas:[{id_asignatura:3,id_carrera:1,ano_estudio:3,estado:'activo'}],docentes:[{id_docente:4,estado:'activo'},{id_docente:5,estado:'activo'}],recursos:[{id_recurso:1,nombre:'Computadora'}]}
const context={catalog,period:{id_periodo:2},allowedCareers:[1]}
async function xlsx(kind,rows){const book=new ExcelJS.Workbook(),sheet=book.addWorksheet(PREPARATION[kind].sheet);sheet.addRow(PREPARATION[kind].fields);rows.forEach(row=>sheet.addRow(row));return Buffer.from(await book.xlsx.writeBuffer())}
const room=['CUR-Chontales','B','B4','laboratorio',35,'Computadoras;Televisor','']
test('Las plantillas provisionales de inventario contienen campos y referencias, sin filas inventadas',async()=>{
 for(const kind of Object.keys(PREPARATION)){
  const book=new ExcelJS.Workbook();await book.xlsx.load(await preparationTemplate(kind,catalog))
  assert.equal(book.getWorksheet(PREPARATION[kind].sheet).rowCount,1)
  assert.match(book.getWorksheet('Instrucciones').getRow(1).getCell(1).value,/PROVISIONAL/)
 }
})
test('Revisa inventario sin guardar',async()=>{
 for(const [kind,row]of[['espacios',room]]){
  const result=await previewPreparation(kind,await xlsx(kind,[row]),context)
  assert.deepEqual(result.errores,[]);assert.equal(result.guardado,false);assert.equal(result.semestre,2);assert.equal(result.filas[0].fila,2)
 }
})
test('El segundo archivo de años queda retirado de plantilla y revisión',async()=>{
 await assert.rejects(preparationTemplate('anos'),{status:400})
 await assert.rejects(previewPreparation('anos',Buffer.from('invalid'),context),{status:400})
 const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async()=>{throw new Error('No debería consultar Supabase')}})
 await assert.rejects(management.execute({headers:{authorization:'Bearer test'}},{rol:'administrador'},'preparation.template',{tipo:'anos'}),{status:400})
})

test('Rechaza fórmulas y datos de inventario inconsistentes',async()=>{
 const row=[...room];row[4]={formula:'30+5',result:35};row[5]='TV;tv';row[6]='B4'
 const result=await previewPreparation('espacios',await xlsx('espacios',[row]),context)
 for(const key of ['capacidad','recursos','espacio_padre'])assert.ok(result.errores.some(e=>e.campo===key),key)
})
test('Archivo vacío, dañado, tipo desconocido y semestre ausente no pasan',async()=>{
 await assert.rejects(previewPreparation('espacios',Buffer.from('invalid'),context),{status:400})
 await assert.rejects(preparationTemplate('__proto__'),{status:400})
 assert.equal((await previewPreparation('espacios',await xlsx('espacios',[]),context)).valido,false)
 assert.equal((await previewPreparation('espacios',await xlsx('espacios',[room]),{catalog})).valido,false)
})
test('Permisos de revisión se comprueban en backend antes de leer el Excel',async()=>{
 for(const [kind,functions,allow]of[['espacios',['coordinador'],false],['espacios',['planificador'],true],['asignaciones',['jefe_departamento'],false]]){
  const calls=[]
  const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{
   const {action}=JSON.parse(options.body);calls.push(action)
   return Response.json(action==='context'?{funciones:functions,carreras:[1]}:action==='periods.list'?[context.period]:catalog[action.split('.')[0]]||[])
  }})
  const promise=management.execute({headers:{authorization:'Bearer test'}},{rol:'docente'},'preparation.template',{tipo:kind})
  if(allow)assert.ok((await promise).base64)
  else{await assert.rejects(promise,{status:403});assert.deepEqual(calls,['context'])}
  assert.ok(calls.every(action=>action==='context'||action.endsWith('.list')))
 }
})

test('Inventario exige un padre presente y rechaza ciclos de subdivisiones',async()=>{
 const first=[...room];first[6]='B5'
 const second=[...room];second[2]='B5';second[6]='B4'
 const cycle=await previewPreparation('espacios',await xlsx('espacios',[first,second]),context)
 assert.ok(cycle.errores.some(e=>e.motivo.includes('ciclo')))
 const missing=await previewPreparation('espacios',await xlsx('espacios',[first]),context)
 assert.ok(missing.errores.some(e=>e.motivo.includes('Incluye el espacio principal')))
 second[6]=''
 assert.equal((await previewPreparation('espacios',await xlsx('espacios',[first,second]),context)).valido,true)
})

test('Inventario revisa contra Supabase y confirma únicamente con huella y semestre actual',async()=>{
 const buffer=await xlsx('espacios',[room]),calls=[]
 const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{
  const body=JSON.parse(options.body);calls.push({url,body,authorization:options.headers.Authorization})
  return Response.json(url.endsWith('/pwa_inventario')?{valido:true,guardado:body.action==='confirm',huella:'a'.repeat(32),filas:body.payload.rows,errores:[]} :body.action==='context'?{funciones:['planificador']}:body.action==='periods.list'?[{id_periodo:2,es_activo:true}]:[])
 }})
 const req={headers:{authorization:'Bearer user'}},profile={rol:'docente'},data={tipo:'espacios',id_periodo:2,base64:buffer.toString('base64')}
 const preview=await management.execute(req,profile,'preparation.preview',data);assert.equal(preview.valido,true);assert.equal(preview.guardado,false)
 await assert.rejects(management.execute(req,profile,'preparation.confirm',data),{status:400})
 assert.equal((await management.execute(req,profile,'preparation.confirm',{...data,huella:preview.huella})).guardado,true)
 await assert.rejects(management.execute(req,profile,'preparation.preview',{...data,id_periodo:1}),{status:409})
 const writes=calls.filter(c=>c.url.endsWith('/pwa_inventario'));assert.deepEqual(writes.map(c=>c.body.action),['preview','confirm']);assert.ok(writes.every(c=>c.authorization==='Bearer user'))
})

test('Datos complementarios validan números y pendientes; nunca aceptan campos de permisos',async()=>{
 let sent;const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async(url,options)=>{sent=JSON.parse(options.body);return Response.json({guardado:true})}})
 const req={headers:{authorization:'Bearer user'}},profile={rol:'docente'},data={id_periodo:1,id_carrera:2,ano_estudio:3,revision:0,cantidad_estudiantes:null,sede:null}
 for(const change of [{cantidad_estudiantes:0},{cantidad_estudiantes:'30'},{sede:''},{revision:-1},{ano_estudio:0}])await assert.rejects(management.execute(req,profile,'academicYears.save',{...data,...change}),{status:400})
 await management.execute(req,profile,'academicYears.save',{...data,isAdmin:true});assert.deepEqual(sent,{action:'year.save',payload:data})
})
