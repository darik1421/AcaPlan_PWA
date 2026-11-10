# Sprint 2: catálogos, grupos, espacios y tiempos

Alcance de la planificación vigente: H06, H07, H09, H10 y H08. H11 corresponde al Sprint 3. H12 es un avance del sprint 3 y no se utiliza para dar por terminado el sprint 2. El diseño sigue siendo provisional.

## Revisión provisional de Excel del 12 de octubre de 2026

Se conectaron tres plantillas provisionales nuevas y su vista previa: años de carrera, asignaturas/docentes e inventario. El archivo anterior queda dentro de consulta histórica. Los años incluyen carrera, año, turno, modalidad, sede y estudiantes; el semestre viene del contexto activo. Asignaciones admite varios docentes por asignatura y necesidades de espacio. Inventario incluye sede, pabellón, código, tipo, capacidad, equipamiento y espacio principal opcional.

El backend comprueba permisos antes de leer: administración/coordinadores para datos académicos y administración/planificador para inventario. Rechaza carreras fuera de alcance, IDs inválidos/inactivos, asignaturas de otra carrera/año, duplicados, fórmulas, archivos dañados y tamaños excesivos. No deduce matrícula ni frecuencia nocturna/encuentros. Regular exige dos sesiones semanales. Rechaza padres ausentes y ciclos de espacios en el archivo. El formato provisional aún usa IDs de catálogos existentes; no crea docentes o asignaturas nuevos.

Endpoints nuevos: POST /api/preparacion/plantilla y /api/preparacion/revisar. Solo leen catálogos; no habilitan confirmación ni escriben archivos del usuario al disco. La PWA muestra campos legibles, errores por fila y advertencia explícita de que no se guardó. Rechaza respuestas de otro semestre y descarta resultados al cambiar de pantalla/semestre.

Alcance pendiente: guardar los datos nuevos con migración y validación transaccional compartidas, confirmar/importar y tratar actualizaciones de registros existentes, adaptar INS en cuentas de ambas apps, excepciones autorizadas y revalidación. No afirmar que solo restan plantillas y motor. Decisión provisional del usuario: Medicina y Bioanálisis no cambian duración ni frecuencia; aplicar las reglas generales de su turno hasta recibir información oficial. No crear excepciones especiales por ahora. No se necesitan los Excel reales para continuar el desarrollo de la confirmación, pero sí para validar el formato final.

Verificación: 105 pruebas backend y 69 interfaz aprobadas; lint, build y smoke correctos. No hubo escrituras en Supabase ni cambios móviles. Sprint 2 sigue abierto.

## Organización de pantallas acordada el 12 de octubre de 2026

Navegación ajustada al flujo acordado: se retiraron las entradas independientes Grupos, Demanda de carga y Bloques y recesos. Asignación académica reúne Asignaturas y docentes con Años de carrera y turnos; explica la recepción por Excel, revisión y futura generación. El usuario aclaró que hay un único grupo de estudiantes por año de carrera, no secciones A/B/C. La configuración de tiempos está dentro de Semestres y se ofrece a quienes tienen permiso para gestionarla. Los descansos se consideran intervalos sin clase, no asignaturas ni filas obligatorias del horario publicado. No se cambia el esquema ni se fusionan registros existentes: la reorganización es de interfaz. La carga definitiva de Excel y la generación continúan pendientes.

Verificación: 66 pruebas de interfaz (suite y prueba de navegación adicional), lint, compilación y arranque.

## Incremento del 12 de octubre de 2026

H09: la consulta de grupos incorpora búsqueda y filtros combinables de carrera, año y turno, incluido «Sin turno asignado». Solo muestra el semestre activo. Los controles distinguen códigos repetidos con carrera e identificador; guardar utiliza id_seccion y la versión, no el código. Una cantidad de estudiantes ausente se señala como pendiente, sin inventar cero o treinta. Las selecciones no guardadas se descartan al cambiar el alcance de permisos. Un fallo de consulta no se presenta como ausencia de grupos y permite reintentar.

H08: al corregir aulas la PWA exige una lista explícita de recursos y un tipo. Omitir recursos no los retira; una lista vacía explícita sí expresa esa intención. Omitir el tipo no convierte un laboratorio en aula común. La corrección abierta se descarta al perder el permiso.

