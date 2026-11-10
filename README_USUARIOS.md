# AcaPlan PWA · Catálogo de Cuentas y Accesos

Este documento contiene la lista completa de cuentas de usuario funcionales para el sistema **AcaPlan PWA** (UNAN-Managua · CUR-Chontales). Todas las cuentas están registradas y confirmadas en **Supabase Auth** (`auth.users`) y vinculadas en el esquema relacional (`public.usuarios`, `public.pwa_permisos_usuario`, `public.pwa_directores_departamento`, `public.docentes` y `public.pwa_docentes_academicos`).

---

## 🔑 Credenciales Generales de Acceso

- **URL de la Aplicación:** [http://localhost:5173](http://localhost:5173)
- **URL de la API (Backend):** [http://127.0.0.1:3001/api/health](http://127.0.0.1:3001/api/health)
- **Contraseña universal para todas las cuentas (incluyendo el Administrador):**
  > `Docente2026*`

---

## 🛡️ 1. Cuenta de Administración Global

| Rol en el Sistema | Nombre del Usuario | Correo Institucional | Contraseña | Cédula Nacional | Permisos |
|---|---|---|---|---|---|
| **Administrador** | Administrador principal | `admin@unan.edu.ni` | `Docente2026*` | `000-000000-0000A` | Gestión total de cuentas, semestres, departamentos, inventario y catálogo. |

---

## 🏛️ 2. Directores de Departamento (3)

Los directores de departamento tienen la función institucional `jefe_departamento`, están vinculados al departamento respectivo en `pwa_directores_departamento` y pueden revisar y aprobar la planificación académica departamental.

| ID | Director(a) | Departamento Asignado | Correo Institucional | Contraseña | Cédula Nacional | Especialidad |
|:---:|---|---|---|:---:|---|---|
| **41** | Dr. Marcos Antonio Orozco Cruz | **Ciencias Económicas y Administrativas** (ID: 1) | `marcos.orozco@unan.edu.ni` | `Docente2026*` | `121-150874-0001N` | Ciencias Económicas y Finanzas |
| **42** | MSc. Elena María Suárez Rivas | **Ciencias de la Educación y Humanidades** (ID: 2) | `elena.suarez@unan.edu.ni` | `Docente2026*` | `121-230478-0001H` | Pedagogía y Ciencias de la Educación |
| **43** | Ing. Carlos Alberto Mendoza Sequeira | **Ciencias, Tecnología y Salud** (ID: 3) | `carlos.mendoza@unan.edu.ni` | `Docente2026*` | `121-101176-0001L` | Ingeniería y Tecnología Aplicada |

---

## 🎓 3. Coordinadores de Carrera (18)

Cada coordinador cuenta con la función `coordinador` y tiene asignado su código de carrera en `pwa_permisos_usuario.carreras`, lo que le permite entregar asignaciones académicas, gestionar secciones y corregir componentes de su carrera.

### Departamento 1: Ciencias Económicas y Administrativas
| ID | Coordinador(a) | Carrera Asignada | Correo Institucional | Contraseña | Cédula Nacional |
|:---:|---|---|---|:---:|---|
| **44** | Lic. Marlon José Gómez Miranda | **Administración de Empresas** (ID: 6) | `marlon.gomez@unan.edu.ni` | `Docente2026*` | `121-050382-0001Q` |
| **45** | MSc. Yadira del Carmen Bravo Sequeira | **Contaduría Pública y Finanzas** (ID: 7) | `yadira.bravo@unan.edu.ni` | `Docente2026*` | `121-180980-0001T` |
| **46** | Lic. Francisco Javier Hurtado Báez | **Mercadotecnia** (ID: 8) | `francisco.hurtado@unan.edu.ni` | `Docente2026*` | `121-120786-0001K` |
| **47** | MSc. Claudia Patricia Rocha Morales | **Administración Turística y Hotelera** (ID: 9) | `claudia.rocha@unan.edu.ni` | `Docente2026*` | `121-290184-0001T` |

### Departamento 2: Ciencias de la Educación y Humanidades
| ID | Coordinador(a) | Carrera Asignada | Correo Institucional | Contraseña | Cédula Nacional |
|:---:|---|---|---|:---:|---|
| **48** | MSc. Lester Antonio Bermúdez Galeano | **C. de la Educación: Inglés** (ID: 11) | `lester.bermudez@unan.edu.ni` | `Docente2026*` | `121-140683-0001Y` |
| **49** | Lic. Gloria Esperanza Téllez Jarquín | **C. de la Educación: Ciencias Sociales** (ID: 12) | `gloria.tellez@unan.edu.ni` | `Docente2026*` | `121-201081-0001Y` |
| **50** | MSc. Denis Enrique Miranda Requene | **C. de la Educación: Ciencias Naturales** (ID: 13) | `denis.miranda@unan.edu.ni` | `Docente2026*` | `121-080479-0001U` |
| **51** | Lic. Rosa Amalia Centeno Fonseca | **C. de la Educación: Física-Matemática** (ID: 14) | `rosa.centeno@unan.edu.ni` | `Docente2026*` | `121-161285-0001G` |
| **52** | MSc. Silvio Ramón Sequeira Duarte | **C. de la Educación: Lengua y Literatura** (ID: 15) | `silvio.sequeira@unan.edu.ni` | `Docente2026*` | `121-030577-0001B` |
| **53** | Lic. Wendy Massiel López Amador | **Cultura y Artes** (ID: 16) | `wendy.lopez@unan.edu.ni` | `Docente2026*` | `121-220888-0001C` |
| **54** | Lic. Jorge Luis Álvarez Marín | **Diseño Gráfico y Multimedia** (ID: 17) | `jorge.alvarez@unan.edu.ni` | `Docente2026*` | `121-110287-0001U` |

### Departamento 3: Ciencias, Tecnología y Salud
| ID | Coordinador(a) | Carrera Asignada | Correo Institucional | Contraseña | Cédula Nacional |
|:---:|---|---|---|:---:|---|
| **55** | Ing. Douglas Omar Oporta Sequeira | **Ingeniería en Sistemas de Información** (ID: 18) | `douglas.oporta@unan.edu.ni` | `Docente2026*` | `121-190985-0001T` |
| **56** | MSc. Karla Vanessa González Robleto | **Ingeniería Agroindustrial** (ID: 19) | `karla.gonzalez@unan.edu.ni` | `Docente2026*` | `121-070383-0001P` |
| **57** | Ing. Álvaro José Montiel Zambrana | **Ingeniería Agronómica** (ID: 20) | `alvaro.montiel@unan.edu.ni` | `Docente2026*` | `121-251182-0001L` |
| **58** | Arq. Brenda Lucía Ocampo Espinoza | **Arquitectura** (ID: 21) | `brenda.ocampo@unan.edu.ni` | `Docente2026*` | `121-140786-0001P` |
| **59** | MSc. Norma Isabel Báez Marín | **Enfermería** (ID: 22) | `norma.baez@unan.edu.ni` | `Docente2026*` | `121-300579-0001Y` |
| **60** | Lic. Walter Antonio Urbina Ríos | **Bioanálisis Clínico** (ID: 23) | `walter.urbina@unan.edu.ni` | `Docente2026*` | `121-090184-0001A` |
| **61** | Dra. Mayra Jamileth Sevilla Solano | **Odontología** (ID: 24) | `mayra.sevilla@unan.edu.ni` | `Docente2026*` | `121-171083-0001G` |

---

## 👨‍🏫 4. Docentes Especialistas y de Formación General (11)

Cuentas de docentes regulares vinculadas al cuerpo académico para impartición de componentes y consulta de horario personal.

| ID | Docente | Especialidad Académica | Correo Institucional | Contraseña | Cédula Nacional |
|:---:|---|---|---|:---:|---|
| **62** | Lic. Erick Daniel Jarquín Castro | Matemáticas Generales y Estadística Descriptiva | `erick.jarquin@unan.edu.ni` | `Docente2026*` | `121-020689-0001Q` |
| **63** | Lic. Tania Marcela Sotelo Cruz | Lenguaje, Comunicación y Redacción Técnica | `tania.sotelo@unan.edu.ni` | `Docente2026*` | `121-280390-0001W` |
| **64** | Ing. Henry Alberto Ríos Amador | Redes, Telecomunicaciones y Ciberseguridad | `henry.rios@unan.edu.ni` | `Docente2026*` | `121-150988-0001T` |
| **65** | MSc. Maritza Auxiliadora Bravo Díaz | Metodología de la Investigación Científica | `maritza.bravo@unan.edu.ni` | `Docente2026*` | `121-121281-0001U` |
| **66** | Dr. Gabriel Ernesto Medina Calero | Anatomía Humana, Fisiología y Salud Pública | `gabriel.medina@unan.edu.ni` | `Docente2026*` | `121-210482-0001G` |
| **67** | Lic. Xiomara del Socorro Duarte Marín | Filosofía Institucional y Ética Profesional | `xiomara.duarte@unan.edu.ni` | `Docente2026*` | `121-190786-0001A` |
| **68** | MSc. Félix Pedro Galeano Rocha | Finanzas Corporativas y Formulación de Proyectos | `felix.galeano@unan.edu.ni` | `Docente2026*` | `121-041178-0001M` |
| **69** | Lic. Sandra Carolina Vargas Mena | Química Orgánica y Bioquímica Fundamental | `sandra.vargas@unan.edu.ni` | `Docente2026*` | `121-100887-0001G` |
| **70** | Ing. Noel Antonio Sequeira Miranda | Física Clásica y Termodinámica Aplicada | `noel.sequeira@unan.edu.ni` | `Docente2026*` | `121-310185-0001S` |
| **71** | MSc. Ligia Patricia Solís Zambrana | Psicología Educativa y Orientación Vocacional | `ligia.solis@unan.edu.ni` | `Docente2026*` | `121-060584-0001U` |
| **72** | Dra. Ana Virginia Rivas Romero | Farmacología Clínica y Toxicología Médica | `ana.rivas@unan.edu.ni` | `Docente2026*` | `121-130980-0001H` |

---

## 🇳🇮 Estructura de las Cédulas Nicaragüenses

Todas las cédulas generadas respetan estrictamente el estándar nacional:
$$\text{Formato: } \mathbf{MMM}-\mathbf{DDMMAA}-\mathbf{NNNNL}$$

1. **Código de Municipio ($\mathbf{MMM}$):** `121` (Juigalpa, sede central de la CUR-Chontales).
2. **Fecha de Nacimiento ($\mathbf{DDMMAA}$):** Día, Mes y Año a 2 dígitos.
3. **Número Consecutivo ($\mathbf{NNNN}$):** `0001`.
4. **Letra Validadora ($\mathbf{L}$):** Calculada mediante el algoritmo oficial de **Módulo 23**:
   $$\text{Índice} = (\text{Número de 13 dígitos}) \pmod{23}$$
   $$\text{Alfabeto: } \text{A B C D E F G H J K L M N P Q R S T U V W X Y}$$

---

## 🚀 Guía de Pruebas Rápidas

1. **Iniciar el sistema:**
   - Backend: `npm run dev:backend` (en puerto 3001).
   - Frontend: `npm run dev:frontend` (en [http://localhost:5173](http://localhost:5173)).
2. **Probar como Director de Departamento:**
   - Entrar con `marcos.orozco@unan.edu.ni` / `Docente2026*`.
   - Se activan las opciones departamentales y la revisión de borradores de su departamento.
3. **Probar como Coordinador de Carrera:**
   - Entrar con `douglas.oporta@unan.edu.ni` / `Docente2026*`.
   - El espacio de trabajo se adapta para la carrera *Ingeniería en Sistemas de Información* (ID: 18).
4. **Probar como Docente Regular:**
   - Entrar con `erick.jarquin@unan.edu.ni` / `Docente2026*`.
   - Se muestra la vista de *Mi horario* y consulta de horarios publicados.

