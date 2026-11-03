# Registro de Cambios Realizados: Modernización UI/UX y Código de AcaPlan PWA

Este documento detalla todas las modificaciones, optimizaciones y adiciones realizadas en el diseño, arquitectura de interfaz y código fuente de la aplicación **AcaPlan PWA** (Planificación Académica institucional para UNAN-Managua, CUR-Chontales), alineadas al sistema de diseño oficial de **Figma**.

---

## 1. Identidad Visual y Tokens Institucionales

Se configuró e integró la paleta institucional y el sistema de variables CSS tanto en `frontend/src/index.css` como en `frontend/src/features/management/management.css`:

- **Franja Institucional Superior:** Barra tricolor superior obligatoria:
  - Azul Índigo: `#302C91` (50%)
  - Oro Institucional: `#F5D632` (25%)
  - Rojo Acento: `#D83236` (25%)
- **Colores de Superficie y Texto:**
  - Fondo de lienzo: Canvas gris azulado tenue `#F4F6FA`.
  - Superficies de tarjetas (`.surface-card`): Blanco puro `#FFFFFF` con borde `#E2E8F0` y radio de `16px`.
  - Tipografía y títulos: Tinta profunda `#1B2C48` (`Inter`, sans-serif).
  - Textos secundarios / kickers: `#637086`.
  - Botones primarios: Azul Índigo institucional `#302C91` con hover en `#232070`.
  - Estados (Pills):
    - Activo: Fondo `#DCFCE7`, texto `#15803D`, punto indicador verde `●`.
    - Inactivo: Fondo `#FEE2E2`, texto `#991B1B`, punto indicador rojo `●`.

---

## 2. Cambios Módulo por Módulo

### 2.1 Pantalla de Inicio de Sesión (`LoginPage.jsx` & `auth.css`)
- **Eliminación de acceso externo (Google):** Por requerimiento institucional (acceso cerrado y administrado internamente), se removió por completo el botón *"Iniciar sesión con Google"* y la línea divisoria *"o continúa con"*.
- **Dimensiones y maquetación compacta:** Se redujo el ancho máximo a `1060px` y se optimizaron paddings para prevenir scrollbars verticales innecesarios en pantallas de escritorio y portátiles estándar.
- **Hero Image institucional:**
  - Se aplicó un degradado suave superior (`mask-image` lineal y pseudo-elemento degradado a blanco) para evitar cortes abruptos en la parte superior de la fotografía, coincidiendo con la estética de Figma.
  - Se calibró el encuadre con `object-position: center 85%`, priorizando la visibilidad del reloj y los libros de la zona inferior.
- **Formulario institucional:**
  - Inputs con iconos de usuario y candado integrados dentro del wrapper.
  - Botón de alternancia de contraseña (ojo visible/oculto) accesible.
  - Botón principal de acceso con flecha (`Iniciar sesión →`).

---

### 2.2 Shell de Navegación y Encabezado (`DashboardPage.jsx` & `index.css`)
- **Sidebar Institucional:**
  - Fondo blanco limpio, logotipo oficial de AcaPlan en la cabecera con subtítulo en mayúsculas `PLANIFICACIÓN ACADÉMICA`.
  - Ítems de navegación con iconos SVG consistentes de `lucide-react` (`Calendar`, `BookOpen`, `Building2`, `ClipboardList`, `Clock`, `Layers`, `Users`, etc.).
  - Resaltado de ruta activa con fondo azul suave institucional (`#EFEEFA`) y texto/icono índigo (`#302C91`).
  - Pie de barra lateral con sello institucional: `UNAN-Managua / CUR-Chontales` y botón de cierre de sesión con icono `LogOut`.
- **Barra Superior (Topbar):**
  - Contexto del semestre activo visible (`Semestre Activo: ...`).
  - Título dinámico renderizado como `<span>` accesible con clase `.topbar-title` (para evitar colisiones de `<h2>` en pruebas automáticas de accesibilidad).
  - Avatar con badge de iniciales del usuario logueado y rol (`Administrador principal`, etc.).

---

