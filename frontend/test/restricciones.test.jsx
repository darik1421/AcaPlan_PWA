import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import RestriccionesPanel from '../src/features/management/RestriccionesPanel'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const context={canManageDisponibilidad:true,activePeriod:{id_periodo:1}}
const docentes=[{id_docente:4,nombre:'Ana',origen:'historico',estado:'activo'}]
const row={origen:'historico',id_restriccion:1,id_docente:4,id_periodo:1,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:00:00',activa:true,version:1}

test('Un docente importado sin cuenta conserva su origen aunque coincida el número del registro anterior',async()=>{
 mocks.api.mockResolvedValue({version:2,docentes:[...docentes,{id_docente:4,origen:'academico',nombre:'Beatriz',estado:'activo'}],restricciones:[]})
 render(<RestriccionesPanel context={context}/> )
 await screen.findByText('No hay restricciones comunicadas en este semestre.')
 fireEvent.click(screen.getByRole('button',{name:'Registrar restricción'}))
 fireEvent.change(screen.getByLabelText('Docente de la restricción'),{target:{value:'academico:4'}})
 fireEvent.change(screen.getByLabelText('Desde'),{target:{value:'08:00'}})
 fireEvent.change(screen.getByLabelText('Hasta'),{target:{value:'09:00'}})
 fireEvent.submit(screen.getByRole('button',{name:'Guardar restricción'}).closest('form'))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/restricciones/unificadas',expect.objectContaining({data:expect.objectContaining({origen:'academico',id_docente:4})})))
})

test('Una base sin la migración muestra el límite de docentes importados y conserva la consulta anterior',async()=>{
 mocks.api.mockResolvedValue({version:1,docentes,restricciones:[row]})
 render(<RestriccionesPanel context={context}/> )
 await screen.findByText(/Falta aplicar en Supabase/)
 expect(screen.getByText('Ana')).toBeTruthy()
})
test('Coordinadores consultan sin controles de escritura y solo el semestre activo',async()=>{
 mocks.api.mockResolvedValue({version:2,docentes,restricciones:[row,{...row,id_restriccion:2,id_periodo:2,dia:'Martes'}]})
 render(<RestriccionesPanel context={{...context,canManageDisponibilidad:false}} docentes={docentes}/> )
 await screen.findByText('Lunes');expect(screen.queryByText('Martes')).toBeNull()
 expect(screen.queryByRole('button',{name:'Registrar restricción'})).toBeNull()
 expect(screen.queryByRole('button',{name:/Corregir restricción/})).toBeNull()
})
test('El jefe registra un intervalo no disponible y descarta la corrección al cambiar de semestre',async()=>{
 mocks.api.mockResolvedValue({version:2,docentes,restricciones:[]})
 const view=render(<RestriccionesPanel context={context} docentes={docentes}/> )
 await screen.findByText('No hay restricciones comunicadas en este semestre.')
 fireEvent.click(screen.getByRole('button',{name:'Registrar restricción'}))
 fireEvent.change(screen.getByLabelText('Docente de la restricción'),{target:{value:'historico:4'}})
 fireEvent.change(screen.getByLabelText('Desde'),{target:{value:'08:00'}})
 fireEvent.change(screen.getByLabelText('Hasta'),{target:{value:'09:00'}})
 fireEvent.submit(screen.getByRole('button',{name:'Guardar restricción'}).closest('form'))
 await waitFor(()=>expect(mocks.api).toHaveBeenCalledWith('/restricciones/unificadas',{method:'POST',data:{origen:'historico',id_docente:4,id_periodo:1,dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:00',activa:true}}))
 await screen.findByText('Restricción guardada.')
 fireEvent.click(screen.getByRole('button',{name:'Registrar restricción'}))
 view.rerender(<RestriccionesPanel context={{...context,activePeriod:{id_periodo:2}}} docentes={docentes}/> )
 expect(screen.queryByRole('button',{name:'Guardar restricción'})).toBeNull()
})
test('Retirar conserva versión e identidad; un fallo exige recargar y no anuncia éxito',async()=>{
 mocks.api.mockImplementation(async(path,options)=>{if(options?.method)throw new Error('Otro usuario modificó este registro.');return {version:2,docentes,restricciones:[row]}})
 render(<RestriccionesPanel context={context} docentes={docentes}/> )
 fireEvent.click(await screen.findByRole('button',{name:'Corregir restricción de Ana'}))
 fireEvent.change(screen.getByLabelText('Estado de la restricción'),{target:{value:'false'}})
 fireEvent.submit(screen.getByRole('button',{name:'Guardar restricción'}).closest('form'))
 await screen.findByRole('alert')
 expect(mocks.api).toHaveBeenCalledWith('/restricciones/unificadas',expect.objectContaining({data:expect.objectContaining({id:1,version:1,activa:false})}))
 expect(screen.getByRole('button',{name:'Guardar restricción'}).closest('fieldset').disabled).toBe(true)
 expect(screen.queryByText('Restricción guardada.')).toBeNull()
})
