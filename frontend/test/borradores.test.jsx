import {cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import BorradoresPage from '../src/features/management/BorradoresPage'
import ComponentesAsignacion from '../src/features/management/ComponentesAsignacion'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const detail={borrador:{id:1,nombre:'Propuesta uno',revision:4},semestre_activo:true,clases:[{id:5,id_asignacion:2,componente:'general',id_aula:3,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:30:00',fijada:true}],asignaciones:[{id:2,carrera:'Sistemas',ano_estudio:3,nombre:'Web',codigo:'WEB'}],espacios:[{id_aula:3,codigo:'A1',estado:'activo',sede:'CUR'}],movimientos:[]}
const list={borradores:[{id:1,nombre:'Propuesta uno'}],carreras:[{id_carrera:1,nombre:'Sistemas'}],semestre_activo:true}

test('Al cambiar el departamento del borrador se retiran las carreras de la selección anterior',async()=>{
 const grouped={...list,departmentDraftVersion:1,departamentos:[{id:1,nombre:'Económicas'},{id:3,nombre:'Tecnología'}],carreras:[{id_carrera:1,id_departamento:1,nombre:'Economía'},{id_carrera:2,id_departamento:3,nombre:'Sistemas'}]}
 mocks.api.mockImplementation(async path=>path==='/borradores/consultar'?grouped:detail)
 render(<BorradoresPage canPlan periodId={1}/> )
 fireEvent.click(await screen.findByText('Crear un borrador'))
 const department=await screen.findByLabelText('Departamento del borrador')
 fireEvent.change(department,{target:{value:'1'}});fireEvent.click(screen.getByLabelText('Economía'))
 fireEvent.change(department,{target:{value:'3'}})
 expect(screen.queryByLabelText('Economía')).toBeNull()
 expect(screen.getByLabelText('Sistemas').checked).toBe(false)
 expect(screen.getByRole('button',{name:'Crear borrador'}).disabled).toBe(true)
})

test('Aprobación revisa la propuesta sin controles para crear ni modificar clases',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/estado'?{estado:'en_revision',version:1,historial:[],canApprove:true,canPlan:false}:path==='/borradores/consultar'?list:detail)
 render(<BorradoresPage periodId={1}/>);
 fireEvent.change(await screen.findByLabelText('Borrador'),{target:{value:'1'}})
 await screen.findByRole('button',{name:'Revisar borrador'})
 expect(screen.queryByText('Crear un borrador')).toBeNull()
 expect(screen.queryByRole('group',{name:'Añadir una clase al borrador'})).toBeNull()
 expect(screen.queryByRole('button',{name:'Editar clase 5'})).toBeNull()
 expect(screen.queryByRole('button',{name:'Retirar clase 5'})).toBeNull()
 expect(screen.queryByRole('button',{name:'Editar sesión 5'})).toBeNull()
 expect(await screen.findByRole('button',{name:'Aprobar borrador'})).toBeTruthy()
})
test('Una clase fijada necesita motivo y autorización ligada al cambio',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/estado'?{estado:'borrador',version:0,historial:[]}:path==='/borradores/consultar'?list:detail)
 render(<BorradoresPage canPlan periodId={1}/>);fireEvent.change(await screen.findByLabelText('Borrador'),{target:{value:'1'}})
 fireEvent.click(await screen.findByRole('button',{name:'Editar clase 5'}))
 fireEvent.change(screen.getByLabelText('Día'),{target:{value:'Martes'}})
 const button=screen.getByRole('button',{name:'Confirmar clase'});expect(button.disabled).toBe(true)
 fireEvent.change(screen.getByLabelText('Motivo de la autorización'),{target:{value:'Ajuste autorizado'}})
 fireEvent.click(screen.getByLabelText('Autorizo este cambio de la clase fijada.'));expect(button.disabled).toBe(false)
 fireEvent.change(screen.getByLabelText('Día'),{target:{value:'Jueves'}});expect(button.disabled).toBe(true)
 fireEvent.click(screen.getByLabelText('Autorizo este cambio de la clase fijada.'));fireEvent.click(button)
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/borradores/clase',expect.objectContaining({data:expect.objectContaining({id:1,revision:4,id_clase:5,dia:'Jueves',autorizar:true,motivo:'Ajuste autorizado'})})))
})
test('Consultar o editar invalida el resultado anterior y no publica',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/estado'?{estado:'borrador',version:0,historial:[]}:path==='/borradores/consultar'?list:path==='/borradores/revisar'?{completo:true,aviso:'No publica ni aprueba',conflictos:[],pendientes:[]}:detail)
 render(<BorradoresPage canPlan periodId={1}/>);fireEvent.change(await screen.findByLabelText('Borrador'),{target:{value:'1'}})
 fireEvent.click(await screen.findByRole('button',{name:'Revisar borrador'}));await screen.findByText('Sin conflictos ni pendientes detectados')
 fireEvent.click(await screen.findByRole('button',{name:'Editar clase 5'}));expect(screen.queryByLabelText('Resultado de revisión')).toBeNull()
 expect(mocks.api.mock.calls.some(([path])=>path.includes('publicar'))).toBe(false)
})
test('Distribuye docentes existentes entre dos sesiones sin crear identidades',async()=>{
 mocks.api.mockResolvedValue({asignacion:{asignatura:'Web',revision:2,turno:'matutino',docentes:[1,2]},disponibles:[{id:1,nombre:'Ana'},{id:2,nombre:'Luis'}],componentes:null,vigente:true})
 const saved=vi.fn();render(<ComponentesAsignacion id={3} periodId={1} onClose={vi.fn()} onSaved={saved}/>)
 fireEvent.change(await screen.findByLabelText('Distribución'),{target:{value:'separada'}})
 fireEvent.click(within(screen.getByRole('group',{name:'Teoría'})).getByLabelText('Ana'));fireEvent.click(within(screen.getByRole('group',{name:'Práctica'})).getByLabelText('Luis'))
 fireEvent.click(screen.getByRole('button',{name:'Guardar distribución'}));await waitFor(()=>expect(saved).toHaveBeenCalled())
 expect(mocks.api).toHaveBeenLastCalledWith('/asignacion-academica/componentes',{method:'PATCH',data:{id:3,id_periodo:1,revision:2,componentes:[{tipo:'teoria',docentes:[1],sesiones:1},{tipo:'practica',docentes:[2],sesiones:1}]}})
})

test('Después de fijar una clase vuelve a edición nueva sin conservar la operación anterior',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/estado'?{estado:'borrador',version:0,historial:[]}:path==='/borradores/consultar'?list:detail)
 render(<BorradoresPage canPlan periodId={1}/>);fireEvent.change(await screen.findByLabelText('Borrador'),{target:{value:'1'}})
 fireEvent.click(await screen.findByRole('button',{name:'Desfijar clase 5'}))
 fireEvent.change(screen.getByLabelText('Motivo de la autorización'),{target:{value:'Corrección autorizada'}})
 fireEvent.click(screen.getByLabelText('Autorizo este cambio de la clase fijada.'));fireEvent.click(screen.getByRole('button',{name:'Confirmar estado'}))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/borradores/fijar',expect.objectContaining({data:expect.objectContaining({id:1,id_clase:5,revision:4,fijada:false,autorizar:true})})))
 await waitFor(async () => {
   fireEvent.click(await screen.findByRole('button',{name:'Añadir clase al borrador'}))
   await screen.findByRole('group',{name:'Añadir una clase al borrador'})
 }, { timeout: 4000 })
 expect(screen.getByLabelText('Asignatura de la propuesta').value).toBe('')
 expect(screen.queryByLabelText('Motivo de la autorización')).toBeNull()
})
test('El conflicto identifica la clase y abre corrección conservando su protección',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/estado'?{estado:'borrador',version:0,historial:[]}:path==='/borradores/consultar'?list:path==='/borradores/revisar'?{revision:4,completo:false,aviso:'Sin aprobar',conflictos:[{codigo:'CRUCE_DOCENTE',motivo:'Docente ocupado',clases:[5]}],pendientes:[]}:detail)
 render(<BorradoresPage canPlan periodId={1}/>);fireEvent.change(await screen.findByLabelText('Borrador'),{target:{value:'1'}})
 fireEvent.click(await screen.findByRole('button',{name:'Revisar borrador'}))
 await screen.findByText('Sistemas · Año 3 · Web · Lunes 08:00–09:30 · A1')
 expect(mocks.api).toHaveBeenCalledWith('/borradores/revisar',{method:'POST',data:{id:1,revision:4}})
 fireEvent.click(screen.getByRole('button',{name:'Corregir clase 5'}))
 expect(screen.getByRole('button',{name:'Confirmar clase'}).disabled).toBe(true)
 expect(screen.queryByLabelText('Resultado de revisión')).toBeNull()
})


