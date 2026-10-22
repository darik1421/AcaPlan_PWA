import {AccessError} from './auth.js'
export function yearTurn(data,save=false){
 const integer=v=>Number.isInteger(v)&&v>0&&v<=2147483647
 if(!data||!integer(data.id_periodo)||!integer(data.id_carrera)||!integer(data.ano_estudio)||data.ano_estudio>10)throw new AccessError(400,'Selecciona un año de carrera del semestre activo.')
 const result={id_periodo:data.id_periodo,id_carrera:data.id_carrera,ano_estudio:data.ano_estudio}
 if(!save)return result
 if(!['matutino','vespertino','nocturno','encuentros'].includes(data.turno)||typeof data.huella!=='string'||!/^[a-f0-9]{32}$/.test(data.huella))throw new AccessError(400,'Revisa el nuevo turno y vuelve a cargar sus asignaturas.')
 return {...result,turno:data.turno,huella:data.huella}
}
