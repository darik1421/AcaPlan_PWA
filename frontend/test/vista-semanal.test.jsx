import {cleanup,fireEvent,render,screen,within} from '@testing-library/react'
import {afterEach,test,expect,vi} from 'vitest'
import VistaSemanalBorrador from '../src/features/management/VistaSemanalBorrador'
afterEach(cleanup)
test('Vista semanal filtra por año, distingue teoría/práctica y conserva ambas clases en un cruce',()=>{
 const d={borrador:{nombre:'Borrador'},asignaciones:[{id:1,id_carrera:1,carrera:'Sistemas',ano_estudio:3,nombre:'Web',docentes:[{id:1,nombre:'Ana'},{id:2,nombre:'Luis'}],componentes:[{tipo:'teoria',docentes:[1]},{tipo:'practica',docentes:[2]}]},{id:2,id_carrera:1,carrera:'Sistemas',ano_estudio:4,nombre:'Redes',docentes:[]}],espacios:[{id_aula:1,sede:'CUR',codigo:'B4'}],clases:[{id:1,id_asignacion:1,id_aula:1,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:30:00',componente:'teoria',fijada:true},{id:2,id_asignacion:1,id_aula:1,dia:'Lunes',hora_inicio:'08:00:00',hora_fin:'09:30:00',componente:'practica',fijada:false}]}
 const edit=vi.fn();render(<VistaSemanalBorrador detail={d} onEdit={edit} disabled={false}/>);
 expect(screen.getAllByRole('article')).toHaveLength(2)
 expect(within(screen.getAllByRole('article')[0]).getByText('Ana')).toBeTruthy();expect(within(screen.getAllByRole('article')[0]).queryByText('Luis')).toBeNull()
 fireEvent.click(screen.getByRole('button',{name:'Editar sesión 1'}));expect(edit).toHaveBeenCalledWith(d.clases[0],'clase')
 fireEvent.change(screen.getByLabelText('Carrera y año de la vista'),{target:{value:'1:4'}})
 expect(screen.queryByRole('table')).toBeNull();expect(screen.getByText('Este año todavía no tiene clases en el borrador.')).toBeTruthy()
})
