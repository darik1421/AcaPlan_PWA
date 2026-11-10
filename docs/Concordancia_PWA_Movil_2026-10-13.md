# Concordancia entre la app móvil y la PWA

Revisión del 13 de octubre de 2026. Se comparó el código móvil fusionado con el esquema de Supabase leído el 12 de octubre (27 tablas públicas y 30 funciones). No se volvió a consultar producción en esta revisión; la comparación describe ese corte, no certifica cambios externos posteriores.

## Resultado

Se resolvieron 11 archivos en conflicto de la rama móvil Darikson: HEAD 2f7d1c5 frente a MERGE_HEAD a7bdb69 (origin/main, «avance app»). La fusión aún necesita su commit; no se hizo commit ni push. Se conserva el trabajo nuevo del compañero, pero no está conectado al mismo contrato de datos que la PWA. Compilar no significa que esas pantallas funcionen contra la base compartida.

Se conservaron accounts.tsx y periods.tsx de la rama local porque usan pwa_sprint1 y create-account, los contratos compartidos existentes. La alternativa entrante usaba admin-users, usuario_carrera, set_active_period, clear_active_period y escrituras directas de periodos. Esa alternativa no se descartó del historial: permanece en MERGE_HEAD y en las copias de las etapas del conflicto. Sus permisos de carreras todavía no se trasladaron a la pantalla móvil; el servicio actual conserva funciones y carreras al editar otras propiedades.

Se integraron las nuevas acciones de navegación, la pantalla entrante de consulta docente y las versiones coherentes de package.json/package-lock.json. Se conservaron ambas declaraciones de Edge Functions con JWT requerido, sin desplegarlas. El .env real no se modificó. Se excluyó el paquete duplicado de funciones Deno del análisis de Expo. Las copias de los conflictos previos están en .git/codex-merge-backup-20261012, fuera de los archivos a subir.

El inicio de sesión entrante consultaba usuarios.auth_user_id, columna ausente en el esquema verificado. Ahora shared-profile.ts consulta actor_id() y lee el perfil activo por id_usuario con campos explícitos, sin contrasena. No depende del backend Node de la PWA. Errores o falta de actor no provocan una consulta general de perfiles.

## Diferencias que sí afectan el funcionamiento

| Tema | Base compartida y PWA | Código móvil recibido | Consecuencia y decisión pendiente |
|---|---|---|---|
| Identidad de acceso | actor_id relaciona sesión con perfil; usuarios no tiene auth_user_id en el corte | Esperaba auth_user_id | Corregido el acceso móvil; no añadir otra identidad por ejecutar SQL masivo |
| Funciones y carreras | rol administrador/docente, funciones y carreras en pwa_permisos_usuario | Roles coordinacion/jefatura/planificacion y usuario_carrera | No son valores intercambiables. La navegación móvil aún decide por rol; falta traducir las funciones compartidas, incluidas las cuentas con varias funciones |
| Cuentas | pwa_sprint1 y Edge Function create-account | Edge Function admin-users con payload action/carrera_ids | Se conserva el contrato probado para cuentas. No se presume que admin-users esté desplegada |
| Semestres | periods.save / periods.activate en pwa_sprint1, activación protegida | Escrituras directas y set_active_period/clear_active_period | Se conservan las RPC compartidas en la pantalla móvil |
| Docentes importados | pwa_docentes_academicos, cédula como texto, sin cuenta obligatoria | Docentes históricos asociados a usuarios y list_academic_assignment_teachers | No igualar IDs de docentes y pwa_docentes_academicos aunque coincidan; necesita adaptación de consultas y relaciones |
| Entrega del coordinador | Un Excel: cédula, nombre docente, código y nombre de asignatura, carrera, año, turno, horas totales del semestre | Código de grupo, tipo teórica/práctica, sesiones por semana, duración y docentes preexistentes; import_academic_assignment_batch | No es la misma plantilla ni el mismo significado de carga. 42/56 son horas semestrales, no frecuencia semanal. El móvil no registra hoy el mismo modelo académico sin cuenta |
| Asignaciones | pwa_asignaciones_academicas y pwa_asignacion_docentes; consulta y confirmación pwa_importar_asignacion | asignaciones_academicas, asignacion_componentes y tablas de docentes/recursos por componente | Evitar dos fuentes paralelas de asignaciones; acordar adaptación explícita antes del motor |
| Restricciones | pwa_restricciones_unificadas, origen historico/academico, intervalo no disponible, versión, autor y retirada | restricciones_planificacion y escrituras directas; otros tipos de condición e impacto | La restricción escrita por una app no alimentaría automáticamente la otra. Reutilizar o ampliar el contrato compartido, sin invertir disponibilidad histórica |
| Tiempos | pwa_cuadriculas y pwa_grupos_turnos, sesiones regulares de 90 minutos formadas por 45+45 | bloques_clase con modalidad/turno/duración, dias_habilitados_periodo | Esas columnas/tablas no están en el corte. No añadir un turno viernes; encuentros conserva viernes según configuración |
| Inventario | aulas/pabellones históricos; plantilla provisional sin confirmación | sede, espacios principales, import_room_inventory y asignatura_recurso | Hay funcionalidades útiles propuestas, pero requieren migración conjunta. No inventar capacidades, sedes o equipamiento |
| Borradores y publicación | El flujo nuevo y la persistencia global aún no están integrados | versiones_horario, validaciones_horario, horario_docente, snapshots, id_version_publicada | Los módulos de consulta y publicación entrantes fallarán contra columnas/tablas ausentes; no confundir con un error de red o un horario vacío |

