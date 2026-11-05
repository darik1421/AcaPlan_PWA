# Conexión del generador al flujo actual

## Implementación

Se conserva el motor de búsqueda con retroceso y MRV recibido de Oneyker. Su implementación compartida está en `shared/schedule-ai-solver.js`; el módulo anterior del frontend reexporta ese motor para mantener sus pruebas y referencias. El algoritmo no se sustituyó por OR-Tools ni por un servicio de lenguaje.

La pantalla conserva sus tarjetas y estilo. Selecciona un borrador departamental existente, con las carreras ya decididas en Borradores, y consulta el backend. No vuelve a consultar secciones, programación o bloques del modelo anterior. Las fijaciones y autorizaciones persistentes se administran en Borradores; los días protegidos conservan las clases guardadas de esos días y evitan añadir otras en ellos.

El adaptador usa asignaciones importadas, sus componentes y todos sus docentes académicos. Forma candidatos con `turnSessions`: en regular son dos sesiones semanales de 90 minutos, cada una con dos bloques contiguos de 45 sin atravesar el receso. Las horas semestrales permanecen informativas y no determinan la frecuencia. Nocturno/encuentros se bloquean con explicación mientras su frecuencia semanal siga sin confirmar.

La búsqueda conserva MRV y sus límites; incorpora comprobaciones del contexto actual para sede/tipo/capacidad de aulas, restricciones de todos los docentes y reservas externas. Antes de aceptar una solución completa se ejecuta `reviewDraft`, que también comprueba huecos, consecutivas con receso y traslados. Una solución encontrada no se anuncia como óptimo global. Se conserva la exploración de alternativas mediante referencias a las posiciones anteriores, usadas únicamente como preferencias de búsqueda.

## API y persistencia

- `POST /api/generador/proponer`: ID del borrador, días protegidos, modo de búsqueda y posiciones previas opcionales. Consulta el contexto bajo los permisos del usuario, calcula en un worker separado y vuelve a consultar para detectar cambios durante el cálculo. Máximo dos cálculos simultáneos por proceso; el worker tiene límites de tiempo y memoria.
- `POST /api/generador/guardar`: ID del borrador, huella y todas las clases de la propuesta. El servidor ignora un actor enviado por el cliente, autentica al usuario, vuelve a revisar la propuesta y rechaza cualquier modificación de una fijada.
- El guardado ya no crea un contenedor vacío. Sustituye las clases no protegidas y guarda todas las nuevas en una transacción. Conserva las fijadas y registra movimientos mediante las operaciones vigentes. No aprueba ni publica.
- Las respuestas antiguas del cálculo o guardado no reaparecen si cambia el semestre. Cambiar borrador, días protegidos o modo retira la propuesta anterior. Ante un guardado incierto se exige consultar el borrador antes de reintentar.

La confirmación usa la clave privada exclusivamente desde el backend. `shared/` debe acompañar a `backend/` al desplegar el servicio; no se necesita instalar otra dependencia ni exponer la clave al navegador.

## Supabase

Aplicada con autorización `database.local/generador-flujo-actual.sql` en el proyecto `yfagadpdxnwcislkocli`:

- `pwa_private.generacion_canonica`: ordena las listas al calcular la huella, para evitar rechazos por un simple cambio en el orden de las consultas.
- `pwa_generador`: consulta coherente del borrador y su ciclo; solo permite preparar borradores departamentales editables del semestre activo con permiso de planificación vigente.
- `pwa_generador_confirmar`: confirmación transaccional, accesible únicamente a `service_role`. Comprueba nuevamente actor activo Director/Administrador, versión del contexto, identidades y conservación de fijadas.
- `pwa_private.ocupaciones_externas`: también incluye las reservas de aulas de otros departamentos cuando el borrador aún no tiene clases. Devuelve intervalos/aulas e identificadores de docentes compartidos, sin nombres ni asignaturas ajenas.

Verificado en el SQL Editor: ambas funciones existen, anon no puede consultar, authenticated puede acceder a la consulta protegida pero no confirmar directamente, service_role puede confirmar y la corrección de reservas está instalada. Aplicar la migración no importó datos, creó clases, cambió roles ni publicó horarios.

## Verificación y límites

Pruebas automatizadas del adaptador, permisos API, worker y pantalla; comprobación local de PostgreSQL con la cadena de migraciones existente: guardado completo, rechazo de huella antigua, rollback total si falla una inserción, protección de fijadas, aislamiento y migración repetible. Los casos incluyen segundo docente compartido, teoría/práctica, reservas de aula sin docente común y consecutivas a ambos lados del receso.

Recorrido visual aislado con datos ficticios: elegir borrador, generar, ver todos los docentes y sesiones, revisar confirmación y enviar el guardado. En esa vista el resultado de persistencia es simulado; el guardado transaccional se verificó por separado en PostgreSQL local. No se atribuye una prueba de generación y guardado con datos institucionales en Supabase.

Evidencias: `evidencias/generador-supabase-2026-11-04.png` y `evidencias/generador-propuesta-aislada-2026-11-04.png`.

Siguen pendientes la aceptación con archivos institucionales, las plantillas definitivas, confirmar las frecuencias semanales no regulares y evaluar rendimiento/calidad con el volumen real. Una búsqueda acotada que no encuentre solución no demuestra que no exista. No se modificó la app móvil ni ningún Word.

Validación final: 184 pruebas de backend y 193 de frontend aprobadas; lint sin errores, compilación y prueba de arranque correctos. La prueba PostgreSQL local del generador también pasó, incluida la estabilidad de las huellas ante listas reordenadas.

## Restricciones y continuación de un borrador — 5 de noviembre

Borradores ofrece accesos a registrar/revisar restricciones y, con permiso de planificación, volver a generar el borrador seleccionado. Restricciones permite regresar al mismo borrador o al generador; el ID se conserva únicamente dentro del semestre correspondiente y el generador lo valida contra su catálogo autorizado. Navegar no ejecuta generación ni guarda cambios. Los directores departamentales conservan sus permisos: para regenerar deben recurrir a Director/Administrador.

Las restricciones siguen perteneciendo al semestre, no a una propuesta aislada. «Conservar días de este borrador» protege todas sus clases guardadas en esos días y evita añadir otras durante esa ejecución. Solo se habilita con un borrador seleccionado; cambiar de selección limpia los días protegidos. No equivale a una restricción permanente ni fija clases de forma persistente.
