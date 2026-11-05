# Revisión visual — 5 de noviembre de 2026

Se mantiene la identidad visual existente: colores, tipografía, navegación y componentes. No se modifica Figma ni Supabase.

- Generador: se recupera la presentación visible de las opciones de búsqueda y días protegidos, conservando los textos breves.
- Tablas de gestión: separación de filas, contraste suave, cabeceras y acciones más legibles.
- Asignación académica: tabla a ancho completo, nombre de asignatura destacado, código y año en segunda línea. El detalle seleccionado queda desplegable; las correcciones siguen disponibles en cada fila.
- Vista semanal del borrador: cabeceras por día, horas fijas al desplazar horizontalmente y tarjetas de clase con borde institucional.
- Horarios publicados: días destacados y horas legibles.
- Distribución: filtros adaptables, paneles apilados cuando falta espacio y desplazamiento horizontal dentro de las tablas.
- Navegación: cambiar de sección vuelve al inicio; revalidar permisos en la misma sección conserva el desplazamiento y los formularios.

## Comprobación

Se inspeccionaron las once vistas principales con datos ficticios aislados, en escritorio y a 390 × 844: generador, asignación académica, restricciones, borradores, horario personal, publicados, semestres, carreras, aulas, asignaturas y cuentas. También se revisaron una vista semanal poblada y el formulario de nueva cuenta. No se crearon datos en Supabase para esta revisión visual.

Las capturas están en `docs/evidencias/visual-*.png`; la tabla académica ampliada está en `visual-tabla-entrega-2026-11-05.png`. La comprobación final de asignación académica en móvil dio 375 px de ancho y 375 px de contenido en el área principal: el desplazamiento horizontal queda dentro de la tabla.

Esta revisión cubre las vistas y estados indicados; no equivale a inspeccionar todas las combinaciones posibles de formularios y datos reales.

La mención anterior a opciones del generador plegadas en `navegacion-sencilla-2026-11-05.md` queda sustituida por la presentación visible recuperada en esta revisión, a petición del usuario.
