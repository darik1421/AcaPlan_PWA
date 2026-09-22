# AcaPlan PWA

Aplicación web progresiva para la gestión de horarios académicos de la UNAN-Managua, CUR-Chontales.

## Estado del proyecto

Repositorio inicial de documentación y planificación. La aplicación web todavía no está implementada y aún no hay comandos de instalación o ejecución.

## Tecnologías previstas

- React y JavaScript, con HTML y CSS para la interfaz.
- Node.js para operaciones de servidor.
- Supabase para autenticación y base de datos.

La PWA y la aplicación móvil React Native son proyectos separados que comparten el mismo proyecto de Supabase. Los cambios en datos, permisos o autenticación deben mantener la compatibilidad con ambas aplicaciones.

## Alcance

Registro e importación de programación académica desde Excel; gestión de docentes, carreras, asignaturas, aulas, secciones y períodos; planificación manual y asistida por IA; detección de conflictos; revisión, aprobación, publicación y consulta de horarios; exportación a PDF y funciones de PWA.

## Archivos iniciales

- `AcaPlan.txt`: contexto del proyecto de graduación.
- `AcaPlan_PWA_Historias_y_Planificacion_SCRUM.docx`: historias de usuario y planificación de seis sprints.
- `Supabase.sql`: esquema de referencia proporcionado al iniciar el proyecto. No representa necesariamente el estado actual del servicio y no debe ejecutarse automáticamente sobre la base compartida.
- `.env.example`: nombres de las variables con valores ficticios.

## Configuración local

El archivo `.env` se mantiene fuera de Git. Los nombres de variables actuales proceden de la aplicación Expo y se ajustarán al configurar la herramienta de desarrollo de React para la PWA.

No subir contraseñas, claves privadas ni claves `service_role`. Las credenciales privilegiadas de Supabase y del proveedor de IA se utilizarán únicamente en el servidor.

## Forma de trabajo

La rama principal es `main`. Para cada historia, crear una rama de trabajo, realizar los cambios y comprobar los criterios de aceptación antes de integrarlos. Las migraciones de la base compartida se probarán antes de aplicarse al entorno utilizado por ambas aplicaciones.
