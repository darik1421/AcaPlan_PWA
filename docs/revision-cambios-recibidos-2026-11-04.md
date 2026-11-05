# Revisión de los cambios recibidos — estado al 4 de noviembre de 2026

Esta revisión contrasta el código actual y `cambios realizados.md` con el flujo institucional acordado. No declara completada la integración del generador. No se modificó el motor ni GeneradorPage.jsx en esta pasada.

## Atendido fuera del generador

- Roles, departamentos de carreras/cuentas, aulas completas, borradores departamentales, aprobación y publicación: implementados y comprobados con datos ficticios contra Supabase. Evidencia y alcance en verificacion-flujo-2026-11-04.md.
- Acceso y carga: sustituido el contenedor provisional, corregido el scroll móvil, preservados formularios ante fallos temporales de red, agrupadas revalidaciones y conectada la preferencia Recordarme. Detalle en depuracion-acceso-2026-11-04.md.
- Entrega académica: corregida invalidación del diagnóstico tras completar estudiantes/sede, detalle lateral coherente con filtros y limpieza de filtros que pierden sus opciones.
- Aulas y pabellones: un fallo de carga ya no aparenta inventario vacío ni deja disponibles filas anteriores para corregir. Hay reintento explícito mediante Actualizar inventario. Si desaparece un tipo de aula del catálogo, su filtro se restablece.
- Catálogo anterior de asignaturas: una actualización fallida retira filas y edición anteriores, informa el fallo y mantiene disponible el reintento. No afecta la consulta separada de asignaturas importadas.

## Pendientes identificados en la conexión del generador

Se mantienen sin cambios por la instrucción de no intervenir aún en el generador.

| Prioridad | Hallazgo comprobado en código | Trabajo que requiere después |
|---|---|---|
| Alta | GeneradorPage carga secciones, bloques y programación del modelo anterior. La entrega actual utiliza asignaciones académicas y tiempos por turno. | Definir y probar un adaptador de entrada con los identificadores actuales antes de dar por integrado el motor. |
| Alta | El mapeo toma un docente principal, aplica dos sesiones como valor predeterminado y calcula duración multiplicando bloques por 45. | Respetar docentes/componentes y reglas explícitas por turno; no inventar frecuencia de encuentros o nocturno. |
| Alta | El guardado llama POST /borradores y muestra éxito, pero no envía las clases de result.clases a la persistencia. | Guardado transaccional de propuesta y sesiones, con revisión y resultado completo. Crear el contenedor no equivale a guardar las clases generadas. |
| Alta | La selección de carreras para guardar se obtiene del conjunto de secciones; no existe selección departamental en ese envío. | Ajustar el alcance a borradores separados por departamento y no mezclar carreras por defecto. |
| Alta | Varias consultas del generador convierten cualquier fallo en una lista vacía mediante catch. | Distinguir ausencia de registros de fallo/denegación y bloquear cálculos sobre datos incompletos. |
| Media | La fijación del generador toma el resultado local anterior; no demuestra por sí misma conservación de las clases fijadas y autorizaciones del borrador persistido. | Conciliar fijaciones y versiones con el flujo persistido al integrar la generación. |

No son nuevos requisitos aprobados para el algoritmo: son incompatibilidades o integraciones pendientes respecto al flujo ya acordado.

## Documento recibido

`cambios realizados.md` describe un momento anterior. Incluye equipamiento y un esquema alternativo con versiones_horario y campos nuevos en horarios. No se ejecutarán esas propuestas directamente: la PWA utiliza pwa_borradores_horario, sus clases, ciclo y publicaciones. Sus cifras históricas de pruebas tampoco representan la validación actual.

## Orden de continuación

1. Mantener resueltos los fallos de interfaz, consultas y permisos ajenos al motor.
2. Cuando corresponda intervenir en la conexión del generador, resolver primero contrato de datos y persistencia, después validaciones y aceptación. No habilitar su guardado como entrega completa basándose solo en la creación del contenedor.
3. Plantillas definitivas y aceptación con archivos institucionales siguen aplazadas hasta contar con ellos.

Esta lista conserva separados los cambios ya probados y lo que todavía no se ha implementado. No se actualizó ningún Word ni se cambiaron datos de Supabase en esta revisión.

## Continuación: respuestas tardías en gestión

Cuentas, carreras y semestres distinguen la vigencia de una operación de la vigencia del permiso actual. Si se cambia el perfil o se retira y devuelve un permiso mientras hay un guardado pendiente, su respuesta anterior no debe anunciar éxito, borrar una edición nueva ni ejecutar callbacks de actualización del contexto nuevo. Las consultas anteriores tampoco pueden sustituir los datos del contexto nuevo.

Se reinicia el estado de procesamiento y se vuelven a consultar las listas cuando cambia el ámbito correspondiente. Se añadieron casos de guardado pendiente de carrera, semestre y creación de cuenta con retirada de permiso.

Esta protección es de interfaz: no cancela ni revierte una transacción ya confirmada por el servidor. Al volver a tener acceso se consulta la información guardada; las comprobaciones de permisos del backend y Supabase se conservan. No se modificó el generador ni se requirió una migración.

## Continuación: revalidación del ámbito de trabajo

La comprobación periódica de /me no detectaba por sí sola cambios de funciones o carreras si la cuenta conservaba el mismo rol base. Cada verificación exitosa del acceso ahora provoca una nueva consulta de /workspace.

- Las pantallas conservan sus formularios cuando el ámbito sigue siendo el mismo. El orden de las listas de carreras o funciones no provoca reinicios.
- Si cambian capacidades, carreras o departamento, se descarta el estado de las pantallas anteriores y se consulta con el nuevo alcance. No se asignan cargos ni permisos automáticamente.
- Los errores HTTP conservan su estado para distinguir red/servidor de una denegación. Un fallo temporal del espacio no borra un formulario ya abierto; 401/403 retiran sus controles y datos de pantalla.
- No se solicita la actualización del espacio por una verificación de perfil fallida. No se debilitan la autenticación del backend ni las políticas de Supabase.

Pruebas añadidas: conservación de edición, cambios de permisos con el mismo perfil base, cambios de carreras/departamento, orden de listas, error temporal, denegaciones 401/403 y propagación del estado de errores API. Sin cambios del generador, de la base de datos o del diseño.

## Conexión posterior del generador

La sección de pendientes del generador anterior refleja el diagnóstico previo. Se avanzó en su conexión a asignaciones importadas, borradores departamentales y persistencia completa. La migración autorizada ya está aplicada en Supabase. El detalle, comprobaciones y límites vigentes están en `conexion-generador-2026-11-04.md`; esto no declara aceptación con datos institucionales ni finalización de las plantillas.
