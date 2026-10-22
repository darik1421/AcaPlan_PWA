import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import DatosAnos from '../src/features/management/DatosAnos'
import AsignaturasImportadas from '../src/features/management/AsignaturasImportadas'
import PreparacionExcel from '../src/features/management/PreparacionExcel'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const row={id_periodo:1,id_carrera:1,carrera:'Sistemas',ano_estudio:3,turno:'matutino',cantidad_estudiantes:null,sede:null,revision:0}
test('Los años vienen de la entrega; los datos desconocidos se guardan como pendientes, sin otro Excel',async()=>{
 mocks.api.mockResolvedValue([row]);render(<DatosAnos periodId={1}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Completar Sistemas · Año 3'}))
 fireEvent.change(screen.getByLabelText('Cantidad de estudiantes'),{target:{value:'30'}})
 fireEvent.click(screen.getByRole('button',{name:'Guardar datos del año'}))
 await screen.findByText('Datos del año guardados.')
 expect(mocks.api).toHaveBeenCalledWith('/asignacion-academica/anos',{method:'PATCH',data:{id_periodo:1,id_carrera:1,ano_estudio:3,revision:0,cantidad_estudiantes:30,sede:null}})
 expect(document.querySelector('input[type=file]')).toBeNull()
})
test('Una respuesta de guardado del semestre anterior no cambia el semestre nuevo',async()=>{
 let finish;mocks.api.mockImplementation(async(path,options)=>options?.method==='PATCH'?new Promise(r=>{finish=r}):[row])
 const view=render(<DatosAnos periodId={1}/>);fireEvent.click(await screen.findByRole('button',{name:'Completar Sistemas · Año 3'}));fireEvent.click(screen.getByRole('button',{name:'Guardar datos del año'}))
 await waitFor(()=>expect(finish).toBeTruthy());view.rerender(<DatosAnos periodId={2}/>);finish({guardado:true})
 await screen.findByText('Los años aparecerán al confirmar la entrega académica.');expect(screen.queryByText('Datos del año guardados.')).toBeNull()
})
test('Asignaturas permite corregir nombres únicamente dentro de la carrera autorizada',async()=>{
 const subject={id:2,id_carrera:1,codigo:'WEB',nombre:'Web',carrera:'Sistemas',ano_estudio:3,huella:'a'.repeat(32)}
 mocks.api.mockResolvedValue([subject,{...subject,id:3,id_carrera:2,codigo:'BIO'}])
 render(<AsignaturasImportadas context={{carreras:[1]}} canManage/>);
 fireEvent.click(await screen.findByRole('button',{name:'Corregir nombre de WEB'}));expect(screen.queryByRole('button',{name:'Corregir nombre de BIO'})).toBeNull()
 fireEvent.change(screen.getByLabelText('Nombre de asignatura importada'),{target:{value:'Desarrollo web'}});fireEvent.click(screen.getByRole('button',{name:'Guardar nombre'}))
 await screen.findByText('Nombre de asignatura corregido.')
 expect(mocks.api).toHaveBeenCalledWith('/asignaturas/importadas',{method:'PATCH',data:{id:2,nombre:'Desarrollo web',huella:subject.huella}})
})
test('Inventario exige confirmación expresa y recarga el catálogo después de guardar',async()=>{
 mocks.api.mockResolvedValueOnce({semestre:1,filas:[{fila:2,codigo:'B4',accion:'Crear'}],columnas:['codigo','accion'],errores:[],avisos:[],valido:true,huella:'b'.repeat(32)}).mockResolvedValueOnce({guardado:true})
 const onConfirmed=vi.fn();render(<PreparacionExcel tipo="espacios" periodId={1} onConfirmed={onConfirmed}/>)
 const file=new File(['xlsx'],'inventario.xlsx');file.arrayBuffer=async()=>new Uint8Array([1,2,3]).buffer
 fireEvent.change(screen.getByLabelText('Seleccionar Excel de inventario de espacios'),{target:{files:[file]}})
 const button=await screen.findByRole('button',{name:'Confirmar y guardar inventario'});expect(button.disabled).toBe(true)
 fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(button)
 await screen.findByText('Inventario guardado. Se conservaron los espacios y recursos anteriores.');expect(onConfirmed).toHaveBeenCalledTimes(1)
 expect(mocks.api).toHaveBeenCalledWith('/preparacion/confirmar',{method:'POST',data:{tipo:'espacios',id_periodo:1,base64:'AQID',huella:'b'.repeat(32)}})
})

test('Una consulta fallida no se presenta como ausencia de años o asignaturas',async()=>{
 mocks.api.mockRejectedValue(new Error('Consulta no disponible'))
 const view=render(<DatosAnos periodId={1}/>);await screen.findByRole('alert')
 expect(screen.queryByText('Los años aparecerán al confirmar la entrega académica.')).toBeNull()
 view.unmount();render(<AsignaturasImportadas context={{isAdmin:true}} canManage/>);await screen.findByRole('alert')
 expect(screen.queryByText('No hay asignaturas importadas.')).toBeNull()
})
