# Generar primero, revisar el borrador después

Se corrige el paso que obligaba a crear manualmente un borrador antes de iniciar el generador. Desde el generador se elige un departamento; el sistema prepara internamente su contenedor con las carreras activas disponibles, calcula con las asignaciones y restricciones existentes y guarda automáticamente las clases solo si la propuesta es completa y válida. Después ofrece revisar el borrador generado. La aprobación departamental y publicación siguen siendo pasos posteriores.

Continuar un borrador existente conserva la revisión explícita del resultado antes de sustituir sus clases. Se respetan las fijadas y las validaciones vigentes. Si la primera búsqueda falla o queda incompleta, no se anuncia un horario guardado: puede quedar preparado el contenedor vacío, que se reutiliza al reintentar desde el mismo contexto. La creación del contenedor y el cálculo no son una única transacción; el guardado de las clases sí es atómico.

No se cambiaron las pantallas de asignación académica ni restricciones, ni sus permisos. Su organización e intuitividad quedan para revisión posterior solicitada por el responsable. No se modificó el algoritmo ni se requirió una migración adicional.

Ocho pruebas de la pantalla del generador aprobadas, incluyendo el primer recorrido automático y el rechazo del guardado de una propuesta incompleta.
