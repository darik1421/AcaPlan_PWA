# Verificación del recorrido generado — 5 de noviembre de 2026

Se amplió la prueba PostgreSQL local del generador para recorrer consecutivamente las RPC existentes y la función backend transitionDraft: entrega académica ficticia y restricciones, generación con reservas de otro departamento, guardado transaccional, conservación de fijadas, revisión, envío a revisión, aprobación por el departamento correcto, publicación por Director y consulta en Mi horario del docente académico vinculado. Se comprobó que las dos sesiones publicadas conservan los días y horas guardados por el generador.

Se rechazaron la aprobación por el director de otro departamento, la publicación por un director de departamento, el guardado directo desde authenticated, la huella antigua y la retirada de una fijada. Una inserción inválida revierte toda la sustitución.

La prueba utiliza una base PGlite desechable y datos ficticios, sin escribir en Supabase ni modificar las 19 carreras agregadas. El adaptador y el ciclo se ejecutan conectados; no se trata de una nueva prueba completa de pantallas, sesión real, correo o descarga en navegador. No se declara finalizada la aceptación visual ni institucional.

Ejecución local: node database.local/test-generador-flujo.mjs, también incluida en npm run test:sql.

## Recorrido posterior en navegador y Supabase reales

Se ejecutó la PWA real en una instancia temporal local contra Supabase, con cinco cuentas ficticias y dos carreras de prueba identificadas por QA-PWA-20261105-723d93. Se conservaron las 19 carreras provisionales y los registros anteriores.

El coordinador inició sesión, subió el XLSX real, revisó su vista previa, confirmó la asignación, definió el tipo de aula y completó estudiantes/sede. El director de departamento inició sesión y guardó la restricción del lunes 08:00–09:30. El Director generó automáticamente el primer borrador: se guardaron dos sesiones de 90 minutos, martes y jueves 08:00–09:30, sin crear ni introducir clases manualmente.

El Director revisó y envió el borrador a revisión; el director de departamento lo aprobó sin facultad para publicar. El Director lo publicó. El docente vinculado al Excel inició sesión, comprobó sus dos clases en Mi horario y descargó el CSV: tres líneas con cabecera, martes y jueves, sin lunes. Se cerraron las sesiones.

Fallos encontrados y corregidos: el nombre automático repetía el de un borrador existente y bloqueaba la generación; ahora numera los siguientes. El botón Revisar borrador generado abría solo el listado; ahora transmite el ID al panel de revisión. La numeración se volvió a comprobar con la generación real; la selección directa tiene prueba automatizada de la pantalla y conexión de navegación.

Verificaciones API: El docente recibe exactamente sus dos sesiones publicadas; Docente no administra cuentas; Coordinador no consulta borradores; Director departamental aprueba pero no planifica ni publica; Publicación departamental prohibida aunque se intente por API; Director departamental no recibe la carrera del otro departamento; Coordinador no registra restricciones por API; Un Excel de una carrera ajena se rechaza sin guardarlo; Las 56 horas semestrales no se convierten en frecuencia semanal; Docente no genera horarios por API; Director departamental no genera horarios por API; Las sesiones generadas respetan el lunes restringido.

Limpieza confirmada por IDs: se retiraron publicación, estados, movimientos, clases, borrador, asignación/relaciones, restricciones ficticias, docente académico, datos de año, configuración de tiempos, aula/pabellón, las dos carreras de prueba y las cinco cuentas tanto en perfiles como Auth. Las contraseñas se retiraron del registro local. Se conserva el mismo semestre activo; las secuencias avanzan normalmente.

Validación final de interfaz: 199 pruebas aprobadas, lint sin advertencias y compilación correcta. Este caso real abarca un departamento y una asignatura; no certifica el rendimiento con todas las carreras ni sustituye las pruebas institucionales. Los cruces entre departamentos, componentes y fijadas mantienen su cobertura PostgreSQL local y automatizada; no se les atribuye una nueva ejecución visual real. No se probaron recuperación por correo ni turnos con frecuencias pendientes.

Evidencias: evidencias/flujo-coordinador-real-2026-11-05.png; evidencias/flujo-generacion-real-2026-11-05.png; evidencias/flujo-personal-generado-real-2026-11-05.png.

## Revisión integral con ejemplos conservados — 5 de noviembre de 2026

Por solicitud del usuario, este conjunto NO se retira al terminar. Marca local: `QA-INTEGRAL-8a7d55`; docentes, asignaturas y borradores se distinguen con `[PRUEBA]`. El registro privado para futuras correcciones o retirada está en `database.local/qa-integral-registro.json`, excluido de Git. Contiene credenciales ficticias de prueba: no debe copiarse a documentación pública. Las tres carreras utilizadas ya existían: no deben borrarse al retirar las pruebas.

