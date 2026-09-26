# Frontend de AcaPlan

React y JavaScript con Vite 8.3.1 y @vitejs/plugin-react 6.1.1. Usar Node.js 24 LTS (verificado con 24.21.0).

- src/features/auth: sesión, acceso, recuperación y cierre de sesión.
- src/pages/DashboardPage.jsx: panel provisional por rol.
- src/features/management: formularios y listados de cuentas y períodos.
- src/components: componentes compartidos.
- src/lib/supabase.js: cliente público de Supabase.
- src/services/session.js: validación del perfil mediante el backend.

Consulta el README de la raíz y docs/sprint-1.md para configuración y pruebas de aceptación.
El diseño es provisional. Cuentas y períodos requieren desplegar la RPC del Sprint 1 tras revisar la integración móvil. Horarios, instalación PWA y modo sin conexión siguen pendientes.
