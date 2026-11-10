# Contexto actual de AcaPlan PWA

Actualizado el 5 de noviembre de 2026. Documento de traspaso para el compañero desarrollador y su asistente de IA. Sustituye el contenido del antiguo AcaPlan_Traspaso_Completo_Proyecto.docx. Describe la implementación actual y las decisiones vigentes; los documentos históricos de Scrum no deben usarse por sí solos para reconstruir el flujo.

## Objetivo y alcance

Gestionar la preparación académica y generar horarios automáticamente por departamento para UNAN Managua CUR Chontales. La PWA es el proyecto de esta carpeta. La aplicación móvil es independiente y no depende del backend web; no modificarla al continuar este trabajo. No dar por hecha una separación física de bases de datos: verificar la configuración de cada proyecto sin divulgar sus claves.

El motor ya existe, procede del trabajo de Oneyker y está integrado. No es necesario crear otro motor ni introducir OR Tools para continuar. Es una búsqueda de restricciones en JavaScript con backtracking y MRV. No es un modelo de lenguaje.

## Tecnologías y ejecución

Frontend React 19, JavaScript, HTML y CSS, Vite 8.3.6, iconos Lucide y cliente Supabase. Backend Node.js 24, API HTTP propia y ExcelJS para los archivos académicos. Supabase proporciona PostgreSQL y autenticación. Vitest y Testing Library prueban la interfaz; node:test prueba el backend; PGlite ejecuta comprobaciones de PostgreSQL aislado.

Desde la raíz: npm run dev:backend y npm run dev:frontend en terminales separadas. API habitual 3001 y frontend 5173. npm test ejecuta pruebas backend e interfaz; npm run lint, npm run build y npm run test:smoke completan la comprobación local. npm run test:sql necesita la carpeta local de ensayos SQL, que no se distribuye mediante Git.

Las variables van en backend/.env y frontend/.env, usando los respectivos .env.example. Nunca copiar la clave service_role al frontend, al documento o al repositorio. El archivo de entorno de la raíz no es necesario. Una cuenta docente académica importada no equivale a una cuenta con acceso al sistema.

## Roles y departamentos

Administrador y Director tienen acceso global. El nombre visible es Administrador, sin añadir técnico. Director de departamento tiene alcance de su departamento, registra restricciones y aprueba sus horarios; no genera ni publica. Coordinador de carrera entrega y corrige información de sus carreras mediante un único Excel; no registra restricciones. Docente consulta Horarios publicados y Mi horario, y descarga su información; no administra ni genera.

Los nombres institucionales son Ciencias Económicas y Administrativas; Ciencias de la Educación y Humanidades; Ciencias, Tecnología y Salud. Cada carrera se relaciona con un departamento. El cambio anual de coordinador se resuelve editando sus carreras asignadas. No deducir el departamento de un docente como si fuera exclusivo: puede impartir en varios y sus restricciones deben ser visibles donde corresponda a sus asignaciones.

El catálogo provisional contiene 19 carreras de la oferta 2025 suministrada por el usuario. No representa todas las carreras históricas. No borrarlas al limpiar datos de prueba. La gestión del departamento está integrada con carreras y cuentas; evitar añadir pantallas redundantes.

## Flujo aprobado

1. Administrador o Director configura semestre activo, carreras y departamentos, aulas completas y tiempos por turno.
2. Cada coordinador sube un único Excel con docentes relacionados con asignaturas, carrera, año, turno y horas semestrales. Se revisa la vista previa y se confirma. La misma entrega permite corregir datos y completar necesidades de aula y estudiantes o sede por año.
3. El director de departamento registra las restricciones comunicadas y las necesidades autorizadas de clases consecutivas. Pueden incorporarse antes de generar o después de revisar un primer borrador.
4. Director o Administrador selecciona departamento y genera automáticamente un primer borrador. No hace falta introducir clases manualmente para obtenerlo.
5. Los responsables revisan el borrador. Se corrigen datos o restricciones y se vuelve a generar ese borrador cuando corresponde. Las clases fijadas y los días protegidos se conservan. Cambiar una clase fijada exige autorización y motivo; no autoriza ignorar restricciones.
6. Director o Administrador envía a revisión. El director del departamento aprueba el suyo; los perfiles globales también disponen de aprobación. Solo Director o Administrador publica.
7. Los docentes consultan publicaciones y un horario personal que reúne sus clases de todos los departamentos.