Verificación: 97 pruebas backend y 65 interfaz aprobadas (suite completa más prueba adicional focalizada), lint, compilación y arranque. Quince escenarios SQL en memoria, incluido mismo código en carreras/semestres distintos y rechazo de duplicado dentro de la misma carrera y semestre. Esta suite SQL también conserva comprobaciones del contrato histórico: no acredita que la generación ni todas las reglas nuevas estén integradas.

No se cambió el Supabase compartido ni la app móvil en este incremento. La corrección HTTP de aulas es propia de la PWA; no afirmar que la escritura móvil o SQL directa recibe esta validación nueva. Continúan pendientes modalidad/sede de grupos, importaciones definitivas, excepciones y revalidación; el sprint no está cerrado. Siguiente incremento: completar el modelo compartido de datos de preparación e importación, conservando compatibilidad y sin reactivar altas manuales descartadas.

## Pendientes contrastados con la planificación vigente

El sprint sigue abierto. H06/H07 cuentan con consulta y correcciones; su recepción definitiva por Excel no está completa. H09 requiere completar modalidad/sede y validar en el entorno compartido la identidad por carrera y semestre; su contrato SQL ya se comprobó localmente sin asumir un código global único. H08 requiere importación del inventario con vista previa y sus datos de sede, pabellón, capacidad, tipo y recursos. La plantilla definitiva y el inventario oficial siguen pendientes, pero no bloquean toda la lógica de preparación.

H10 ya protege las configuraciones en uso. En este incremento la protección devuelve los IDs de las clases afectadas; el backend muestra hasta 20 IDs positivos y descarta detalles internos. Aplicado en Supabase sin modificar clases ni permisos. Quedan las excepciones autorizadas de salud y el procedimiento completo de revalidación de cambios sobre clases persistidas; rechazar un cambio no equivale a tener ese procedimiento terminado.

Pruebas: 96 backend, 60 interfaz; lint, compilación y arranque aprobados. El ensayo SQL local comprobó rechazo y detalle exacto de dos clases, conservación de versión y edición permitida de nombre. No se probaron escrituras ficticias en producción ni concurrencia multiconexión. Evidencia remota: `docs/evidencias/sprint2-clases-afectadas.png`. El SQL permanece en `database.local/sprint-2-proteger-turnos.sql`, excluido de Git por decisión del responsable: compartirlo aparte para reproducir otro entorno.

## Estado actual de la adaptación — 11 de octubre de 2026

### Protección de configuraciones con clases — aplicada en Supabase

Se aplicó `database.local/sprint-2-proteger-turnos.sql` y se verificó el trigger activo en Supabase. Rechaza cambios estructurales de bloques/turno/semestre cuando un grupo vinculado tiene clases; cambiar solo el nombre sigue permitido. Configuraciones sin clases permanecen editables. No se eliminaron ni reprogramaron datos. El backend traduce `TURNO_CON_CLASES` a un conflicto comprensible y la pantalla conserva la corrección ante un rechazo.

Prueba local: `node database.local/test-proteger-turnos.mjs`, con migración repetida, edición sin clases, rechazo por RPC y actualización directa, rollback de versión, cambio de nombre y protección del vínculo. PGlite no acredita concurrencia multiconexión. La protección toma un bloqueo transaccional de horarios durante cambios estructurales. Resultado remoto: ejecución correcta y trigger habilitado; no se insertaron datos de prueba. Evidencia: `docs/evidencias/sprint2-proteccion-turnos.png`.

Verificación de este incremento: 92 pruebas backend, 53 interfaz, lint y compilación correctos. No requiere modificar el código móvil ni concede permisos nuevos. Esta protección puntual no sustituye la migración de restricciones y programación todavía pendiente.


### Núcleo local de sesiones y restricciones

Se adaptó `schedule-validation.js` a la configuración por grupo: regular requiere dos sesiones de 90 minutos mediante dos bloques contiguos de 45. Encuentros/nocturno conservan 60 y requieren frecuencia explícita. Las horas del catálogo ya no son equivalencias de carga. Se comprueba pertenencia al turno, docentes asociados, cruces, recursos, capacidad y huecos.

La entrada `restricciones` representa intervalos no disponibles comunicados y autorizados. `[]` no bloquea; un dato ausente o inválido impide validar. No se transforma la disponibilidad histórica. `student-gaps.js` solo descuenta recesos del turno del grupo y admite sesiones explícitas de varios bloques. Se retiraron pesos y penalizaciones de preferencias, junto con la agrupación heurística de filas históricas.