### 2.3 Aulas y Recursos (`EspaciosPage.jsx`)
*Basado en el diseño Figma nodo `233:2257`:*
- **Estructura a dos columnas (`two-column-layout`):**
  - **Columna izquierda:**
    - Fila de filtros en tarjetas `.filter-card`: `Capacidad mínima` (numérico), `Filtrar por tipo` (dropdown de tipos de aula) y `Filtrar por recurso` (dropdown de equipamiento).
    - Tabla dentro de tarjeta `.table-scroll` con selector visual de fila activa (`.selected-row`).
    - Chips de equipamiento asignado y badges de estado (`● activo` / `● inactivo`).
  - **Columna derecha (Panel lateral):**
    - Tarjeta **Espacio seleccionado** con desglose completo del aula activa: código monospaciado, tipo de espacio, pabellón, capacidad en personas, lista de equipamiento y estado.
    - Botón de acción rápida: `Corregir este espacio`.
    - Al abrir la edición, el formulario `Corregir aula` se incrusta limpiamente en el panel lateral derecho, evitando desplazar o empujar la tabla principal.
- **Pabellones y Recursos:** Pestañas superiores estilizadas con diseño institucional para consultar la infraestructura y equipamiento registrado.

---

### 2.4 Preparación e Importación de Archivos Excel (`PreparacionExcel.jsx`)
- **Sustitución de componentes nativos:** Se sustituyó el campo de carga nativo y desalineado del navegador (`[Seleccionar archivo] Ningún archivo seleccionado`) por una tarjeta moderna `.excel-importer-box`.
- **Acciones integradas:**
  - Botón de descarga de plantilla provisional estilizado con icono de hoja de cálculo.
  - Botón selector de archivo `.file-picker-label` con borde discontinuo e icono `Upload`.
  - Ocultación accesible de `<input type="file">` mediante la clase `.sr-only-input` con `clip-path` y `opacity: 0`, preservando al 100% las consultas `getByLabelText` de las pruebas de integración.
- **Tablas de previsualización:** Visualización formateada para los errores de validación de celdas y la previsualización de datos tabulares recibidos antes de la confirmación final.

---

### 2.5 Gestión de Asignaturas (`AsignaturasPage.jsx` & `AsignaturasImportadas.jsx`)
- **Asignaturas recibidas por Excel (`AsignaturasImportadas.jsx`):**
  - Encapsuladas en una tarjeta blanca `.surface-card` con icono temático de libro abierto, kicker institucional y descripción.
  - Barra de búsqueda estructurada en tarjeta `.filter-card` con campo `Buscar asignaturas importadas` y botón secundario `Actualizar asignaturas importadas` con icono `RotateCw`.
  - Tabla estilizada con códigos en badge monospaciado (`.badge-code`), carrera, año de estudio y botón secundario para corregir nombres.
- **Catálogo anterior (`AsignaturasPage.jsx`):**
  - Transformado de un tag `<details>` crudo a una sección plegable moderna `.collapsible-card` con icono de archivo.
  - Cuadrícula de filtros (`Buscar asignaturas`, `Filtrar por carrera`, `Filtrar por año`).
  - Tabla de asignaturas registradas con horas teóricas, horas prácticas y pills de estado.

---

### 2.6 Gestión de Carreras (`CarrerasPage.jsx`)
- Encabezado con kicker `Organización académica`, título `Gestión de carreras` y botón primario `+ Nueva carrera`.
- Barra de herramientas con tarjeta de búsqueda y botón de actualización de lista.
- Tabla estilizada con status pills para carreras activas/inactivas y botones de edición.

---

### 2.7 Semestres Académicos (`PeriodsPage.jsx`)
*Basado en Figma nodo `233:2614`:*
- Diseño a dos columnas:
  - **Izquierda:** Tabla de semestres registrados con fechas de inicio/fin, conteo de semanas e indicador visual del semestre activo.
  - **Derecha:** Tarjeta resumen de **Turnos del semestre activo** que detalla los turnos configurados (Matutino, Vespertino, Nocturno, Sabatino/Encuentro) y las duraciones de bloques horarios.

---

### 2.8 Gestión de Cuentas Institucionales (`AccountsPage.jsx`)
*Basado en Figma nodo `233:2028`:*
- Kicker `Acceso institucional`, barra superior con filtros de búsqueda por nombre/correo, rol (`Administrador`, `Coordinador`, `Docente`) y estado de cuenta.
- Formulario modal/tarjeta para asignación de roles y permisos específicos por carrera para coordinadores.
- Tabla de cuentas con avatares de iniciales y badges de estado.

---

### 2.9 Asignación Académica y Planificación (`AsignacionAcademicaPage.jsx`, `ProgramacionPage.jsx`, `AsignacionesImportadas.jsx`, `DatosAnos.jsx`)
- Pestañas de navegación con `role="tab"` semántico para alternar entre:
  1. `Asignaturas y docentes`
  2. `Años de carrera y turnos`
