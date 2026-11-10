# Depuración de acceso y sesión — 4 de noviembre de 2026

Primera pasada de la revisión amplia solicitada. Se conservaron los cambios que ya estaban sin commit. Sin migraciones ni cambios de Supabase, del generador o de la app móvil.

## Problemas corregidos

- La carga inicial, la descarga diferida del panel y la recuperación utilizaban el contenedor provisional con la letra A. Ahora comparten el logo real, la franja institucional y el diseño actual. La espera presenta una tarjeta y un indicador que respeta la preferencia de movimiento reducido.
- El documento bloquea el desplazamiento para el panel. El acceso no tenía un contenedor desplazable propio, y en pantallas pequeñas sus controles podían quedar fuera de alcance. Ahora el acceso y recuperación pueden desplazarse independientemente.
- Un fallo temporal de red al volver a comprobar el perfil eliminaba el perfil ya verificado y desmontaba formularios. Ahora conserva el espacio abierto y muestra un aviso con reintento. Las respuestas reales 401/403 y el cierre de sesión siguen retirando el acceso; no se trata una cuenta revocada como un fallo temporal.
- Eventos repetidos de Supabase con el mismo usuario y token provocaban nuevas comprobaciones. La dependencia usa identidad y token. La renovación de token revalida sin desmontar formularios.
- Focus, visibilidad y temporizador podían solaparse. Las comprobaciones automáticas se agrupan con un intervalo mínimo de un minuto; al recuperar la conexión se puede reintentar. Esto no modifica los límites de inactividad o revocación establecidos por Supabase.
- Recordarme era una casilla sin efecto. Marcada conserva la sesión en localStorage; desmarcada utiliza sessionStorage. La sesión temporal resiste recargar la pestaña. Las sesiones persistentes anteriores siguen siendo legibles. La aplicación no almacena la contraseña; almacena la sesión administrada por el SDK. Al salir se limpian ambas ubicaciones y la preferencia temporal, sin borrar almacenamiento de otras aplicaciones.
- El inicio y la recuperación rechazan envíos duplicados mientras procesan una solicitud.
- Se retiró la normalización de filtros de publicaciones mediante un efecto posterior: ahora los filtros y los datos se actualizan juntos, evitando resultados transitorios incoherentes durante recarga/descarga.

## Código retirado

HomePage.jsx y services/api.js: presentación provisional y comprobador visual de conexión sin referencias desde la aplicación.

ImportacionPage.jsx y ProgramacionResumen.jsx: componentes antiguos sin entrada desde el flujo actual; se retiraron también sus pruebas específicas. La carga actual de asignación e inventario se conserva. No se eliminaron datos ni funciones SQL históricas. Una revisión estática de imports de frontend/src desde main.jsx no encontró otros módulos JS/JSX fuera del grafo de ejecución.

## Verificación

- Suite completa: 172 pruebas backend y 168 frontend aprobadas.
- Lint: sin errores ni avisos. Compilación correcta.
- Arranque básico correcto: HTML, transformación React y proxy hacia backend.
- Pruebas de sesión con fallos simulados, renovación de token, eventos repetidos, revalidación temporizada, acceso denegado y formularios sin guardar.
- Pruebas de almacenamiento temporal/persistente y limpieza al cerrar sesión.
- Comprobación visual en navegador aislado con componentes reales, sin envíos a Supabase: carga de escritorio y acceso de 390 × 640. El contenedor móvil tenía 1023 px de contenido y 640 px visibles, con desplazamiento automático; el botón de acceso quedó alcanzable.
- Evidencias: evidencias/carga-diseno-actual-2026-11-04.png y evidencias/acceso-movil-scroll-2026-11-04.png.

No se simuló una espera real de varias horas contra Supabase ni se cambiaron sus políticas de expiración. Esta pasada corrige causas concretas de reinicio del formulario y falsos bloqueos por red; no certifica la ausencia de todos los errores del proyecto ni sustituye la revisión pendiente del paquete recibido de Oneyker.

## Limpieza adicional — 5 de noviembre de 2026

Se retiraron 13 copias temporales de módulos y propuestas README de la app móvil en `tmp/`, sin referencias desde la PWA; también sus carpetas vacías. Se excluyó `tmp/` de Git para evitar volver a mezclar esos archivos con la aplicación.

Se eliminó `SeccionesPage.jsx`, consulta histórica sin importaciones desde la aplicación, junto con sus tres pruebas exclusivas. La entrega actual permanece en Asignación académica. Se retiró el reexportador del motor en el frontend: sus pruebas importan ahora directamente el mismo archivo `shared/schedule-ai-solver.js` que utiliza el backend, sin duplicar el algoritmo.

Se corrigieron avisos obsoletos en Tiempos de los turnos y la documentación de navegación; el README identifica los documentos vigentes y distingue los antecedentes. Se conservaron las fuentes proporcionadas por el equipo (Word, Excel, PDF, audio, prototipo), las evidencias y las migraciones. Las herramientas de documentos y sus originales locales tampoco se borraron indiscriminadamente.

Validación después de retirar archivos: 184 pruebas backend y 204 frontend aprobadas, lint sin advertencias, compilación y prueba de arranque/proxy correctas. La reducción en el número de pruebas frontend corresponde a las tres de la pantalla histórica retirada. No se modificó Supabase, el diseño ni la app móvil.