El ejemplo XLSX conserva su estructura provisional; sus instrucciones ya no indican 80 minutos, equivalencias con horas del catálogo ni una importación activa. No se habilitaron nuevas escrituras HTTP, publicación ni generación. Las restricciones de clases juntas y excepciones autorizadas siguen pendientes, al igual que la persistencia SQL compartida. No se modificó Supabase ni la móvil.

Pruebas al finalizar este incremento: 91 backend y 52 interfaz. El diagnóstico permanece marcado como adaptación pendiente hasta completar su integración.

### Depuración de asignaturas y mensajes

Se retiraron el alta manual de asignaturas y sus rutas de escritura POST/despachador. El catálogo conserva consulta y corrección PATCH para apoyar el flujo de Excel con ajustes en la app. La pantalla distingue las horas del catálogo de las dos sesiones regulares de 90 minutos; no convierte valores históricos automáticamente. Cambiar las carreras autorizadas o perder permisos cierra la corrección abierta.

El backend rechaza horas vacías en lugar de convertirlas silenciosamente a cero, conserva el cero explícito y valida años de estudio entre 1 y 10. La consulta de asignaciones muestra errores y permite reintentar, sin presentar una consulta fallida como un grupo sin clases. Sus etiquetas usan Grupo y distinguen las sesiones del registro anterior.

Se corrigieron mensajes heredados que pedían 80 minutos o disponibilidad positiva obligatoria. Ahora identifican el rechazo SQL antiguo y la adaptación pendiente; esto no sustituye la migración de esas reglas compartidas. No se modificaron Supabase ni la app móvil.

Verificación: 83 pruebas de backend, 52 de interfaz, lint, compilación y arranque básico aprobados. Se actualizó el documento de traspaso. Pendientes: persistencia compatible con sesiones nuevas, restricciones comunicadas, entrada definitiva por Excel y motor de generación. El Sprint 2 sigue en adaptación.

## Registro de la adaptación — 9 de octubre de 2026

### Grupos y turno en el mismo recorrido

La consulta y corrección de grupos incorpora ahora la asignación de los bloques de su turno, con permisos por carrera y semestre. Bloques y recesos queda dedicado a configurar los tiempos; ya no contiene una segunda gestión de grupos. Se retiraron el alta manual de grupos, su ruta y despachador, y la matrícula predeterminada de 30 estudiantes. La futura importación académica proporcionará esos datos; las correcciones de registros existentes se conservan.

Cambiar de semestre o perder permisos cierra la corrección abierta y el guardado comprueba de nuevo ese contexto. Una lista de asignaturas omitida se rechaza en vez de vaciar silenciosamente el grupo; una lista vacía explícita conserva la semántica de corrección y sigue sujeta a las protecciones SQL existentes. Se valida el rango de año de estudio y no se inventa una matrícula cuando falta.

Este paso no crea grupos reales ni modifica Supabase. Sigue pendiente la entrada definitiva por Excel, los datos institucionales restantes y su conexión completa con programación y restricciones. No equivale al cierre del Sprint 2.

### Depuración de navegación y operaciones de la PWA

Se eliminó la pantalla antigua de preferencias de planificación y su formulario de pesos. No se ofrece minimizar huecos como preferencia ni priorizar la mañana fuera del turno asignado. Se retiraron también los controles decorativos sin acción de búsqueda y notificaciones.

La plantilla de ejemplo y el historial anterior de importaciones se encuentran dentro de la consulta de programación, para cuentas autorizadas. Ya no hay una pantalla separada de importación ni controles para subir o confirmar archivos con el contrato anterior. El ejemplo sigue descargable; no representa la plantilla definitiva. Restricciones sustituye a Disponibilidad en el menú y conserva la consulta histórica en una sección desplegable, sin convertir intervalos disponibles en restricciones.

Se retiraron las rutas HTTP y sus despachadores de escritura antiguos de programación, disponibilidad positiva, bloques sin turno y altas de inventario; también la confirmación/vista previa de importaciones y las operaciones de la antigua pantalla de reglas. Llamarlas directamente ya no alcanza Supabase. Se mantienen las lecturas, la corrección de aulas y los catálogos aún útiles, cuentas, semestres y configuración por turno.

