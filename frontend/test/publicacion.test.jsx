import {act,cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react'
import {afterEach,beforeEach,test,expect,vi} from 'vitest'
import EstadoBorrador from '../src/features/management/EstadoBorrador'
import HorariosPublicados from '../src/features/management/HorariosPublicados'
import {publicationCsv} from '../src/features/management/publication-csv'
const mocks=vi.hoisted(()=>({api:vi.fn(),review:vi.fn()}))
vi.mock('../src/services/management',()=>({api:(path,options)=>path==='/borradores/revisar'?mocks.review(path,options):mocks.api(path,options)}))
beforeEach(()=>mocks.review.mockResolvedValue({completo:true,conflictos:[],pendientes:[]}))
afterEach(()=>{cleanup();mocks.api.mockReset();mocks.review.mockReset()})

test('Un conflicto entre departamentos se muestra antes de permitir la aprobación',async()=>{
 mocks.api.mockResolvedValue({estado:'en_revision',version:1,canApprove:true,historial:[]})
 mocks.review.mockResolvedValueOnce({completo:false,conflictos:[{motivo:'Aula ocupada por otro departamento aprobado'}],pendientes:[]}).mockResolvedValue({completo:true,conflictos:[],pendientes:[]})
 render(<EstadoBorrador id={1} revision={4} active onChanged={vi.fn()}/>)
 await screen.findByText('Aula ocupada por otro departamento aprobado')
 expect(screen.getByRole('button',{name:'Aprobar borrador'}).disabled).toBe(true)
 expect(screen.getByRole('checkbox').disabled).toBe(true)
 fireEvent.click(screen.getByRole('button',{name:'Revisar propuesta nuevamente'}))
 await waitFor(()=>expect(screen.getByRole('checkbox').disabled).toBe(false))
 expect(screen.getByRole('status').textContent).toBe('Sin conflictos ni pendientes detectados.')
 fireEvent.click(screen.getByRole('checkbox'))
 expect(screen.getByRole('button',{name:'Aprobar borrador'}).disabled).toBe(false)
 expect(mocks.api.mock.calls.some(([path])=>path==='/borradores/transicion')).toBe(false)
})

test.each([
 {completo:false,conflictos:[null],pendientes:[]},
 {completo:false,conflictos:[],pendientes:[{}]},
 {completo:true,conflictos:[{motivo:42}],pendientes:[]},
])('Un detalle de revisión incompleto bloquea la aprobación sin romper la pantalla: %j',async review=>{
 mocks.api.mockResolvedValue({estado:'en_revision',version:1,canApprove:true,historial:[]})
 mocks.review.mockResolvedValueOnce(review).mockResolvedValue({completo:true,conflictos:[],pendientes:[]})
 render(<EstadoBorrador id={1} revision={4} active onChanged={vi.fn()}/>)
 expect((await screen.findByRole('alert')).textContent).toContain('No se pudo comprobar la propuesta completa')
 expect(screen.getByRole('button',{name:'Aprobar borrador'}).disabled).toBe(true)
 fireEvent.click(screen.getByRole('button',{name:'Revisar propuesta nuevamente'}))
 await waitFor(()=>expect(screen.getByRole('checkbox').disabled).toBe(false))
 expect(screen.getByRole('button',{name:'Aprobar borrador'}).disabled).toBe(true)
})

test.each([false,true])('Una respuesta incompleta de horarios no rompe la pantalla (personal=%s)',async personal=>{
 mocks.api.mockResolvedValue(personal?{publicaciones:[{id:1,filas:[{carrera:'Sistemas'}]}]}:{publicaciones:[]})
 render(<HorariosPublicados personal={personal}/>)
 expect((await screen.findByRole('alert')).textContent).toContain('No se pudieron leer los horarios completos')
 expect(screen.queryByRole('table')).toBeNull()
 mocks.api.mockResolvedValue(personal?{publicaciones:[],vinculado:false}:[])
 fireEvent.click(screen.getByRole('button',{name:'Actualizar horarios'}))
 await waitFor(()=>expect(screen.queryByRole('alert')).toBeNull())
})

test('Una respuesta incompleta del ciclo bloquea sus acciones y permite reconsultar',async()=>{
 mocks.api.mockResolvedValue({estado:'aprobado',version:2,canPublish:true})
 render(<EstadoBorrador id={1} revision={4} active onChanged={vi.fn()}/>)
 expect((await screen.findByRole('alert')).textContent).toContain('No se pudo comprobar el estado')
 expect(screen.queryByRole('button',{name:'Publicar horario'})).toBeNull()
 mocks.api.mockResolvedValue({estado:'aprobado',version:2,canPublish:true,historial:[]})
 fireEvent.click(screen.getByRole('button',{name:'Consultar nuevamente'}))
 await screen.findByRole('button',{name:'Publicar horario'})
})

test('Los horarios publicados se leen de lunes a domingo y por hora, aunque lleguen desordenados',async()=>{
 const base={carrera:'Sistemas',ano:3,asignatura:'Web',componente:'general',docentes:['Ana'],fin:'12:00',aula:'B4',sede:'CUR'}
 mocks.api.mockResolvedValue([{id:1,nombre:'Tecnología',semestre:'2026',fecha:'2026-11-05',filas:[{...base,dia:'Jueves',inicio:'08:00'},{...base,dia:'Lunes',inicio:'09:40'},{...base,dia:'Miércoles',inicio:'08:00'},{...base,dia:'Lunes',inicio:'08:00'}]}])
 render(<HorariosPublicados />)
 const table=await screen.findByRole('table')
 const rows=within(table).getAllByRole('row').slice(1)
 expect(rows.map(row=>within(row).getAllByRole('cell')[3].textContent)).toEqual(['Lunes','Lunes','Miércoles','Jueves'])
 expect(within(rows[0]).getAllByRole('cell')[4].textContent).toContain('08:00')
})

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
 await screen.findByText('La aprobación corresponde al director del departamento, al Director o al Administrador; la publicación corresponde al Director o al Administrador.')
 expect(screen.queryByRole('button',{name:/Aprobar borrador|Publicar horario/})).toBeNull()
})

