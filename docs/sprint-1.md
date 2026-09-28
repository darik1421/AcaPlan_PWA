# Sprint 1 — Acceso, cuentas y períodos

## Estado
H01 (inicio de sesión), H02 (recuperación), H03 (cuentas y funciones), H04 (salida)
y H05 (períodos) están implementadas. El diseño es provisional, pendiente de Figma.
La migración compartida y la Edge Function móvil se desplegaron el 26/09/2026.
El incremento está listo para demostración con el alcance implementado y las comprobaciones autorizadas.
La aceptación completa no se da por aprobada: el responsable decidió posponer las pruebas que crean
cuentas/períodos temporales. También quedan la entrega real de correo, la concurrencia con conexiones
independientes y la ejecución en teléfono. No se presentan esas pruebas como realizadas.

| Historia | Implementación y evidencia | Validación real pendiente |
| --- | --- | --- |
| H01 Acceso | Inicio administrativo real, perfil compartido, API protegida y pruebas de rechazo | Docente y cuenta inactiva reales |
| H02 Recuperación | Formularios, respuestas sin enumerar cuentas, redirecciones guardadas y pruebas del flujo | Recepción del correo, enlace usado/vencido y cambio de contraseña real |
| H03 Cuentas | Alta/edición/permisos, consulta administrativa real, pruebas del backend y de RLS | Altas/ediciones reales y recorrido móvil |
| H04 Salida | Cierre real, retorno al acceso, apertura posterior sin panel; pruebas sin conexión y respuesta tardía | Regresión en otros navegadores |
| H05 Períodos | Consulta real, formularios, validación y pruebas SQL de activación única/historial | Solicitudes simultáneas en conexiones PostgreSQL independientes |

La clave administrativa del backend se comprobó mediante una consulta de solo lectura (HTTP 200).
La RPC pwa_sprint1 está desplegada. Se modificaron esquema y permisos; no se crearon cuentas
ni se enviaron correos durante la verificación remota.

## Configuración
- frontend/.env: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (clave pública).
- backend/.env: SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.
- Reiniciar el backend después de cambiar variables. Nunca poner service_role en frontend ni compartirla en Git.
- No se necesita .env en la raíz.

Supabase Auth ya permite http://127.0.0.1:5173/recuperar y http://localhost:5173/recuperar.
Se guardaron las dos direcciones con autorización expresa. No había direcciones previas en la lista;
no se eliminó ninguna redirección móvil. Site URL permanece en http://localhost:3000; la PWA envía
explícitamente su redirectTo autorizado. Al publicar, añadir la URL HTTPS exacta del despliegue.

## Migración local y base compartida
Los scripts originales database.local/sprint-1.sql y revision-previa.sql se eliminaron localmente
el 27/09/2026 por decisión del responsable, para sustituir esa carpeta por contexto actualizado.
La migración ya está aplicada: quien use el mismo proyecto Supabase no necesita esos archivos.
Para preparar otro entorno se debe obtener una migración actualizada; esta documentación no
sustituye el SQL. Cualquier contenido nuevo con ese nombre debe revisarse antes de ejecutarlo.
Supabase.sql es solo la referencia original: no volver a ejecutarlo sobre la base existente.

La nueva migración crea funciones SQL y permisos, sin cambiar los roles administrador/docente.
Incluye un índice de correo sin distinguir mayúsculas, un índice que admite como máximo un período activo
y una tabla pwa_permisos_usuario para funciones adicionales y carreras.
Se detiene y revierte si encuentra correos duplicados o varios períodos activos.
No elige ni corrige datos automáticamente.

Las pantallas móviles accounts.tsx y periods.tsx ya fueron adaptadas: las consultas y cambios
usan pwa_sprint1 y el alta móvil usa la Edge Function create-account de Supabase. Conservan las funciones y carreras asignadas.
El móvil no depende del backend Node de la PWA. Solo necesita su URL y clave pública de Supabase.
Consultar ACAPLAN/docs/integracion-pwa.md para desplegar la Edge Function y realizar pruebas independientes.
La migración se aplicó en el proyecto yfagadpdxnwcislkocli. create-account se publicó con
verificación JWT activada y sus dos archivos de servidor, sin dependencia del backend PWA.

