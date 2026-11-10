# Estado de adaptación del Sprint 3

## Restricciones y capacidad previa — 16 de octubre de 2026

Control de cambios durante la revisión: se vuelven a consultar semestre, datos de años, inventario, tiempos y restricciones al finalizar la recopilación. Un cambio observable devuelve 409 y exige repetir la consulta; una respuesta incompleta devuelve 503. El orden de las filas y datos de otros semestres no provocan conflictos falsos. Esta comparación no es una transacción global ni una autorización para publicar propuestas. No requiere cambios adicionales en Supabase.

Aplicada y verificada en Supabase `sprint-3-restricciones-por-asignacion.sql`. La RPC de solo lectura reutiliza el permiso de `pwa_corregir_asignacion('context')` y devuelve restricciones activas de los docentes de esa asignación, vinculando cuentas históricas mediante `id_usuario`, nunca por coincidencia numérica. No devuelve cédulas ni crea registros. Evidencia: `evidencias/sprint3-restricciones-asignacion-verificadas.png`; código normalizado verificado, ejecución autenticada y acceso anónimo bloqueado.

La revisión de preparación cuenta las posiciones de sesiones regulares de 90 minutos que no coinciden con restricciones de ninguno de sus docentes y no suma alternativas solapadas. Si quedan menos de dos, identifica la asignatura y pide revisar tiempos/restricciones. No elimina restricciones, exige disponibilidad positiva ni deduce sesiones de horas semestrales. No resuelve la competencia entre diferentes asignaturas por un mismo docente/aula; no sustituye al motor ni certifica viabilidad global. Encuentros y nocturno no reciben una frecuencia semanal inventada. La distinción futura entre teoría/práctica con docentes distintos sigue pendiente; actualmente todos los docentes de una asignación se consideran simultáneos.

Pruebas: 153 backend, 98 interfaz, prueba PostgreSQL local de vínculos/permisos, lint, compilación y arranque correctos. No se importaron datos reales, no se cambiaron horarios ni plantillas y no se actualizó Word. El sprint 3 no se declara cerrado.

## Incremento local — 15 de octubre de 2026

Revisión adicional de sedes: el diagnóstico señala los años de encuentros cuya sede no coincide con CUR/instituto cuando hay bloques sabatinos. Ignora diferencias de mayúsculas y espacios exteriores, sin inferir equivalencias entre nombres diferentes. El recolector vuelve a consultar la configuración al finalizar y rechaza cambios concurrentes; esto no convierte todas las consultas en una transacción global. El formulario ofrece nombres de espacios activos del inventario como sugerencias, sin elegirlos ni crear registros. Pruebas específicas de diagnóstico y formulario aprobadas. No se requieren nuevas migraciones para este ajuste.

**Actualización de despliegue:** tras autorización específica del usuario se aplicaron en Supabase `sprint-3-proteger-restricciones.sql` y `sprint-3-sedes-traslado.sql`. Se verificaron ambos triggers activos, RLS de sedes, bloqueo de escritura directa, ejecución autenticada y rechazo anónimo (cinco comprobaciones correctas). Evidencia: `evidencias/sprint3-sedes-protecciones-verificadas.png`. La revisión de preparación consulta esta configuración y señala su ausencia cuando corresponde a encuentros del sábado; incorpora sus cambios en la huella de revisión. No se registraron sedes de ejemplo, cuentas, importaciones ni horarios en producción. Las notas inferiores sobre despliegue pendiente describen el estado anterior y quedan superadas por esta actualización. La integración con futuras propuestas sigue pendiente.

Configuración persistente de sedes preparada localmente: `database.local/sprint-3-sedes-traslado.sql` crea una configuración por semestre con nombres explícitos, versión y último editor. RPC autenticada; administración y planificación escriben, perfiles activos consultan, RLS bloquea acceso directo. La sección de tiempos del semestre incorpora «Traslados entre CUR e instituto los sábados», con consulta manual y rechazo de respuestas tardías o versiones desactualizadas. No infiere nombres ni cambia aulas. Backend e interfaz conectados a la RPC; **la migración todavía no se ha aplicado en Supabase**, por lo que guardar requiere ese despliegue. Pruebas SQL locales verifican permisos, repetibilidad, versiones y semestre activo. Sigue pendiente conectar esta configuración con el contexto de las futuras propuestas, sin atribuir al diagnóstico actual una validación integral.

