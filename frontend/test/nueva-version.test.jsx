import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,expect,test,vi} from 'vitest'
import NuevaVersionBorrador from '../src/features/management/NuevaVersionBorrador'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})

test('Crear versión exige confirmación y conserva la misma solicitud si falla la respuesta',async()=>{
 mocks.api.mockRejectedValueOnce(new Error('Respuesta incierta')).mockResolvedValueOnce({id:20,creado:true})
 const created=vi.fn()
 render(<NuevaVersionBorrador id={4} revision={7} version={3} onCreated={created}/>)
 fireEvent.click(screen.getByRole('button',{name:'Crear nueva versión'}))
 expect(screen.getByRole('button',{name:'Confirmar nueva versión'}).disabled).toBe(true)
 fireEvent.click(screen.getByRole('checkbox'))
 fireEvent.click(screen.getByRole('button',{name:'Confirmar nueva versión'}))
 await screen.findByRole('alert')
 fireEvent.click(screen.getByRole('button',{name:'Confirmar nueva versión'}))
 await waitFor(()=>expect(created).toHaveBeenCalledWith(20))
 expect(mocks.api.mock.calls[0][1].data).toEqual(mocks.api.mock.calls[1][1].data)
 expect(mocks.api.mock.calls[0][1].data).toMatchObject({id:4,revision:7,version:3,request_id:expect.any(String)})
})

test('Una respuesta de copia de otro borrador no navega al cambiar la selección',async()=>{
 let resolve
 mocks.api.mockImplementation(()=>new Promise(r=>{resolve=r}))
 const created=vi.fn(),view=render(<NuevaVersionBorrador id={4} revision={7} version={3} onCreated={created}/>)
 fireEvent.click(screen.getByRole('button',{name:'Crear nueva versión'}));fireEvent.click(screen.getByRole('checkbox'));fireEvent.click(screen.getByRole('button',{name:'Confirmar nueva versión'}))
 view.rerender(<NuevaVersionBorrador id={5} revision={1} version={3} onCreated={created}/>)
 resolve({id:20})
 await waitFor(()=>expect(screen.getByRole('button',{name:'Crear nueva versión'})).toBeTruthy())
 expect(created).not.toHaveBeenCalled()
})
