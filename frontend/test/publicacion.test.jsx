import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import EstadoBorrador from '../src/features/management/EstadoBorrador'
import HorariosPublicados from '../src/features/management/HorariosPublicados'
import {publicationCsv} from '../src/features/management/publication-csv'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})
test('Publicar exige confirmación y envía versiones, sin decidir el resultado de validación',async()=>{
 mocks.api.mockResolvedValueOnce({estado:'aprobado',version:2,historial:[]}).mockResolvedValueOnce({guardado:true});const changed=vi.fn()
 render(<EstadoBorrador id={1} revision={4} active onChanged={changed}/>);
 const button=await screen.findByRole('button',{name:'Publicar horario'});expect(button.disabled).toBe(true)
 fireEvent.click(screen.getByLabelText('Confirmo: publicar horario.'));fireEvent.click(button)
 await waitFor(()=>expect(changed).toHaveBeenCalled())
 expect(mocks.api).toHaveBeenLastCalledWith('/borradores/transicion',{method:'POST',data:{id:1,revision:4,version:2,estado:'publicado'}})
})
test('La aprobación obsoleta vuelve a revisión y no ofrece publicar',async()=>{
 mocks.api.mockResolvedValue({estado:'borrador',desactualizado:true,version:3,historial:[]})
 render(<EstadoBorrador id={1} revision={5} active onChanged={vi.fn()}/>);
 await screen.findByRole('button',{name:'Enviar a revisión'});expect(screen.queryByRole('button',{name:'Publicar horario'})).toBeNull()
})
test('Sin publicaciones no muestra borradores ni controles de edición',async()=>{
 mocks.api.mockResolvedValue([]);render(<HorariosPublicados/>);await screen.findByText('No hay publicaciones vigentes. El encargado debe completar la revisión y publicación.')
 expect(screen.queryByRole('table')).toBeNull()
})
test('CSV protege fórmulas, comillas y columnas extra',()=>{
 const csv=publicationCsv([{carrera:'=WEBSERVICE("x")',asignatura:'Texto, "ejemplo"',docentes:['Ana'],cedula:'privada'}]);expect(csv).toContain("'=WEBSERVICE");expect(csv).toContain('"Texto, ""ejemplo"""');expect(csv).not.toContain('privada')
})