Traslado sabatino: `backend/src/saturday-travel.js`, conectado al validador local de propuestas, exige un bloque de encuentros completo de 60 minutos libre al cambiar entre CUR e instituto. El contexto debe identificar explícitamente ambos nombres mediante `sedesTraslado: {sede_cur, sede_instituto}`; se contrasta con `aulas.sede`. No se deducen sedes de códigos de aulas o nombres de carreras. Sin esa configuración o ante una sede desconocida, una propuesta del sábado no se declara válida. No extiende la regla al domingo, a otros docentes ni a otro semestre. Revisa todos los docentes asociados y descarta recesos y bloques de otro turno o semestre como espacio de traslado. Falta conectar la configuración persistente de esas dos sedes y el contexto de propuestas; **no es una regla desplegada en Supabase ni un motor de generación**. Pruebas con ejemplos sintéticos únicamente.

La revisión de preparación identifica la versión de sus comprobaciones y una huella SHA-256 de los datos consultados. La pantalla compara consultas sucesivas del mismo semestre y avisa si cambiaron; no vigila Supabase en tiempo real. El orden de filas o recursos no produce un cambio falso. Se conserva el carácter orientativo: no hay snapshot transaccional global ni aprobación de propuestas. La huella no expone los datos personales utilizados internamente. Además, el diagnóstico detecta turnos contradictorios en entregas ya guardadas del mismo año. Pruebas específicas: ocho backend y cuatro de interfaz aprobadas; lint y compilación correctos.

Se mantiene pendiente el cierre del sprint. Sin importar datos reales: los errores de Excel indican hoja, fila y campo, y se rechaza un archivo que asigne dos turnos al mismo año de carrera. Se conserva un único Excel del coordinador.

`database.local/sprint-3-proteger-restricciones.sql` está probado en PostgreSQL local, **no aplicado en Supabase**. Protege ambas APIs de restricciones: rechaza intervalos que afecten clases existentes e informa sus IDs; impide modificar restricciones de semestres inactivos. Las identidades académicas sin cuenta no se confunden con docentes históricos por coincidencia numérica. No mueve clases. Esta protección cubre `horarios`; la integración con futuras propuestas debe probarse al implementar su persistencia.

La batería local de backend/interfaz, lint, compilación y SQL pasó. Los escenarios SQL históricos comprueban compatibilidad, no certifican que sus reglas antiguas representen el flujo vigente. Siguen pendientes, además de las pruebas reales aplazadas: distinguir teoría/práctica con docentes diferentes cuando corresponda, revisar la regla de traslado sabatino y conectar versionado/revalidación con las futuras propuestas. El motor no está implementado. No se actualizó ningún Word ni se modificó la app móvil.

## Registro anterior — 11 de octubre de 2026

Avance parcial, no cierre del Sprint 3 ni declaración de cierre de los sprints 1 y 2. Se completó el bloque de registro de restricciones ya iniciado; corresponde volver a los pendientes de integración del Sprint 2 antes de abrir más funcionalidades.

## Registro de intervalos no disponibles

Se desplegó `database.local/sprint-3-restricciones-comunicadas.sql`: tabla separada y RPC, sin convertir ni borrar disponibilidad histórica. GET/POST `/api/restricciones` conecta la PWA mediante el JWT del usuario. Jefes y administradores registran/corrigen/retiran; coordinadores y docentes consultan. Se valida intervalo, identidad inmutable, estado explícito y versión; se conservan autor y último editor. No hay borrado físico.

`RestriccionesPanel.jsx` diferencia las restricciones nuevas de la consulta histórica y exige recargar tras un guardado fallido. El diagnóstico local ignora las retiradas. La tabla y RPC no modifican ni bloquean todavía escrituras en horarios: falta la integración transaccional y su consumo móvil. Clases juntas y excepciones autorizadas siguen pendientes. No se ejecutaron altas ficticias en producción.

Pruebas: 95 backend, 56 interfaz, SQL local de roles/RLS/versiones, lint, compilación y arranque. Evidencia de despliegue: `docs/evidencias/sprint3-restricciones-registro.png`. No certifica pruebas de usuario real.

## Registro histórico anterior

# Sprint 3: programación, importación y conflictos

