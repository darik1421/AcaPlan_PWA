import { AccessError } from './auth.js'
export async function readBody(request) {
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) throw new AccessError(415, 'Se requiere JSON.')
  const chunks = []
  let size = 0
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length
    if (size > 16384) {
      request.resume()
      throw new AccessError(413, 'El formulario supera el tamaño permitido.')
    }
    chunks.push(chunk)
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('object')
    return data
  } catch { throw new AccessError(400, 'El formulario no contiene JSON válido.') }
}
