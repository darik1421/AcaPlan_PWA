# Análisis de la entrevista al profesor Matamoros

Fecha del análisis: 6 de octubre de 2026. La fecha de la grabación no se ha verificado.

Actualización del 7 de octubre de 2026 con aclaraciones de Darikson: el bloque base regular dura 45 minutos; dos bloques consecutivos forman una sesión de 90 minutos. Se corrige la terminología del análisis anterior, sin alterar el texto de la transcripción automática. La frecuencia semanal y las excepciones deben expresarse distinguiendo bloques base y sesiones.

Fuente: `audio explicación profesor matamoro.m4a.mp4`, aproximadamente 43:54. Transcripción automática local con Whisper small en español. No se subió el audio a un servicio de transcripción. Este análisis se basa en el texto reconocido, sin cotejo auditivo manual; los nombres propios, códigos de aulas y algunos fragmentos pueden estar mal reconocidos. Las marcas de tiempo permiten revisar el audio original. No se atribuye automáticamente toda intervención al profesor: también hay preguntas y propuestas del equipo.

Se generaron una transcripción legible y un JSONL con los segmentos originales. No se modificaron el código de las aplicaciones ni Supabase durante este análisis.

## Conclusiones principales

1. **La columna de horas del Excel no sirve para calcular directamente la carga semanal del horario.** El profesor explica que se utiliza para contratos y pagos. Además, el Excel facilitado es una versión no terminada que puede contener errores (00:45–01:43).
2. **El bloque base regular es de 45 minutos y una sesión de 90 minutos reúne dos bloques.** Esta distinción fue aclarada por Darikson el 7 de octubre. El audio menciona dos encuentros semanales y clases de 60 minutos para encuentro, pero debe confirmarse la carga semanal usando esta terminología antes de convertirla a reglas del sistema (02:06–03:39; 36:50–37:18).
3. **El profesor indica que los encuentros regulares se distribuyen por defecto en distintos días.** Concentrarlos exige una solicitud canalizada por coordinación y autorización del jefe de departamento (03:51–06:10). No debe confundirse esta autorización con la agrupación habitual de dos bloques base de 45 minutos en una sesión de 90.
4. **La prioridad es evitar huecos para los estudiantes.** Se respetan las restricciones docentes; dentro de las soluciones válidas se busca continuidad y, cuando sea posible, salir temprano. Concentrar la semana de los docentes no aparece como objetivo principal (39:26–43:35).
5. **La coordinación asigna docentes y comunica necesidades; las jefaturas gestionan restricciones.** El profesor propone que los coordinadores consulten las restricciones y que su edición corresponda a los tres jefes de departamento (16:18–17:58; 21:29–24:48).
6. **Hay revisión antes de publicar, y Registro Académico realiza la publicación definitiva.** Una incidencia posterior se corrige mediante el responsable de elaborar el horario y Registro vuelve a publicar, sin repetir toda la revisión docente (33:01–36:38).
7. **Faltaban dos necesidades relevantes: traslados entre sedes y electivos.** El sábado, un docente necesita al menos un bloque libre al cambiar entre CUR e instituto. Los electivos deben reservar espacios y participar en la detección de cruces de profesores (27:06–30:19; 37:37–39:23).

## Respuestas a las 17 cuestiones de requisitos

### 1. ¿Qué significan las horas del Excel y cómo se convierten a bloques?

**Resuelta la interpretación principal; pendiente el origen de los ceros.** Son cifras utilizadas para contratos y pagos de docentes horarios. No debemos dividir 42, 56 o 64 entre semanas para obtener la demanda del generador. El profesor advierte que la organización compartida no es definitiva. No explica específicamente cada fila con cero (00:45–01:43).

La demanda de horario deberá obtenerse de la modalidad y de las necesidades académicas confirmadas de cada componente. Esto es una consecuencia de la entrevista, no una fórmula de importación ya aprobada.

### 2. ¿Cómo se distribuyen teoría y práctica?

**Parcialmente resuelta.** Explica casos con entradas separadas de teoría y práctica. En el ejemplo de Parasitología, una distribución inicial de dos bloques y dos bloques se adapta a uno de teoría y tres de práctica. Las prácticas pueden ir en el turno alterno y los tres bloques normalmente se concentran en un día. No es una regla universal para todas las carreras. Teoría y práctica pueden tener profesores diferentes (09:05–13:15; 24:50–27:06).

