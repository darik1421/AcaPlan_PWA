# Sprint 1 — Acceso, cuentas y períodos

## Estado
H01 (inicio de sesión), H02 (recuperación), H03 (cuentas y funciones), H04 (salida)
y H05 (períodos) tienen implementación local. El diseño es provisional, pendiente de Figma.
No se declara terminado el sprint: falta aplicar la migración compartida,
aplicarla en el entorno acordado y realizar aceptación con cuentas reales.

La clave administrativa del backend se comprobó mediante una consulta de solo lectura (HTTP 200).
No se crearon cuentas, no se enviaron correos y no se modificó la base Supabase durante esta entrega.
La RPC pwa_sprint1 todavía no está desplegada en el proyecto consultado.

## Configuración
- frontend/.env: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (clave pública).
- backend/.env: SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.
- Reiniciar el backend después de cambiar variables. Nunca poner service_role en frontend ni compartirla en Git.
- No se necesita .env en la raíz.

Supabase Auth debe permitir la redirección http://127.0.0.1:5173/recuperar.
Añadir http://localhost:5173/recuperar si se usa ese host y las URL HTTPS del despliegue.
Conservar las redirecciones de React Native. Estas opciones no fueron modificadas.

## Migración local y base compartida
Archivo preparado: database.local/sprint-1.sql, excluido de Git por decisión del proyecto.
El compañero que clone el repositorio deberá recibir este archivo por separado.
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
La migración continúa sin ejecutar en Supabase. El código móvil adaptado requiere esa RPC.

Antes de aplicar en un entorno acordado:
1. Obtener respaldo y revisar las políticas/triggers actuales con el responsable de Supabase.
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
Las pruebas Node usan servicios simulados y no modifican Supabase.
Cubren autenticación, rutas protegidas, errores de JSON, UTF8, límites del formulario,
validaciones, permisos, separación de claves, altas y compensación ante fallos.
Las pruebas SQL se ejecutaron en PostgreSQL embebido local con esquema Auth simulado:
migración idempotente, permisos, RLS frente a políticas abiertas, último administrador,
activación de períodos, duplicados, funciones, cuentas inactivas y creación de perfiles.
No prueban concurrencia de conexiones reales ni las políticas existentes del proyecto remoto.

## Aceptación pendiente en el entorno acordado
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
requieren Node >=20.19.4; el entorno actual tiene 20.17.0. No se cambió Node.

## Independencia de las aplicaciones
La PWA conserva su backend Node. La app móvil llama directamente a Supabase Auth, RPC
y la Edge Function create-account. Esta última vive en ACAPLAN/supabase/functions y se
despliega en Supabase, sin importar código ni llamar servicios de ACAPLANWEB.
Se eliminó EXPO_PUBLIC_API_URL del ejemplo móvil y de su configuración local si existía.
La Edge Function pasó 9 pruebas de autorización, validación, separación de claves y
compensación. El adaptador móvil verifica el alta sin acceso al backend de la PWA.
Estos son tests locales simulados; no equivalen a un despliegue ni una prueba en teléfono.
