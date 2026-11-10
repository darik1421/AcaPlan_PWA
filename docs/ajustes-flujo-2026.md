# Ajustes acordados del flujo — 7 de octubre de 2026

El documento principal es `AcaPlan_PWA_Historias_y_Planificacion_SCRUM.docx`, depurado a 21 historias y seis sprints propuestos. H02 y H04 se integran en H01; H22 se integra en H16 y H21. H25 y H26 quedan fuera de la primera entrega. Se retira la ampliación H27–H37: mentorías, sesiones y subdivisiones no tienen módulos propios; la PWA recibe los datos académicos y aplica las reglas necesarias para crear horarios. Las estimaciones son relativas y provisionales.

Estas decisiones sustituyen las suposiciones anteriores que contradigan las respuestas del equipo. PWA y móvil comparten Supabase; la móvil no depende del backend Node de la PWA. Los inventarios y matrículas reales se cargarán después: no bloquean desarrollar pantallas y lógica.

## Reglas y responsabilidades

- Coordinación asigna docentes y asignaturas y define necesidades de espacio/equipamiento. Consulta restricciones, pero no las registra.
- Jefaturas registran restricciones autorizadas. Si no se comunica una restricción, no se presume indisponibilidad.
- El encargado organiza y corrige borradores. Docentes consultan y descargan borradores compartidos y horarios publicados; observaciones fuera de la aplicación.
- Se fijan clases correctas y se reorganiza el resto. Mover una clase fijada requiere autorización previa del encargado; autorizar el movimiento no elimina restricciones.
- Se aprueba la semana completa del grupo. Se conserva la secuencia de borradores revisados hasta publicar; no se solicita comparar escenarios alternativos.
- Regular matutino/vespertino: dos sesiones semanales de 90 minutos por asignatura como regla general; unidad académica de 45 minutos. Encuentros: sesiones de 60 minutos. Nocturno sin receso. Salud requiere excepciones explícitas; no sustituir globalmente 80 por 90.
- Recesos según la cuadrícula correspondiente. Después puede cambiar grupo, docente o asignatura. No debe haber huecos internos para estudiantes; terminar antes es admisible.
- Todos los mentores de modalidad de graduación quedan ocupados durante esa clase.
- El horario semanal se repite durante el semestre. Incluir grupos de los seis PDF salvo Boaco/UNICAM, que se resuelve manualmente.
- Una propuesta inviable permanece pendiente y muestra problemas; no se publica como válida.

## Resumen técnico previo a la reestructuración

| Orden | Historia / resultado | Aceptación principal | Estado |
| --- | --- | --- | --- |
| 1 | Como encargado, detectar huecos reales de estudiantes | Excluir recesos registrados, separar día/sección/período, no contar entrada/salida; mostrar conflicto sin aprobar | Implementado y probado localmente en diagnóstico |
| 2 | Como encargado, configurar cuadrículas por turno y excepciones | 45/90/60 minutos según modalidad, recesos por cuadrícula, compatibilidad con móvil y migración de datos existentes | Pendiente |
| 3 | Como coordinador/jefe, gestionar asignaciones y restricciones según responsabilidad | Permisos en servidor y Supabase; ausencia de restricciones no bloquea; conservar datos existentes | Pendiente |
| 4 | Como coordinador, definir componentes, mentores y espacios necesarios | Teoría/práctica, varios mentores ocupados, capacidad/equipamiento y sedes | Pendiente |
| 5 | Como encargado, corregir borradores preservando clases fijadas | Proponer movimiento, autorizar/rechazar, revalidar todas las restricciones; aprobación semanal | Pendiente |
| 6 | Como docente, consultar y descargar lo compartido | Distinguir borrador revisable y publicado; impedir publicación inválida | Pendiente |

La tabla anterior conserva el resumen técnico de la primera revisión, no la distribución vigente de sprints. Para ejecutar el trabajo se utiliza el Word reestructurado con 21 historias y seis sprints; no se declaran completos los sprints anteriores bajo los criterios nuevos.

## Alcance del primer cambio

Solo diagnóstico local del backend y presentación en la PWA; no se ejecuta SQL ni se cambia la app móvil. Los recesos actuales se identifican por período y día: todavía falta separarlos por cuadrícula/turno. No inferir descansos no registrados. La validación heredada de 80 minutos y disponibilidad explícita sigue pendiente de migración coordinada; el sistema aún no implementa todo el flujo nuevo.

Verificación local: 60 pruebas del backend y 41 del frontend aprobadas; compilación Vite correcta y lint sin errores ni advertencias. No se realizaron escrituras ni pruebas de integración en Supabase. El lanzador npm del entorno falló al buscar npm-cli.js en AppData/Roaming; se ejecutaron directamente Node, Vitest, Vite y Oxlint ya instalados.
