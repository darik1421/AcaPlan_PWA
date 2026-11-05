import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,beforeEach,test,expect,vi} from 'vitest'
import GeneradorPage from '../src/features/management/GeneradorPage'
const mocks=vi.hoisted(()=>({api:vi.fn(),cycle:vi.fn()}))
vi.mock('../src/services/management',()=>({api:(path,options)=>path==='/borradores/estado'?mocks.cycle(path,options):mocks.api(path,options)}))
beforeEach(()=>mocks.cycle.mockResolvedValue({estado:'borrador',version:0,canPlan:true,historial:[]}))
afterEach(()=>{cleanup();mocks.api.mockReset();mocks.cycle.mockReset()})
const list={semestre_activo:true,borradores:[{id:8,nombre:'Primero',id_departamento:3,departamento:'Tecnología'},{id:9,nombre:'Segundo',id_departamento:1,departamento:'Economía'}]}
const result={huella:'a'.repeat(64),listo_para_guardar:true,mensaje:'Propuesta comprobada',estado:'propuesta',clases:[{id:-1,id_horario:'propuesta-1',id_seccion:'1:3',seccion_codigo:'Sistemas · Año 3',asignatura_nombre:'Web',docente_nombre:'Ana, Luis',id_asignacion:1,componente:'general',numero_sesion:1,id_aula:1,aula_codigo:'A1',dia:'Domingo',hora_inicio:'08:00',hora_fin:'09:30'}],revision:{conflictos:[],pendientes:[],completo:true},estadisticas:{sesionesColocadas:1,totalSesiones:1,sesionesFijadasPreservadas:0,huecosEstudiantilesEvitados:0,tiempoCalculoMs:8},pendientes:[]}
async function select(){fireEvent.change(await screen.findByLabelText('Borrador del departamento'),{target:{value:'8'}});await waitFor(()=>expect(screen.queryByText('Comprobando estado del borrador…')).toBeNull())}

test('La carga inicial no muestra un semestre inexistente ni una configuración incompleta',async()=>{
 let finish
 mocks.api.mockImplementation(()=>new Promise(resolve=>{finish=resolve}))
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1}/>)
 expect(screen.getByRole('status').textContent).toBe('Preparando generador…')
 expect(screen.queryByText('Sin semestre activo')).toBeNull()
 expect(screen.queryByLabelText('Borrador del departamento')).toBeNull()
 finish({...list,departamentos:[{id:3,nombre:'Tecnología'}]})
 await screen.findByLabelText('Departamento para generar')
 expect(screen.getByText('Semestre activo')).toBeTruthy()
 expect(screen.getByLabelText('Borrador del departamento')).toBeTruthy()
 expect(screen.queryByText('Preparando generador…')).toBeNull()
})

