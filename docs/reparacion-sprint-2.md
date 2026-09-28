# Reparación de los módulos H06-H12

## Código

- Se corrigieron las llamadas `require` que impedían guardar bloques y programación en el backend ES Modules.
- El contexto reconoce los arrays `funciones` y `carreras` del sprint 1 y comunica `isAdmin` sin exponer credenciales.
- Las pantallas ofrecen edición de asignaturas/secciones/programación únicamente en las carreras autorizadas. El administrador puede seleccionar todas; los listados de secciones y programación usan el período activo.
- Se normalizan los días al enum PostgreSQL (`Lunes`, `Martes`, etc.). Se rechazan cantidades no enteras, booleanos enviados como texto y horas iguales aunque tengan formatos distintos.
- Los conflictos y relaciones inexistentes muestran errores de validación, sin presentarse como fallos inciertos de red.
- Se corrigieron dependencias de efectos React y se instalaron las dependencias ya declaradas en el lockfile.

## SQL compartido

El archivo local `database.local/sprint-2-consolidado.sql` sustituye los siete scripts parciales. Conserva todas las operaciones, corrige permisos, crea programación académica y añade controles de integridad y lecturas de perfiles activos. Los originales y el ZIP se retiraron después de comprobar la actualización desde ellos. El complemento `sprint-2-cierre.sql` completa los controles de asignaciones descritos en [sprint-2.md](sprint-2.md).

No borra datos. La restricción de cantidades se añade como `NOT VALID` para no modificar registros históricos que pudieran existir en otras instalaciones; sí se aplica a nuevas escrituras. Las validaciones de relaciones e intervalos actúan también en escrituras directas a las tablas correspondientes.

Estado del despliegue: aplicado en el proyecto Supabase compartido, tras autorización explícita del responsable para ejecutar el script sin copia. Supabase confirmó `Success. No rows returned`. En la inspección previa, la función estaba incompleta y aún no existía `programacion_academica`.

## Verificación

- Backend: 27 pruebas aprobadas.
- Frontend: 28 pruebas aprobadas.
- Lint: cero errores y advertencias.
- Compilación de producción: aprobada.
- SQL: 12 escenarios aprobados sobre esquema base y otros 12 tras aplicar los scripts originales. Incluyen creación/edición, permisos por carrera, lecturas con perfil inactivo, solapamientos, integridad y repetición de la migración.
- Las pruebas SQL usan una base efímera en memoria. No se crearon cuentas ni registros de prueba en Supabase.
- Comprobación remota de solo lectura: los diez listados responden con contexto de administrador autenticado. Los catálogos están vacíos actualmente; no se realizaron altas reales.
- Verificación posterior: siete comprobaciones `OK` para los diez listados, contexto del sprint 1, RLS de programación, bloqueo de RPC a `anon`, doce políticas restrictivas de perfil activo, tres triggers de integridad y restricción de cantidades positivas. Se puede repetir con `database.local/verificar-sprint-2.sql`.

No se ha realizado una prueba interactiva completa con sesiones reales de cada rol ni una compilación móvil. La app móvil mantiene su conexión independiente a Supabase.

Los resultados anteriores corresponden a la reparación inicial; el estado más reciente y la limpieza están en [sprint-2.md](sprint-2.md).

## Para continuar en otro equipo

Instalar dependencias con `npm run install:all`, configurar los `.env` locales y arrancar ambos servicios con los comandos del README. No volver a aplicar los SQL históricos. Si ambos equipos usan el mismo proyecto Supabase, la migración se aplica una vez a ese proyecto. El SQL se comparte por separado porque está excluido de Git.