### Datos cargados

- Tres carreras del catálogo existente: Administración de Empresas (año 2), Ciencias de la Educación con mención en Inglés (año 2), Ingeniería en Sistemas de Información (año 3).
- Nueve asignaturas con 56 horas semestrales, tomadas como referencia de `docs/Horarios ejemplos/Organi_Isem_2026.xlsx`, hoja `CUR-ISEM (2)`: filas 262–264, 12–14 y 82, 83, 85. Los nombres de docentes y sus identificadores son inventados; no se atribuyen cédulas ficticias a personas reales.
- Doce cuentas ficticias: Administrador, Director, tres coordinadores, tres directores departamentales, un docente compartido y tres docentes de carrera.
- Dos aulas completas, una sede/pabellón ficticio, tiempos matutinos con bloques de 45 minutos y dos recesos oficiales de 10 minutos. Capacidad y estudiantes son provisionales.
- Tres borradores departamentales y tres publicaciones, con 18 sesiones de 90 minutos en total. Se mantienen los dos borradores que existían antes y el mismo semestre activo. El catálogo de carreras no cambió.
- Tres archivos de entrega separados se conservan en `outputs/qa-integral/`. Son archivos de prueba de la estructura provisional, no las plantillas oficiales.

### Recorrido comprobado

Se ejecutaron contra la API real y Supabase: vista previa y confirmación de los tres XLSX, necesidades de aula, estudiantes/sede, restricción de un docente compartido, solicitud de sesiones consecutivas permitiendo receso, generación automática, guardado, fijación, regeneración con día protegido, rechazo de huella antigua, revisión, envío a revisión, aprobación por el director departamental correcto y publicación por Director.

Se realizaron 37 comprobaciones afirmativas distintas, además de rechazos de operaciones no autorizadas: Excel de carrera ajena, consulta del borrador por otro departamento, publicación por director departamental y gestión/importación/restricciones/generación por docentes. El CSV personal del docente compartido contiene seis clases y una cabecera; filtrado a Sistemas contiene dos clases y una cabecera.

Las visitas de navegador real cubrieron la entrega del coordinador y sus restricciones de consulta; el menú, horarios, filtros y descarga del docente; y las publicaciones, borradores y navegación Borradores → Restricciones → Generador del Director. El regreso conserva el ID del borrador correcto. No se atribuye una ejecución manual de todos los botones del ciclo: las escrituras, transiciones y comprobaciones entre departamentos se recorrieron mediante la API real, usando las cuentas de cada perfil.

### Hallazgos y correcciones

- Los horarios publicados conservaban el orden de inserción. Ahora publicados, Mi horario, listado de clases del borrador y CSV comparten lunes a domingo y hora ascendente, sin modificar los registros originales. Se verificó en las tablas reales y con pruebas de regresión que incluyen tildes y orden desordenado de entrada.
- La cuadrícula semanal y los días del generador ya estaban organizados de lunes a domingo. Se mantienen.
- Se corrigió una instrucción de necesidades de aula que todavía describía la generación como futura.
- Condición importante: los borradores exploratorios de departamentos diferentes todavía sin aprobar no reservan recursos entre sí. La reserva vinculante proviene de horarios aprobados/publicados. Generar todos los primeros borradores a la vez puede producir coincidencias entre ellos; no se deben aprobar sin una revisión actualizada. El recorrido final aprobó/publicó el primero y regeneró los siguientes contra esas reservas. Se comprobó que las 18 sesiones finales no cruzan aulas ni docentes. El generador explica esta condición con una indicación breve.

### Validación y pendientes

Pasaron 184 pruebas backend y 208 frontend, la suite PostgreSQL local, lint, compilación y prueba de arranque/proxy. Las sesiones ficticias del navegador se cerraron; solo se detuvo el servidor temporal de revisión. Los datos de Supabase permanecen cargados.

Quedan las plantillas oficiales de asignación e inventario (campos finales y diseño), confirmar frecuencias semanales de nocturno/encuentros, aceptación con datos institucionales y rendimiento al volumen completo, recuperación por correo y despliegue/instalación de la PWA. En esta revisión no se encontró manifiesto ni registro de service worker en el frontend actual: la capacidad instalable no se certifica como implementada. La generación existente está integrada y se probó; no está pendiente crear un motor nuevo.

La selección de un borrador aprobado/publicado para regenerar exige crear una nueva versión editable; no se cambia automáticamente el estado ni se retira la publicación. La comprobación funcional de esta operación se detalla a continuación.

Evidencias: `evidencias/qa-integral-coordinador-2026-11-05.png`, `evidencias/qa-integral-docente-2026-11-05.png`, `evidencias/qa-integral-publicaciones-2026-11-05.png`, `evidencias/qa-integral-publicaciones-ordenadas-2026-11-05.png`.