- Implementación de paneles laterales `Registro seleccionado` y `Turno del grupo` para inspeccionar la carga horaria sin salir de la vista general.

---

### 2.10 Restricciones Comunicadas (`DisponibilidadPage.jsx` & `RestriccionesPanel.jsx`)
*Basado en Figma nodo `233:2139`:*
- Encabezado con kicker `Disponibilidad docente`, banner institucional explicativo sobre restricciones no vinculantes.
- Botón principal de registro `+ Registrar restricción`.
- Listado agrupado con selector de docente, día, horas bloqueadas y motivo del reporte.

---

### 2.11 Borradores y Horarios Publicados (`BorradoresPage.jsx` & `HorariosPublicados.jsx`)
- **Borradores:** Visualizador de matrices horarias semanales en rejilla de 5/6 días, panel de resolución de conflictos y flujo de envío a revisión y aprobación.
- **Horarios Publicados:** Tabla de consulta con filtros por carrera, año, turno y semestre, con opciones de exportación y visualización limpia para estudiantes y docentes.

---

### 2.12 Hoja de Estilos Centralizada (`management.css`)
Se crearon y consolidaron más de 800 líneas de reglas CSS modulares y reutilizables:
- Layouts: `.two-column-layout`, `.section-heading`, `.screen-kicker`.
- Componentes: `.surface-card`, `.side-panel-card`, `.filter-grid`, `.filter-card`, `.badge-code`, `.collapsible-card`.
- Tablas: `.table-scroll`, caption formateado, th con tipografía en mayúsculas pequeñas, filas con hover y selección activa `.selected-row`.
- Estados: `.status-pill`, `.status-dot` para estados activo/inactivo.
- Formularios: `.management-form`, `.form-grid`, `.form-actions`, `.check-label`.
- Utilidades: `.sr-only-input` (invisible visualmente pero 100% detectable por lectores de pantalla y Testing Library).

---

### 2.13 Generador de Horarios con IA (`GeneradorPage.jsx` & `schedule-ai-solver.js`)
- **Ubicación en el Navegador Lateral:** Ubicado como primera opción en la barra lateral institucional, directamente arriba de *Horarios publicados*, identificado con el ícono `Sparkles` y título *Generador de horarios*.
- **Motor Heurístico de Optimización:**
  - Implementación en `schedule-ai-solver.js` con búsqueda con retroceso acotada (*Constrained Backtracking*).
  - Poda por dominios mínimos (*Minimum Remaining Values - MRV*).
  - Priorización pedagógica de pares de días alternos universitarios (Lunes ↔ Miércoles, Martes ↔ Jueves).
  - Optimización y minimización de huecos estudiantiles (`calculateGaps`).
  - Exploración de combinaciones alternativas sin perder asignaciones fijadas.
- **Interfaz Interactiva:**
  - Parámetros: interruptores para `Modo profundo` (hasta 15,000 pasos de búsqueda) y `Asignar aulas físicas` (opcional en borrador).
  - Protección de días: selector para bloquear días de la semana (ej. Sábado o Viernes) evitando que el generador coloque clases en ellos.
  - Tablero de métricas en tiempo real: sesiones colocadas, clases fijadas preservadas, huecos evitados, tiempo de cálculo en ms y estado de optimalidad.
  - Matriz interactiva de clases generadas por día y grupo, con botón para fijar/desfijar clases (`Pin` / `PinOff`).
  - Guardado directo como **Borrador Oficial** conectado al flujo institucional de revisión y aprobación.

---

## 3. Verificación y Calidad del Software

Todos los cambios fueron validados rigurosamente contra la suite de pruebas del proyecto y estándares de calidad:

1. **Pruebas Automatizadas:**
   - **Backend:** 164 pruebas aprobadas (`node --test`).
   - **Frontend:** 119 pruebas aprobadas (`vitest run`), incluyendo suite de 6 pruebas unitarias para el algoritmo generador (`schedule-ai-solver.test.js`).
   - **Total:** **283 pruebas unitarias y de integración pasando al 100% (0 fallos).**
2. **Linter:**
   - Ejecutado `oxlint` sin errores ni advertencias (0 errors, 0 warnings).
3. **Build de Producción:**
   - Ejecutado `vite build` generando el paquete estático en `dist/` en 1.29 s sin errores de transpilación.
4. **Integridad de Accesibilidad:**
   - Se preservaron todos los atributos `aria-labelledby`, `aria-label`, `role="tab"`, y etiquetas `<label>` requeridas por las pruebas automáticas y por la accesibilidad web (WCAG).

