import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import PreparacionExcel from '../src/features/management/PreparacionExcel'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const result={semestre:1,filas:[{fila:2,carrera_id:'1'}],columnas:['carrera_id'],errores:[],avisos:['No guardado'],valido:true}
test('Los errores ubican la hoja, fila y campo y bloquean la confirmación',async()=>{
 mocks.api.mockResolvedValue({...result,valido:false,errores:[{hoja:'Otra hoja',fila:3,campo:'turno',motivo:'Turnos incompatibles.'}]})
 render(<PreparacionExcel tipo="asignaciones" periodId={1}/>)
 fireEvent.change(screen.getByLabelText('Seleccionar Excel de asignación académica'),{target:{files:[file()]}})
 const table=await screen.findByRole('table',{name:'Errores del archivo'})
 expect(table.textContent).toContain('Otra hoja')
 expect(table.textContent).toContain('Turnos incompatibles.')
 expect(screen.queryByRole('button',{name:'Confirmar y guardar asignación'})).toBeNull()
 expect(mocks.api).toHaveBeenCalledTimes(1)
})
function file(){const f=new File(['xlsx'],'datos.xlsx');f.arrayBuffer=async()=>new Uint8Array([1,2,3]).buffer;return f}
test('Seleccionar Excel muestra vista previa y nunca envía confirmación de escritura',async()=>{
 mocks.api.mockResolvedValue(result)
 render(<PreparacionExcel tipo="espacios" periodId={1}/>)
 fireEvent.change(screen.getByLabelText('Seleccionar Excel de inventario de espacios'),{target:{files:[file()]}})
 await screen.findByText(/La revisión preliminar pasó/)
 expect(screen.getByRole('table',{name:'Vista previa de datos recibidos'})).toBeTruthy()
 expect(mocks.api).toHaveBeenCalledTimes(1)
 expect(mocks.api).toHaveBeenCalledWith('/preparacion/revisar',{method:'POST',data:{tipo:'espacios',base64:'AQID',id_periodo:1}})
 expect(screen.queryByRole('button',{name:/Confirmar/})).toBeNull()
})
test('Una respuesta del semestre anterior no se muestra en el nuevo',async()=>{
 let resolve;mocks.api.mockImplementation(()=>new Promise(r=>{resolve=r}))
 const view=render(<PreparacionExcel tipo="espacios" periodId={1}/>)
 fireEvent.change(screen.getByLabelText('Seleccionar Excel de inventario de espacios'),{target:{files:[file()]}})
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledTimes(1))
 view.rerender(<PreparacionExcel tipo="espacios" periodId={2}/>)
 resolve(result)
 await waitFor(()=>expect(screen.queryByText(/La revisión preliminar pasó/)).toBeNull())
 expect(screen.queryByRole('table')).toBeNull()
})
test('Archivo incorrecto y ausencia de semestre impiden revisión',async()=>{
 const view=render(<PreparacionExcel tipo="espacios" periodId={1}/>)
 fireEvent.change(screen.getByLabelText('Seleccionar Excel de inventario de espacios'),{target:{files:[new File(['x'],'archivo.csv')]}})
 await screen.findByRole('alert')
 expect(mocks.api).not.toHaveBeenCalled()
 view.rerender(<PreparacionExcel tipo="espacios"/>)
 expect(screen.getByLabelText('Seleccionar Excel de inventario de espacios').disabled).toBe(true)
})

test('La confirmación exige revisión expresa y envía el archivo con su huella',async()=>{
 const ready={...result,huella:'a'.repeat(32)}
 mocks.api.mockResolvedValueOnce(ready).mockResolvedValueOnce({guardado:true})
 const onConfirmed=vi.fn()
 render(<PreparacionExcel tipo="asignaciones" periodId={1} onConfirmed={onConfirmed}/>)
 fireEvent.change(screen.getByLabelText('Seleccionar Excel de asignación académica'),{target:{files:[file()]}})
 const save=await screen.findByRole('button',{name:'Confirmar y guardar asignación'})
 expect(save.disabled).toBe(true)
 fireEvent.click(screen.getByRole('checkbox'))
 fireEvent.click(save)
 await screen.findByText('Asignación académica guardada. No se crearon cuentas de acceso.')
 expect(mocks.api).toHaveBeenCalledWith('/preparacion/confirmar',{method:'POST',data:{tipo:'asignaciones',base64:'AQID',id_periodo:1,huella:ready.huella}})
 expect(onConfirmed).toHaveBeenCalledTimes(1)
})

test('Una confirmación incierta obliga a revisar de nuevo y no permite repetir ciegamente',async()=>{
 mocks.api.mockResolvedValueOnce({...result,huella:'a'.repeat(32)}).mockRejectedValueOnce(new Error('No se pudo confirmar'))
 render(<PreparacionExcel tipo="asignaciones" periodId={1}/>)
 fireEvent.change(screen.getByLabelText('Seleccionar Excel de asignación académica'),{target:{files:[file()]}})
 fireEvent.click(await screen.findByRole('checkbox'))
 fireEvent.click(screen.getByRole('button',{name:'Confirmar y guardar asignación'}))
 await screen.findByRole('alert')
 expect(screen.queryByRole('button',{name:'Confirmar y guardar asignación'})).toBeNull()
})