Falta un listado de componentes con su distribución real y quién registra la excepción aprobada.

### 3. ¿El horario cambia cada semana?

**Resuelta para el funcionamiento actual descrito.** Se elabora una plantilla semanal que se repite durante el semestre; su duración puede variar (15:20–16:09).

Al final menciona como posibilidad, todavía no confirmada, que encuentro se organice por bimestres. No debe implementarse esa posibilidad como una norma vigente (37:06–37:31).

### 4. ¿Cuáles son las modalidades, duraciones y horas oficiales?

**Parcialmente resuelta.** Darikson aclara que el bloque base regular dura 45 minutos y que dos bloques seguidos forman una sesión de 90 minutos. Falta confirmar la cantidad semanal expresada en bloques base y sesiones. Para encuentro, la transcripción indica clases de 60 minutos, con diez minutos entre clases. Incluye viernes, sábado y domingo, aunque señala que viernes es una situación particular local que debe contemplarse (01:43–03:39; 36:50–37:18).

Falta copiar el catálogo completo de días, bloques y recesos de los horarios oficiales de cada turno. El ejemplo regular común de lunes a jueves y tres bloques por turno no debe extrapolarse a todos los grupos: también existen diurnos con jornadas y prácticas especiales (40:51–43:35).

### 5. ¿Se pueden unir bloques y qué ocurre con el receso?

**Parcialmente resuelta.** Dos encuentros separados son la opción general; se pueden concentrar mediante solicitud y autorización de la jefatura (03:51–06:10). Con la aclaración posterior del bloque base de 45 minutos, es necesario distinguir esa concentración excepcional de la sesión habitual de 90 minutos formada por dos bloques base.

No queda confirmado si el aula y el docente permanecen reservados durante el intervalo entre bloques unidos, ni cómo se representa ese intervalo. La propuesta previa de considerar toda la franja como ocupación continua sigue siendo una propuesta pendiente de validación.

### 6. ¿Quién registra la disponibilidad de los docentes?

**Resuelta como propuesta de funcionamiento expresada en la entrevista.** Los coordinadores comunican las restricciones; los jefes de departamento pueden agregarlas o modificarlas. Coordinación consulta esas restricciones. El docente de planta generalmente debe estar disponible en los turnos requeridos; el docente horario puede comunicar limitaciones (16:18–17:58; 19:31–24:48).

Esto no significa que un profesor de planta deba tener clases en todos los turnos. Tampoco resuelve si cada jefatura podrá editar todos los docentes o solamente los de su ámbito.

### 7. ¿Qué hacemos cuando no se conoce la disponibilidad?

**Pendiente.** La entrevista diferencia disponibilidad amplia y restricciones comunicadas, pero no define expresamente cómo distinguir “todavía no se consultó” de “confirmó que no tiene restricciones”. Tampoco define una casilla de excepción ni su autorización (19:31–21:23).

Por tanto, no corresponde dar por aprobada la propuesta de bloquear toda generación por disponibilidad desconocida, ni asumir que todo registro incompleto significa disponibilidad libre.

### 8. ¿Cómo identificamos a un docente compartido entre carreras?

**Parcialmente resuelta.** Se discuten el identificador institucional/INSS y la cédula para evitar confusiones de nombres. El reconocimiento automático de las siglas no es completamente fiable (18:06–19:20).

Falta confirmar cuál es el dato obligatorio, qué ocurre cuando falta y quién crea o unifica registros. Conservar un identificador interno y evitar duplicados mediante un documento validado sería una decisión técnica posterior, no una autorización para cambiar ahora la base.

### 9. ¿Cómo funcionan los subgrupos y las prácticas simultáneas?

**Parcialmente resuelta.** El profesor y la coordinación organizan la división de estudiantes para las prácticas. El horario debe reservar los bloques requeridos, sin que eso implique asignar automáticamente cada estudiante a un subgrupo. El profesor indica que actualmente no tienen el esquema de un mismo grupo dividido en prácticas simultáneas en distintas aulas (09:05–13:15; 24:50–27:06).

No confundir esa situación con dos grupos distintos utilizando dos áreas independientes de un laboratorio. Falta determinar si la aplicación debe guardar los subgrupos nominalmente o solo las reservas necesarias.

### 10. ¿Qué aulas o laboratorios son compatibles con cada clase?

