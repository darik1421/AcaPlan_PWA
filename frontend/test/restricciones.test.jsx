import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import RestriccionesPanel from '../src/features/management/RestriccionesPanel'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
const context={canManageDisponibilidad:true,activePeriod:{id_periodo:1}}
const docentes=[{id_docente:4,nombre:'Ana',origen:'historico',estado:'activo'}]
const row={origen:'historico',id_restriccion:1,id_docente:4,id_periodo:1,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:00:00',activa:true,version:1}

test('Una restricción compartida de otro departamento se consulta con la edición deshabilitada',async()=>{
 mocks.api.mockResolvedValue({version:2,docentes,restricciones:[{...row,editable:false}]})
 render(<RestriccionesPanel context={context}/> )
 await screen.findByText('Lunes')
 const edit=screen.getByRole('button',{name:/Corregir restricción/})
 expect(edit.disabled).toBe(true)
 fireEvent.click(edit)
 expect(screen.queryByRole('button',{name:'Guardar restricción'})).toBeNull()
})

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

test('Después de guardar se puede registrar otra restricción sin volver a entrar a la pantalla',async()=>{
 mocks.api.mockImplementation(async(_,options)=>options?.method==='POST'?{guardado:true}:{version:2,docentes,restricciones:[row]})
 render(<RestriccionesPanel context={context}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Corregir restricción de Ana'}))
 fireEvent.submit(screen.getByRole('button',{name:'Guardar restricción'}).closest('form'))
 await screen.findByText('Restricción guardada.')
 await waitFor(()=>expect(screen.getByRole('button',{name:'Registrar restricción'}).disabled).toBe(false))
 fireEvent.click(screen.getByRole('button',{name:'Registrar restricción'}))
 expect(screen.getByLabelText('Docente de la restricción').value).toBe('')
 expect(screen.getByRole('button',{name:'Guardar restricción'}).closest('fieldset').disabled).toBe(false)
})

test('Si el guardado termina pero falla la recarga, permite recuperar la consulta sin repetir el guardado',async()=>{
 mocks.api.mockResolvedValueOnce({version:2,docentes,restricciones:[row]}).mockResolvedValueOnce({guardado:true}).mockRejectedValueOnce(new Error('Consulta interrumpida')).mockResolvedValueOnce({version:2,docentes,restricciones:[row]})
 render(<RestriccionesPanel context={context}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Corregir restricción de Ana'}))
 fireEvent.submit(screen.getByRole('button',{name:'Guardar restricción'}).closest('form'))
 await screen.findByText('Consulta interrumpida')
 const reload=screen.getByRole('button',{name:'Recargar restricciones'})
 expect(reload.disabled).toBe(false)
 fireEvent.click(reload)
 await screen.findByText('Ana')
 expect(mocks.api.mock.calls.filter(([,o])=>o?.method==='POST')).toHaveLength(1)
 expect(screen.getByRole('button',{name:'Registrar restricción'}).disabled).toBe(false)
})

test('Perder el permiso durante el guardado ignora el resultado anterior y deja la consulta operativa',async()=>{
 let finish
 mocks.api.mockImplementation((_,options)=>options?.method==='POST'?new Promise(resolve=>{finish=resolve}):Promise.resolve({version:2,docentes,restricciones:[row]}))
 const view=render(<RestriccionesPanel context={context}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Corregir restricción de Ana'}))
 fireEvent.submit(screen.getByRole('button',{name:'Guardar restricción'}).closest('form'))
 view.rerender(<RestriccionesPanel context={{...context,canManageDisponibilidad:false}}/>)
 await screen.findByText('Ana')
 await act(async()=>{finish({guardado:true})})
 expect(screen.queryByText('Restricción guardada.')).toBeNull()
 expect(screen.queryByRole('button',{name:'Guardar restricción'})).toBeNull()
 expect(screen.getByRole('button',{name:'Recargar restricciones'}).disabled).toBe(false)
})
