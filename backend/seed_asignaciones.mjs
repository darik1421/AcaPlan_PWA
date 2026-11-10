const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
  console.error('Missing environment variables.');
  process.exit(1);
}

// Teacher assignment logic based on specialty and role
function selectTeacherForSubject(sub, teachersByUserId, teachersByCedula, coordinatorsByCarrera) {
  const code = sub.codigo;
  const name = sub.nombre.toLowerCase();
  const cid = sub.id_carrera;
  const coord = coordinatorsByCarrera.get(cid);

  // Health & Odonto
  if (cid === 24) { // Odontología
    if (code.includes('101') || code.includes('302') || code.includes('402') || code.includes('502')) {
      return teachersByUserId.get(66); // Dr. Gabriel Medina (Cirugía oral / anatomía)
    }
    if (code.includes('202')) {
      return teachersByUserId.get(72); // Dra. Ana Virginia Rivas (Microbiología)
    }
    return coord; // Dra. Mayra Sevilla
  }

  if (cid === 22) { // Enfermería
    if (code.includes('101')) return teachersByUserId.get(66); // Dr. Gabriel Medina (Anatomía)
    if (code.includes('103') || code.includes('202')) return teachersByUserId.get(72); // Dra. Ana Virginia Rivas (Bioquímica / Farmacología)
    if (code.includes('203') || code.includes('302') || code.includes('401') || code.includes('502')) {
      return teachersByUserId.get(65); // MSc. Maritza Bravo (Materno-Infantil)
    }
    return coord; // MSc. Norma Báez
  }

  if (cid === 23) { // Bioanálisis Clínico
    if (code.includes('102')) return teachersByUserId.get(69); // Lic. Sandra Vargas (Química)
    if (code.includes('103')) return teachersByUserId.get(66); // Dr. Gabriel Medina (Anatomía)
    if (code.includes('202') || code.includes('301') || code.includes('402')) {
      return teachersByUserId.get(72); // Dra. Ana Virginia Rivas (Microbiología / Parasitología)
    }
    return coord; // Lic. Walter Urbina
  }

  // Engineering & Tech
  if (cid === 18) { // Sistemas
    if (code.includes('102')) return teachersByUserId.get(68); // MSc. Félix Galeano (Matemática discreta)
    if (code.includes('201') || code.includes('202') || code.includes('302') || code.includes('401') || code.includes('403')) {
      return teachersByUserId.get(64); // Ing. Henry Ríos (Redes / Software)
    }
    if (code.includes('501')) return teachersByUserId.get(43); // Ing. Carlos Mendoza (Director / IA)
    return coord; // Ing. Douglas Oporta
  }

  if (cid === 21) { // Arquitectura
    if (code.includes('202') || code.includes('302') || code.includes('402')) {
      return teachersByUserId.get(43); // Ing. Carlos Mendoza (Estructuras / Materiales)
    }
    if (code.includes('203')) return teachersByUserId.get(54); // Lic. Jorge Álvarez (CAD)
    return coord; // Arq. Brenda Ocampo
  }

  if (cid === 19) { // Agroindustrial
    if (code.includes('102')) return teachersByUserId.get(69); // Lic. Sandra Vargas (Química / Bioquímica)
    if (code.includes('103')) return teachersByUserId.get(43); // Ing. Carlos Mendoza (Cálculo)
    if (code.includes('201')) return teachersByUserId.get(72); // Dra. Ana Virginia Rivas (Microbiología)
    if (code.includes('202') || code.includes('402')) return teachersByUserId.get(70); // Ing. Noel Sequeira (Balance / Plantas)
    return coord; // MSc. Karla González
  }

  if (cid === 20) { // Agronómica
    if (code.includes('102') || code.includes('301') || code.includes('402') || code.includes('501')) {
      return teachersByUserId.get(70); // Ing. Noel Sequeira (Suelos / Plagas / Ganadería)
    }
    if (code.includes('103')) return teachersByUserId.get(69); // Lic. Sandra Vargas (Química)
    return coord; // Ing. Álvaro Montiel
  }

  // Económicas
  if (cid === 6) { // Administración
    if (code.includes('102') || code.includes('302')) return teachersByUserId.get(41); // Dr. Marcos Orozco (Director / Economía)
    if (code.includes('202')) return teachersByUserId.get(63); // Lic. Tania Sotelo (Contabilidad)
    if (code.includes('402')) return teachersByUserId.get(68); // MSc. Félix Galeano (Calidad)
    return coord; // Lic. Marlon Gómez
  }

  if (cid === 7) { // Contaduría
    if (code.includes('102')) return teachersByUserId.get(68); // MSc. Félix Galeano (Mat Financiera)
    if (code.includes('103')) return teachersByUserId.get(44); // Lic. Marlon Gómez (Principios Admin)
    if (code.includes('201') || code.includes('301') || code.includes('401')) {
      return teachersByUserId.get(63); // Lic. Tania Sotelo (Costos / Auditoría)
    }
    if (code.includes('302')) return teachersByUserId.get(41); // Dr. Marcos Orozco (Finanzas)
    return coord; // MSc. Yadira Bravo
  }

  if (cid === 8) { // Mercadotecnia
    if (code.includes('103')) return teachersByUserId.get(41); // Dr. Marcos Orozco (Economía)
    if (code.includes('201')) return teachersByUserId.get(68); // MSc. Félix Galeano (Investigación Mercados)
    if (code.includes('302')) return teachersByUserId.get(71); // MSc. Ligia Solís (Marketing digital)
    return coord; // Lic. Francisco Hurtado
  }

  if (cid === 9) { // Turismo
    if (code.includes('102')) return teachersByUserId.get(67); // Lic. Xiomara Duarte (Geografía)
    if (code.includes('301')) return teachersByUserId.get(53); // Lic. Wendy López (Animación)
    if (code.includes('402')) return teachersByUserId.get(46); // Lic. Francisco Hurtado (Eventos)
    return coord; // MSc. Claudia Rocha
  }

  // Educación & Artes
  if (cid === 11) { // Inglés
    if (code.includes('102') || code.includes('202') || code.includes('301') || code.includes('401')) {
      return teachersByUserId.get(62); // Lic. Erick Jarquín (Inglés)
    }
    if (code.includes('103')) return teachersByUserId.get(42); // MSc. Elena Suárez (Pedagogía)
    return coord; // MSc. Lester Bermúdez
  }

  if (cid === 12) { // Sociales
    if (code.includes('102') || code.includes('202') || code.includes('301') || code.includes('401')) {
      return teachersByUserId.get(67); // Lic. Xiomara Duarte (Historia / Geografía)
    }
    if (code.includes('103')) return teachersByUserId.get(42); // MSc. Elena Suárez (Pedagogía)
    return coord; // Lic. Gloria Téllez
  }

  if (cid === 13) { // Naturales
    if (code.includes('102') || code.includes('301')) return teachersByUserId.get(69); // Lic. Sandra Vargas (Química)
    if (code.includes('103')) return teachersByUserId.get(42); // MSc. Elena Suárez (Pedagogía)
    if (code.includes('302')) return teachersByUserId.get(51); // Lic. Rosa Centeno (Física)
    return coord; // MSc. Denis Miranda
  }

  if (cid === 14) { // Física-Matemática
    if (code.includes('102') || code.includes('301') || code.includes('401')) {
      return teachersByUserId.get(68); // MSc. Félix Galeano (Matemáticas)
    }
    if (code.includes('103')) return teachersByUserId.get(42); // MSc. Elena Suárez (Pedagogía)
    return coord; // Lic. Rosa Centeno
  }

  if (cid === 15) { // Lengua
    if (code.includes('103')) return teachersByUserId.get(42); // MSc. Elena Suárez (Pedagogía)
    if (code.includes('302')) return teachersByUserId.get(49); // Lic. Gloria Téllez (Literatura)
    return coord; // MSc. Silvio Sequeira
  }

  if (cid === 16) { // Cultura y Artes
    if (code.includes('103')) return teachersByUserId.get(67); // Lic. Xiomara Duarte (Antropología)
    if (code.includes('202')) return teachersByUserId.get(71); // MSc. Ligia Solís (Artes digitales)
    if (code.includes('302')) return teachersByUserId.get(54); // Lic. Jorge Álvarez (Expresión plástica)
    return coord; // Lic. Wendy López
  }

  if (cid === 17) { // Diseño Gráfico
    if (code.includes('102') || code.includes('201') || code.includes('301') || code.includes('401')) {
      return teachersByUserId.get(71); // MSc. Ligia Solís (Diseño / Medios digitales)
    }
    return coord; // Lic. Jorge Álvarez
  }

  return coord || teachersByUserId.get(41);
}

