import ExcelJS from 'exceljs'
import yauzl from 'yauzl'

export const HEADERS = ['periodo_id', 'carrera_id', 'seccion_id', 'asignatura_id', 'docente_id', 'sesiones_semanales', 'bloques_por_sesion', 'laboratorio', 'recursos_ids']
const MAX_BYTES = 2 * 1024 * 1024
const MAX_EXPANDED = 8 * 1024 * 1024

// Lee cada entrada sin extraer archivos al disco y verifica su tamaño real.
async function inspectZip(buffer) {
  await new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
      if (error) return reject(new Error('El archivo no es un XLSX válido.'))
      let bytes = 0, entries = 0, finished = false
      const fail = () => { if (!finished) { finished = true; zip.close(); reject(new Error('El XLSX está dañado o supera los límites de lectura.')) } }
      zip.on('error', fail)
      zip.on('end', () => { if (!finished) { finished = true; resolve() } })
      zip.on('entry', entry => {
        if (++entries > 1000 || entry.uncompressedSize > MAX_EXPANDED || /vbaProject|externalLinks/i.test(entry.fileName) || entry.generalPurposeBitFlag & 1) return fail()
        zip.openReadStream(entry, (err, stream) => {
          if (err) return fail()
          stream.on('error', fail)
          stream.on('data', chunk => { bytes += chunk.length; if (bytes > MAX_EXPANDED) { stream.destroy(); fail() } })
          stream.on('end', () => { if (!finished) zip.readEntry() })
        })
      })
      zip.readEntry()
    })
  })
}

export async function readImportWorkbook(buffer) {
  if (!buffer.length || buffer.length > MAX_BYTES) throw new Error('El XLSX debe tener como máximo 2 MB.')
  await inspectZip(buffer)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const errores = [], filas = []
  const issue = (hoja, fila, campo, motivo) => errores.push({ hoja, fila, campo, motivo })
  const sheet = workbook.getWorksheet('Programacion')
  if (!sheet) return { filas, errores: [{ hoja: 'Programacion', fila: 1, campo: 'estructura', motivo: 'Falta la hoja Programacion de la plantilla.' }] }
  for (const other of workbook.worksheets) {
    if (!['Programacion', 'Instrucciones', 'Periodos', 'Carreras', 'Secciones', 'Asignaturas', 'Docentes', 'Recursos'].includes(other.name)) issue(other.name, 1, 'estructura', 'Hoja no reconocida; utiliza la plantilla descargada.')
  }
  if (sheet.rowCount > 501 || sheet.columnCount > HEADERS.length) return { filas, errores: [{ hoja: sheet.name, fila: 1, campo: 'estructura', motivo: 'Se admiten hasta 500 filas y las nueve columnas de la plantilla.' }] }
  if (sheet.model.merges?.length) issue(sheet.name, 1, 'estructura', 'No se admiten celdas combinadas en Programacion.')
  HEADERS.forEach((header, col) => { if (sheet.getRow(1).getCell(col + 1).value !== header) issue(sheet.name, 1, header, 'Encabezado ausente, cambiado o fuera de orden.') })
  for (let n = 2; n <= sheet.rowCount; n++) {
    const row = sheet.getRow(n), values = HEADERS.map((_, c) => row.getCell(c + 1).value)
    if (values.every(v => v === null || v === '')) continue
    const data = { fila: n, hoja: sheet.name }
    HEADERS.forEach((header, col) => {
      const value = values[col]
      if (value !== null && typeof value === 'object') { issue(sheet.name, n, header, 'Usa valores simples; no se admiten fórmulas, vínculos ni objetos.'); return }
      if (String(value ?? '').length > 1000) { issue(sheet.name, n, header, 'El valor es demasiado largo.'); return }
      if (header === 'laboratorio') {
        const bool = String(value ?? '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        if (!['SI', 'NO'].includes(bool)) issue(sheet.name, n, header, 'Indica SI o NO.')
        else data.requisito_laboratorio = bool === 'SI'
      } else if (header === 'recursos_ids') {
        const items = String(value ?? '').trim() ? String(value).split(',').map(s => s.trim()) : []
        if (items.length > 100 || items.some(v => !/^[1-9]\d*$/.test(v) || Number(v) > 2147483647) || new Set(items).size !== items.length) issue(sheet.name, n, header, 'Usa IDs positivos sin repetir, separados por comas, o deja vacío para ninguno.')
        else data.recursos_requeridos = items.map(Number).sort((a, b) => a - b)
      } else {
        const text = String(value ?? '').trim()
        if (!/^[1-9]\d*$/.test(text) || Number(text) > 2147483647) issue(sheet.name, n, header, 'Se requiere un entero positivo válido.')
        else data[({ periodo_id: 'id_periodo', carrera_id: 'id_carrera', seccion_id: 'id_seccion', asignatura_id: 'id_asignatura', docente_id: 'id_docente', bloques_por_sesion: 'duracion_bloques' })[header] || header] = Number(text)
      }
    })
    filas.push(data)
  }
  if (!filas.length) issue(sheet.name, 2, 'estructura', 'El archivo no contiene filas para importar.')
  return { filas, errores }
}

export async function importTemplate(catalog) {
  const workbook = new ExcelJS.Workbook()
  const main = workbook.addWorksheet('Programacion')
  main.addRow(HEADERS); main.views = [{ state: 'frozen', ySplit: 1 }]
  main.columns.forEach(col => { col.width = 24 }); main.getRow(1).font = { bold: true }
  const instructions = workbook.addWorksheet('Instrucciones')
  for (const text of [
    'EJEMPLO PROVISIONAL. La plantilla definitiva de asignación académica está pendiente; este archivo no se puede confirmar en la PWA.',
    'La estructura conserva columnas del modelo anterior solo como referencia. Descargar el ejemplo no crea datos.',
    'Los coordinadores proporcionarán grupos, asignaturas y sus docentes. Los jefes de departamento registrarán las restricciones autorizadas.',
    'Regla general regular: dos sesiones de 90 minutos por semana, cada una formada por dos bloques consecutivos de 45 minutos.',
    'Encuentros: sesiones de 60 minutos. No deducir su frecuencia semanal ni la de nocturno a partir de las horas del catálogo.',
    'Las horas teóricas y prácticas del catálogo no se convierten automáticamente en sesiones ni en minutos.',
    'laboratorio y recursos_ids pertenecen al ejemplo anterior. La plantilla final contemplará necesidades de espacio y varios docentes por asignatura.'
  ]) instructions.addRow([text])
  instructions.getColumn(1).width = 115
  const definitions = [
    ['Periodos', 'periodos', ['id_periodo', 'nombre']], ['Carreras', 'carreras', ['id_carrera', 'nombre', 'estado']],
    ['Secciones', 'secciones', ['id_seccion', 'codigo', 'id_periodo', 'id_carrera', 'ano_estudio']],
    ['Asignaturas', 'asignaturas', ['id_asignatura', 'codigo', 'nombre', 'id_carrera', 'horas_teoricas', 'horas_practicas', 'estado']],
    ['Docentes', 'docentes', ['id_docente', 'nombres', 'apellidos', 'estado']], ['Recursos', 'recursos', ['id_recurso', 'nombre']],
  ]
  for (const [name, key, headers] of definitions) {
    const sheet = workbook.addWorksheet(name); sheet.addRow(headers); sheet.getRow(1).font = { bold: true }
    for (const item of catalog[key]) sheet.addRow(headers.map(h => item[h] ?? ''))
    sheet.columns.forEach(col => { col.width = 26 })
  }
  return Buffer.from(await workbook.xlsx.writeBuffer())
}
