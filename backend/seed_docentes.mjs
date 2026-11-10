const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const adminHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

function calculateCedulaLetter(digits13) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXY';
  const rem = Number(BigInt(digits13) % 23n);
  return letters[rem];
}

function makeCedula(muni, dd, mm, aa, seq = '0001') {
  const digits13 = `${muni}${dd}${mm}${aa}${seq}`;
  const letter = calculateCedulaLetter(digits13);
  return `${muni}-${dd}${mm}${aa}-${seq}${letter}`;
}

const TEACHERS = [
  // ── 3 DIRECTORES DE DEPARTAMENTO ──
  {
    tipo: 'Director de Departamento',
    nombre: 'Dr. Marcos Antonio Orozco Cruz',
    correo: 'marcos.orozco@unan.edu.ni',
    muni: '121', dd: '15', mm: '08', aa: '74', seq: '0001',
    especialidad: 'Ciencias Económicas y Finanzas',
    rol: 'docente',
    funciones: ['jefe_departamento'],
    carreras: [],
    id_departamento: 1,
    departamento_nombre: 'Ciencias Económicas y Administrativas',
  },
  {
    tipo: 'Director de Departamento',
    nombre: 'MSc. Elena María Suárez Rivas',
    correo: 'elena.suarez@unan.edu.ni',
    muni: '121', dd: '23', mm: '04', aa: '78', seq: '0001',
    especialidad: 'Pedagogía y Ciencias de la Educación',
    rol: 'docente',
    funciones: ['jefe_departamento'],
    carreras: [],
    id_departamento: 2,
    departamento_nombre: 'Ciencias de la Educación y Humanidades',
  },
  {
    tipo: 'Director de Departamento',
    nombre: 'Ing. Carlos Alberto Mendoza Sequeira',
    correo: 'carlos.mendoza@unan.edu.ni',
    muni: '121', dd: '10', mm: '11', aa: '76', seq: '0001',
    especialidad: 'Ingeniería y Tecnología Aplicada',
    rol: 'docente',
    funciones: ['jefe_departamento'],
    carreras: [],
    id_departamento: 3,
    departamento_nombre: 'Ciencias, Tecnología y Salud',
  },

  // ── 18 COORDINADORES DE CARRERA ──
  // Depto 1: Ciencias Económicas y Administrativas (Carreras 6, 7, 8, 9)
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Lic. Marlon José Gómez Miranda',
    correo: 'marlon.gomez@unan.edu.ni',
    muni: '121', dd: '05', mm: '03', aa: '82', seq: '0001',
    especialidad: 'Administración Estratégica y Talento Humano',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [6],
    carrera_nombre: 'Administración de Empresas',
    id_departamento: 1,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'MSc. Yadira del Carmen Bravo Sequeira',
    correo: 'yadira.bravo@unan.edu.ni',
    muni: '121', dd: '18', mm: '09', aa: '80', seq: '0001',
    especialidad: 'Contabilidad y Auditoría Financiera',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [7],
    carrera_nombre: 'Contaduría Pública y Finanzas',
    id_departamento: 1,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Lic. Francisco Javier Hurtado Báez',
    correo: 'francisco.hurtado@unan.edu.ni',
    muni: '121', dd: '12', mm: '07', aa: '86', seq: '0001',
    especialidad: 'Mercadotecnia y Comercio Digital',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [8],
    carrera_nombre: 'Mercadotecnia',
    id_departamento: 1,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'MSc. Claudia Patricia Rocha Morales',
    correo: 'claudia.rocha@unan.edu.ni',
    muni: '121', dd: '29', mm: '01', aa: '84', seq: '0001',
    especialidad: 'Gestión Hotelera y Desarrollo Turístico',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [9],
    carrera_nombre: 'Administración Turística y Hotelera',
    id_departamento: 1,
  },

  // Depto 2: Ciencias de la Educación y Humanidades (Carreras 11, 12, 13, 14, 15, 16, 17)
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'MSc. Lester Antonio Bermúdez Galeano',
    correo: 'lester.bermudez@unan.edu.ni',
    muni: '121', dd: '14', mm: '06', aa: '83', seq: '0001',
    especialidad: 'Lingüística y Didáctica del Idioma Inglés',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [11],
    carrera_nombre: 'Ciencias de la Educación con mención en Inglés',
    id_departamento: 2,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Lic. Gloria Esperanza Téllez Jarquín',
    correo: 'gloria.tellez@unan.edu.ni',
    muni: '121', dd: '20', mm: '10', aa: '81', seq: '0001',
    especialidad: 'Historia y Didáctica de Ciencias Sociales',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [12],
    carrera_nombre: 'Ciencias de la Educación con mención en Ciencias Sociales',
    id_departamento: 2,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'MSc. Denis Enrique Miranda Requene',
    correo: 'denis.miranda@unan.edu.ni',
    muni: '121', dd: '08', mm: '04', aa: '79', seq: '0001',
    especialidad: 'Biología, Química y Medio Ambiente',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [13],
    carrera_nombre: 'Ciencias de la Educación con mención en Ciencias Naturales',
    id_departamento: 2,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Lic. Rosa Amalia Centeno Fonseca',
    correo: 'rosa.centeno@unan.edu.ni',
    muni: '121', dd: '16', mm: '12', aa: '85', seq: '0001',
    especialidad: 'Matemática Pura y Didáctica de la Física',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [14],
    carrera_nombre: 'Ciencias de la Educación con mención en Física-Matemática',
    id_departamento: 2,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'MSc. Silvio Ramón Sequeira Duarte',
    correo: 'silvio.sequeira@unan.edu.ni',
    muni: '121', dd: '03', mm: '05', aa: '77', seq: '0001',
    especialidad: 'Literatura Hispánica y Comprensión Lectora',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [15],
    carrera_nombre: 'Ciencias de la Educación con mención en Lengua y Literatura Hispánicas',
    id_departamento: 2,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Lic. Wendy Massiel López Amador',
    correo: 'wendy.lopez@unan.edu.ni',
    muni: '121', dd: '22', mm: '08', aa: '88', seq: '0001',
    especialidad: 'Expresión Artística y Patrimonio Cultural',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [16],
    carrera_nombre: 'Cultura y Artes',
    id_departamento: 2,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Lic. Jorge Luis Álvarez Marín',
    correo: 'jorge.alvarez@unan.edu.ni',
    muni: '121', dd: '11', mm: '02', aa: '87', seq: '0001',
    especialidad: 'Diseño Gráfico y Comunicación Visual',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [17],
    carrera_nombre: 'Diseño Gráfico y Multimedia',
    id_departamento: 2,
  },

  // Depto 3: Ciencias, Tecnología y Salud (Carreras 18, 19, 20, 21, 22, 23, 24)
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Ing. Douglas Omar Oporta Sequeira',
    correo: 'douglas.oporta@unan.edu.ni',
    muni: '121', dd: '19', mm: '09', aa: '85', seq: '0001',
    especialidad: 'Ingeniería de Software y Redes de Información',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [18],
    carrera_nombre: 'Ingeniería en Sistemas de Información',
    id_departamento: 3,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'MSc. Karla Vanessa González Robleto',
    correo: 'karla.gonzalez@unan.edu.ni',
    muni: '121', dd: '07', mm: '03', aa: '83', seq: '0001',
    especialidad: 'Procesos Agroindustriales y Control de Calidad',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [19],
    carrera_nombre: 'Ingeniería Agroindustrial',
    id_departamento: 3,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Ing. Álvaro José Montiel Zambrana',
    correo: 'alvaro.montiel@unan.edu.ni',
    muni: '121', dd: '25', mm: '11', aa: '82', seq: '0001',
    especialidad: 'Producción Agrícola y Riego Sostenible',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [20],
    carrera_nombre: 'Ingeniería Agronómica',
    id_departamento: 3,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Arq. Brenda Lucía Ocampo Espinoza',
    correo: 'brenda.ocampo@unan.edu.ni',
    muni: '121', dd: '14', mm: '07', aa: '86', seq: '0001',
    especialidad: 'Urbanismo y Diseño Arquitectónico',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [21],
    carrera_nombre: 'Arquitectura',
    id_departamento: 3,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'MSc. Norma Isabel Báez Marín',
    correo: 'norma.baez@unan.edu.ni',
    muni: '121', dd: '30', mm: '05', aa: '79', seq: '0001',
    especialidad: 'Enfermería Comunitaria y Materno Infantil',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [22],
    carrera_nombre: 'Enfermería',
    id_departamento: 3,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Lic. Walter Antonio Urbina Ríos',
    correo: 'walter.urbina@unan.edu.ni',
    muni: '121', dd: '09', mm: '01', aa: '84', seq: '0001',
    especialidad: 'Hematología y Microbiología Clínica',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [23],
    carrera_nombre: 'Bioanálisis Clínico',
    id_departamento: 3,
  },
  {
    tipo: 'Coordinador de Carrera',
    nombre: 'Dra. Mayra Jamileth Sevilla Solano',
    correo: 'mayra.sevilla@unan.edu.ni',
    muni: '121', dd: '17', mm: '10', aa: '83', seq: '0001',
    especialidad: 'Cirugía Oral y Odontopediatría',
    rol: 'docente',
    funciones: ['coordinador'],
    carreras: [24],
    carrera_nombre: 'Odontología',
    id_departamento: 3,
  },

  // ── 11 DOCENTES ESPECIALISTAS Y GENERALES ──
  {
    tipo: 'Docente Especialista',
    nombre: 'Lic. Erick Daniel Jarquín Castro',
    correo: 'erick.jarquin@unan.edu.ni',
    muni: '121', dd: '02', mm: '06', aa: '89', seq: '0001',
    especialidad: 'Matemáticas Generales y Estadística Descriptiva',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
  {
    tipo: 'Docente Especialista',
    nombre: 'Lic. Tania Marcela Sotelo Cruz',
    correo: 'tania.sotelo@unan.edu.ni',
    muni: '121', dd: '28', mm: '03', aa: '90', seq: '0001',
    especialidad: 'Lenguaje, Comunicación y Redacción Técnica',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
  {
    tipo: 'Docente Especialista',
    nombre: 'Ing. Henry Alberto Ríos Amador',
    correo: 'henry.rios@unan.edu.ni',
    muni: '121', dd: '15', mm: '09', aa: '88', seq: '0001',
    especialidad: 'Redes, Telecomunicaciones y Ciberseguridad',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
  {
    tipo: 'Docente Especialista',
    nombre: 'MSc. Maritza Auxiliadora Bravo Díaz',
    correo: 'maritza.bravo@unan.edu.ni',
    muni: '121', dd: '12', mm: '12', aa: '81', seq: '0001',
    especialidad: 'Metodología de la Investigación Científica',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
  {
    tipo: 'Docente Especialista',
    nombre: 'Dr. Gabriel Ernesto Medina Calero',
    correo: 'gabriel.medina@unan.edu.ni',
    muni: '121', dd: '21', mm: '04', aa: '82', seq: '0001',
    especialidad: 'Anatomía Humana, Fisiología y Salud Pública',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
  {
    tipo: 'Docente Especialista',
    nombre: 'Lic. Xiomara del Socorro Duarte Marín',
    correo: 'xiomara.duarte@unan.edu.ni',
    muni: '121', dd: '19', mm: '07', aa: '86', seq: '0001',
    especialidad: 'Filosofía Institucional y Ética Profesional',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
  {
    tipo: 'Docente Especialista',
    nombre: 'MSc. Félix Pedro Galeano Rocha',
    correo: 'felix.galeano@unan.edu.ni',
    muni: '121', dd: '04', mm: '11', aa: '78', seq: '0001',
    especialidad: 'Finanzas Corporativas y Formulación de Proyectos',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
  {
    tipo: 'Docente Especialista',
    nombre: 'Lic. Sandra Carolina Vargas Mena',
    correo: 'sandra.vargas@unan.edu.ni',
    muni: '121', dd: '10', mm: '08', aa: '87', seq: '0001',
    especialidad: 'Química Orgánica y Bioquímica Fundamental',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
  {
    tipo: 'Docente Especialista',
    nombre: 'Ing. Noel Antonio Sequeira Miranda',
    correo: 'noel.sequeira@unan.edu.ni',
    muni: '121', dd: '31', mm: '01', aa: '85', seq: '0001',
    especialidad: 'Física Clásica y Termodinámica Aplicada',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
  {
    tipo: 'Docente Especialista',
    nombre: 'MSc. Ligia Patricia Solís Zambrana',
    correo: 'ligia.solis@unan.edu.ni',
    muni: '121', dd: '06', mm: '05', aa: '84', seq: '0001',
    especialidad: 'Psicología Educativa y Orientación Vocacional',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
  {
    tipo: 'Docente Especialista',
    nombre: 'Dra. Ana Virginia Rivas Romero',
    correo: 'ana.rivas@unan.edu.ni',
    muni: '121', dd: '13', mm: '09', aa: '80', seq: '0001',
    especialidad: 'Farmacología Clínica y Toxicología Médica',
    rol: 'docente',
    funciones: [],
    carreras: [],
  },
];

const STANDARD_PASSWORD = 'Docente2026*';

async function seed() {
  console.log(`Iniciando registro de ${TEACHERS.length} docentes, coordinadores y directores...`);

  // 1. Fetch existing auth users to avoid duplicates
  const existingAuthRes = await fetch(`${url}/auth/v1/admin/users`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  const existingAuthData = await existingAuthRes.json();
  const authUsersByEmail = new Map(
    (existingAuthData.users || []).map(u => [u.email.toLowerCase(), u])
  );

  // 2. Fetch existing public.usuarios
  const existingUsersRes = await fetch(`${url}/rest/v1/usuarios?select=*`, {
    headers: adminHeaders,
  });
  const existingUsers = await existingUsersRes.json();
  const usersByEmail = new Map(
    (existingUsers || []).map(u => [u.correo.toLowerCase(), u])
  );

  const results = [];

  for (const t of TEACHERS) {
    const cedula = makeCedula(t.muni, t.dd, t.mm, t.aa, t.seq);
    const email = t.correo.toLowerCase();

    // A. Ensure user in Auth
    let authUser = authUsersByEmail.get(email);
    if (!authUser) {
      const authCreateRes = await fetch(`${url}/auth/v1/admin/users`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          email,
          password: STANDARD_PASSWORD,
          email_confirm: true,
          user_metadata: { nombre: t.nombre },
        }),
      });
      if (!authCreateRes.ok) {
        const errText = await authCreateRes.text();
        throw new Error(`Failed to create Auth user ${email}: ${authCreateRes.status} ${errText}`);
      }
      authUser = await authCreateRes.json();
      authUsersByEmail.set(email, authUser);
    } else {
      // Update password to ensure it is functional
      await fetch(`${url}/auth/v1/admin/users/${authUser.id}`, {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          password: STANDARD_PASSWORD,
          email_confirm: true,
        }),
      });
    }

    // B. Ensure user in public.usuarios
    let dbUser = usersByEmail.get(email);
    if (!dbUser) {
      const createRes = await fetch(`${url}/rest/v1/usuarios`, {
        method: 'POST',
        headers: { ...adminHeaders, Prefer: 'return=representation' },
        body: JSON.stringify({
          nombre: t.nombre,
          correo: email,
          cedula,
          contrasena: '***',
          rol: t.rol,
          estado: 'activo',
        }),
      });
      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Failed to insert into usuarios ${email}: ${createRes.status} ${errText}`);
      }
      const createdRows = await createRes.json();
      dbUser = createdRows[0];
      usersByEmail.set(email, dbUser);
    } else {
      // Update info
      await fetch(`${url}/rest/v1/usuarios?id_usuario=eq.${dbUser.id_usuario}`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          nombre: t.nombre,
          cedula,
          rol: t.rol,
          estado: 'activo',
        }),
      });
    }

    const userId = dbUser.id_usuario;

    // C. Upsert pwa_permisos_usuario
    await fetch(`${url}/rest/v1/pwa_permisos_usuario`, {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        id_usuario: userId,
        funciones: t.funciones,
        carreras: t.carreras,
      }),
    });

    // D. If Director, upsert pwa_directores_departamento
    if (t.id_departamento && t.funciones.includes('jefe_departamento')) {
      await fetch(`${url}/rest/v1/pwa_directores_departamento`, {
        method: 'POST',
        headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify({
          id_usuario: userId,
          id_departamento: t.id_departamento,
          revision: 1,
        }),
      });
    }

    // E. Upsert docentes table
    await fetch(`${url}/rest/v1/docentes`, {
      method: 'POST',
      headers: { ...adminHeaders, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({
        id_docente: userId,
        especialidad: t.especialidad,
      }),
    });

    // F. Upsert pwa_docentes_academicos
    // Check if exists
    const docAcadRes = await fetch(`${url}/rest/v1/pwa_docentes_academicos?id_usuario=eq.${userId}`, {
      headers: adminHeaders,
    });
    const docAcadRows = await docAcadRes.json();
    if (docAcadRows && docAcadRows.length > 0) {
      await fetch(`${url}/rest/v1/pwa_docentes_academicos?id_usuario=eq.${userId}`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({
          cedula,
          nombre: t.nombre,
        }),
      });
    } else {
      await fetch(`${url}/rest/v1/pwa_docentes_academicos`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          id_usuario: userId,
          cedula,
          nombre: t.nombre,
        }),
      });
    }

    results.push({
      id: userId,
      tipo: t.tipo,
      nombre: t.nombre,
      correo: email,
      cedula,
      rol: t.rol,
      funciones: t.funciones.join(', ') || 'Ninguna (docente regular)',
      carrera: t.carrera_nombre || (t.carreras.length > 0 ? `Carrera ${t.carreras[0]}` : 'N/A'),
      departamento: t.departamento_nombre || (t.id_departamento ? `Depto ${t.id_departamento}` : 'N/A'),
      password: STANDARD_PASSWORD,
    });
    console.log(`[OK] (${results.length}/${TEACHERS.length}) ${t.tipo}: ${t.nombre} <${email}> [${cedula}]`);
  }

  console.log('\n--- VERIFICACIÓN DE LOGIN EN SUPABASE AUTH ---');
  // Verify 1 Director
  const testDir = TEACHERS.find(t => t.funciones.includes('jefe_departamento'));
  const dirLogin = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testDir.correo, password: STANDARD_PASSWORD }),
  });
  console.log(`Director Login (${testDir.correo}): ${dirLogin.status === 200 ? 'EXITOSO' : 'FALLIDO'}`);

  // Verify 1 Coordinador
  const testCoord = TEACHERS.find(t => t.funciones.includes('coordinador'));
  const coordLogin = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testCoord.correo, password: STANDARD_PASSWORD }),
  });
  console.log(`Coordinador Login (${testCoord.correo}): ${coordLogin.status === 200 ? 'EXITOSO' : 'FALLIDO'}`);

  // Verify 1 Docente
  const testDoc = TEACHERS.find(t => t.funciones.length === 0);
  const docLogin = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testDoc.correo, password: STANDARD_PASSWORD }),
  });
  console.log(`Docente General Login (${testDoc.correo}): ${docLogin.status === 200 ? 'EXITOSO' : 'FALLIDO'}`);

  return results;
}

seed()
  .then(res => {
    console.log('\n=============================================');
    console.log(`TOTAL DOCENTES REGISTRADOS: ${res.length}`);
    console.log('=============================================');
  })
  .catch(err => {
    console.error('Error durante la siembra de docentes:', err);
    process.exit(1);
  });