La pantalla docente entrante, aunque compila, consulta periodos.id_version_publicada y horario_docente; por eso no se declara funcional en producción. Tampoco se declara lista la importación, los borradores ni la generación móvil. Se mantuvo ese trabajo para reconciliarlo, no se eliminaron sus pantallas o migraciones.

## El generador que ya trae el paquete móvil

20261014000000_sprint5_generation_sharing_consultation.sql define generate_schedule_draft. Es un procedimiento PL/pgSQL: recorre sesiones faltantes en orden, prueba pares bloque/aula y conserva la primera colocación aceptada por save_schedule_session. Tiene límite de intentos y validación final. No es una integración de OR-Tools ni un servicio de IA externo. En ese procedimiento no se observa búsqueda global con retroceso que reorganice colocaciones previas; que deje pendientes no demuestra que no exista una solución.

Filtra un único bloque cuya duración debe ser exactamente la de la sesión. Nuestro modelo puede formar una sesión de 90 minutos con dos intervalos consecutivos de 45. Esa representación debe normalizarse en el contrato de entrada del motor; no hacer equivaler IDs de bloque entre esquemas ni descartar soluciones por representaciones distintas.

El compañero conserva la responsabilidad del motor. Antes de conectarlo hay que acordar: identidad académica de cada docente, asignaciones con todos sus docentes, duración y frecuencia explícitas por turno, intervalos y recesos, capacidad/recursos/sede, restricciones vigentes, clases fijadas y propuesta/versión destino. La salida debe identificar asignación, docentes, espacio, inicio/fin y propuesta, acompañada de pendientes/diagnóstico. Este es un contrato por acordar, no una API ya implementada.

## Riesgo del paquete SQL entrante

No ejecutar en bloque supabase/migrations ni paquete_postgresql_completo sobre el proyecto compartido. La migración 20260930000000_security_and_constraints.sql, aproximadamente líneas 497–519, recorre pg_policies y elimina todas las políticas de 15 tablas antes de poner las suyas. No elimina solo políticas creadas por esa rama: alcanzaría también las políticas actuales de la PWA. Las migraciones siguientes añaden roles, triggers y contratos alternativos. Es necesaria una migración revisada contra las definiciones reales y sus consumidores, no un segundo esquema inicial.

Tampoco el lado PWA está completo: el corte conserva validadores históricos de 80 minutos y disponibilidad positiva. La regla vigente es 90 minutos en regular y solo restricciones comunicadas; esa deuda debe resolverse antes de habilitar escritura/publicación del nuevo modelo. No presentar todo lo de la PWA como correcto por defecto.

## Inventario reproducible de referencias ausentes

Este inventario busca llamadas literales .from y .rpc en src. No cubre referencias dinámicas, todas las relaciones anidadas ni el cuerpo completo de cada SQL; por ello son al menos estos objetos.

### Tablas ausentes en el corte