test('Consulta el catálogo de borradores actual y envía el borrador seleccionado, sin rutas antiguas',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/consultar'?list:result)
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1}/>);await select()
 fireEvent.click(screen.getByRole('button',{name:'Generar Horario con IA'}))
 expect(await screen.findByText('Web')).toBeTruthy();expect(screen.getByText('Ana, Luis')).toBeTruthy()
 expect(screen.getByText('Completa y comprobada')).toBeTruthy();expect(screen.queryByText('100% Óptimo')).toBeNull()
 expect(mocks.api.mock.calls.map(c=>c[0])).toEqual(['/borradores/consultar','/generador/proponer'])
 expect(mocks.api.mock.calls[1][1].data).toEqual({id:8,lockedDays:[],modoProfundo:true})
})
test('Guarda todas las clases en el borrador, no un contenedor vacío',async()=>{
 const navigate=vi.fn()
 mocks.api.mockImplementation(async path=>path==='/borradores/consultar'?list:path==='/generador/proponer'?result:{guardado:true,id:8,clases:1})
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1} onNavigateToDrafts={navigate}/>);await select()
 fireEvent.click(screen.getByRole('button',{name:'Generar Horario con IA'}))
 fireEvent.click(await screen.findByRole('button',{name:'Guardar propuesta en el borrador'}))
 fireEvent.click(screen.getByRole('button',{name:'Confirmar guardado'}))
 await waitFor(()=>expect(navigate).toHaveBeenCalledWith(8))
 expect(mocks.api.mock.calls.find(c=>c[0]==='/generador/guardar')[1].data).toEqual({id:8,huella:result.huella,clases:[{id:-1,id_asignacion:1,componente:'general',id_aula:1,dia:'Domingo',hora_inicio:'08:00',hora_fin:'09:30'}]})
 expect(mocks.api.mock.calls.some(c=>c[0]==='/borradores')).toBe(false)
})
test('Una propuesta parcial muestra sus problemas y no permite guardar',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/consultar'?list:{...result,listo_para_guardar:false,revision:{conflictos:[{motivo:'Cruce de docente'}],pendientes:[{mensaje:'Falta una sesión'}]}})
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1}/>);await select()
 fireEvent.click(screen.getByRole('button',{name:'Generar Horario con IA'}))
 expect(await screen.findByText('Cruce de docente')).toBeTruthy();expect(screen.getByText('Falta una sesión')).toBeTruthy()
 expect(screen.queryByRole('button',{name:'Guardar propuesta en el borrador'})).toBeNull()
})
test('Cambiar de borrador elimina la propuesta y un fallo de lectura permite reintentar',async()=>{
 mocks.api.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce(list).mockResolvedValueOnce(result)
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Volver a consultar borradores'}))
 await waitFor(()=>expect(screen.getByRole('option',{name:'Tecnología · Primero'})).toBeTruthy());await select()
 fireEvent.click(screen.getByRole('button',{name:'Generar Horario con IA'}));await screen.findByText('Web')
 fireEvent.change(screen.getByLabelText('Borrador del departamento'),{target:{value:'9'}})
 expect(screen.queryByText('Web')).toBeNull();expect(screen.queryByRole('button',{name:'Guardar propuesta en el borrador'})).toBeNull()
})
test('Una respuesta de cálculo de otro semestre no reaparece',async()=>{
 let resolve
 mocks.api.mockImplementation(path=>path==='/borradores/consultar'?Promise.resolve(list):new Promise(r=>{resolve=r}))
 const view=render(<GeneradorPage context={{canManageBloques:true}} periodId={1}/>);await select()
 fireEvent.click(screen.getByRole('button',{name:'Generar Horario con IA'}))
 view.rerender(<GeneradorPage context={{canManageBloques:true}} periodId={2}/>);resolve(result)
 await waitFor(()=>expect(screen.getByRole('button',{name:'Generar Horario con IA'}).disabled).toBe(true));expect(screen.queryByText('Web')).toBeNull()
})

test('Explorar alternativas envía posiciones anteriores sin tratarlas como fijadas',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/consultar'?list:result)
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1}/>);await select()
 fireEvent.click(screen.getByRole('button',{name:'Generar Horario con IA'}));await screen.findByText('Web')
 fireEvent.click(screen.getByRole('button',{name:'Explorar alternativas'}))
 await waitFor(()=>expect(mocks.api.mock.calls.filter(c=>c[0]==='/generador/proponer').length).toBe(2))
 expect(mocks.api.mock.calls.at(-1)[1].data.previas).toEqual([{id_asignacion:1,componente:'general',numero_sesion:1,dia:'Domingo',hora_inicio:'08:00',hora_fin:'09:30'}])
})


test('El primer horario se genera por departamento sin crear manualmente un borrador',async()=>{
 const current={...list,departamentos:[{id:3,nombre:'Ciencias, Tecnología y Salud'}],carreras:[{id_carrera:1,id_departamento:3},{id_carrera:2,id_departamento:1}]}
 mocks.api.mockImplementation(async path=>path==='/borradores/consultar'?current:path==='/borradores'?{id:10}:path==='/generador/proponer'?result:{guardado:true,id:10,clases:1})
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1}/>)
 fireEvent.change(await screen.findByLabelText('Departamento para generar'),{target:{value:'3'}})
 fireEvent.click(screen.getByRole('button',{name:'Generar Horario con IA'}))
 expect(await screen.findByText(/Primer borrador generado y guardado/)).toBeTruthy()
 expect(mocks.api.mock.calls.find(c=>c[0]==='/borradores')[1].data).toEqual({id_periodo:1,id_departamento:3,carreras:[1],nombre:'Borrador · Ciencias, Tecnología y Salud'})
 expect(mocks.api.mock.calls.map(c=>c[0])).toEqual(['/borradores/consultar','/borradores','/generador/proponer','/generador/guardar'])
 expect(screen.getByRole('button',{name:'Revisar borrador generado'})).toBeTruthy()
})

