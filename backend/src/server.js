import { createApp } from './app.js'

const port = Number(process.env.PORT || 3001)
const host = process.env.HOST || '127.0.0.1'
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT debe ser un entero entre 1 y 65535.')
}
const server = createApp()
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `El puerto ${port} está ocupado. Cierra la otra instancia o ajusta PORT y el proxy de Vite.`
    : 'No se pudo iniciar el backend.')
  process.exitCode = 1
})
server.listen(port, host, () => {
  console.log(`AcaPlan API: http://${host}:${port}/api/health`)
})
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close())
}
