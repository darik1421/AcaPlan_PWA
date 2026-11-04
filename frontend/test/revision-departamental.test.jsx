import {cleanup,render,screen} from '@testing-library/react'
import {afterEach,expect,test,vi} from 'vitest'
import RevisionBorrador from '../src/features/management/RevisionBorrador'
afterEach(cleanup)
test('Un cruce externo orienta sobre la propuesta propia sin revelar clases ajenas',()=>{
 const detail={asignaciones:[{id:1,carrera:'Sistemas',ano_estudio:3,nombre:'Web'}],espacios:[{id_aula:2,codigo:'B4'}],clases:[{id:7,id_asignacion:1,id_aula:2,dia:'Lunes',hora_inicio:'08:00',hora_fin:'09:30',fijada:true}]}
 const report={completo:false,revision:1,aviso:'Consulta actual',conflictos:[{codigo:'CRUCE_DOCENTE_OTRO_DEPARTAMENTO',motivo:'Docente ocupado en otro departamento',clases:[7]}],pendientes:[]}
 render(<RevisionBorrador detail={detail} report={report} onEdit={vi.fn()} disabled/>)
 expect(screen.getByText(/no se cambia esa clase automáticamente/)).toBeTruthy()
 expect(screen.getByText(/Fijada: requiere autorización para cambiar/)).toBeTruthy()
 expect(screen.getByRole('button',{name:'Corregir clase 7'}).disabled).toBe(true)
})
