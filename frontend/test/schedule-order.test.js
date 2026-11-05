import {expect,test} from 'vitest'
import {orderedScheduleRows} from '../src/lib/schedule-order'
import {publicationCsv} from '../src/features/management/publication-csv'

test('Ordena lunes a domingo, incluidas las tildes, y dentro del día por hora',()=>{
 const rows=[{dia:'Domingo',inicio:'08:00'},{dia:'Miércoles',inicio:'08:00'},{dia:'Lunes',inicio:'10:00'},{dia:'Sábado',inicio:'08:00'},{dia:'Jueves',inicio:'08:00'},{dia:'Martes',inicio:'08:00'},{dia:'Viernes',inicio:'08:00'},{dia:'Lunes',inicio:'8:00'}]
 expect(orderedScheduleRows(rows).map(r=>`${r.dia} ${r.inicio}`)).toEqual(['Lunes 8:00','Lunes 10:00','Martes 08:00','Miércoles 08:00','Jueves 08:00','Viernes 08:00','Sábado 08:00','Domingo 08:00'])
 expect(rows[0].dia).toBe('Domingo')
})

test('Usa hora_inicio en las clases de borrador y deja días desconocidos al final',()=>{
 const rows=[{id:1,dia:'Pendiente',hora_inicio:'08:00'},{id:2,dia:'Miercoles',hora_inicio:'10:00:00'},{id:3,dia:'Lunes',hora_inicio:'09:40:00'},{id:4,dia:'Lunes',hora_inicio:'08:00:00'}]
 expect(orderedScheduleRows(rows).map(r=>r.id)).toEqual([4,3,2,1])
})

test('La descarga CSV mantiene el mismo orden semanal que la pantalla',()=>{
 const csv=publicationCsv([{dia:'Jueves',inicio:'08:00',asignatura:'Cuarta'},{dia:'Lunes',inicio:'09:40',asignatura:'Segunda'},{dia:'Lunes',inicio:'08:00',asignatura:'Primera'}])
 const lines=csv.split('\r\n')
 expect(lines[1]).toContain('Primera');expect(lines[2]).toContain('Segunda');expect(lines[3]).toContain('Cuarta')
})