Actualización local del 11 de octubre: el validador JavaScript ya usa reglas por turno y restricciones comunicadas; se retiraron los pesos antiguos y los recesos ajenos al grupo. Esto no modifica las funciones SQL descritas en el registro histórico siguiente ni certifica el Sprint 3. Ver el estado vigente en `sprint-2.md` y el Word de traspaso.

> Registro histórico del flujo anterior. La adaptación vigente está en sprint-2.md y en AcaPlan_PWA_Traspaso_para_Gemini.docx. Las escrituras antiguas de programación e importación y la pantalla de preferencias se retiraron de la PWA el 9 de octubre de 2026. No usar los supuestos de 80 minutos ni este cierre anterior como criterios del flujo actual. Las funciones SQL compartidas todavía requieren su migración coordinada.

Actualizado el 28 de septiembre de 2026. Las implementaciones H12–H15 y sus pruebas automáticas están terminadas en el código local. H12, H13, H14 y H15 están aplicadas al Supabase compartido. El responsable autorizó H15 después de revisar su efecto sobre ambas apps; las nueve comprobaciones remotas dieron OK. El sprint no se declara cerrado formalmente: faltan revisión del equipo, aceptación manual por roles y contraste con el diagrama de flujo que preparará el compañero.

## Funciones disponibles

| Historia | Implementación |
|---|---|
| H12 Programación académica | Captura y edición por sección, carga semanal, laboratorio, recursos obligatorios y resumen institucional con filtros y faltantes. |
| H13 Importación XLSX | Plantilla con catálogos, revisión por hoja/fila/campo, diferencias antes/después, confirmación explícita de sustituciones, lote atómico, reimportación sin duplicados e historial del autor. |
| H14 Reglas y preferencias | Restricciones obligatorias fijas, tres preferencias con pesos 1–5, versiones inmutables por período, rechazo de edición sobre versión antigua e identificación de horarios que requieren nueva comprobación. |
| H15 Conflictos | Diagnóstico institucional integrado en backend e interfaz; protección SQL de clases, reservas por docente/aula/sección y revalidación de publicación. Migración compartida aplicada y comprobada. |

La navegación añade **Importar Excel** para administración/coordinación y **Reglas y conflictos** para administración/planificación. Las carreras autorizadas se comprueban también en Supabase. Ocultar botones no es el control de acceso.

## Supuestos que revisaremos con el diagrama de flujo

- Una unidad académica y un bloque lectivo duran **80 minutos**, según la aclaración del responsable.
- Se interpreta `horas_teoricas + horas_practicas` como carga semanal en unidades académicas. Tres unidades equivalen a 240 minutos. No se convirtieron datos anteriores; si el catálogo expresa horas semestrales o de 60 minutos, el equipo debe aclararlo antes de generar horarios.
- `sesiones_semanales × duracion_bloques` debe cubrir esa carga. Una sesión de dos bloques consecutivos se cuenta una sola vez, aunque la tabla compartida guarde una fila por bloque.
- Una selección de recursos vacía significa expresamente que no se requieren recursos adicionales. `NULL` significa información todavía sin declarar.
- La importación utiliza IDs existentes de los catálogos de la plantilla; no crea carreras, docentes ni asignaturas automáticamente. El usuario revisa los cambios antes de confirmar.
- Un período tiene una configuración vigente de preferencias. Pesar una preferencia nunca permite incumplir una regla obligatoria.
- El diagnóstico compara todas las carreras del período. Es una comprobación del estado consultado, no una aprobación ni una publicación.
- Los controles SQL de publicación validan la cobertura institucional del período. El recorrido de aprobación, versiones de propuestas y publicación desde la PWA corresponde al trabajo posterior y se ajustará al diagrama.

La captura completa no demuestra que exista una distribución factible. `habilita_generacion` permanece en `false` hasta integrar el flujo posterior de generación y revisión. El diseño visual también es provisional.

## Importación y reglas

La plantilla contiene `Programacion`, instrucciones y catálogos de períodos, carreras, secciones, asignaturas, docentes y recursos. Se admiten hasta 500 filas y 2 MB comprimidos. Se limitan además el contenido expandido a 8 MB, las entradas ZIP a 1000 y el tiempo de lectura a 15 segundos; la lectura se ejecuta en un worker con límite de memoria. No se evalúan fórmulas ni se aceptan macros o vínculos externos.

