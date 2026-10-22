import test from 'node:test'
import assert from 'node:assert/strict'
import ExcelJS from 'exceljs'
import {ASSIGNMENT_HEADERS,assignmentTemplate,readAssignments} from '../src/assignment-workbook.js'
const row=['001-ABC','María López','WEB01','Programación Web','Sistemas',3,'Matutino',56]
async function book(rows){const b=new ExcelJS.Workbook(),s=b.addWorksheet('Asignaciones');s.addRow(ASSIGNMENT_HEADERS);rows.forEach(r=>s.addRow(r));return Buffer.from(await b.xlsx.writeBuffer())}
test('Plantilla acordada: cédula y código como texto, sin IDs internos',async()=>{
 const b=new ExcelJS.Workbook();await b.xlsx.load(await assignmentTemplate([{nombre:'Sistemas'}]));const s=b.getWorksheet('Asignaciones')
 assert.deepEqual(s.getRow(1).values.slice(1),ASSIGNMENT_HEADERS);assert.equal(s.getColumn(1).numFmt,'@');assert.equal(s.getColumn(3).numFmt,'@');assert.equal(s.rowCount,1)
})
test('Dos docentes en una asignatura conservan 56 horas del semestre, sin convertirlas',async()=>{
 const second=[...row];second[0]='002-XYZ';second[1]='Otro Docente'
 const result=await readAssignments(await book([row,second]));assert.deepEqual(result.errors,[]);assert.equal(result.rows[0].cedula_docente,'001ABC');assert.equal(result.rows[0].horas_semestre,56);assert.equal(result.rows[1].horas_semestre,56)
})
test('Cédulas numéricas, fórmulas, turnos abreviados y conflictos de identidad no pasan',async()=>{
 const invalid=[...row];invalid[0]=123;invalid[1]={formula:'1+1',result:2};invalid[6]='M'
 const changed=[...row];changed[1]='Nombre diferente'
 const result=await readAssignments(await book([row,invalid,changed]));assert.ok(result.errors.some(e=>e.campo==='identificadores'));assert.ok(result.errors.some(e=>e.campo==='turno'));assert.ok(result.errors.some(e=>e.campo==='docente'))
})
test('Carga distinta por docente y duplicados no se suman ni guardan silenciosamente',async()=>{
 const second=[...row];second[0]='002XYZ';second[1]='Otro Docente';second[7]=42
 const result=await readAssignments(await book([row,second,row]));assert.ok(result.errors.some(e=>e.campo==='horas'));assert.ok(result.errors.some(e=>e.campo==='duplicado'))
})

test('Un mismo año no recibe turnos diferentes dentro del mismo archivo; señala hoja y filas',async()=>{
 const second=[...row];second[2]='BD01';second[3]='Bases';second[6]='Vespertino'
 const result=await readAssignments(await book([row,second]))
 assert.ok(result.errors.some(e=>e.hoja==='Asignaciones'&&e.fila===3&&e.campo==='turno'&&e.motivo.includes('fila 2')))
 second[5]=4;assert.deepEqual((await readAssignments(await book([row,second]))).errors,[])
})
