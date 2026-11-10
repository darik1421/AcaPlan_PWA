# Frontend de AcaPlan

React y JavaScript con Vite 8.3.1 y @vitejs/plugin-react 6.1.1. Usar Node.js 24 LTS (verificado con 24.21.0).

- src/features/auth: sesión, acceso, recuperación y cierre de sesión.
- src/pages/DashboardPage.jsx: panel provisional por rol.
- src/features/management: cuentas, períodos, carreras, asignaturas, espacios, secciones, bloques, disponibilidad y avance de programación académica.
- src/components: componentes compartidos.
- src/lib/supabase.js: cliente público de Supabase.
- src/services/session.js: validación del perfil mediante el backend.

Consulta el README de la raíz, docs/sprint-1.md y docs/sprint-2.md para configuración y pruebas de aceptación.
El diseño es provisional. La RPC del Sprint 1 ya está desplegada en el proyecto compartido. Horarios, instalación PWA y modo sin conexión corresponden a sprints posteriores.

`npm test` ejecuta las pruebas del frontend con servicios simulados, sin enviar correos ni modificar Supabase. Desde la raíz, `npm test` ejecuta backend y frontend.