- `asignatura_recurso`: `src/components/academic-assignments-screen.tsx:82`, `src/components/catalogs-screen.tsx:97`, `src/components/schedule-drafts-screen.tsx:132`.
- `asignaciones_academicas`: `src/components/academic-assignments-screen.tsx:83`, `src/components/schedule-drafts-screen.tsx:128`.
- `asignacion_componentes`: `src/components/academic-assignments-screen.tsx:84`, `src/components/schedule-drafts-screen.tsx:129`.
- `asignacion_componente_docente`: `src/components/academic-assignments-screen.tsx:85`.
- `asignacion_componente_recurso`: `src/components/academic-assignments-screen.tsx:86`.
- `dias_habilitados_periodo`: `src/components/blocks-screen.tsx:81`.
- `versiones_reglas_planificacion`: `src/components/planning-rules-screen.tsx:44`.
- `restricciones_planificacion`: `src/components/restrictions-screen.tsx:73`, `src/components/restrictions-screen.tsx:211`, `src/components/restrictions-screen.tsx:212`.
- `versiones_horario`: `src/components/schedule-drafts-screen.tsx:125`, `src/components/shared-schedules-screen.tsx:77`.
- `validaciones_horario`: `src/components/schedule-drafts-screen.tsx:174`.
- `horario_docente`: `src/app/(docente)/index.tsx:90`.
### Funciones ausentes en el corte

- `list_academic_assignment_teachers`: `src/components/academic-assignment-import-screen.tsx:101`, `src/components/academic-assignments-screen.tsx:132`, `src/components/academic-assignments-screen.tsx:157`, `src/components/restrictions-screen.tsx:98`, `src/components/schedule-drafts-screen.tsx:159`.
- `import_academic_assignment_batch`: `src/components/academic-assignment-import-screen.tsx:295`.
- `save_academic_assignment_component`: `src/components/academic-assignments-screen.tsx:232`.
- `set_period_enabled_days`: `src/components/blocks-screen.tsx:128`.
- `preview_class_block_revalidation`: `src/components/blocks-screen.tsx:162`.
- `update_class_block_time`: `src/components/blocks-screen.tsx:261`.
- `replace_subject_resources`: `src/components/catalogs-screen.tsx:232`.
- `replace_room_resources`: `src/components/catalogs-screen.tsx:246`.
- `save_planning_rules`: `src/components/planning-rules-screen.tsx:89`.
- `preview_restriction_impact`: `src/components/restrictions-screen.tsx:163`.
- `import_room_inventory`: `src/components/room-inventory-import-screen.tsx:247`.
- `create_schedule_draft`: `src/components/schedule-drafts-screen.tsx:227`.
- `validate_schedule_version`: `src/components/schedule-drafts-screen.tsx:244`.
- `generate_schedule_draft`: `src/components/schedule-drafts-screen.tsx:262`.
- `share_schedule_version`: `src/components/schedule-drafts-screen.tsx:281`.
- `publish_schedule_version`: `src/components/schedule-drafts-screen.tsx:297`.
- `save_schedule_session`: `src/components/schedule-drafts-screen.tsx:342`.
- `set_schedule_item_fixed`: `src/components/schedule-drafts-screen.tsx:377`.
- `remove_schedule_session`: `src/components/schedule-drafts-screen.tsx:387`.
- `replace_section_subjects`: `src/components/sections-screen.tsx:227`.
- `list_schedule_version_teacher_links`: `src/components/shared-schedules-screen.tsx:96`.
- `decide_schedule_version`: `src/components/shared-schedules-screen.tsx:155`.
- `log_schedule_export`: `src/components/shared-schedules-screen.tsx:201`.

## Orden recomendado para la concordancia

1. Mantener cuentas y semestres sobre el contrato compartido existente, y completar el acceso móvil a funciones/carreras sin inventar nuevos roles en producción.
2. Adaptar la importación y consulta móvil a la entrega académica única. Reutilizar pwa_importar_asignacion con su preview/confirm, validación de permisos y huella; el parser móvil debe validar las mismas reglas. No copiar secretos al cliente ni llamar al servidor PWA.
3. Adaptar las restricciones móviles al contrato unificado y la identidad origen+ID. Los coordinadores consultan; los jefes y administradores editan.
4. Diseñar juntos la migración pendiente de inventario, tiempos, clases y versiones. Aprovechar el trabajo entrante donde corresponda, conservando datos y definiendo compatibilidad temporal.
5. Publicar un contrato de entrada/salida para el motor, independiente de React/React Native. Probar ambas apps con las mismas fixtures locales antes de una nueva migración compartida.

## Comprobaciones y límites

TypeScript sin errores; ESLint sin errores ni avisos; tres pruebas locales de shared-profile aprobadas. Expo regeneró las rutas tipadas y Metro exportó el paquete JavaScript/Hermes Android. No es un APK firmado ni una prueba en un teléfono. No hubo datos ficticios en producción, despliegues, cambios de Supabase, commit ni push. Las pruebas del acceso usan cliente simulado; falta aceptación real de inicio de sesión y módulos compatibles.