No se modificaron las funciones SQL compartidas ni los datos reales o la app móvil. Las utilidades de lectura de Excel y diagnóstico que pueden reutilizarse se conservan con sus pruebas, pero no constituyen una importación definitiva ni un generador activo. La siguiente etapa es adaptar persistencia y restricciones antes de reintroducir escrituras de programación.

### Lectura de bloques por turno en la consolidación

El resumen de programación ya consulta las configuraciones y sus vínculos a grupos mediante las RPC desplegadas, con el JWT del usuario. Muestra la configuración de cada grupo y distingue vínculos ausentes, semestres incompatibles y configuraciones que no forman sesiones completas.

`backend/src/turn-sessions.js` calcula posiciones temporales posibles: dos bloques consecutivos de 45 minutos para una sesión regular de 90, o un bloque de 60 en encuentros/nocturno. No une intervalos a través de recesos, huecos o días distintos. Cuenta capacidad sin sumar alternativas solapadas y señala si ni siquiera caben las dos sesiones de la regla general regular. No inventa frecuencia semanal para encuentros/nocturno.

Esta comprobación es únicamente temporal: no acredita capacidad para toda la carga del grupo, aulas o docentes disponibles ni viabilidad del horario. Tampoco transforma programaciones históricas; sus duraciones siguen pendientes de adaptación y la generación permanece deshabilitada en el diagnóstico. No se ejecutó otra migración SQL en este paso.

### Retirada de formularios del flujo anterior

Se retiraron de la PWA los formularios de alta/edición de programación que exigían equivalencias de 80 minutos, así como su eliminación manual. La consulta de asignaciones y el resumen permanecen; las correcciones de asignación se restablecerán con el modelo adaptado, no enviando datos nuevos al contrato antiguo.

También se retiró el formulario de disponibilidad positiva y el mensaje que declaraba no asignable a un docente sin intervalos registrados. La pantalla conserva la consulta histórica y distingue esos registros de las futuras restricciones comunicadas. Se eliminaron las altas manuales de aulas, pabellones y recursos; se conserva la corrección de aulas existentes. La importación de inventario y las plantillas definitivas siguen pendientes. La plantilla de programación existente se identifica como ejemplo anterior.

Esta limpieza no elimina registros ni modifica Supabase o la móvil. Los validadores y contratos compartidos anteriores permanecen pendientes de su migración coordinada. Las pruebas de frontend actualizadas verifican consulta sin escrituras antiguas y corrección de aulas mediante PATCH.

El Sprint 2 está **en adaptación al flujo acordado**. El cierre técnico de septiembre descrito más abajo corresponde al flujo anterior y no certifica el nuevo flujo.

- La pantalla «Bloques y recesos» integra configuraciones por turno y la asignación de estas a cada grupo, dentro del mismo semestre.
- Matutino y vespertino usan unidades de 45 minutos: dos consecutivas forman una sesión de 90. Nocturno y encuentros usan unidades de 60; nocturno no admite recesos. La frecuencia semanal de encuentros/nocturno no se deduce de la del regular.
- Administradores y responsables de planificación configuran los bloques. Los coordinadores asignan configuraciones únicamente a grupos de sus carreras; los administradores conservan acceso superior.
- Se aplicó en Supabase la migración aditiva `sprint-2-grupos-turnos.sql`, sobre `sprint-2-cuadriculas.sql`. Comprueba semestre, permisos y versión al guardar. No se crearon registros académicos de prueba ni se alteraron clases existentes. [Evidencia](evidencias/sprint2-grupos-turnos.png).
- Se retiró el formulario anterior de bloques de la PWA. Los registros históricos quedan en consulta. Se mantienen los contratos SQL anteriores que todavía utilizan el motor y la app móvil.
- Un guardado cuya respuesta no se confirma requiere recargar las asignaciones antes de reintentar, para recuperar la versión real del registro.

Verificación: suite de 72 pruebas backend y 48 frontend aprobada; después de la depuración pasaron nuevamente las 12 pruebas de bloques y formularios, más dos de asignación de grupos (incluido un caso nuevo de respuesta incierta). Lint, compilación y prueba de arranque frontend/proxy/backend correctos. Las pruebas SQL locales de permisos, semestres y concurrencia pasaron. Las pruebas de interfaz usan servicios simulados; no equivalen a una prueba con escrituras reales en Supabase.

