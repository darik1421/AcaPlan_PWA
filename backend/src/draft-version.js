import {AccessError} from './auth.js'
export function draftVersionInput(data) {
  if (!Number.isSafeInteger(data?.id) || data.id < 1 || !Number.isInteger(data.revision) || data.revision < 1 || data.revision > 2147483647 || !Number.isInteger(data.version) || data.version < 0 || data.version > 2147483647 || typeof data.request_id !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(data.request_id)) {
    throw new AccessError(400, 'Consulta el horario y confirma la creación de su nueva versión.')
  }
  return {id:data.id,revision:data.revision,version:data.version,request_id:data.request_id}
}
