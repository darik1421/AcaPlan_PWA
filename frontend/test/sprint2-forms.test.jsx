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

test('Administrador puede seleccionar carreras y crear sección; oculta otros períodos',async()=>{
 mockData();render(<SeccionesPage context={{...base,isAdmin:true,carreras:[]}} onChanged={vi.fn()}/> )
 await screen.findByText('GRUPO-A')
 expect(screen.queryByText('OTRO-PERIODO')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Nueva sección'}))
 expect(screen.getByLabelText('Carrera').options).toHaveLength(2)
})
test('Coordinador puede editar y seleccionar solo sus carreras',async()=>{
 mockData();render(<SeccionesPage context={base} onChanged={vi.fn()}/> )
 await screen.findByText('GRUPO-A')
 expect(screen.getAllByRole('button',{name:'Editar'})).toHaveLength(1)
 fireEvent.click(screen.getByRole('button',{name:'Nueva sección'}))
 expect(screen.getByLabelText('Carrera').options).toHaveLength(1)
})
test('Programación carga secciones del período para administrador y envía la asignación',async()=>{
 mockData();render(<ProgramacionPage context={{...base,isAdmin:true,carreras:[]}} onChanged={vi.fn()}/> )
 await waitFor(()=>expect(screen.getByLabelText('Sección a planificar:').options).toHaveLength(2))
 expect(screen.queryByRole('option',{name:/OTRO-PERIODO/})).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Registrar Impartición'}))
 fireEvent.change(screen.getByLabelText('Asignatura de la malla'),{target:{value:'1'}})
 fireEvent.change(screen.getByLabelText('Docente requerido'),{target:{value:'4'}})
 fireEvent.submit(screen.getByRole('button',{name:'Registrar',exact:true}).closest('form'))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/programacion',expect.objectContaining({method:'POST',data:expect.objectContaining({id_periodo:1,id_seccion:1,id_asignatura:1,id_docente:4})})))
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
test('Asignaturas restringe opciones a carreras coordinadas',async()=>{
 mockData();render(<AsignaturasPage context={base} canManage onChanged={vi.fn()}/> )
 await screen.findByText('Matemática')
 fireEvent.click(screen.getByRole('button',{name:'Nueva asignatura'}))
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