test('Una primera generación incompleta no se guarda como horario completo',async()=>{
 const current={...list,departamentos:[{id:3,nombre:'Salud'}],carreras:[{id_carrera:1,id_departamento:3}]}
 mocks.api.mockImplementation(async path=>path==='/borradores/consultar'?current:path==='/borradores'?{id:10}:{...result,listo_para_guardar:false})
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1}/>)
 fireEvent.change(await screen.findByLabelText('Departamento para generar'),{target:{value:'3'}})
 fireEvent.click(screen.getByRole('button',{name:'Generar Horario con IA'}))
 await screen.findByText('Comprobación de la propuesta')
 expect(mocks.api.mock.calls.some(c=>c[0]==='/generador/guardar')).toBe(false)
 expect(screen.queryByText(/Primer borrador generado y guardado/)).toBeNull()
})


test('Un nuevo horario no reutiliza el nombre de un borrador anterior',async()=>{
 const current={...list,borradores:[{id:8,nombre:'Borrador · Salud',id_departamento:3}],departamentos:[{id:3,nombre:'Salud'}],carreras:[{id_carrera:1,id_departamento:3}]}
 mocks.api.mockImplementation(async path=>path==='/borradores/consultar'?current:path==='/borradores'?{id:10}:path==='/generador/proponer'?result:{guardado:true,id:10,clases:1})
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1}/>)
 fireEvent.change(await screen.findByLabelText('Departamento para generar'),{target:{value:'3'}})
 fireEvent.click(screen.getByRole('button',{name:'Generar Horario con IA'}))
 await screen.findByText(/Primer borrador generado y guardado/)
 expect(mocks.api.mock.calls.find(c=>c[0]==='/borradores')[1].data.nombre).toBe('Borrador · Salud (2)')
})

test('Desde restricciones recupera el borrador solicitado y permite revisar sus restricciones',async()=>{
 mocks.api.mockResolvedValue(list)
 const navigate=vi.fn()
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1} initialDraftId={9} onNavigateToRestrictions={navigate}/>)
 const select=await screen.findByLabelText('Borrador del departamento')
 expect(select.value).toBe('9')
 fireEvent.click(screen.getByRole('button',{name:'Revisar restricciones antes de generar'}))
 expect(navigate).toHaveBeenCalledWith(9)
 expect(mocks.api.mock.calls.map(c=>c[0])).toEqual(['/borradores/consultar'])
})

test('No recupera un borrador que no pertenece al catálogo del semestre',async()=>{
 mocks.api.mockResolvedValue(list)
 render(<GeneradorPage context={{canManageBloques:true}} periodId={2} initialDraftId={100}/>)
 expect((await screen.findByLabelText('Borrador del departamento')).value).toBe('')
 expect(screen.getByRole('button',{name:'Generar Horario con IA'}).disabled).toBe(true)
})

test('Conservar días solo se habilita al continuar un borrador y comunica su selección',async()=>{
 mocks.api.mockResolvedValue(list)
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1}/>)
 await screen.findByLabelText('Borrador del departamento')
 const monday=screen.getByRole('button',{name:'Lunes',exact:true})
 expect(monday.disabled).toBe(true)
 await select()
 expect(monday.disabled).toBe(false)
 fireEvent.click(monday)
 expect(monday.getAttribute('aria-pressed')).toBe('true')
 fireEvent.change(screen.getByLabelText('Borrador del departamento'),{target:{value:''}})
 expect(monday.disabled).toBe(true)
 expect(monday.getAttribute('aria-pressed')).toBe('false')
})

test.each(['aprobado','publicado'])('No regenera directamente un horario %s y ofrece una nueva versión',async estado=>{
 mocks.api.mockResolvedValue({...list,borradores:list.borradores.map(d=>({...d,revision:4}))})
 mocks.cycle.mockResolvedValue({estado,version:3,canPlan:true})
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1} initialDraftId={8}/>)
 await screen.findByRole('button',{name:'Crear nueva versión'})
 expect(screen.getByRole('button',{name:'Generar Horario con IA'}).disabled).toBe(true)
 expect(screen.getByRole('button',{name:'Lunes',exact:true}).disabled).toBe(true)
 expect(mocks.api.mock.calls.some(([path])=>path==='/generador/proponer')).toBe(false)
})

test('Si no puede comprobar el estado, bloquea la generación y permite consultar de nuevo',async()=>{
 mocks.api.mockResolvedValue(list)
 mocks.cycle.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValue({estado:'borrador',version:1})
 render(<GeneradorPage context={{canManageBloques:true}} periodId={1} initialDraftId={8}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Consultar estado nuevamente'}))
 await waitFor(()=>expect(screen.getByRole('button',{name:'Generar Horario con IA'}).disabled).toBe(false))
})
