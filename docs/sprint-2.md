# Sprint 2: catálogos y disponibilidad

Alcance del documento Scrum: H06, H07, H08, H09, H10 y H11. H12 es un avance del sprint 3 y no se utiliza para dar por terminado el sprint 2. El diseño sigue siendo provisional.

## Estado

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