Para aplicar en otro entorno:
1. Acordar el respaldo y revisar las políticas/triggers actuales con el responsable de Supabase.
2. Comprobar que el esquema coincide con la referencia y que hay una cuenta Auth de administrador
   vinculada por correo con un perfil usuarios activo. La migración no crea ese primer administrador.
3. Revisar en particular triggers de auth.users: si ya crean perfiles automáticamente,
   adaptar el alta para que no compita con accounts.create.
4. Ejecutar el archivo completo en SQL Editor como postgres, en una sola ejecución.
5. Comprobar lecturas con RLS y los flujos de ambas apps antes de dar el sprint por aceptado.

Las políticas restrictivas evitan que una política antigua permisiva habilite escrituras directas.
No eliminan políticas ajenas; una política recursiva o restrictiva preexistente puede requerir ajustes.
Esta migración protege usuarios, periodos y la nueva tabla de permisos. No es una auditoría de
todas las tablas académicas. La columna contrasena histórica permanece por compatibilidad:
las cuentas nuevas guardan un marcador, nunca su contraseña. Auditar datos heredados por separado.

## Comportamiento y permisos
- Sesión validada contra Supabase Auth y perfil activo mediante /api/me.
- Solo administrador lista, crea, edita o desactiva cuentas.
- Correo inmutable en edición para conservar la vinculación con Auth; nombre, cédula, rol,
  estado y funciones editables. No se eliminan perfiles ni historial docente.
- Coordinación requiere al menos una carrera existente. Coordinación y aprobación se guardan
  para sprints posteriores; no habilitan todavía módulos de horarios/aprobación.
- Administrador o función planificador gestiona períodos; los demás perfiles activos los consultan.
- Activar un período desactiva el anterior dentro de la misma transacción. Desactivar permite
  quedar sin período activo; ambas acciones solicitan confirmación.
- Último administrador activo protegido dentro de la RPC con bloqueo transaccional.
  Escrituras privilegiadas desde SQL Editor/service_role son operaciones de mantenimiento
  y deben respetar ese control.
- Cierre local de sesión no cierra la sesión móvil; sin conexión limpia los datos del navegador.
- Revalidación al volver a la ventana y cada 60 segundos. El refresco normal conserva formularios;
  si falla la comprobación se bloquea el panel.
- No se implementan aún instalación PWA, caché sin conexión ni consulta de horarios.

El alta crea primero la cuenta con Auth Admin en el backend y después el perfil por RPC con el JWT
del administrador. Ante rechazo confirmado intenta eliminar solo la cuenta recién creada.
Si la respuesta es incierta no la elimina: revisar Auth y perfiles antes de reintentar.
La contraseña inicial se entrega por un canal privado; no se envía correo de invitación automáticamente.

## API
Todas las rutas siguientes requieren Authorization: Bearer con una sesión válida:
- GET /api/me: perfil autorizado.
- GET /api/workspace: permisos, carreras disponibles y período activo.
- GET /api/accounts, POST /api/accounts, PATCH /api/accounts: cuentas.
- GET /api/periods, POST /api/periods: consulta y creación/edición.
- POST /api/periods/active: activar/desactivar.
GET/HEAD /api/health sigue público y no comprueba Supabase.

## Verificación
Desde la raíz: npm test, npm run lint, npm run build.
Las 23 pruebas del backend y las 22 del frontend usan servicios simulados y no modifican Supabase.
Cubren autenticación, rutas protegidas, errores de JSON, UTF8, límites del formulario,
validaciones, permisos, separación de claves, altas y compensación ante fallos.
Las pruebas SQL se ejecutaron en PostgreSQL embebido local con esquema Auth simulado:
migración idempotente, permisos, RLS frente a políticas abiertas, último administrador,
activación de períodos, duplicados, funciones, cuentas inactivas y creación de perfiles.
Las 12 comprobaciones SQL locales no prueban concurrencia de conexiones independientes.
En el proyecto remoto se comprobaron por separado las políticas y lecturas de administrador/anon.