Los borradores pertenecen a un departamento. La revisión no publica; la aprobación tampoco. Los borradores exploratorios no aprobados de departamentos diferentes no reservan entre sí. Las reservas vinculantes proceden de horarios aprobados o publicados. Antes de aprobar y publicar se vuelve a comprobar el contexto; si aparecen cruces, corregir o regenerar la propuesta restante.

## Reglas académicas vigentes

En matutino y vespertino cada asignatura tiene, como regla general provisional, dos sesiones semanales de 90 minutos. Una sesión ocupa dos bloques consecutivos de 45 minutos. No usar 80 minutos. No convertir automáticamente 42 o 56 horas del Excel en horas semanales: son horas totales del semestre.

Nocturno y encuentros usan bloques de 60 minutos; no se ha confirmado su frecuencia semanal. Nocturno no lleva recesos. La generación debe informar los datos pendientes en lugar de inventarlos. Medicina y Bioanálisis conservan provisionalmente las duraciones generales; no se confirmaron excepciones de duración o frecuencia.

Los recesos oficiales se representan en la configuración de tiempos; no son clases. Después del receso puede cambiar la asignatura, el grupo o el aula. Una sesión regular de 90 minutos no atraviesa un receso. Para una pareja de sesiones consecutivas se permite el receso oficial entre ambas, sin otra clase ni hueco adicional.

Hay un solo grupo por año, carrera y turno; no crear primeros A, B o C. El horario se repite durante el semestre. Evitar huecos estudiantiles y respetar ocupación de aulas, docentes, restricciones, capacidad, sede y necesidades de tipo de aula. Sin restricciones comunicadas se considera que no hay restricciones; no bloquear por disponibilidad desconocida.

Solo se usan pabellones y aulas completas. Se retiró del flujo el equipamiento y la división de aulas; conservar registros históricos y compatibilidad donde todavía sean necesarios. El coordinador indica el tipo de aula requerido. No crear gestión de mentorías: modalidad de graduación es otra asignatura y puede tener varios docentes asociados, ocupados simultáneamente. La distribución de teoría y práctica permite docentes diferentes cuando la asignación lo requiere.

## Importación e identidad

La identificación del docente es la cédula, no el número INSS. La asignatura se identifica mediante código; sus nombres siguen siendo visibles. El Excel debe poder incorporar registros académicos sin crear cuentas de acceso. No confundir IDs de usuarios con IDs de docentes académicos.

Se conservan plantillas provisionales y archivos de ejemplo. Las plantillas oficiales y su presentación todavía están pendientes. La referencia original agregada de varias carreras es docs/Horarios ejemplos/Organi_Isem_2026.xlsx. No inferir abreviaturas ambiguas sin confirmación ni atribuir identificadores inventados a personas reales.

## Implementación y base de datos

frontend/src/features/management contiene entrega académica, restricciones, generador, borradores y publicaciones. DashboardPage organiza la navegación por funciones. backend/src/app.js declara rutas; management.js conecta la API con funciones PostgreSQL y aplica validaciones. shared/schedule-ai-solver.js contiene el motor compartido. generation-service.js y generation-worker.js realizan la búsqueda y validan el guardado.

El generador limita concurrencia, tiempo y memoria. Su guardado es transaccional y comprueba huellas del contexto para rechazar propuestas desactualizadas. No sustituir esas garantías por un guardado fila a fila desde el navegador.

Las tablas principales incluyen usuarios, carreras, periodos, registros académicos importados, restricciones, pwa_borradores_horario, pwa_borrador_carreras, pwa_clases_borrador, pwa_movimientos_borrador y pwa_publicaciones_horario. Esta descripción no es un volcado completo del esquema. Consultar las migraciones reales y las funciones antes de modificar contratos o columnas.

Los cambios acumulados habilitaron departamentos, rol Director, alcance departamental, importación académica, aulas completas, restricciones de docentes importados, sesiones consecutivas, componentes teoría y práctica, borradores, revisión, aprobación departamental, publicación y Mi horario. Las funciones antiguas Planificación y Aprobación se archivaron en el nuevo flujo. No reactivarlas como roles paralelos.

database.local contiene SQL y ensayos privados y está excluido de Git por decisión del proyecto. El compañero no recibirá automáticamente esos archivos al descargar la rama. No suponer que una base nueva ya contiene las migraciones ni ejecutar todos los scripts históricos a ciegas. Coordinar una entrega de migraciones revisadas sin credenciales si necesita reproducir otra base.

## Nuevas versiones de horarios

La última migración es database.local/borradores-nueva-version.sql, ejecutada manualmente por el usuario y comprobada después contra la API real. Añade origen_borrador, origen_revision y solicitud_version, además de la función pwa_nueva_version_borrador. La ruta web es POST /api/borradores/versiones.

