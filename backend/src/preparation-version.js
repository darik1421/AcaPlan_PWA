import {createHash} from 'node:crypto'
import {academicRule} from './academic-rules.js'

// Incrementar al cambiar el significado de una comprobación de preparación.
export const PREPARATION_RULE_VERSION = '2026-10-15.4'

// Las listas consultadas son conjuntos: su orden de respuesta no es un cambio.
// Solo se devuelve el hash; nombres, cédulas y otros datos internos no se exponen.
function canonical(value){
 if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value)
 if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value)
 if(Array.isArray(value))return `[${value.map(canonical).sort().join(',')}]`
 if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`
 throw new TypeError('Datos incompletos para identificar la revisión de preparación.')
}

export function preparationVersion(data){
 const rules=Object.fromEntries(['matutino','vespertino','nocturno','encuentros'].map(turn=>[turn,academicRule(turn)]))
 return {version_reglas:PREPARATION_RULE_VERSION,huella_datos:createHash('sha256').update(canonical({version:PREPARATION_RULE_VERSION,rules,data})).digest('hex')}
}
