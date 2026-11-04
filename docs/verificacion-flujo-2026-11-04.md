# Verificación del flujo por roles — 4 de noviembre de 2026

Alcance: PWA. Sin cambios al generador, a la app móvil, a las plantillas definitivas o a los datos de Supabase durante esta revisión.

## Comprobaciones realizadas

| Recorrido | Comprobación | Entorno y resultado |
|---|---|---|
| Administrador / Director | Gestión de cuentas, cinco roles institucionales, carreras y vínculo de departamento en una transacción | Interfaz automatizada y PostgreSQL local: correcto. Navegador aislado: formularios y consulta correctos; no se crearon cuentas reales. |
| Coordinador de carrera | Única carga de Excel, relaciones docente/asignatura, correcciones de sus carreras y rechazo de ámbitos ajenos | PostgreSQL local: correcto. Navegador aislado: una sola entrada de archivo y restricciones sin controles de escritura. |
| Director de departamento | Consulta de entregas, restricciones compartidas de solo consulta, edición del ámbito propio y aprobación del borrador correspondiente | PostgreSQL local: aislamiento, revocación y aprobación correctos. Navegador aislado: consulta departamental y registro ficticio de restricción correctos. |
| Borradores | Clases fijadas, motivo y autorización explícita, aprobación departamental y publicación global | Interfaz automatizada y ciclo Node/PostgreSQL local: correctos. No se publicó un horario en producción. |
| Docente | Mi horario reúne clases de varios departamentos sin mezclar identidades homónimas | PostgreSQL local: correcto. Navegador aislado: consulta y descarga CSV correctas; se inspeccionó el archivo descargado. |

## Fallos corregidos en esta revisión

- Restricciones: la recarga posterior al guardado cambiaba la referencia de la operación y dejaba los controles bloqueados. Ya permite otra operación; si falla la consulta, permite recargar sin repetir el guardado.
- Carreras: un fallo al consultar ya no se presenta como una lista vacía ni habilita nuevas altas con información no comprobada. Al retirar la gestión se descarta la edición pendiente.
- Borradores: perder el permiso de planificación descarta la edición y la autorización previa de una clase fijada. El formulario comprueba permiso, semestre activo y operación en curso antes de enviar.
- Se añadieron pruebas para esos casos, incluida la llegada tardía de una respuesta después de retirar permisos.

## Validación final

- Backend: 172 pruebas aprobadas.
- Frontend: 151 pruebas aprobadas en 33 archivos.
- Lint: sin errores ni avisos.
- Compilación: correcta, sin aviso de paquetes grandes.
- Arranque básico: HTML, transformación React y conexión frontend → proxy → backend correctos.
- Scripts PostgreSQL locales ejecutados: test-guardado-atomico, test-ciclo-integrado, test-horario-personal, test-importacion-academica, test-correcciones-asignacion y test-departamentos-flujo.

Los escenarios SQL usan PostgreSQL en memoria (PGlite), datos sintéticos y funciones SQL del proyecto. El navegador aislado utiliza los componentes reales de la PWA con respuestas API simuladas; no equivale a una prueba completa contra el Supabase desplegado. Las credenciales, RLS desplegadas y el servicio Auth real no se volvieron a probar en este incremento.

No se declara finalizada toda la aplicación ni la aceptación de un sprint por estas pruebas. Continúan aplazadas la aceptación con archivos institucionales reales, las plantillas definitivas y la recuperación de contraseña real. La integración y aceptación del motor corresponden a su línea de trabajo.

No hubo nuevas migraciones, cambios de usuarios reales, publicaciones, commits ni push. El servidor temporal del navegador se cerró al terminar. No se actualizó ningún Word.

## Prueba real posterior contra Supabase

Se completó el recorrido desde la PWA local conectada al Supabase actual. Esta sección amplía las verificaciones aisladas anteriores; no las confunde con una importación institucional definitiva.

Datos temporales identificados con `QA-PWA-20261104-568ff7`: cinco cuentas (Administrador, Director, Coordinador, Director de departamento y Docente), dos carreras de departamentos distintos, un pabellón/aula y una configuración de tiempos. Se conservó el semestre activo original y se comprobó antes que no existieran horarios anteriores, aulas, asignaciones académicas, borradores ni publicaciones que pudieran verse afectados.

Recorrido ejecutado en navegador con Auth y RPC reales:

1. El coordinador inició sesión, subió `QA_asignacion.xlsx`, revisó una fila sin errores y confirmó la importación. El docente se vinculó a la cuenta de prueba por su identidad; la importación no creó otra cuenta.
2. Corrigió la carga de 56 a 42 horas totales del semestre, confirmó el cambio, indicó tipo de espacio `aula` y completó 25 estudiantes y sede de prueba.
3. El director de departamento registró una restricción de miércoles 12:00–13:00. Se verificó que la lista se recargara y que se habilitara un segundo registro.
4. El Director creó un borrador de su departamento y añadió manualmente dos sesiones de 90 minutos. Fijó una clase; la pantalla bloqueó moverla sin autorización. Añadió motivo, autorizó el cambio de lunes a martes y conservó la otra sesión el jueves. El historial registró los movimientos.
5. La revisión devolvió cero conflictos y cero pendientes. El Director envió la propuesta a revisión. El director de departamento inició su propia sesión y la aprobó sin controles para editar clases ni publicar.
6. El Director inició sesión y publicó la propuesta. El Docente inició su propia sesión, consultó las dos clases en Mi horario y descargó el CSV; se inspeccionaron sus dos filas, días, horas, aula y sede.
7. Se cerró sesión desde la PWA.

Comprobaciones negativas realizadas a través del backend real: Docente no administra cuentas; Coordinador no consulta el borrador ni registra restricciones; el Excel de una carrera ajena se rechaza sin guardar; Director de departamento no publica y no recibe la carrera del otro departamento. Se comprobó la correspondencia entre cuenta y docente académico: sus identificadores son distintos y no deben compararse directamente.

Limpieza confirmada por identificadores exactos: se retiraron la publicación, los estados e historiales del borrador, sus dos clases, restricciones, necesidades, relaciones, asignación, asignatura, docente académico, datos del año, configuración de tiempos, aula/pabellón, carreras y las cinco cuentas temporales tanto de usuarios como de Supabase Auth. Se eliminaron las contraseñas del registro local. Se conserva únicamente evidencia local y el registro de la ejecución, sin claves. Las secuencias de identificadores y la versión global de cambios avanzan normalmente; no se fuerzan a sus valores anteriores. El mismo semestre permanece activo.

Evidencia: `evidencias/flujo-real-mi-horario-2026-11-04.png` (tomada antes de retirar los datos ficticios).

No se aplicaron migraciones ni se modificó el generador, el diseño o la app móvil en esta prueba. No se probó recuperación de contraseña ni se finalizaron las plantillas. La aceptación con archivos y reglas institucionales definitivos continúa pendiente. El caso real publicado utilizó un departamento y un docente; los escenarios de docente compartido entre varios departamentos siguen respaldados por las pruebas locales anteriores, sin atribuirles una nueva prueba real en esta ejecución.