Director o Administrador puede crear una copia editable de un horario aprobado o publicado. Copia las clases activas y las fijadas, deja historial, conserva intacto el original y usa una solicitud UUID para evitar duplicados al reintentar. Comprueba revisiones, estado y semestre activo. La copia debe recorrer de nuevo revisión, aprobación y publicación.

La interfaz ofrece Crear nueva versión desde Generador y Borradores. No permite regenerar directamente el original aprobado o publicado. Antes de aprobar o publicar consulta conflictos y pendientes, muestra el resultado y exige confirmación. El servidor vuelve a validar durante la transición.

## Auditoría y cambios recientes

Se corrigieron el arranque visual incompleto del generador, la navegación entre restricciones y el borrador elegido, los nombres repetidos de nuevos borradores, la conservación de selección y respuestas tardías, y varios estados de error y reintento. Se eliminaron pantallas y módulos huérfanos del flujo anterior. La revisión de autenticación evita tratar indisponibilidad temporal del servidor como una revocación definitiva de la sesión.

Las tablas y CSV usan lunes a domingo y hora ascendente. Se mejoraron las tablas académicas y semanales respetando el diseño Figma. La cabecera móvil se corrigió para que un nombre largo no aplaste el título. La última inspección verificó 390×844 y 1365×900 sin desbordamiento horizontal de la página. El diseño de Figma no se modifica.

Vite se actualizó a 8.3.6; la instalación comprobada dejó cero vulnerabilidades reportadas entonces. Mantener package-lock.json. No ejecutar npm audit fix --force como reparación automática.

## Pruebas y datos que se conservan

La última ejecución general pasó 186 pruebas backend y 220 frontend, suite PostgreSQL, lint, compilación y prueba de arranque y proxy. Tras el pequeño ajuste visual de aprobación volvieron a pasar sus 26 pruebas y lint y compilación. Esto no demuestra ausencia total de errores ni certifica rendimiento institucional.

Se recorrieron importación, restricciones, generación, fijación, regeneración, revisión, aprobación y publicación con perfiles ficticios. Se verificaron rechazos por rol y carrera y el horario personal de un docente compartido. Las tres publicaciones provisionales reúnen 18 sesiones de 90 minutos, sin cruces finales entre departamentos.

Marca QA-INTEGRAL-8a7d55. Hay doce cuentas ficticias, nueve asignaturas de ejemplo, dos aulas y tiempos matutinos. Los ejemplos permanecen por petición expresa del usuario: no borrarlos sin nueva indicación. Las tres carreras usadas ya existían. Los Excel de prueba están en outputs/qa-integral; no son plantillas oficiales.

También se conservan dos copias del horario de prueba del departamento 1: revisión, creada por la comprobación API y editable; revisión (2), creada visualmente y enviada a revisión, sin aprobar ni publicar. Las publicaciones originales se conservaron. El registro privado database.local/qa-integral-registro.json permite localizar los ejemplos y contiene credenciales: nunca subirlo ni reproducirlo en documentación. Las sesiones del navegador se cerraron y se detuvieron los servidores temporales de la revisión.

El detalle verificable y las capturas están en docs/verificacion-recorrido-generado-2026-11-05.md y docs/evidencias. Las pruebas SQL incluyen atomicidad, reintentos, permisos, revisiones obsoletas y rollback. El bloqueo de acceso al dashboard Supabase fue un problema de permisos del navegador; no un error del SQL. La ejecución manual resolvió la aplicación pendiente; no se afirma que el permiso del dashboard haya quedado reparado.

## Pendientes y secuencia de continuación

Primero revisar el código y este documento, conservar los cambios de la rama y repetir comprobaciones si se modifica funcionalidad. No reescribir el generador ya integrado. Mantener el flujo sencillo con generación automática, revisión departamental y publicación global.

Pendientes: definir y diseñar las plantillas oficiales; confirmar frecuencia semanal de nocturno y encuentros y posibles excepciones de salud; probar recuperación por correo de extremo a extremo; validar importaciones institucionales y rendimiento con volumen completo; completar despliegue y capacidad instalable PWA. En la última auditoría no se encontró manifiesto ni registro de service worker en el frontend: no presentarla todavía como instalable certificada.

Las pruebas provisionales no sustituyen aceptación con autoridades y datos finales. No inventar fechas de entrega, responsables, porcentajes ni reglas pendientes. El manual de usuario se hará en una etapa posterior. Actualizar este contexto cuando cambien decisiones, contratos o el estado real de pruebas.