**Pendiente para completar la adaptación:** conectar las configuraciones al motor de clases, retirar conjuntamente la regla heredada de 80 minutos de sus validaciones y SQL, y sustituir la disponibilidad positiva obligatoria por restricciones comunicadas. La asignación de configuración a un grupo aún no genera ni modifica sus horarios. No se modificó la app móvil en este paso: conserva su conexión independiente a Supabase.

## Registro del cierre anterior (septiembre; no describe la adaptación actual)

## Estado anterior

Implementación técnica completada y comprobaciones automáticas aprobadas. Las migraciones `sprint-2-consolidado.sql` y `sprint-2-cierre.sql` están aplicadas al Supabase compartido, con autorización del responsable. El 27 de septiembre de 2026 se confirmaron nueve comprobaciones remotas con resultado `OK`. El cierre formal requiere la revisión de otro integrante y la aceptación visual/manual que exige la definición de terminado del documento Scrum. No se presenta esa revisión humana como realizada.

## Criterios y evidencia

| Historia | Implementación y comprobaciones |
|---|---|
| H06 Carreras | Nombre obligatorio y único, búsqueda, edición y baja lógica. Coordinación por carreras del sprint 1; no se cambian los identificadores compartidos. Pruebas de permisos por función/carrera y de campos obligatorios. |
| H07 Asignaturas | Código único, carrera, año y horas no negativas; búsqueda y filtros combinados por carrera/año. Baja lógica conserva historial; SQL rechaza nuevas vinculaciones o clases con asignaturas inactivas. Las sesiones por sección se guardan separadamente en la programación. |
| H08 Espacios | Código único por pabellón, capacidad entera positiva, tipo, recursos y estado. Consulta por capacidad, tipo y recurso. SQL rechaza desactivar espacios con clases de períodos activos o no finalizados y rechaza nuevas clases en espacios inactivos. No se eliminan referencias históricas. |
| H09 Secciones | Código, carrera, año, período, cantidad de estudiantes y vínculos con asignaturas. Rechazo de duplicados y referencias incompatibles; conservación de vínculos usados en clases. No se incorpora matrícula individual. |
| H10 Bloques | Día/período e intervalos válidos, recesos y rechazo de superposiciones. Intervalos adyacentes admitidos. No se permite cambiar o borrar bloques usados ni asignar clases a un receso. |
| H11 Disponibilidad | Intervalos por docente/período sin superposición; clases completamente cubiertas por disponibilidad. Cambios incompatibles se rechazan indicando IDs de clases afectadas, sin limitar la comprobación a una carrera. No se puede insertar, ajustar o publicar una clase que incumpla estos controles. El flujo de versiones y aprobación corresponde a sprints posteriores. |

Los controles del complemento SQL también se aplican a escrituras de la aplicación móvil: esta mantiene su conexión independiente a Supabase. No se ha compilado ni validado la interfaz móvil durante este cierre.

## Pruebas reproducibles

```powershell
npm test
npm run lint
npm run build
npm run test:smoke
npm run test:sql
```

- Backend: 28 pruebas aprobadas.
- Frontend: 30 pruebas aprobadas, incluidos filtros y permisos de las pantallas.
- SQL: 14 escenarios en PostgreSQL en memoria. Incluyen RPC, políticas, conservación de datos, migración repetida, intervalos, asignaciones activas y relaciones históricas.
- Lint: cero errores y advertencias.
- Compilación: correcta.
- Smoke: HTML, transformación React y proxy Vite hacia el backend correctos.
- Supabase: nueve comprobaciones de solo lectura aprobadas, incluidos los siete triggers de cierre y la conservación de vínculos históricos al editar secciones. Evidencia: [resultado en Supabase](evidencias/sprint2-cierre-supabase.png).

Las pruebas SQL necesitan `Supabase.sql` y `database.local`, excluidos de Git por decisión del proyecto. Instalar su dependencia con `npm --prefix database.local ci`. No leen `.env` ni escriben en Supabase. Las pruebas React usan servicios simulados: no equivalen a recorrer todas las pantallas con una sesión real.

## Limpieza realizada

Se enviaron a la Papelera los scripts temporales de reparación, cachés de trabajo, scripts SQL parciales y ZIP antiguos, assets de la plantilla sin referencias, `.env.example` redundante de la raíz y lockfile de la raíz que no gestionaba dependencias. Se desinstalaron `xlsx` y `react-dropzone`, que no utiliza el código actual; se podrán incorporar cuando se implemente H13.