**Parcialmente resuelta.** Hay espacios especializados y usos que varían por turno. El laboratorio de inglés tiene ocupación propia en la mañana y puede utilizarse para otros componentes en otros horarios cuando esté libre. Se mencionan cinco laboratorios de computación, pero sus códigos no se reconocieron con suficiente claridad (13:12–15:17).

Registro Académico aporta la matrícula por grupo antes del semestre. El profesor advierte que automatizar ubicación y capacidad añade variables, aunque acepta que el equipo contemple ese alcance (06:10–08:42). Falta el catálogo validado de espacios, capacidades, equipamiento y reservas fijas.

Darikson aclara el 7 de octubre que los espacios se organizan por pabellones, con aulas y laboratorios identificados mediante letra y número. Cada espacio puede disponer de televisores, abanicos, aire acondicionado u otros elementos, y algunas aulas pueden dividirse. El equipo recibirá un Excel institucional de inventario para importarlo. La dependencia que lo proporcionará —Secretaría Académica o Administración— sigue por confirmar. Registro Académico como fuente de matrícula no implica que sea también responsable del inventario físico.

Darikson confirma cinco laboratorios de computación y la existencia de un laboratorio de Agroindustria. El número de espacios de Medicina o Bioanálisis y la lista exacta de códigos quedan pendientes del inventario. B4 y B5 se mencionan como ejemplos; A4 y E1 se recuerdan con duda y no se dan por confirmados.

### 11. ¿Qué espacios se pueden dividir y usar simultáneamente?

**Parcialmente resuelta.** Describe dos áreas de Bioanálisis que permiten atender grupos distintos a la vez (13:12–15:17). No confirma una regla general de aulas padre/hija ni la división de todos los espacios mencionados en documentos anteriores.

Falta precisar sus identificadores, capacidades, independencia y si reservar el espacio completo bloquea ambas áreas.

### 12. ¿Quién asigna, genera, cierra, aprueba, publica y reabre?

**Parcialmente resuelta.** Se identifican estas responsabilidades: coordinación asigna profesores/componentes y comunica necesidades; jefaturas gestionan restricciones y canalizan revisión; el encargado elabora y corrige horarios; Registro Académico publica (16:18–24:48; 33:01–36:38).

No se define un cierre de carrera dentro del sistema, ni quién puede reabrirlo o autorizar la generación. Tampoco queda resuelta toda la jerarquía de permisos de ambas aplicaciones.

### 13. ¿Se genera una carrera a la vez o toda la institución?

**Pendiente.** No aparece una decisión explícita sobre la unidad de generación. Sí se describen recursos y docentes compartidos, por lo que cualquier generación parcial necesitará respetar sus ocupaciones existentes. Esa última frase es una consecuencia técnica, no una elección de flujo expresada por el profesor.

### 14. ¿Cómo se revisan, versionan y corrigen las propuestas?

**Resuelto el proceso humano; pendiente el modelo de versiones.** El responsable envía un borrador a las jefaturas; ellas lo comparten con los docentes y reúnen incidencias. Se corrige, se envía un borrador final y, si no hay observaciones, Registro publica el definitivo. Menciona dos o tres días como margen habitual de revisión, no necesariamente un plazo invariable (33:01–36:38).

Si surge una incidencia después de publicar, la recibe el encargado, corrige con Registro y este vuelve a publicar. No se repite toda la revisión docente. La entrevista no especifica cuántas propuestas alternativas pueden coexistir ni cómo se identifica cada versión.

### 15. ¿Qué información se importa del Excel?

**Parcialmente resuelta.** El archivo compartido es una organización no definitiva usada también para fines administrativos. Las cifras de contratos no deben alimentar automáticamente las horas de clase (00:45–01:43).

Falta acordar la plantilla definitiva de importación y la validación de carreras, grupos, docentes, componentes, turnos, sedes y necesidades especiales. La entrevista no certifica cada fila del archivo.

### 16. ¿Quién ve los borradores, los horarios y las observaciones?

**Parcialmente resuelta.** Los borradores circulan por las jefaturas hacia los profesores; las incidencias regresan al encargado. La publicación definitiva corresponde a Registro (33:01–36:38).

Falta decidir cómo traducir esa circulación a pantallas y permisos: acceso de docentes y estudiantes, visibilidad por carrera y posibilidad de registrar observaciones directamente en la aplicación.

