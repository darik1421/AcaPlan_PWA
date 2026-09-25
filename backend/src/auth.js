export class AccessError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

export async function authenticate(request, {
  url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_ANON_KEY,
  fetchImpl = fetch,
} = {}) {
  const token = /^Bearer ([^\s]+)$/.exec(request.headers.authorization || '')?.[1]
  if (!token) throw new AccessError(401, 'Inicia sesión para continuar.')
  if (!url || !key) throw new AccessError(503, 'La autenticación del servidor no está configurada.')
  const headers = { apikey: key, Authorization: `Bearer ${token}` }
  let userResponse, profilesResponse
  try {
    userResponse = await fetchImpl(`${url}/auth/v1/user`, { headers, signal: AbortSignal.timeout(8000) })
  } catch { throw new AccessError(503, 'No se pudo verificar la sesión. Intenta de nuevo.') }
  if ([401, 403].includes(userResponse.status)) throw new AccessError(401, 'La sesión no es válida. Vuelve a iniciar sesión.')
  if (!userResponse.ok) throw new AccessError(503, 'No se pudo verificar la sesión.')
  const user = await userResponse.json()
  if (!user.id || !user.email) throw new AccessError(401, 'La sesión no es válida.')
  const query = new URLSearchParams({
    select: 'id_usuario,nombre,correo,rol,estado',
    correo: `eq.${user.email}`,
    limit: '2',
  })
  try {
    profilesResponse = await fetchImpl(`${url}/rest/v1/usuarios?${query}`, { headers, signal: AbortSignal.timeout(8000) })
  } catch { throw new AccessError(503, 'No se pudo consultar el perfil. Intenta de nuevo.') }
  if (!profilesResponse.ok) throw new AccessError(503, 'No se pudo consultar el perfil autorizado.')
  const profiles = await profilesResponse.json()
  if (!Array.isArray(profiles) || profiles.length !== 1 || profiles[0].estado !== 'activo'
      || !['administrador', 'docente'].includes(profiles[0].rol)) {
    throw new AccessError(403, 'La cuenta no está autorizada o se encuentra inactiva.')
  }
  const { id_usuario, nombre, correo, rol, estado } = profiles[0]
  return { id_usuario, nombre, correo, rol, estado }
}

