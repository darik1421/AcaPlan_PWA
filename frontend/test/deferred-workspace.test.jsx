import {act,cleanup,fireEvent,render,screen} from '@testing-library/react'
import {afterEach,expect,test,vi} from 'vitest'
import DeferredWorkspace from '../src/components/DeferredWorkspace'
afterEach(()=>{cleanup();vi.restoreAllMocks()})
test('Muestra la espera y abre el espacio cuando termina la descarga',async()=>{
 let finish
 const load=vi.fn(()=>new Promise(resolve=>{finish=resolve}))
 render(<DeferredWorkspace load={load}/>)
 expect(screen.getByRole('status').textContent).toContain('Abriendo tu espacio')
 await act(async()=>{finish({default:()=> <p>Espacio disponible</p>})})
 expect(screen.getByText('Espacio disponible')).toBeTruthy()
 expect(screen.queryByRole('status')).toBeNull()
 expect(load).toHaveBeenCalledTimes(1)
})
test('Una descarga fallida ofrece un nuevo intento sin recargar la página',async()=>{
 vi.spyOn(console,'error').mockImplementation(()=>{})
 const load=vi.fn().mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce({default:()=> <p>Espacio recuperado</p>})
 render(<DeferredWorkspace load={load}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Volver a intentar'}))
 await screen.findByText('Espacio recuperado')
 expect(load).toHaveBeenCalledTimes(2)
 expect(screen.queryByRole('alert')).toBeNull()
})
