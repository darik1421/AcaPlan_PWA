# Contraste entre acuerdos y código — 8 de octubre de 2026

Los acuerdos más recientes del equipo prevalecen sobre la implementación y las pruebas antiguas. Esta revisión no certifica el cierre del Sprint 2 ni que la migración del nuevo flujo esté completa.

| Acuerdo | Contradicción localizada | Trabajo necesario |
| --- | --- | --- |
| Regular matutino/vespertino: 2 sesiones de 90 minutos, unidad de 45 | `schedule-validation.js`, `ProgramacionPage.jsx`, `import-workbook.js` y SQL de sprint 3 conservan 80 | Cuadrícula por turno; migración coordinada de sesiones, bloques, importación y publicación. No reemplazar globalmente por 90 |
| Encuentros: 60 minutos; nocturno sin receso | Los bloques se separan solo por semestre y día | Asociar grupos y bloques a cuadrículas. No inventar una frecuencia semanal de encuentros ni un turno viernes |
| Carga contractual no determina automáticamente duración semanal | `programacion-report.js`, captura y SQL equiparaban horas declaradas con sesiones × bloques | Retirada la conversión a minutos del resumen. Pendiente reemplazar la validación de captura e importación |
| Sin restricciones comunicadas no se bloquea al docente | `schedule-validation.js`, `DisponibilidadPage.jsx` y validadores SQL exigen cobertura positiva | Distinguir restricciones de indisponibilidad de los intervalos disponibles existentes; no invertir datos antiguos automáticamente |
| No hay huecos internos del estudiante | Diagnóstico los detecta, pero se conserva un peso de minimizar huecos; recesos solo por día/semestre | Eliminar su carácter opcional y separar recesos por cuadrícula antes de generación |
| Coordinadores asignan; jefes registran restricciones | Antes el coordinador editaba disponibilidad | Permisos adaptados en SQL y PWA. La semántica de disponibilidad todavía está pendiente |
| Excel inicial con correcciones puntuales | Captura manual conserva protagonismo; plantilla conserva equivalencias antiguas | Adaptar plantilla y entrada principal en su sprint, con vista previa y confirmación |
| Varios docentes pueden ocupar una misma clase | Diagnóstico interno admite varios, captura y persistencia siguen con uno | Recibir la asignación del coordinador y reservar todos; no crear gestión de mentorías |
| Clases fijadas solo se mueven con autorización; semana completa se aprueba | No existe todavía ese recorrido completo | Implementar estados y autorización junto a borradores/generación. Autorizar no permite incumplir restricciones |

## Correcciones realizadas en esta revisión

- Reglas confirmadas recogidas en `backend/src/academic-rules.js` y pruebas explícitas para 45/90/60 minutos. Esto es una base de reglas, no una migración de datos ni un motor completo.
- El resumen ya no convierte tres horas declaradas en 240 minutos ni presenta como completa la comprobación de carga sin cuadrícula.
- El diagnóstico expone `adaptacion_pendiente` y no devuelve `valido` o `completo` mientras utiliza comprobaciones heredadas. Sigue mostrando conflictos parciales; no culpa a los datos del usuario por la adaptación pendiente.
- Se corrigieron pruebas que consideraban completo ese diagnóstico antiguo. Las pruebas restantes del validador heredado siguen pendientes de sustitución con la migración; no son evidencia de cumplimiento del nuevo flujo.

## Punto estable y siguiente trabajo

Se conservan acceso, permisos, semestres y catálogos. No se modificó Supabase ni la móvil durante esta revisión. El siguiente paso es persistir cuadrículas por turno y vincularlas a grupos/bloques, conservando registros anteriores sin clasificarlos por suposición. Después se retiran juntos los validadores y mensajes de 80 minutos. La adaptación de restricciones necesita su propia migración de significado, no una sustitución de etiquetas.
