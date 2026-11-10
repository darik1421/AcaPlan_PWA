import {cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import SedesTraslado from '../src/features/management/SedesTraslado'
const mocks=vi.hoisted(()=>({api:vi.fn()}));vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
test('Consulta explícita sin inventar sedes y guarda con versión',async()=>{
 mocks.api.mockResolvedValueOnce({configuracion:null}).mockResolvedValueOnce([{sede:'CUR',estado:'activo'},{sede:' cur ',estado:'activo'},{sede:'Instituto',estado:'activo'},{sede:'Antigua',estado:'inactivo'}]).mockResolvedValueOnce({configuracion:{sede_cur:'CUR',sede_instituto:'Instituto',version:1}})
 render(<SedesTraslado periodId={1} editable/>)
 expect(mocks.api).not.toHaveBeenCalled()
 fireEvent.click(screen.getByText('Consultar sedes del semestre'))
 const field=await screen.findByLabelText('Nombre de la sede CUR');expect(field.value).toBe('')
 expect(document.querySelectorAll('datalist option').length).toBe(2)
 fireEvent.change(field,{target:{value:'CUR'}})
 fireEvent.change(screen.getByLabelText('Nombre de la sede del instituto'),{target:{value:'Instituto'}})
 fireEvent.click(screen.getByText('Guardar sedes del semestre'))
 await screen.findByRole('status')
 expect(mocks.api).toHaveBeenLastCalledWith('/sedes-traslado',{method:'POST',data:{id_periodo:1,sede_cur:'CUR',sede_instituto:'Instituto',version:0}})
})
test('Si falla la consulta, no permite guardar una configuración supuesta',async()=>{
 mocks.api.mockRejectedValue(new Error('Configuración no disponible'))
 render(<SedesTraslado periodId={1} editable/>);fireEvent.click(screen.getByText('Consultar sedes del semestre'))
 await screen.findByRole('alert');expect(screen.queryByText('Guardar sedes del semestre')).toBeNull()
})
