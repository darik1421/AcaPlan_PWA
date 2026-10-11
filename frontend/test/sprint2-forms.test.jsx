import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import SeccionesPage from '../src/features/management/SeccionesPage'
import ProgramacionPage from '../src/features/management/ProgramacionPage'
import BloquesPage from '../src/features/management/BloquesPage'
import AsignaturasPage from '../src/features/management/AsignaturasPage'
import EspaciosPage from '../src/features/management/EspaciosPage'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const careers=[{id_carrera:1,nombre:'Ingeniería',estado:'activo'},{id_carrera:2,nombre:'Medicina',estado:'activo'}]
const sections=[{id_seccion:1,id_carrera:1,id_periodo:1,codigo:'GRUPO-A',carrera_nombre:'Ingeniería',ano_estudio:1,cantidad_estudiantes:20,asignaturas:[1]},
 {id_seccion:2,id_carrera:2,id_periodo:1,codigo:'GRUPO-B',carrera_nombre:'Medicina',ano_estudio:1,cantidad_estudiantes:20,asignaturas:[]},
 {id_seccion:3,id_carrera:1,id_periodo:2,codigo:'OTRO-PERIODO',carrera_nombre:'Ingeniería',ano_estudio:1,cantidad_estudiantes:20,asignaturas:[]}]
const subjects=[{id_asignatura:1,id_carrera:1,codigo:'MAT',nombre:'Matemática',carrera_nombre:'Ingeniería',ano_estudio:1,horas_teoricas:2,horas_practicas:1,estado:'activo'}]
const base={isAdmin:false,funciones:['coordinador'],carreras:[1],canManageSecciones:true,canManageAsignaturas:true,activePeriod:{id_periodo:1,nombre:'2026'}}
const mockData=()=>mocks.api.mockImplementation(async path=>({'/carreras':careers,'/secciones':sections,'/asignaturas':subjects,'/docentes':[{id_docente:4,nombres:'Docente',estado:'activo'}],'/programacion':[]}[path]||[]))

test('Administrador consulta grupos sin alta manual ni grupos de otros semestres',async()=>{
 mockData();render(<SeccionesPage context={{...base,isAdmin:true,carreras:[]}} onChanged={vi.fn()}/> )
 await screen.findByText('GRUPO-A')
 expect(screen.queryByText('OTRO-PERIODO')).toBeNull()
 expect(screen.queryByRole('button',{name:'Nueva sección'})).toBeNull()
 expect(screen.getAllByRole('button',{name:'Editar'})).toHaveLength(2)
})
test('Coordinador puede editar y seleccionar solo sus carreras',async()=>{
 mockData();render(<SeccionesPage context={base} onChanged={vi.fn()}/> )
 await screen.findByText('GRUPO-A')
 expect(screen.getAllByRole('button',{name:'Editar'})).toHaveLength(1)
 fireEvent.click(screen.getByRole('button',{name:'Editar'}))
 expect(screen.getByLabelText('Carrera').options).toHaveLength(1)
})

test('Corregir un grupo envía PATCH y conserva las asignaturas y la matrícula recibidas',async()=>{
 mockData();render(<SeccionesPage context={base} onChanged={vi.fn()}/> )
 fireEvent.click(await screen.findByRole('button',{name:'Editar'}))
 expect(screen.getByLabelText('Cantidad de estudiantes').value).toBe('20')
 fireEvent.change(screen.getByLabelText('Código del grupo'),{target:{value:'GRUPO-A1'}})
 fireEvent.submit(screen.getByRole('button',{name:'Guardar grupo'}).closest('form'))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/secciones',expect.objectContaining({method:'PATCH',data:expect.objectContaining({id:1,codigo:'GRUPO-A1',cantidad_estudiantes:20,asignaturas:[1]})})))
 expect(mocks.api.mock.calls.some(([path,options])=>path==='/secciones'&&options?.method==='POST')).toBe(false)
})

