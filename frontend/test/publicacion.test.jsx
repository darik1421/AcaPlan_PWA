import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import EstadoBorrador from '../src/features/management/EstadoBorrador'
import HorariosPublicados from '../src/features/management/HorariosPublicados'
import {publicationCsv} from '../src/features/management/publication-csv'
const mocks=vi.hoisted(()=>({api:vi.fn()}))
vi.mock('../src/services/management',()=>({api:mocks.api}))
afterEach(()=>{cleanup();mocks.api.mockReset()})

test('Un director de departamento puede aprobar, pero no recibe el control de publicar',async()=>{
 mocks.api.mockResolvedValue({estado:'aprobado',version:2,historial:[],canPlan:false,canApprove:true,canPublish:false})
 render(<EstadoBorrador id={1} revision={4} active onChanged={vi.fn()}/> )
 await screen.findByText('La publicación corresponde al Director o al Administrador.')
 expect(screen.queryByRole('button',{name:'Publicar horario'})).toBeNull()
})

test('Mi horario consulta el endpoint personal y reúne las clases recibidas de distintos departamentos',async()=>{
 const row={carrera:'Sistemas',ano:3,asignatura:'Web',componente:'general',docentes:['Ana'],dia:'Lunes',inicio:'08:00',fin:'09:30',aula:'B4',sede:'CUR'}
 mocks.api.mockResolvedValue({vinculado:true,requiere_republicacion:false,publicaciones:[{id:1,nombre:'Tecnología',semestre:'2026',fecha:'2026-11-03',filas:[row]},{id:2,nombre:'Economía',semestre:'2026',fecha:'2026-11-03',filas:[{...row,asignatura:'Estadística',carrera:'Economía'}]}]})
 render(<HorariosPublicados personal />)
 await screen.findByText('Estadística')
 expect(screen.getByText('Web')).toBeTruthy()
 expect(screen.getAllByRole('table')).toHaveLength(1)
 expect(screen.getAllByRole('button',{name:/Descargar CSV/})).toHaveLength(1)
 expect(screen.getByRole('heading',{name:/Mi horario semanal/})).toBeTruthy()
 expect(mocks.api).toHaveBeenCalledWith('/horarios/personal',expect.anything())
 expect(mocks.api.mock.calls.some(([path])=>path==='/horarios/publicados')).toBe(false)
})

test('Mi horario explica una cuenta sin vínculo sin ofrecer datos de otros docentes',async()=>{
 mocks.api.mockResolvedValue({vinculado:false,requiere_republicacion:false,publicaciones:[]})
 render(<HorariosPublicados personal />)
 await screen.findByText(/Tu cuenta aún no está vinculada/)
 expect(screen.queryByRole('table')).toBeNull()
})

test.each(['en_revision','aprobado'])('Planificación no ofrece aprobación ni publicación en %s',async estado=>{
 mocks.api.mockResolvedValue({estado,version:1,historial:[],canPlan:true,canApprove:false})
 render(<EstadoBorrador id={1} revision={4} active onChanged={vi.fn()}/>);
 await screen.findByText('La función Aprobación es necesaria para aprobar y publicar este horario.')
 expect(screen.queryByRole('button',{name:/Aprobar borrador|Publicar horario/})).toBeNull()
})

test('Aprobación consulta un borrador sin poder enviarlo a revisión',async()=>{
 mocks.api.mockResolvedValue({estado:'borrador',version:0,historial:[],canPlan:false,canApprove:true})
 render(<EstadoBorrador id={1} revision={4} active onChanged={vi.fn()}/>);
 await screen.findByText('Planificación debe enviar este borrador a revisión.')
 expect(screen.queryByRole('button',{name:'Enviar a revisión'})).toBeNull()
})
test('Publicar exige confirmación y envía versiones, sin decidir el resultado de validación',async()=>{
 mocks.api.mockResolvedValueOnce({estado:'aprobado',version:2,historial:[],canApprove:true}).mockResolvedValueOnce({guardado:true});const changed=vi.fn()
 render(<EstadoBorrador id={1} revision={4} active onChanged={changed}/>);
 const button=await screen.findByRole('button',{name:'Publicar horario'});expect(button.disabled).toBe(true)
 fireEvent.click(screen.getByLabelText('Confirmo: publicar horario.'));fireEvent.click(button)
 await waitFor(()=>expect(changed).toHaveBeenCalled())
 expect(mocks.api).toHaveBeenLastCalledWith('/borradores/transicion',{method:'POST',data:{id:1,revision:4,version:2,estado:'publicado'}})
})
test('La aprobación obsoleta vuelve a revisión y no ofrece publicar',async()=>{
 mocks.api.mockResolvedValue({estado:'borrador',desactualizado:true,version:3,historial:[],canPlan:true})
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