### 17. ¿Qué preferencias debe optimizar el generador?

**Resuelta la prioridad principal; pendientes los criterios exactos.** Respetar restricciones docentes, evitar huecos de estudiantes y permitir salida temprana cuando la carga lo permita. La distribución normal regular debe mantener dos encuentros. El encargado puede fijar qué días liberar un último bloque por electivos, viajes de estudiantes o una petición de coordinación (03:51–06:10; 39:26–43:35).

Falta determinar si “sin huecos” será siempre obligatorio o si el sistema podrá mostrar una propuesta con advertencias cuando no exista una solución completa. No corresponde convertir una preferencia en un bloqueo absoluto sin resolver ese caso.

## Requisitos nuevos que deben incorporarse al análisis funcional

### Traslados entre sedes los sábados

En un primer momento se menciona sábado y domingo, pero el profesor corrige después: el caso descrito corresponde **solo al sábado**. Hay grupos en CUR y en un instituto. Para pasar de una sede a otra, el docente debe tener **al menos un bloque libre**, no clases consecutivas. La ubicación de cada grupo debe actualizarse cada semestre (27:06–30:19; rectificación cerca de 29:51).

Faltan los nombres oficiales de las sedes y confirmar si la regla afecta también a cualquier otro participante. No se debe sustituir “un bloque” por una cantidad de minutos inventada.

### Componentes electivos

Se ofrecen fuera de la organización ordinaria de los grupos y deben incluir docente y horario para detectar cruces. El profesor los representa en su programa como grupos adicionales; esa es su solución actual, no una obligación de copiarlos como carreras ficticias en nuestra base (37:37–39:23).

Menciona los últimos bloques del martes en matutino, jueves en vespertino y sábado/domingo en encuentro. Describe cinco componentes ofrecidos en ese momento, con nombres que pueden cambiar. Falta confirmar el viernes y la tabla completa de reservas por turno, además del vínculo con los grupos que pueden cursarlos.

### Excepciones diurnas y prácticas externas

Algunas carreras concentran clases durante todo el día en determinados días y reservan otros para prácticas externas. El ejemplo de Agroindustria no debe convertirse en una regla universal para todas las carreras (40:51–41:35).

## Preguntas restantes para el equipo

1. ¿Pueden proporcionar un horario oficial de cada turno, con días, inicio, fin y recesos, incluido viernes?
2. Cuando se unen bloques, ¿el aula sigue ocupada durante el receso?
3. Si no hay información de disponibilidad de un docente horario, ¿se considera pendiente de confirmar o disponible sin restricciones? ¿Quién lo confirma?
4. ¿Cuál es la distribución aprobada de teoría, práctica y bloques unidos de cada componente que se aparta de la regla general?
5. Pendiente de recibir el Excel institucional de inventario anunciado por el equipo. Con ese archivo se verificarán aulas, laboratorios, divisiones, capacidades y equipamiento; no es necesario reconstruir de memoria la lista de códigos. Las sedes y reservas fijas se confirmarán si no figuran en el archivo.
6. ¿Quién carga los datos, confirma que una carrera está lista, genera el horario, permite corregirlo y lo entrega a Registro para publicar?
7. ¿La generación será conjunta o por carrera? ¿Cuántas propuestas alternativas deben poder guardarse?
8. ¿Quién verá cada borrador y quién podrá enviar observaciones dentro de la PWA y la app móvil?
9. ¿Cuál es el identificador obligatorio de docente y quién evita o resuelve duplicados?
10. ¿Cuál es la tabla oficial de espacios para electivos, incluido viernes, y qué grupos deben tenerlos libres?
11. Si no se puede construir un horario sin huecos, ¿se bloquea la propuesta o se permite una revisión con advertencias?

## Consecuencias para el proyecto

La entrevista y la aclaración posterior de Darikson exigen revisar las suposiciones previas sobre bloques de 80 minutos y distinguir bloques base de 45 minutos de sesiones de 90. También requieren revisar conversión de horas del Excel, disponibilidad, distribución de sesiones y permisos, además de traslados, electivos y revisión/publicación. No demuestran por sí solas que cada una de estas reglas ya esté implementada correctamente.

Como la PWA y la aplicación móvil compartirán estas reglas y Supabase, su implementación deberá ser compatible con ambas. Este documento es análisis de requisitos: no constituye una migración aplicada ni una confirmación de funcionamiento del código actual.