test('Cambiar de semestre o perder permisos descarta la corrección abierta',async()=>{
 mockData();const view=render(<SeccionesPage context={base} onChanged={vi.fn()}/> )
 fireEvent.click(await screen.findByRole('button',{name:'Editar'}))
 view.rerender(<SeccionesPage context={{...base,activePeriod:{id_periodo:2,nombre:'Segundo'}}} onChanged={vi.fn()}/> )
 expect(screen.queryByRole('button',{name:'Guardar grupo'})).toBeNull()
 view.rerender(<SeccionesPage context={base} onChanged={vi.fn()}/> )
 fireEvent.click(await screen.findByRole('button',{name:'Editar'}))
 view.rerender(<SeccionesPage context={{...base,funciones:[],carreras:[],canManageSecciones:false}} onChanged={vi.fn()}/> )
 expect(screen.queryByRole('button',{name:'Guardar grupo'})).toBeNull()
 expect(mocks.api.mock.calls.some(([,options])=>options?.method==='PATCH')).toBe(false)
})

test('Grupos permite asignar el turno del semestre y no muestra configuraciones de otro',async()=>{
 mockData();const previous=mocks.api.getMockImplementation()
 mocks.api.mockImplementation(async(path,options)=>path==='/cuadriculas'?[{id_cuadricula:1,id_periodo:1,nombre:'Matutino CUR'},{id_cuadricula:2,id_periodo:2,nombre:'Otro semestre'}]:options?.method==='POST'?{id_seccion:1,id_cuadricula:1,version:1}:previous(path,options))
 render(<SeccionesPage context={base} onChanged={vi.fn()}/> )
 const select=await screen.findByLabelText('Bloques de GRUPO-A')
 expect(screen.queryByRole('option',{name:'Otro semestre'})).toBeNull()
 fireEvent.change(select,{target:{value:'1'}})
 fireEvent.click(screen.getByRole('button',{name:'Guardar GRUPO-A'}))
 await screen.findByText('Bloques asignados a GRUPO-A.')
 expect(mocks.api).toHaveBeenCalledWith('/grupos-turnos',{method:'POST',data:{id_seccion:1,id_cuadricula:1,version:0}})
})
test('Programación consulta solo grupos del semestre sin ofrecer alta manual',async()=>{
 mockData();render(<ProgramacionPage context={{...base,isAdmin:true,carreras:[]}}/> )
 await waitFor(()=>expect(screen.getByLabelText('Grupo a consultar:').options).toHaveLength(2))
 expect(screen.queryByRole('option',{name:/OTRO-PERIODO/})).toBeNull()
 expect(screen.queryByRole('button',{name:'Registrar Impartición'})).toBeNull()
 expect(mocks.api.mock.calls.every(([,options])=>!options?.method)).toBe(true)
})
test('Docente sin función no recibe controles de escritura en programación',async()=>{
 mockData();render(<ProgramacionPage context={{...base,funciones:[],carreras:[],canManageSecciones:false}} onChanged={vi.fn()}/> )
 await screen.findByRole('option',{name:/GRUPO-A/})
 expect(screen.queryByRole('button',{name:'Registrar Impartición'})).toBeNull()
})
test('Bloques devueltos por PostgreSQL se muestran con el filtro Lunes',async()=>{
 mocks.api.mockResolvedValue([{id_bloque:1,id_periodo:1,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:00:00',es_receso:false}])
 render(<BloquesPage context={{...base,canManageBloques:true}} onChanged={vi.fn()}/> )
 await screen.findByText('08:00')
 expect(screen.getByText('09:00')).toBeTruthy()
})

test('Bloques anteriores son solo consulta incluso para administradores',async()=>{
 mocks.api.mockResolvedValue([{id_bloque:1,id_periodo:1,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:00:00',es_receso:false}])
 render(<BloquesPage context={{...base,isAdmin:true,canManageBloques:true}}/> )
 await screen.findByText('08:00')
 expect(screen.queryByRole('button',{name:'Editar'})).toBeNull()
 expect(screen.queryByRole('button',{name:/Nuevo bloque/})).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Martes'}))
 expect(screen.queryByText('08:00')).toBeNull()
 expect(mocks.api.mock.calls.every(([,options])=>!options?.method)).toBe(true)
})

test('La consulta histórica respeta el semestre seleccionado',async()=>{
 mocks.api.mockResolvedValue([{id_bloque:1,id_periodo:1,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:00:00',es_receso:false}])
 const view=render(<BloquesPage context={base}/> )
 await screen.findByText('08:00')
 view.rerender(<BloquesPage context={{...base,activePeriod:{id_periodo:2,nombre:'Segundo'}}}/> )
 expect(screen.queryByText('08:00')).toBeNull()
})

test('Asignaturas restringe opciones a carreras coordinadas',async()=>{
 mockData();render(<AsignaturasPage context={base} canManage onChanged={vi.fn()}/> )
 await screen.findByText('Matemática')
 fireEvent.click(screen.getByRole('button',{name:'Editar Matemática'}))
 expect(screen.getByLabelText('Carrera').options).toHaveLength(1)
})

test('Filtra asignaturas combinando carrera, año y búsqueda',async()=>{
 mocks.api.mockImplementation(async path=>path==='/carreras'?careers:[...subjects,{...subjects[0],id_asignatura:2,id_carrera:2,ano_estudio:2,nombre:'Biología',codigo:'BIO',carrera_nombre:'Medicina'}])
 render(<AsignaturasPage context={{...base,isAdmin:true}} canManage onChanged={vi.fn()}/> )
 await screen.findByText('Biología')
 fireEvent.change(screen.getByLabelText('Filtrar por carrera'),{target:{value:'2'}})
 fireEvent.change(screen.getByLabelText('Filtrar por año'),{target:{value:'2'}})
 expect(screen.queryByText('Matemática')).toBeNull()
 expect(screen.getByText('Biología')).toBeTruthy()
 fireEvent.change(screen.getByLabelText('Buscar asignaturas'),{target:{value:'inexistente'}})
 expect(screen.getByText('No hay asignaturas que coincidan.')).toBeTruthy()
})

test('Consulta espacios por capacidad, tipo y recurso',async()=>{
 mocks.api.mockImplementation(async path=>({'/pabellones':[{id_pabellon:1,nombre:'Norte'}],'/recursos':[{id_recurso:1,nombre:'Proyector'}],'/aulas':[
  {id_aula:1,codigo:'LAB-40',tipo:'laboratorio',capacidad:40,recursos:[1],estado:'activo',pabellon_nombre:'Norte'},
  {id_aula:2,codigo:'AULA-20',tipo:'aula',capacidad:20,recursos:[],estado:'activo',pabellon_nombre:'Norte'}
 ]}[path]||[]))
 render(<EspaciosPage canManage onChanged={vi.fn()}/> )
 await screen.findByText('AULA-20')
 fireEvent.change(screen.getByLabelText('Capacidad mínima'),{target:{value:'30'}})
 fireEvent.change(screen.getByLabelText('Filtrar por tipo'),{target:{value:'laboratorio'}})
 fireEvent.change(screen.getByLabelText('Filtrar por recurso'),{target:{value:'1'}})
 expect(screen.queryByText('AULA-20')).toBeNull()
 expect(screen.getByText('LAB-40')).toBeTruthy()
 fireEvent.change(screen.getByLabelText('Capacidad mínima'),{target:{value:'50'}})
 expect(screen.getByText('No hay aulas que coincidan con los filtros.')).toBeTruthy()
})

test('Asignaturas corrige sin alta manual y descarta el formulario al perder su carrera',async()=>{
 mockData();const view=render(<AsignaturasPage context={base} canManage onChanged={vi.fn()}/> )
 fireEvent.click(await screen.findByRole('button',{name:'Editar Matemática'}))
 expect(screen.queryByRole('button',{name:'Nueva asignatura'})).toBeNull()
 fireEvent.change(screen.getByLabelText('Nombre de la asignatura'),{target:{value:'Matemática I'}})
 fireEvent.submit(screen.getByRole('button',{name:'Guardar asignatura'}).closest('form'))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/asignaturas',expect.objectContaining({method:'PATCH',data:expect.objectContaining({id:1,nombre:'Matemática I',horas_teoricas:2,horas_practicas:1})})))
 await screen.findByText('Asignatura actualizada.')
 fireEvent.click(screen.getByRole('button',{name:'Editar Matemática'}))
 view.rerender(<AsignaturasPage context={{...base,carreras:[2]}} canManage onChanged={vi.fn()}/> )
 expect(screen.queryByRole('button',{name:'Guardar asignatura'})).toBeNull()
 expect(mocks.api.mock.calls.some(([,options])=>options?.method==='POST')).toBe(false)
})