test('Al retirar planificación se descartan la edición y la autorización de una clase fijada',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/estado'?{estado:'borrador',version:0,historial:[],canPlan:false}:path==='/borradores/consultar'?list:detail)
 const view=render(<BorradoresPage canPlan periodId={1}/>)
 fireEvent.change(await screen.findByLabelText('Borrador'),{target:{value:'1'}})
 fireEvent.click(await screen.findByRole('button',{name:'Editar clase 5'}))
 fireEvent.change(screen.getByLabelText('Motivo de la autorización'),{target:{value:'Cambio antes de retirar permisos'}})
 fireEvent.click(screen.getByLabelText('Autorizo este cambio de la clase fijada.'))
 view.rerender(<BorradoresPage canPlan={false} periodId={1}/>)
 await screen.findByRole('button',{name:'Revisar borrador'})
 expect(screen.queryByRole('button',{name:'Confirmar clase'})).toBeNull()
 view.rerender(<BorradoresPage canPlan periodId={1}/>)
 await waitFor(async () => {
   fireEvent.click(await screen.findByRole('button',{name:'Añadir clase al borrador'}))
   await screen.findByRole('group',{name:'Añadir una clase al borrador'})
 }, { timeout: 4000 })
 expect(screen.queryByLabelText('Motivo de la autorización')).toBeNull()
 expect(mocks.api.mock.calls.some(([path])=>path==='/borradores/clase')).toBe(false)
})


