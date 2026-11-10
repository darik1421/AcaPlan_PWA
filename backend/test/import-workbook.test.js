import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import { HEADERS, readImportWorkbook, importTemplate } from '../src/import-workbook.js'
import { parseImport } from '../src/import-service.js'
import { createManagement } from '../src/management.js'
const valid = [1, 1, 1, 1, 4, 3, 1, 'NO', '2,3']
async function book(rows, headers = HEADERS) {
  const wb = new ExcelJS.Workbook(), sheet = wb.addWorksheet('Programacion')
  sheet.addRow(headers); rows.forEach(row => sheet.addRow(row))
  return Buffer.from(await wb.xlsx.writeBuffer())
}
test('XLSX real produce filas tipadas y conserva su número original', async () => {
  const result = await readImportWorkbook(await book([[], valid]))
  assert.deepEqual(result.errores, [])
  assert.deepEqual(result.filas[0], { hoja: 'Programacion', fila: 3, id_periodo: 1, id_carrera: 1, id_seccion: 1, id_asignatura: 1, id_docente: 4, sesiones_semanales: 3, duracion_bloques: 1, requisito_laboratorio: false, recursos_requeridos: [2, 3] })
})
test('Errores XLSX identifican hoja, fila y campo; nunca evalúa fórmulas', async () => {
  const row = [...valid]; row[4] = { formula: '1+3', result: 4 }; row[5] = 1.5; row[7] = 'quizás'; row[8] = '2,2'
  const result = await readImportWorkbook(await book([row]))
  assert.equal(result.errores.length, 4)
  assert.ok(result.errores.every(e => e.hoja === 'Programacion' && e.fila === 2 && e.campo && e.motivo))
})
test('Rechaza estructura diferente, archivo vacío, binario dañado y filas excesivas', async () => {
  assert.ok((await readImportWorkbook(await book([], ['otro']))).errores.length)
  await assert.rejects(readImportWorkbook(Buffer.from('not zip')))
  assert.ok((await readImportWorkbook(await book(Array.from({ length: 501 }, () => valid)))).errores.some(e => e.campo === 'estructura'))
})
test('Plantilla descargable tiene catálogos y no agrega datos de ejemplo a importar', async () => {
  const buffer = await importTemplate({ periodos: [{ id_periodo: 1, nombre: '2026' }], carreras: [], secciones: [], asignaturas: [], docentes: [], recursos: [] })
  const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buffer)
  assert.equal(wb.getWorksheet('Programacion').rowCount, 1)
  assert.equal(wb.getWorksheet('Periodos').getRow(2).getCell(2).value, '2026')
  assert.equal(wb.worksheets.length, 8)
})
test('Lectura aislada en worker y validación del tamaño y extensión', async () => {
  assert.equal((await parseImport({ archivo: 'plan.xlsx', base64: (await book([valid])).toString('base64') })).filas.length, 1)
  await assert.rejects(parseImport({ archivo: 'plan.xls', base64: 'YQ==' }), { status: 400 })
  await assert.rejects(parseImport({ archivo: 'plan.xlsx', base64: 'a'.repeat(2800001) }), { status: 400 })
})
test('Operaciones de importación retiradas no ejecutan consultas ni confirman lotes', async () => {
  const request={headers:{authorization:'Bearer usuario'}}, calls=[]
  const management=createManagement({url:'https://example.test',key:'public',fetchImpl:async(...args)=>{calls.push(args);return Response.json({})}})
  for(const route of ['import.preview','import.confirm','planning.save','programacion.detalle.create','bloques.create']) {
    await assert.rejects(management.execute(request,{rol:'administrador'},route,{}),{status:404})
  }
  assert.equal(calls.length,0)
})

test('El ejemplo descargable no enseña equivalencias descartadas ni promete importación activa',async()=>{
 const wb=new ExcelJS.Workbook()
 await wb.xlsx.load(await importTemplate({periodos:[],carreras:[],secciones:[],asignaturas:[],docentes:[],recursos:[]}))
 const text=wb.getWorksheet('Instrucciones').getSheetValues().flat(2).join(' ')
 assert.match(text,/EJEMPLO PROVISIONAL/)
 assert.match(text,/90 minutos/)
 assert.doesNotMatch(text,/80 minutos|debe coincidir con las horas|solo Confirmar guarda/)
})