La prueba útil de conexión se conserva como `scripts/smoke.mjs`. Las evidencias finales se trasladaron a `docs/evidencias`. Se conservan los `.env` reales y sus ejemplos dentro de frontend/backend, el documento Scrum, esquema de referencia, migraciones vigentes, pruebas y dependencias necesarias.

## Revisión de aceptación pendiente

Otro integrante debe revisar los cambios y recorrer los seis módulos con cuentas reales de administrador, coordinación y planificación, en escritorio y móvil. No se crearon datos de prueba en la base compartida por la preferencia previa del responsable. Las comprobaciones remotas se limitan a metadatos y lecturas autenticadas.

Solo después de esa aceptación se debe marcar el sprint como cerrado formalmente en la planificación Scrum. El código aún debe integrarse en GitHub cuando el responsable decida subirlo.

## Adaptación al flujo nuevo — 8 de octubre de 2026

Primer paso de depuración: consultar otro día ya no cambia el día del bloque en edición. Cambiar de semestre o perder permiso de gestión cierra el formulario; el guardado también comprueba el contexto. La tabla muestra los minutos reales de cada intervalo, sin asumir que todos duran 80 minutos.

La configuración por turno y modalidad sigue pendiente: todavía no se sustituye la regla heredada de 80 minutos del motor ni las validaciones SQL. Esa adaptación debe incluir las cuadrículas, recesos y consumidores del dato conjuntamente; mostrar la duración real no equivale a haberla terminado. No se modificó Supabase ni la app móvil en este paso.

Verificación de la conexión de turnos al resumen: 78 pruebas backend y 51 frontend aprobadas; lint sin errores ni advertencias y compilación correcta. Los nuevos casos cubren sesiones de 90 minutos, recesos, cambios de día, alternativas solapadas y conservación de la programación histórica sin conversiones automáticas.

Cierre de esta depuración: 78 pruebas backend y 47 frontend aprobadas; lint sin errores, compilación y arranque correctos. Se actualizaron el README y el Word de traspaso. No se declara terminado el Sprint 2 ni implementado el motor generador.


## Estado vigente — 12 de octubre de 2026

La decisión final es cédula, no INS. Se aplicó `database.local/sprint-2-importacion-academica.sql` en Supabase y se verificaron sus tablas y permisos. La PWA permite plantilla, revisión y confirmación de asignaciones con docentes académicos sin cuenta, códigos de asignatura y horas semestrales. Inventario y años solo tienen revisión. No genera horarios ni integra todavía identidades nuevas en restricciones históricas. La consulta remota confirma validadores históricos de 80 minutos y disponibilidad positiva pendientes de sustitución coordinada. El detalle está en `AcaPlan_Estado_Base_de_Datos.docx`; este estado prevalece sobre notas históricas anteriores. No se declara cerrado ningún sprint por este incremento.


## Restricciones académicas — 12 de octubre de 2026

Restricciones de docentes importados: migración sprint-3-restricciones-academicas.sql aplicada y verificada en Supabase. Administradores y jefes de departamento pueden registrar, corregir y retirar intervalos de docentes sin cuenta. Los perfiles activos consultan nombres y restricciones sin cédulas. La identidad se distingue por origen (historico o academico) e ID; no se equiparan números entre tablas. El contrato móvil anterior se conserva. No se crearon cuentas ni se modificaron horarios.

Este incremento conecta el registro de restricciones, no su aplicación al guardar o publicar horarios. Persisten validadores históricos de 80 minutos y disponibilidad positiva que deben sustituirse de forma coordinada. No se declara terminado ningún sprint ni el motor.

Verificación: 110 pruebas backend y 73 frontend aprobadas, lint, compilación y smoke correctos. PostgreSQL local comprobó permisos, identidades coincidentes, versiones, retirada y compatibilidad. En Supabase se verificaron RLS, bloqueo anónimo, RPC autenticada, bloqueo de escritura directa y conservación del contrato anterior. No se hicieron altas ficticias ni pruebas funcionales con personas reales en producción.

Siguiente incremento: correcciones de asignaciones importadas. Referencia vigente: AcaPlan_Traspaso_Completo_Proyecto.docx.
