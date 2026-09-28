# AcaPlan PWA

Aplicación web progresiva para la gestión de horarios académicos de la UNAN-Managua, CUR-Chontales.

## Estado actual

Base local con React, JavaScript, HTML, CSS, Node.js y cliente de Supabase.
Sprint 1 implementado: acceso, recuperación, cierre de sesión, cuentas y períodos. SQL compartido y Edge Function móvil desplegados en Supabase; redirecciones de recuperación local configuradas. Se verificaron el acceso administrativo, las consultas y el cierre con una sesión real. Las pruebas que crean datos y la aceptación completa en teléfono se pospusieron por decisión del responsable. Consulta [docs/sprint-1.md](docs/sprint-1.md).
La comprobación del backend no comprueba el acceso a la base de datos.

Módulos H06-H12 corregidos: carreras, asignaturas, espacios, secciones, bloques, disponibilidad y programación académica. Consulta [la reparación y sus pruebas](docs/reparacion-sprint-2.md). El SQL consolidado local sustituye los scripts parciales recibidos; no volver a ejecutarlos.
El alcance y los criterios de cierre del sprint 2 están en [docs/sprint-2.md](docs/sprint-2.md). H12 pertenece al sprint 3.

## Estructura

```text
ACAPLANWEB/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Componentes compartidos
│   │   ├── features/auth/    # Acceso y recuperación
│   │   ├── lib/              # Cliente de Supabase
│   │   ├── pages/            # Pantallas
│   │   ├── services/         # Comunicación con la API
│   │   └── App.jsx
│   ├── .env                  # Local, excluido de Git
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── src/app.js            # API HTTP
│   ├── src/server.js         # Inicio del servidor
│   ├── test/
│   ├── .env                  # Local, excluido de Git
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json              # Comandos desde la raíz
└── Documentación del proyecto
```

## Instalar

Usar Node.js 24 LTS (versión verificada: 24.21.0, indicada en .nvmrc). El frontend usa Vite 8.3.1 y @vitejs/plugin-react 6.1.1. El lockfile conserva las versiones resueltas. Reiniciar las terminales y los servidores de desarrollo después de actualizar Node.

Desde la raíz:

```powershell
npm run install:all
```

Al clonar, crea los archivos de entorno solo si todavía no existen:

```powershell
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Completa frontend/.env con la URL y clave pública del proyecto Supabase compartido:
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y VITE_API_BASE_URL=/api.
Se admite una clave anon o publishable. Las variables VITE_ son visibles en el navegador: nunca colocar claves secret ni service_role.

Se utilizan únicamente frontend/.env y backend/.env; el .env de la raíz fue eliminado.
El backend utiliza HOST=127.0.0.1 y PORT=3001. Para verificar sesiones necesita SUPABASE_URL y SUPABASE_ANON_KEY del mismo proyecto. El endpoint /api/health sigue siendo público.
La creación de cuentas requiere SUPABASE_SERVICE_ROLE_KEY exclusivamente en backend/.env.

## Ejecutar

En una terminal, desde la raíz:

```powershell
npm run dev:backend
```

En otra terminal, también desde la raíz:

```powershell
npm run dev:frontend
```

Abrir http://127.0.0.1:5173 e ingresar con una cuenta autorizada existente. Reiniciar ambos servicios después de cambiar variables de entorno.
El frontend verifica el perfil mediante /api/me a través del proxy de Vite hacia el puerto 3001.
Si cambias PORT, modifica también el proxy en frontend/vite.config.js.

## Verificar

```powershell
npm run lint
npm test
npm run build
npm run test:smoke
```

La compilación se guarda en frontend/dist. Para producción falta configurar HTTPS y el proxy de /api hacia el backend. Vite preview permite inspeccionar la compilación, pero no sustituye esa configuración de producción.

Con los archivos SQL locales y su dependencia instalada (`npm --prefix database.local ci`), `npm run test:sql` comprueba las migraciones en memoria sin tocar Supabase.

## Base de datos y archivos locales

La PWA y la aplicación React Native son proyectos separados que comparten Supabase.
La autenticación verifica el correo de Supabase Auth contra un perfil activo en usuarios. Falta comprobar las políticas RLS y el flujo completo con cuentas reales.
La gestión usa la RPC pwa_sprint1, aplicada en el proyecto compartido. Los scripts locales originales se retiraron por decisión del responsable; no son necesarios para ejecutar la PWA contra ese proyecto. Para preparar otra base se necesita una migración actualizada del esquema. Consulta docs/sprint-1.md.
No aplicar migraciones o cambios de roles sin comprobar la compatibilidad con la app móvil.

.env, frontend/.env, backend/.env, Supabase.sql, database.local/, node_modules y dist están excluidos de Git.
Supabase.sql es un esquema local de referencia, no una migración automática.
Los dos .gitignore se conservan: el de la raíz aplica a todo el repositorio y el del frontend añade reglas locales.

La documentación de contexto está en AcaPlan.txt y las historias y sprints en AcaPlan_PWA_Historias_y_Planificacion_SCRUM.docx.
