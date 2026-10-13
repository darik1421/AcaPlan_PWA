# Estado de adaptación del Sprint 3 — 11 de octubre de 2026

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