test('Aprobación consulta un borrador sin poder enviarlo a revisión',async()=>{
 mocks.api.mockResolvedValue({estado:'borrador',version:0,historial:[],canPlan:false,canApprove:true})
 render(<EstadoBorrador id={1} revision={4} active onChanged={vi.fn()}/>);
 await screen.findByText('El Director o el Administrador debe enviar este borrador a revisión.')
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

test('El horario personal ordena días con y sin tilde antes de ordenar por hora',async()=>{
 const row={carrera:'Sistemas',ano:3,componente:'general',docentes:['Ana'],inicio:'08:00',fin:'09:30',aula:'B4',sede:'CUR'}
 mocks.api.mockResolvedValue({vinculado:true,publicaciones:[{id:1,nombre:'Prueba',semestre:'2026',fecha:'2026-11-04',filas:[{...row,dia:'Miercoles',asignatura:'Tercera'},{...row,dia:'Lunes',asignatura:'Primera'},{...row,dia:'Sábado',asignatura:'Sexta'},{...row,dia:'Martes',asignatura:'Segunda'}]}]})
 render(<HorariosPublicados personal />)
 await screen.findByText('Tercera')
 const rows=screen.getAllByRole('row').slice(1).map(row=>row.textContent)
 expect(rows[0]).toContain('Primera');expect(rows[1]).toContain('Segunda');expect(rows[2]).toContain('Tercera');expect(rows[3]).toContain('Sexta')
})

test('Cambiar de borrador durante una transición libera controles e ignora la respuesta anterior',async()=>{
 let finish
 mocks.api.mockImplementation((path)=>path==='/borradores/transicion'?new Promise(resolve=>{finish=resolve}):Promise.resolve({estado:'borrador',version:0,historial:[],canPlan:true,canApprove:false,canPublish:false}))
 const changed=vi.fn(),view=render(<EstadoBorrador id={1} revision={1} active onChanged={changed}/>)
 fireEvent.click(await screen.findByLabelText('Confirmo: enviar a revisión.'))
 fireEvent.click(screen.getByRole('button',{name:'Enviar a revisión'}))
 await screen.findByRole('button',{name:'Comprobando…'})
 view.rerender(<EstadoBorrador id={2} revision={1} active onChanged={changed}/>)
 const confirmation=await screen.findByLabelText('Confirmo: enviar a revisión.')
 expect(confirmation.disabled).toBe(false)
 expect(confirmation.checked).toBe(false)
 finish({guardado:true})
 await waitFor(()=>expect(changed).not.toHaveBeenCalled())
 expect(screen.getByRole('button',{name:'Enviar a revisión'}).disabled).toBe(true)
})

test('Los años del filtro corresponden a la carrera seleccionada y se restablecen al cambiarla',async()=>{
 const row={ano:3,carrera:'Sistemas',asignatura:'Web',componente:'general',docentes:['Ana'],dia:'Lunes',inicio:'08:00',fin:'09:30',aula:'B4',sede:'CUR'}
 mocks.api.mockResolvedValue([{id:1,nombre:'Prueba',semestre:'2026',fecha:'2026-11-04',filas:[row,{...row,carrera:'Economía',ano:1,asignatura:'Econometría'}]}])
 render(<HorariosPublicados/>)
 await screen.findByText('Web')
 fireEvent.change(screen.getByLabelText('Carrera publicada'),{target:{value:'Sistemas'}})
 expect([...screen.getByLabelText('Año publicado').options].map(o=>o.value)).toEqual(['','3'])
 fireEvent.change(screen.getByLabelText('Año publicado'),{target:{value:'3'}})
 fireEvent.change(screen.getByLabelText('Carrera publicada'),{target:{value:'Economía'}})
 expect(screen.getByLabelText('Año publicado').value).toBe('')
 expect(screen.queryByText('Web')).toBeNull()
 expect(screen.getByText('Econometría')).toBeTruthy()
})

test('La descarga no crea un CSV vacío cuando la nueva consulta ya no coincide con el filtro',async()=>{
 const row={ano:3,carrera:'Sistemas',asignatura:'Web',componente:'general',docentes:['Ana'],dia:'Lunes',inicio:'08:00',fin:'09:30',aula:'B4',sede:'CUR'}
 const publication={id:1,nombre:'Prueba',semestre:'2026',fecha:'2026-11-04',filas:[row]}
 mocks.api.mockResolvedValueOnce([publication]).mockResolvedValueOnce([{...publication,filas:[{...row,carrera:'Economía',asignatura:'Econometría'}]}])
 render(<HorariosPublicados/>)
 await screen.findByText('Web')
 fireEvent.change(screen.getByLabelText('Carrera publicada'),{target:{value:'Sistemas'}})
 fireEvent.click(screen.getByRole('button',{name:'Descargar CSV de Prueba'}))
 await screen.findByText('Los datos cambiaron y ya no hay clases para los filtros seleccionados. Revisa el horario actualizado antes de descargar.')
 expect(screen.queryByText('Web')).toBeNull()
 expect(screen.getByText('Econometría')).toBeTruthy()
 expect(screen.getByLabelText('Carrera publicada').value).toBe('')
})

test('Un error al consultar el estado permite reintentar sin ejecutar una transición',async()=>{
 mocks.api.mockRejectedValueOnce(new Error('Sin conexión')).mockResolvedValueOnce({estado:'borrador',version:0,historial:[],canPlan:true})
 render(<EstadoBorrador id={1} revision={1} active onChanged={vi.fn()}/>)
 fireEvent.click(await screen.findByRole('button',{name:'Consultar nuevamente'}))
 const confirmation=await screen.findByLabelText('Confirmo: enviar a revisión.')
 expect(confirmation.checked).toBe(false)
 expect(screen.getByRole('button',{name:'Enviar a revisión'}).disabled).toBe(true)
 expect(mocks.api.mock.calls.every(([path])=>path==='/borradores/estado')).toBe(true)
})

test('Una transición incierta exige consultar el estado y confirmar nuevamente',async()=>{
 mocks.api.mockResolvedValueOnce({estado:'borrador',version:0,historial:[],canPlan:true}).mockRejectedValueOnce(new Error('Respuesta interrumpida')).mockResolvedValueOnce({estado:'en_revision',version:1,historial:[],canApprove:true})
 const changed=vi.fn()
 render(<EstadoBorrador id={1} revision={1} active onChanged={changed}/>)
 fireEvent.click(await screen.findByLabelText('Confirmo: enviar a revisión.'))
 fireEvent.click(screen.getByRole('button',{name:'Enviar a revisión'}))
 fireEvent.click(await screen.findByRole('button',{name:'Consultar nuevamente'}))
 const confirmation=await screen.findByLabelText('Confirmo: aprobar borrador.')
 expect(confirmation.checked).toBe(false)
 expect(screen.getByRole('button',{name:'Aprobar borrador'}).disabled).toBe(true)
 expect(mocks.api.mock.calls.filter(([path])=>path==='/borradores/transicion')).toHaveLength(1)
 expect(changed).not.toHaveBeenCalled()
})

test('Una descarga anterior no reemplaza Mi horario tras cambiar de pantalla',async()=>{
 let finish
 const row={ano:3,carrera:'Sistemas',asignatura:'Web',componente:'general',docentes:['Ana'],dia:'Lunes',inicio:'08:00',fin:'09:30',aula:'B4',sede:'CUR'}
 const publication={id:1,nombre:'Prueba',semestre:'2026',fecha:'2026-11-04',filas:[row]}
 mocks.api.mockResolvedValueOnce([publication]).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve})).mockResolvedValueOnce({vinculado:false,publicaciones:[]})
 const view=render(<HorariosPublicados/>)
 fireEvent.click(await screen.findByRole('button',{name:'Descargar CSV de Prueba'}))
 view.rerender(<HorariosPublicados personal/>)
 await screen.findByText(/Tu cuenta aún no está vinculada/)
 await act(async()=>{finish([publication])})
 await waitFor(()=>expect(screen.queryByRole('table')).toBeNull())
 expect(screen.queryByRole('alert')).toBeNull()
 expect(screen.getByRole('button',{name:'Actualizar horarios'}).disabled).toBe(false)
})

test('Un error de descarga anterior no aparece en la nueva pantalla',async()=>{
 let fail
 const row={ano:3,carrera:'Sistemas',asignatura:'Web',componente:'general',docentes:['Ana'],dia:'Lunes',inicio:'08:00',fin:'09:30',aula:'B4',sede:'CUR'}
 mocks.api.mockResolvedValueOnce([{id:1,nombre:'Prueba',semestre:'2026',fecha:'2026-11-04',filas:[row]}]).mockImplementationOnce(()=>new Promise((_,reject)=>{fail=reject})).mockResolvedValueOnce({vinculado:false,publicaciones:[]})
 const view=render(<HorariosPublicados/>)
 fireEvent.click(await screen.findByRole('button',{name:'Descargar CSV de Prueba'}))
 view.rerender(<HorariosPublicados personal/>)
 await screen.findByText(/Tu cuenta aún no está vinculada/)
 await act(async()=>{fail(new Error('Descarga anterior interrumpida'))})
 expect(screen.queryByRole('alert')).toBeNull()
})
