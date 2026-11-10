import test from 'node:test'
import assert from 'node:assert/strict'
import { planningDiagnostic } from '../src/planning.js'
const snapshot=()=>({id_periodo:1,clases:[],secciones:[],asignaturas:[],docentes:[],aulas:[],bloques:[],restricciones:[],programacion:[],recursos:[],cuadriculas:[],gruposTurnos:[]})
test('El diagnóstico no publica ni certifica el flujo antes de migrar la persistencia',()=>{
 const result=planningDiagnostic(snapshot())
 assert.equal(result.valido,false)
 assert.equal(result.completo,false)
 assert.equal(result.aprobado,false)
 assert.equal(result.adaptacion_pendiente,true)
 assert.equal(result.id_periodo,1)
 assert.equal('preferencias' in result,false)
})
test('Las preferencias antiguas no cambian el diagnóstico ni generan penalizaciones',()=>{
 const data=snapshot();data.clases=[{id_horario:1}]
 const before=planningDiagnostic(data)
 data.reglas={version:7,preferencias:{minimizar_huecos:0,priorizar_manana:99}}
 assert.deepEqual(planningDiagnostic(data).conflictos,before.conflictos)
 assert.equal('penalizacion' in planningDiagnostic(data),false)
})
