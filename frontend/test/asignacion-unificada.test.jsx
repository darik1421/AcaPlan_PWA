import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import AsignacionAcademicaPage from '../src/features/management/AsignacionAcademicaPage'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const context={isAdmin:true,canManageSecciones:true,activePeriod:{id_periodo:1,nombre:'2026'}}
const row={id:1,id_periodo:1,carrera:'Sistemas',ano_estudio:3,codigo_asignatura:'P1',nombre_asignatura:'Programación',docentes:['Ana','Luis'],turno:'matutino',horas_semestre:56}
test('Una única entrega confirma y refresca docentes, asignaturas, año y turno juntos',async()=>{
 let saved=false
 mocks.api.mockImplementation(async path=>{
  if(path==='/asignacion-academica')return saved?[row]:[]
  if(path==='/preparacion/revisar')return {semestre:1,filas:[{fila:2,ano_estudio:3,turno:'matutino'}],columnas:['ano_estudio','turno'],errores:[],avisos:[],valido:true,huella:'a'.repeat(32)}
  if(path==='/preparacion/confirmar'){saved=true;return {guardado:true}}
  return []
 })
 render(<AsignacionAcademicaPage context={context}/>)
 await screen.findByText('No hay entregas confirmadas en este semestre.')
 const input=screen.getByLabelText('Seleccionar Excel de asignación académica')
 expect(document.querySelectorAll('input[type="file"]')).toHaveLength(1)
 expect(screen.queryByRole('button',{name:'Años de carrera y turnos'})).toBeNull()
 const file=new File(['xlsx'],'entrega.xlsx');file.arrayBuffer=async()=>new Uint8Array([1,2]).buffer
 fireEvent.change(input,{target:{files:[file]}})
 fireEvent.click(await screen.findByRole('checkbox'))
 fireEvent.click(screen.getByRole('button',{name:'Confirmar y guardar asignación'}))
 await screen.findByText('P1 · Programación')
 expect(screen.getByText('Sistemas · Año 3')).toBeTruthy()
 expect(screen.getByText('Ana, Luis')).toBeTruthy()
 expect(screen.getByText('56')).toBeTruthy()
 expect(mocks.api.mock.calls.filter(([p])=>p==='/preparacion/confirmar')).toHaveLength(1)
 expect(mocks.api.mock.calls.some(([p])=>p==='/secciones'||p==='/programacion/detalle')).toBe(false)
})
test('Filtros combinados solo consultan la entrega del semestre, sin confundir un filtro vacío con falta de entrega',async()=>{
 mocks.api.mockResolvedValue([row,{...row,id:2,carrera:'Medicina',ano_estudio:1,nombre_asignatura:'Biología',codigo_asignatura:'B1',turno:'vespertino'},{...row,id:3,id_periodo:2,nombre_asignatura:'Otro semestre'}])
 render(<AsignacionAcademicaPage context={context}/>)
 await screen.findByText('B1 · Biología')
 expect(screen.queryByText(/Otro semestre/)).toBeNull()
 fireEvent.change(screen.getByLabelText('Carrera de la entrega'),{target:{value:'Sistemas'}})
 fireEvent.change(screen.getByLabelText('Turno de la entrega'),{target:{value:'vespertino'}})
 expect(screen.getByText('No hay asignaciones que coincidan con los filtros.')).toBeTruthy()
 fireEvent.click(screen.getByRole('button',{name:'Limpiar filtros'}))
 expect(screen.getByText('P1 · Programación')).toBeTruthy()
})
test('Error de consulta no aparenta una entrega vacía y permite reintentar',async()=>{
 mocks.api.mockRejectedValueOnce(new Error('Consulta no disponible')).mockResolvedValue([row])
 render(<AsignacionAcademicaPage context={context}/>)
 await screen.findByRole('alert')
 expect(screen.queryByText('No hay entregas confirmadas en este semestre.')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Reintentar consulta'}))
 await screen.findByText('P1 · Programación')
 await waitFor(()=>expect(screen.queryByRole('alert')).toBeNull())
})
