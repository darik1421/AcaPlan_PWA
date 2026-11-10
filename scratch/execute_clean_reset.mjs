const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

async function del(table, query) {
  const endpoint = `${url}/rest/v1/${table}?${query}`;
  const res = await fetch(endpoint, { method: 'DELETE', headers });
  if (!res.ok) {
    const txt = await res.text();
    console.error(`FAIL: ${table}?${query} => ${res.status}: ${txt}`);
  } else {
    console.log(`OK: Deleted from ${table} (${res.status})`);
  }
}

async function run() {
  console.log('=== STARTING COMPLETE DATA RESET ===');

  // 1. Borradores y publicaciones
  await del('pwa_publicaciones_horario', 'id=gt.0');
  await del('pwa_clases_borrador', 'id=gt.0');
  await del('pwa_movimientos_borrador', 'id=gt.0');
  await del('pwa_borrador_carreras', 'id_borrador=gt.0');
  await del('pwa_historial_ciclo', 'id=gt.0');
  await del('pwa_ciclo_borrador', 'id_borrador=gt.0');
  await del('pwa_borradores_horario', 'id=gt.0');

  // 2. Reglas y restricciones
  await del('pwa_reglas_consecutivas', 'id=gt.0');
  await del('pwa_restricciones_docentes', 'id_restriccion=gt.0');
  await del('pwa_restricciones_academicas', 'id_restriccion=gt.0');

  // 3. Asignaciones académicas, necesidades e importaciones
  await del('pwa_necesidades_asignacion', 'id_asignacion=gt.0');
  await del('pwa_asignacion_docentes', 'id_asignacion=gt.0');
  await del('pwa_asignaciones_academicas', 'id=gt.0');
  await del('pwa_asignaturas_academicas', 'id_asignatura=gt.0');
  await del('pwa_docentes_academicos', 'id=gt.0');
  await del('pwa_datos_ano_carrera', 'id_periodo=gt.0');
  await del('pwa_importaciones', 'id=gt.0');

  // 4. Espacios
  await del('aula_recurso', 'id_aula=gt.0');
  await del('aulas', 'id_aula=gt.0');
  await del('pabellones', 'id_pabellon=gt.0');

  // 5. Permisos y relaciones de usuarios
  await del('pwa_directores_departamento', 'id_usuario=gt.0');
  await del('disponibilidad_docente', 'id_docente=gt.0');
  await del('docentes', 'id_docente=gt.0');
  await del('pwa_permisos_usuario', 'id_usuario=neq.1');

  // 6. Usuarios en public.usuarios (conservando admin@unan.edu.ni e id 1)
  const usersRes = await fetch(`${url}/rest/v1/usuarios?select=id_usuario,correo`, { headers });
  const users = await usersRes.json();
  for (const u of users) {
    if (u.id_usuario !== 1 && u.correo !== 'admin@unan.edu.ni' && u.correo !== 'darikcas13@gmail.com') {
      await del('usuarios', `id_usuario=eq.${u.id_usuario}`);
    }
  }

  // 7. Supabase Auth users
  const authRes = await fetch(`${url}/auth/v1/admin/users`, { headers });
  const authData = await authRes.json();
  if (authData.users) {
    for (const u of authData.users) {
      if (u.email !== 'admin@unan.edu.ni' && u.email !== 'darikcas13@gmail.com') {
        const d = await fetch(`${url}/auth/v1/admin/users/${u.id}`, { method: 'DELETE', headers });
        console.log(`Deleted Auth user: ${u.email} (${d.status})`);
      }
    }
  }

  console.log('=== VERIFYING FINAL COUNTS ===');
  const tables = [
    'pwa_publicaciones_horario',
    'pwa_clases_borrador',
    'pwa_borradores_horario',
    'pwa_reglas_consecutivas',
    'pwa_restricciones_docentes',
    'pwa_asignaciones_academicas',
    'pwa_asignaturas_academicas',
    'pwa_docentes_academicos',
    'pwa_importaciones',
    'aulas',
    'pabellones',
    'usuarios',
    'carreras',
    'pwa_departamentos',
    'periodos'
  ];

  for (const t of tables) {
    const res = await fetch(`${url}/rest/v1/${t}?select=*`, {
      headers: { ...headers, Range: '0-0', Prefer: 'count=exact' }
    });
    const cr = res.headers.get('content-range');
    const count = cr ? cr.split('/')[1] : '0';
    console.log(`Final count ${t}: ${count}`);
  }
}

run().catch(console.error);