La vista previa no modifica programación. La confirmación envía únicamente el identificador del lote y la aceptación de sustituciones; Supabase vuelve a validar sus filas, permisos y catálogos bajo bloqueo. Si cambió la información desde la revisión, se exige revisar otra vez. Si falla cualquier fila, se revierte todo el lote y se conserva su rechazo en auditoría. Repetir una confirmación ya completada devuelve su resultado; importar lo mismo no duplica necesidades. La vista previa caduca a los 30 minutos. Cada usuario consulta sus últimos 20 intentos.

Se añadieron ExcelJS 4.4.0 y yauzl 3.4.0 al backend. El override de uuid 11.1.1 mantiene la llamada CommonJS `v4` utilizada por ExcelJS y elimina la dependencia vulnerable anterior. La instalación terminó sin vulnerabilidades reportadas por npm.

Las preferencias actuales son reducir huecos, distribuir sesiones en días y preferir la mañana. Sus penalizaciones son informativas hasta integrar generación. Cambiar los pesos conserva la versión anterior y no altera horarios publicados.

## Cambios compartidos en Supabase

Orden después de los scripts del sprint 2:

1. `database.local/sprint-3-programacion.sql`: recursos y contrato H12. Aplicado.
2. `database.local/sprint-3-importacion.sql`: tabla de auditoría y RPC transaccional H13. Aplicado.
3. `database.local/sprint-3-reglas.sql`: versiones de reglas, columna de versión del horario y snapshot institucional. Aplicado.
4. `database.local/sprint-3-conflictos.sql`: restricciones y triggers H15. Aplicado con autorización del responsable.

La comprobación previa encontró **0 horarios**, **0 traslapes** y **0 necesidades con recursos sin declarar**. No se crearon cuentas ni registros de prueba en Supabase. No se hizo copia, conforme a la decisión previa del responsable.

H15 reserva intervalos en una tabla protegida mediante una restricción de exclusión GiST: dos escrituras incompatibles no pueden confirmar la misma ocupación de docente, aula o sección. Comprueba capacidad, laboratorio, recursos, docente activo, carga, recesos, bloques de 80 minutos y cobertura completa de disponibilidad. Los cambios incompatibles en catálogos se rechazan indicando las clases afectadas. Las publicaciones se vuelven a validar en la transacción; un período que conserva clases publicadas no puede quedar con sesiones faltantes al eliminar otra clase.

**La app móvil mantiene su conexión propia a Supabase.** Estos controles compartidos también rechazarán sus escrituras incompatibles. Para guardar horarios necesitará programación con recursos declarados y, para publicar, reglas configuradas y cobertura completa. No se modificó ni se compiló la app móvil en este avance; su interfaz debe manejar los errores de Supabase. No necesita conectarse al backend de la PWA.

Los scripts SQL y `Supabase.sql` siguen excluidos de Git por decisión del proyecto. El compañero que se conecta al mismo Supabase recibe los cambios aplicados automáticamente. Para reproducir otra base o las pruebas SQL debe recibir los scripts por separado; no ejecutar el esquema original sobre producción.

## Verificación

- **54 pruebas backend y 41 frontend aprobadas.** Incluyen archivos XLSX reales, permisos, confirmaciones, control de versiones, errores de interfaz y sesiones de varios bloques.
- **37 escenarios SQL aprobados:** 14 de regresión del sprint 2 y 23 del sprint 3. PostgreSQL efímero mediante PGlite; nunca escriben en Supabase.
- Lint sin errores ni advertencias; compilación Vite correcta; smoke frontend → proxy → backend correcto; `git diff --check` sin errores de espacios.
- Se comprobó la exclusión de intervalos en SQL; no se ejecutó una prueba de carga con procesos concurrentes reales. La garantía de exclusión depende de la restricción nativa de PostgreSQL, no solo de la consulta previa.
- Las pruebas de React simulan los servicios. No sustituyen la aceptación manual con cuentas de cada rol ni la revisión de otra persona.

