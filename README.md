# AcaPlan PWA

Aplicación web progresiva para la gestión de horarios académicos de la UNAN-Managua, CUR-Chontales.

## Estado actual

Base local con React, JavaScript, HTML, CSS, Node.js y cliente de Supabase.
La autenticación, los módulos académicos, la instalación PWA y el modo sin conexión están pendientes.
La comprobación del backend no comprueba el acceso a la base de datos.

## Estructura

```text
ACAPLANWEB/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # Componentes compartidos
│   │   ├── features/auth/    # Futuro módulo de autenticación
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

Node.js 20.17.0 es compatible con esta base. Vite 6 y su plugin están fijados para no instalar Vite 8 accidentalmente. El lockfile conserva las versiones resueltas; actualizar dependencias requiere revisar compatibilidad.

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

El .env de la raíz se conserva como referencia local, pero ninguno de los dos servicios lo carga.
El backend utiliza HOST=127.0.0.1 y PORT=3001. El endpoint de salud no necesita credenciales de Supabase.
Las futuras credenciales privilegiadas pertenecerán exclusivamente al entorno del servidor.

## Ejecutar

En una terminal, desde la raíz:

```powershell
npm run dev:backend
```

En otra terminal, también desde la raíz:

```powershell
npm run dev:frontend
```

Abrir http://127.0.0.1:5173 y utilizar el botón de comprobación del servidor.
El frontend llama a /api/health mediante el proxy de Vite hacia el puerto 3001.
Si cambias PORT, modifica también el proxy en frontend/vite.config.js.

## Verificar

```powershell
npm run lint
npm test
npm run build
```

La compilación se guarda en frontend/dist. Para producción falta configurar HTTPS y el proxy de /api hacia el backend. Vite preview permite inspeccionar la compilación, pero no sustituye esa configuración de producción.

## Base de datos y archivos locales

La PWA y la aplicación React Native son proyectos separados que comparten Supabase.
Antes de implementar autenticación se comprobará la correspondencia de cuentas, perfiles y permisos.
Las operaciones futuras deben respetar las políticas RLS y los controles del servidor.
No aplicar migraciones o cambios de roles sin comprobar la compatibilidad con la app móvil.

.env, frontend/.env, backend/.env, Supabase.sql, node_modules y dist están excluidos de Git.
Supabase.sql es un esquema local de referencia, no una migración automática.
Los dos .gitignore se conservan: el de la raíz aplica a todo el repositorio y el del frontend añade reglas locales.

La documentación de contexto está en AcaPlan.txt y las historias y sprints en AcaPlan_PWA_Historias_y_Planificacion_SCRUM.docx.