## Nuevas versiones y cierre de la revisión — 5 de noviembre de 2026

El usuario ejecutó manualmente `database.local/borradores-nueva-version.sql` y compartió el resultado satisfactorio del SQL Editor. Después se comprobó la función mediante la API real de la PWA contra Supabase, con las cuentas ficticias existentes. No se ejecutó la migración por una vía alternativa al navegador bloqueado.

- Director creó una copia editable del horario publicado de prueba del departamento 1: se conservaron sus seis clases y sus fijadas. La copia quedó en estado borrador.
- Repetir el mismo identificador de solicitud devolvió la misma copia, sin duplicarla. El director departamental recibió 403 al intentar crearla.
- El generador produjo una propuesta completa sobre la copia, conservando cada clase fijada. Esa propuesta no se guardó ni publicó.
- Se compararon el detalle y las filas publicadas originales antes y después: permanecieron intactos y el original siguió publicado.
- La copia de prueba permanece disponible, como los demás ejemplos solicitados. Su ID y la solicitud están registrados en el archivo privado `database.local/qa-integral-registro.json`; el comprobador es `database.local/qa-nueva-version.mjs`. No se incluyen contraseñas en este informe.

La interfaz ofrece «Crear nueva versión» desde Borradores y desde el generador al elegir un horario aprobado/publicado. Exige confirmación y conserva la identidad de la solicitud cuando no puede confirmar la respuesta, para evitar copias duplicadas. La copia debe recorrer nuevamente revisión, aprobación y publicación.

Antes de aprobar o publicar, la interfaz consulta una revisión actualizada de clases y reservas entre departamentos. Si hay conflictos o pendientes, bloquea la confirmación y muestra los primeros motivos. Una respuesta incompleta permite reintentar sin romper la pantalla ni habilitar la aprobación. El servidor vuelve a validar al ejecutar la transición; la comprobación previa no aprueba ni publica por sí misma.

Validación final de este cierre: 186 pruebas backend y 220 frontend aprobadas; suite PostgreSQL local aprobada, incluyendo copia atómica, idempotencia, migración repetible y rollback completo. Lint sin errores ni advertencias, compilación Vite 8.3.6 correcta y prueba de arranque React → proxy → backend aprobada. Se actualizó la versión de Vite indicada en README. La comprobación visual posterior se detalla a continuación.

Permanecen pendientes las plantillas oficiales, las frecuencias semanales no confirmadas, recuperación por correo, aceptación institucional y rendimiento al volumen completo, y despliegue/instalación PWA. El cierre de estas pruebas no equivale a certificar toda la aplicación como terminada.

## Comprobación visual posterior — 5 de noviembre de 2026

Se abrió la PWA real en el navegador integrado, con el backend conectado a Supabase y cuentas ficticias del recorrido anterior. Director seleccionó un horario publicado desde Generador: la regeneración directa permaneció bloqueada y se ofreció «Crear nueva versión». La creación exigió marcar la confirmación, mostró el estado ocupado y abrió automáticamente la copia correcta en Borradores. Se visualizaron sus seis sesiones y la clase fijada. Esta segunda copia se identifica por el sufijo «revisión (2)» y quedó en revisión tras enviarla desde la interfaz; no se aprobó ni publicó. Su ID figura en `versionVisual` del registro privado de pruebas. Se conserva por instrucción del usuario.

La revisión previa terminó sin conflictos ni pendientes; el botón de aprobación siguió deshabilitado hasta marcar su confirmación y volvió a deshabilitarse al retirarla. Se añadió un estado breve «Sin conflictos ni pendientes detectados» para que el fin de la consulta resulte visible. Con la cuenta de director del departamento 1 solo aparecieron sus borradores; no aparecieron controles para crear versiones, editar clases o publicar. Se cerraron ambas sesiones de prueba.

Se revisaron tamaños de escritorio (1365×900) y móvil (390×844, además del tamaño inicial del navegador). En móvil se detectó que el nombre largo del usuario reducía excesivamente el espacio del título. Se corrigió la cabecera con dos filas y espacio flexible, conservando el diseño de escritorio. A 390 px la cabecera quedó en 110 px de alto, con el título legible; a 1365 px mantuvo sus 72 px. No se detectó desbordamiento horizontal de la página en estas vistas. La consola no registró errores en el recorrido posterior a la corrección de conexión local.

Las 26 pruebas de publicación pasaron tras añadir el estado visible. Evidencias: `evidencias/nueva-version-revision-2026-11-05.jpg`, `evidencias/aprobacion-departamento-2026-11-05.jpg` y `evidencias/aprobacion-movil-corregida-2026-11-05.jpg`. Esta comprobación visual cubre nuevas versiones y aprobación; no es una nueva inspección de todas las pantallas de la aplicación.
