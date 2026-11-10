import {AccessError} from './auth.js'
function validDraftSnapshot(data) {
  return Number.isSafeInteger(data?.id) && data.id > 0
    && Number.isInteger(data.revision) && data.revision > 0 && data.revision <= 2147483647
    && Number.isInteger(data.version) && data.version >= 0 && data.version <= 2147483647
}

export function draftVersionInput(data) {
  if (!validDraftSnapshot(data) || typeof data.request_id !== 'string' || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(data.request_id)) {
    throw new AccessError(400, 'Consulta el horario y confirma la creación de su nueva versión.')
  }
  return {id:data.id,revision:data.revision,version:data.version,request_id:data.request_id}
}

export function draftDeleteInput(data) {
  if (!validDraftSnapshot(data)) throw new AccessError(400, 'Consulta el borrador antes de eliminarlo.')
  return {id:data.id,revision:data.revision,version:data.version}
}
