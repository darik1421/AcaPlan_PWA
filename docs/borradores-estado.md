# Borradores y distribución de sesiones — 17 de octubre de 2026

Estado: implementación local y pruebas aprobadas. Las tres migraciones se aplicaron en Supabase el 17 de octubre de 2026, con autorización del usuario. Se verificó que las tres funciones coinciden con el código probado, el acceso anónimo está bloqueado y las cinco tablas tienen RLS sin acceso directo de anon/authenticated. Evidencia: evidencias/borradores-migraciones-verificadas.png.

1. Asignación académica permite distribuir los docentes existentes entre teoría y práctica. La alternativa general mantiene todos los docentes ocupados simultáneamente. En regular conserva dos sesiones de 90 minutos semanales; la separación utiliza una sesión por componente. No infiere frecuencias de nocturno/encuentros ni convierte horas semestrales. Las necesidades de espacio actuales son comunes a ambos componentes.
2. Borradores independientes por semestre y carreras, disponibles para administración y planificación. Permiten preparar clases y corregirlas sin alterar horarios publicados. No generan horarios ni ofrecen publicación/aprobación.
3. Fijar, desfijar, mover y retirar clases del borrador. Toda modificación de una clase fijada exige autorización explícita y motivo. Se conserva historial antes/después; la autorización no elimina restricciones. La versión del borrador evita sobrescribir cambios simultáneos.
4. Revisión de duración, tiempos, restricciones comunicadas, cruces de docentes/años/espacios padre e hijos, capacidad, sede, equipamiento, huecos estudiantiles, consecutividad y traslado sabatino. Dos consultas comparadas detectan cambios observables durante la revisión; no constituyen una reserva global ni una aprobación. Editar o recargar retira el informe anterior. Las sesiones faltantes o datos pendientes impiden presentar la propuesta como completa.

Las correcciones académicas invalidan conservadoramente una distribución ya guardada mediante la revisión de la asignación. El coordinador debe revisarla antes de continuar. No hay administración de mentorías ni nuevas cuentas.

Migraciones, en orden: database.local/sprint-3-componentes.sql, database.local/sprint-4-borradores.sql, database.local/sprint-4-trabajo-borradores.sql. Todas son aditivas respecto a horarios existentes. El primer archivo amplía las operaciones del coordinador; los dos siguientes habilitan propuestas para administradores/planificadores. No contienen importaciones reales.

Validación local: 158 pruebas backend y 101 frontend aprobadas, suite PostgreSQL en memoria aprobada (incluye permisos, concurrencia, aislamiento de propuestas, autorización y auditoría), compilación y prueba de arranque correctas. Los fixtures viven solo en memoria. Los ensayos históricos de SQL no definen las reglas vigentes del nuevo flujo.

Pendientes: recorrido con datos reales cuando el equipo lo autorice; integración con el motor, plantillas finales y aprobación/publicación en una entrega posterior. No se modificó la app móvil ni se actualizaron documentos Word.


## Continuación — 17 de octubre de 2026

- Vista semanal del borrador por carrera/año, con docentes correspondientes a teoría/práctica, aulas y estado de fijación. Las clases superpuestas permanecen visibles; las casillas vacías no certifican disponibilidad. Recesos no se representan como asignaturas.
- Revisión muestra conflictos y pendientes por separado; identifica las clases por carrera, año, asignatura, hora y aula. El acceso directo a corregir conserva la autorización de clases fijadas.
- La revisión exige la versión del borrador vista en pantalla y rechaza cambios concurrentes; no presenta una comprobación nueva sobre una lista de clases anterior.
- Corregido el estado del formulario después de fijar/desfijar/retirar: vuelve a nueva clase y limpia autorización y motivo.
- Validación de este incremento: 7 pruebas backend focalizadas y 6 de interfaz aprobadas; lint y compilación correctos. No se requirieron nuevas migraciones, datos reales ni cambios del motor. No se actualizaron Word ni la app móvil. La aprobación/publicación sigue pendiente.

## Revisión, aprobación y publicación — 20 de octubre de 2026

Implementado y habilitado en Supabase: migración `database.local/sprint-4-publicacion.sql` aplicada con autorización el 20 de octubre de 2026. Se verificaron las cinco funciones contra el código probado, la confirmación exclusiva del backend, las cuatro tablas protegidas, los triggers y el bloqueo anónimo. Las seis comprobaciones resultaron correctas. Evidencia: `evidencias/publicacion-verificada.png`. No se publicó ningún horario real.

- Flujo explícito: en edición → en revisión → aprobado → publicado. Enviar a revisión admite pendientes; aprobar y publicar exigen revisión completa sin conflictos ni datos faltantes. No se calcula ni inventa la frecuencia semanal pendiente de nocturno/encuentros.
- El backend autentica al usuario, consulta con su JWT, ejecuta las validaciones y confirma mediante una función exclusiva de service_role. El cliente no proporciona actor, resultado válido ni filas publicables. Se conserva auditoría de estados.
- SQL compara bajo bloqueo la revisión del borrador, la versión del estado y la revisión de datos académicos. Cambios en clases/carreras de esa propuesta invalidan su aprobación/publicación; otra propuesta independiente no la invalida. Cambios de catálogos, restricciones, usuarios y demás datos compartidos invalidan conservadoramente las aprobaciones, incluso si una fila pertenece a otra carrera o semestre.
- Publicación como copia de consulta con campos limitados: carrera/año/turno, asignatura/componente, nombres docentes, aula/sede y día/horas. Sin cédulas, restricciones ni credenciales. Solo perfiles activos pueden consultar. Copias anteriores se conservan, pero la consulta expone únicamente la última vigente por semestre; una copia obsoleta no vuelve a aparecer como vigente.
- Una publicación sustituta debe incluir las carreras de la publicación anterior. No se mezclan parcialmente escenarios: se deben incluir y revisar juntos para comprobar cruces. Si el semestre conserva horarios en el modelo histórico, se bloquea la publicación hasta conciliarlos; no se borran ni migran automáticamente.
- Descarga CSV con filtros por carrera/año, nueva consulta de vigencia antes de descargar y protección contra fórmulas en celdas. No es todavía un diseño PDF institucional.

Validación: 163 pruebas backend y 108 frontend aprobadas; prueba PostgreSQL local de permisos, transiciones, aprobación inválida, publicación, versiones obsoletas, invalidación por clase/catálogo y propuestas independientes; lint, compilación y arranque correctos. No se publicaron horarios ni se cargaron datos reales. Sin cambios en Word ni móvil.

