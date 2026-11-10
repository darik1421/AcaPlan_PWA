import {AccessError} from './auth.js'
export function travelSitesInput(data,save=false){
 const fail=()=>{throw new AccessError(400,'Selecciona el semestre e indica dos sedes diferentes, de hasta 100 caracteres.')}
 if(!Number.isInteger(data?.id_periodo)||data.id_periodo<1||data.id_periodo>999999999)fail()
 const result={id_periodo:data.id_periodo}
 if(save){
  if(!Number.isInteger(data.version)||data.version<0||data.version>999999999)fail()
  for(const key of ['sede_cur','sede_instituto']){
   if(typeof data[key]!=='string'||!data[key].trim()||data[key].trim().length>100)fail()
   result[key]=data[key].trim()
  }
  if(result.sede_cur.toLocaleLowerCase('es')===result.sede_instituto.toLocaleLowerCase('es'))fail()
  result.version=data.version
 }
 return result
}