El frontend cubre respuestas de recuperación sin enumerar cuentas, enlace rechazado, contraseñas
distintas, sesión autorizada/inactiva, recuperación tras recarga, limpieza al salir sin conexión,
respuesta tardía tras salir y permisos/validaciones de formularios de cuentas y períodos.
Se corrigió la pérdida del aviso de enlace inválido cuando el SDK limpia la URL y el bloqueo de
navegación al salir si falla stopAutoRefresh. El temporizador del cierre se cancela al finalizar.
Lint, compilación de producción y smoke de React → proxy Vite → backend pasaron.

## Aceptación ampliada diferida
No ejecutar altas ni cambios de prueba en la base compartida sin retomar la autorización del responsable.
1. Administrador/docente válidos, contraseña incorrecta y cuenta inactiva/sin perfil.
2. Alta, correo/cédula duplicados, edición, funciones y desactivación. Probar último administrador.
3. Docente sin acceso administrativo, incluso al llamar API/RPC directamente.
4. Crear/editar períodos, fechas inválidas, activar otro y verificar conservación del historial.
5. Dos administradores operando a la vez: solo un período activo y no perder el último administrador.
6. Recuperación: correo recibido, enlace permitido, vencido/usado y cambio de contraseña.
7. Cierre normal y sin conexión; actualizar y usar Atrás sin recuperar acceso.
8. Pruebas de regresión de React Native tras acordar su integración.
9. Revisión visual de la interfaz provisional con el equipo y adaptación futura a Figma.


## Verificación de integración móvil
El adaptador móvil pasó sus pruebas sin red (scripts/test-management.cjs).
La comprobación global de TypeScript devuelve 45 errores previos, sin nuevos diagnósticos
respecto de las pantallas originales de Git. El linter global reporta dos errores previos
en login.tsx y un aviso en _layout.tsx. Expo configuró ESLint al ejecutar el comando por
primera vez, agregando sus dependencias de desarrollo y eslint.config.js.
La ejecución en dispositivo y Supabase real sigue pendiente. Expo/React Native instalados
requieren Node >=20.19.4. El 26/09/2026 se actualizó el equipo a Node 24.21.0 LTS y la PWA a Vite 8.3.1.

## Independencia de las aplicaciones
La PWA conserva su backend Node. La app móvil llama directamente a Supabase Auth, RPC
y la Edge Function create-account. Esta última vive en ACAPLAN/supabase/functions y se
despliega en Supabase, sin importar código ni llamar servicios de ACAPLANWEB.
Se eliminó EXPO_PUBLIC_API_URL del ejemplo móvil y de su configuración local si existía.
La Edge Function pasó 9 pruebas de autorización, validación, separación de claves y
compensación. El adaptador móvil verifica el alta sin acceso al backend de la PWA.
Estos son tests locales simulados; no equivalen a un despliegue ni una prueba en teléfono.

## Despliegue y comprobaciones remotas — 26/09/2026
- Se aplicó la migración completa en una transacción, sin respaldo por decisión expresa del responsable.
- Revisión previa: columnas compatibles, ningún correo duplicado, un período activo,
  un administrador activo vinculado a Auth y ninguna política previa en las tablas revisadas.
- Supabase confirmó `Success. No rows returned`; la API REST expone `pwa_sprint1`.
- En una transacción de solo lectura con rol authenticated y contexto del administrador existente,
  la RPC devolvió permiso administrativo, una cuenta y un período. RLS permitió leer su perfil.
- Con rol anon: cero usuarios y períodos visibles, y sin permiso EXECUTE sobre la RPC.
- create-account desplegada: petición sin autorización devuelve 401 del gateway;
  petición con la clave pública devuelve 401 de la propia función (`La sesión no es válida.`).
- Se repitieron las nueve pruebas locales de la Edge Function y las del adaptador móvil: todas pasaron.
- El responsable inició sesión como administrador en la PWA. Se comprobaron el panel, las consultas
  de cuentas/períodos, el cierre confirmado y la apertura posterior sin acceso al panel.
- No se creó ningún dato de prueba. Alta real, recuperación por correo y ejecución en teléfono
  siguen diferidas por el alcance de aceptación acordado.
- Se completó la consulta pública JWKS: HTTP 200, algoritmo ES256. La documentación actual de
  Supabase indica que verify_jwt admite firmas asimétricas; se conserva activado. Una llamada real
  autorizada a create-account continúa pendiente: el rechazo anónimo no prueba ese recorrido.
  Fuente: https://supabase.com/docs/guides/functions/auth-headers
