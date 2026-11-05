# AcaPlan PWA

Aplicación web progresiva para la gestión de horarios académicos de la UNAN-Managua, CUR-Chontales.

## Estado actual

Para continuar el desarrollo, consultar primero [el contexto vigente de traspaso](docs/CONTEXTO_ACTUAL_PWA.md). Su copia en Word es [AcaPlan Traspaso Completo Proyecto](docs/AcaPlan_Traspaso_Completo_Proyecto.docx), reemplazada con el estado del 5 de noviembre de 2026.

Actualizado al 5 de noviembre de 2026. La PWA usa React, JavaScript, HTML/CSS, Node.js y Supabase. Mantiene el diseño actual y el flujo por departamentos: Administrador y Director tienen acceso global; los directores de departamento registran restricciones y aprueban su borrador; los coordinadores de carrera entregan y corrigen asignaciones mediante un único Excel; los docentes consultan sus horarios publicados.

Están implementados acceso y cuentas, semestres, carreras/departamentos, aulas completas, entrega académica, restricciones, borradores, revisión, aprobación departamental, publicación y horario personal. El generador de búsqueda MRV recibido de Oneyker está conectado a las asignaciones importadas y al guardado transaccional de sus clases. Consulta [la conexión del generador y sus límites](docs/conexion-generador-2026-11-04.md) y [la revisión de los cambios recibidos](docs/revision-cambios-recibidos-2026-11-04.md).

Las pruebas automáticas y las comprobaciones aisladas no sustituyen la aceptación con archivos institucionales. Siguen pendientes las plantillas definitivas, confirmar las frecuencias semanales de los turnos no regulares y evaluar el volumen real. La recuperación de contraseña requiere su aceptación final con correo. Los documentos de sprints conservan antecedentes históricos; no todos describen el estado vigente.

## Estructura

La documentación vigente parte de este README, la [conexión del generador](docs/conexion-generador-2026-11-04.md), la [prueba del recorrido completo](docs/verificacion-recorrido-generado-2026-11-05.md) y la [revisión visual](docs/revision-visual-2026-11-05.md). Los Word, ejemplos, audio y documentos de sprints en `docs/` se conservan como referencias y antecedentes; sus fechas importan al interpretar el flujo. `database.local/` contiene migraciones y comprobaciones locales excluidas de Git. `tmp/` y `.document-work/` son espacios temporales, no partes de la aplicación.

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
├── shared/                  # Motor MRV compartido con el backend
├── .gitignore
├── package.json              # Comandos desde la raíz
└── Documentación del proyecto
```

## Instalar

Usar Node.js 24 LTS (versión verificada: 24.21.0, indicada en .nvmrc). El frontend usa Vite 8.3.6 y @vitejs/plugin-react 6.1.1. El lockfile conserva las versiones resueltas. Reiniciar las terminales y los servidores de desarrollo después de actualizar Node.

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
La creación de cuentas y la confirmación de propuestas requieren SUPABASE_SERVICE_ROLE_KEY exclusivamente en backend/.env.

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

La compilación se guarda en frontend/dist. El despliegue del backend debe incluir también la carpeta shared/ situada en la raíz; allí está el motor usado por el worker. Para producción falta configurar HTTPS y el proxy de /api hacia el backend. Vite preview permite inspeccionar la compilación, pero no sustituye esa configuración de producción.

Con los archivos SQL locales y su dependencia instalada (`npm --prefix database.local ci`), `npm run test:sql` comprueba las migraciones en memoria sin tocar Supabase.

## Base de datos y archivos locales

La PWA y la app React Native son proyectos independientes. Esta versión se mantiene en el proyecto Supabase configurado en sus archivos de entorno; no depende del backend móvil.
La autenticación verifica Supabase Auth y el perfil activo de usuarios. Los permisos se comprueban también en las RPC; no dependen únicamente de los botones de la interfaz. El flujo de acceso, aprobación y publicación se verificó con cuentas ficticias temporales: [alcance de la prueba](docs/verificacion-flujo-2026-11-04.md).
Las migraciones locales son para revisión y pruebas; no deben aplicarse indiscriminadamente sobre una base existente ni usarse como un esquema inicial completo. El generador requiere la migración generador-flujo-actual.sql, ya aplicada en el proyecto actual. Para preparar otra base debe conservarse y revisarse la cadena de migraciones correspondiente.

.env, frontend/.env, backend/.env, Supabase.sql, database.local/, node_modules y dist están excluidos de Git.
Supabase.sql es un esquema local de referencia, no una migración automática.
Los dos .gitignore se conservan: el de la raíz aplica a todo el repositorio y el del frontend añade reglas locales.

La documentación de contexto está en AcaPlan.txt y las historias y sprints en AcaPlan_PWA_Historias_y_Planificacion_SCRUM.docx.

Regla regular vigente: dos sesiones semanales de 90 minutos, formadas por bloques contiguos de 45. Las horas semestrales del Excel no equivalen a sesiones semanales. Nocturno y encuentros mantienen 60 minutos por sesión y quedan pendientes de confirmar su frecuencia; el generador no la inventa.
