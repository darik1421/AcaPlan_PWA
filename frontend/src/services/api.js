const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export async function getApiHealth() {
  const response = await fetch(`${baseUrl}/health`, {
    signal: AbortSignal.timeout(5000),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error('El backend no está disponible.')
  const data = await response.json()
  if (data.status !== 'ok' || data.service !== 'acaplan-api') {
    throw new Error('La respuesta no corresponde al backend de AcaPlan.')
  }
  return data
}