async function main() {
  console.log('--- CARGANDO CATÁLOGOS DESDE SUPABASE ---');

  const [cRes, sRes, dRes, permRes] = await Promise.all([
    fetch(url + '/rest/v1/carreras?select=id_carrera,nombre&order=id_carrera', {
      headers: { Authorization: 'Bearer ' + serviceKey, apikey: serviceKey }
    }),
    fetch(url + '/rest/v1/pwa_asignaturas_academicas?select=id,id_carrera,codigo,nombre,ano_estudio&order=id_carrera,ano_estudio,codigo', {
      headers: { Authorization: 'Bearer ' + serviceKey, apikey: serviceKey }
    }),
    fetch(url + '/rest/v1/pwa_docentes_academicos?select=id,cedula,nombre,id_usuario&order=id', {
      headers: { Authorization: 'Bearer ' + serviceKey, apikey: serviceKey }
    }),
    fetch(url + '/rest/v1/pwa_permisos_usuario?select=*', {
      headers: { Authorization: 'Bearer ' + serviceKey, apikey: serviceKey }
    })
  ]);

  const carreras = await cRes.json();
  const subjects = await sRes.json();
  const docs = await dRes.json();
  const perms = await permRes.json();

  console.log(`Carreras: ${carreras.length}, Asignaturas: ${subjects.length}, Docentes: ${docs.length}`);

  const carrerasById = new Map(carreras.map(c => [c.id_carrera, c]));
  const teachersByUserId = new Map(docs.map(d => [d.id_usuario, d]));
  const teachersByCedula = new Map(docs.map(d => [d.cedula.replace(/[\s-]/g, '').toUpperCase(), d]));
  const coordinatorsByCarrera = new Map();

  for (const p of perms) {
    if (p.funciones?.includes('coordinador') && p.carreras?.length) {
      const doc = teachersByUserId.get(p.id_usuario);
      if (doc) {
        for (const cid of p.carreras) {
          coordinatorsByCarrera.set(cid, doc);
        }
      }
    }
  }

  console.log(`Coordinadores encontrados: ${coordinatorsByCarrera.size} carreras`);

  // Build rows
  const rows = [];
  let filaNum = 2;

  for (const sub of subjects) {
    const carrera = carrerasById.get(sub.id_carrera);
    const teacher = selectTeacherForSubject(sub, teachersByUserId, teachersByCedula, coordinatorsByCarrera);

    if (!teacher) {
      console.error(`Docente no encontrado para asignatura ${sub.codigo} en carrera ${sub.id_carrera}`);
      process.exit(1);
    }

    const row = {
      fila: filaNum++,
      cedula_docente: teacher.cedula.replace(/[\s-]/g, '').toUpperCase(),
      nombre_docente: teacher.nombre,
      codigo_asignatura: sub.codigo,
      nombre_asignatura: sub.nombre,
      carrera: carrera.nombre,
      ano_estudio: sub.ano_estudio,
      turno: 'matutino',
      horas_semestre: 56
    };
    rows.push(row);
  }

  console.log(`Total filas de asignación generadas: ${rows.length}`);

  // Iniciar sesión como administrador
  console.log('\n--- AUTENTICANDO COMO ADMINISTRADOR ---');
  const loginRes = await fetch(url + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@unan.edu.ni', password: 'Docente2026*' })
  });
  const authData = await loginRes.json();
  if (!authData.access_token) {
    console.error('Error autenticando admin:', authData);
    process.exit(1);
  }
  const accessToken = authData.access_token;
  console.log('Autenticación exitosa.');

  // Llamar RPC pwa_importar_asignacion 'preview'
  console.log('\n--- EJECUTANDO VISTA PREVIA (RPC pwa_importar_asignacion) ---');
  const previewRes = await fetch(url + '/rest/v1/rpc/pwa_importar_asignacion', {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'preview',
      payload: {
        id_periodo: 1,
        rows
      }
    })
  });

  const previewData = await previewRes.json();
  console.log('Preview status:', previewRes.status);
  console.log('Preview válido:', previewData.valido);
  console.log('Preview errores:', previewData.errores?.length || 0);
  console.log('Preview huella:', previewData.huella);

  if (previewData.errores?.length > 0) {
    console.error('Errores en preview:', previewData.errores.slice(0, 5));
    process.exit(1);
  }

  // Comprobar estado de docentes y asignaturas reconocidas
  const docReconocidos = previewData.filas.filter(f => f.docente_estado === 'Reconocido').length;
  const asigReconocidas = previewData.filas.filter(f => f.asignatura_estado === 'Reconocida').length;
  console.log(`Docentes reconocidos: ${docReconocidos} / ${previewData.filas.length}`);
  console.log(`Asignaturas reconocidas: ${asigReconocidas} / ${previewData.filas.length}`);

  // Confirmar importación
  console.log('\n--- CONFIRMANDO ASIGNACIONES (RPC pwa_importar_asignacion confirm) ---');
  const confirmRes = await fetch(url + '/rest/v1/rpc/pwa_importar_asignacion', {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'confirm',
      payload: {
        id_periodo: 1,
        huella: previewData.huella,
        rows: previewData.filas
      }
    })
  });

  const confirmData = await confirmRes.json();
  console.log('Confirm status:', confirmRes.status);
  console.log('Confirm resultado:', confirmData);

  // Registrar pwa_datos_ano_carrera para cada año de cada carrera
  console.log('\n--- CONFIGURANDO DATOS DE AÑO Y CARRERA (pwa_datos_ano_carrera) ---');
  // Obtener combinaciones de carrera y año existentes en los subjects
  const cohorts = new Map();
  for (const sub of subjects) {
    const key = `${sub.id_carrera}-${sub.ano_estudio}`;
    if (!cohorts.has(key)) {
      cohorts.set(key, {
        id_periodo: 1,
        id_carrera: sub.id_carrera,
        ano_estudio: sub.ano_estudio,
        // Alumnos estimados realistas para la CURL Chontales: entre 25 y 35
        cantidad_estudiantes: 25 + ((sub.id_carrera * 3 + sub.ano_estudio * 7) % 11),
        sede: 'CUR Chontales',
        actualizado_por: 1,
        revision: 1
      });
    }
  }

  console.log(`Total cohortes (carrera-año) a registrar: ${cohorts.size}`);
  for (const [key, cohort] of cohorts) {
    const res = await fetch(url + '/rest/v1/pwa_datos_ano_carrera', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + serviceKey,
        apikey: serviceKey,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify(cohort)
    });
    if (!res.ok) {
      console.warn(`Error guardando cohorte ${key}:`, await res.text());
    }
  }
  console.log('Cohortes de año de carrera registradas exitosamente.');

  // Verificación final consultando la lista de asignaciones académicas
  console.log('\n--- VERIFICACIÓN FINAL ---');
  const listRes = await fetch(url + '/rest/v1/rpc/pwa_importar_asignacion', {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'list', payload: {} })
  });
  const listData = await listRes.json();
  console.log(`Total asignaciones académicas activas en BD: ${listData.length}`);

  const yearsRes = await fetch(url + '/rest/v1/rpc/pwa_preparacion_academica', {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action: 'years', payload: {} })
  });
  const yearsData = await yearsRes.json();
  console.log(`Total años académicos configurados en preparación: ${yearsData.length}`);

  console.log('\n¡ASIGNACIÓN ACADÉMICA REGISTRADA CON ÉXITO!');
}

main().catch(err => {
  console.error('Error durante la ejecución:', err);
  process.exit(1);
});