test('Un borrador recibido desde el generador se abre directamente sin otra selección',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/estado'?{estado:'borrador',version:0,historial:[]}:path==='/borradores/consultar'?list:detail)
 render(<BorradoresPage periodId={1} canPlan initialDraftId={1}/>)
 await screen.findByRole('button',{name:'Editar clase 5'})
 expect(screen.getByLabelText('Borrador').value).toBe('1')
 expect(mocks.api).toHaveBeenCalledWith('/borradores/detalle',expect.objectContaining({data:{id:1}}))
})

test('Los accesos de restricciones y regeneración conservan el borrador sin escribir datos',async()=>{
 mocks.api.mockImplementation(async path=>path==='/borradores/estado'?{estado:'borrador',version:0,historial:[]}:path==='/borradores/consultar'?list:detail)
 const restrictions=vi.fn(), regenerate=vi.fn()
 render(<BorradoresPage periodId={1} canPlan initialDraftId={1} onNavigateToRestrictions={restrictions} onRegenerate={regenerate}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Revisar o registrar restricciones'}))
 expect(restrictions).toHaveBeenCalledWith(1)
 await waitFor(()=>expect(screen.getByRole('button',{name:'Volver a generar este borrador'}).disabled).toBe(false))
 fireEvent.click(screen.getByRole('button',{name:'Volver a generar este borrador'}))
 expect(regenerate).toHaveBeenCalledWith(1)
 expect(mocks.api.mock.calls.every(([path])=>['/borradores/consultar','/borradores/detalle','/borradores/estado'].includes(path))).toBe(true)
})