Comandos desde la raíz:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run test:sql
npm.cmd run test:smoke
```

En este equipo se utilizó `npm.cmd` porque el lanzador `npm` de PowerShell apuntaba a una referencia global faltante. No se alteró la instalación global.

## Punto de continuación

`database.local/verificar-sprint-3-cierre.sql` devolvió nueve resultados OK: historial de importaciones, reglas, snapshot institucional, bloqueo anónimo, tablas protegidas, exclusión de intervalos, triggers y compatibilidad con H12 y sprint 1. [Evidencia del resultado](evidencias/sprint3-cierre-supabase.png). No se modificaron datos académicos durante esta verificación. Falta hacer la revisión del equipo y contrastar el diagrama de flujo antes de dar aceptación formal al sprint. La generación automática, gestión de propuestas y recorrido de aprobación/publicación no se presentan como terminados. No se hizo commit ni push.



## Restricciones académicas — 12 de octubre de 2026

Restricciones de docentes importados: migración sprint-3-restricciones-academicas.sql aplicada y verificada en Supabase. Administradores y jefes de departamento pueden registrar, corregir y retirar intervalos de docentes sin cuenta. Los perfiles activos consultan nombres y restricciones sin cédulas. La identidad se distingue por origen (historico o academico) e ID; no se equiparan números entre tablas. El contrato móvil anterior se conserva. No se crearon cuentas ni se modificaron horarios.

Este incremento conecta el registro de restricciones, no su aplicación al guardar o publicar horarios. Persisten validadores históricos de 80 minutos y disponibilidad positiva que deben sustituirse de forma coordinada. No se declara terminado ningún sprint ni el motor.

Verificación: 110 pruebas backend y 73 frontend aprobadas, lint, compilación y smoke correctos. PostgreSQL local comprobó permisos, identidades coincidentes, versiones, retirada y compatibilidad. En Supabase se verificaron RLS, bloqueo anónimo, RPC autenticada, bloqueo de escritura directa y conservación del contrato anterior. No se hicieron altas ficticias ni pruebas funcionales con personas reales en producción.

Siguiente incremento: correcciones de asignaciones importadas. Referencia vigente: AcaPlan_Traspaso_Completo_Proyecto.docx.


## Entrega única del coordinador — 12 de octubre de 2026

Asignación académica tiene una única plantilla provisional y una única carga de Excel por coordinador. El archivo contiene cédula y nombre del docente, código y nombre de asignatura, carrera, año, turno y horas totales del semestre. La confirmación guarda sus relaciones en el modelo académico existente. La consulta permite filtrar carrera, año y turno. Se retiraron las pestañas de carga separadas, el tipo de archivo anos del backend y el resumen de programación histórica del recorrido principal. Los datos anteriores de grupos y tiempos se conservan en una sección secundaria, sin carga de Excel.

No se cambió Supabase ni la app móvil en este ajuste. Año y turno ya se guardaban en la importación académica; no se crearon secciones históricas, matrícula, sedes ni necesidades de espacio por inferencia. Esos datos adicionales siguen pendientes de integración en el flujo único. El inventario de aulas conserva su importación independiente. El compañero desarrolla el motor de generación; esta línea de trabajo continúa con la PWA, permisos, preparación de datos y revisión por sprints.

110 pruebas backend, 73 frontend, lint, build y smoke correctos. Sigue pendiente la edición de asignaciones importadas.


## Correcciones de asignaciones — 13 de octubre de 2026

Estado vigente al 13 de octubre de 2026: trabajamos únicamente en la PWA. La separación de Supabase para la móvil es una decisión pendiente, no una base ya creada. Se implementó y aplicó sprint-3-correcciones-asignacion.sql: administradores y coordinadores pueden corregir docentes asociados y horas totales del semestre dentro de sus carreras y del semestre activo. El motor lo desarrollará el compañero.

La corrección conserva carrera, año y turno. El cambio de turno de todo un año necesita una operación conjunta; no se puede cambiar aisladamente una asignatura. Solo se seleccionan docentes académicos ya asociados a asignaciones de la misma carrera; un docente nuevo entra por Excel. Un docente retirado que ya no conserve asociaciones a esa carrera debe volver a incorporarse por Excel. No se editan nombres ni cédulas desde esta corrección. No se crean cuentas ni se alteran horarios o restricciones.

Pruebas: 113 backend y 76 frontend aprobadas; lint, build y smoke correctos. PostgreSQL local verificó corrección de horas y relaciones, permisos por carrera, semestre activo, falta de docentes, IDs ajenos, bloqueo de lectura/escritura directa y concurrencia entre corrección e importación. En producción se verificaron las tres columnas, las dos reglas automáticas de revisión, los permisos RPC y la huella del Excel. No se crearon datos ficticios ni se probaron ediciones de personas reales en producción.

Siguiente: cambio conjunto de turno por año. No hay commit ni push de este incremento.
