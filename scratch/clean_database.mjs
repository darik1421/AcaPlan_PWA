const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

async function deleteFromTable(table, query = '') {
  const endpoint = `${url}/rest/v1/${table}${query ? `?${query}` : ''}`;
  const res = await fetch(endpoint, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`Error deleting from ${table}: ${res.status} ${err}`);
  } else {
    console.log(`Deleted from ${table} (${res.status})`);
  }
}

async function clean() {
  console.log('--- Starting safe database clean ---');

  // 1. Borradores y publicaciones
  await deleteFromTable('pwa_publicaciones_horario', 'id=gt.0');
  await deleteFromTable('pwa_clases_borrador', 'id_clase=gt.0');
  await deleteFromTable('pwa_movimientos_borrador', 'id=gt.0');
  await deleteFromTable('pwa_borrador_carreras', 'id=gt.0');
  await deleteFromTable('pwa_historial_ciclo', 'id=gt.0');
  await deleteFromTable('pwa_ciclo_borrador', 'id=gt.0');
  await deleteFromTable('pwa_borradores_horario', 'id_borrador=gt.0');

  // 2. Restricciones y reglas consecutivas
  await deleteFromTable('pwa_reglas_consecutivas', 'id_regla=gt.0');
  await deleteFromTable('pwa_restricciones_docentes', 'id_restriccion=gt.0');
  await deleteFromTable('pwa_restricciones_academicas', 'id_restriccion=gt.0');

  // 3. Asignaciones académicas e importaciones Excel
  await deleteFromTable('pwa_componentes_asignacion', 'id_componente=gt.0');
  await deleteFromTable('pwa_necesidades_recursos', 'id_necesidad=gt.0');
  await deleteFromTable('pwa_necesidades_asignacion', 'id=gt.0');
  await deleteFromTable('pwa_asignacion_docentes', 'id=gt.0');
  await deleteFromTable('pwa_asignaciones_academicas', 'id_asignacion=gt.0');
  await deleteFromTable('pwa_asignaturas_academicas', 'id_asignatura=gt.0');
  await deleteFromTable('pwa_docentes_academicos', 'id_docente=gt.0');
  await deleteFromTable('pwa_datos_ano_carrera', 'id=gt.0');
  await deleteFromTable('pwa_importaciones', 'id_importacion=gt.0');

  // 4. Espacios de prueba
  await deleteFromTable('aula_recurso', 'id_aula=gt.0');
  await deleteFromTable('aulas', 'id_aula=gt.0');
  await deleteFromTable('pabellones', 'id_pabellon=gt.0');

  // 5. Carreras inactivas de prueba (1, 2, 3)
  await deleteFromTable('pwa_carrera_departamento', 'id_carrera=in.(1,2,3)');
  await deleteFromTable('carreras', 'id_carrera=in.(1,2,3)');

  // 6. Cuentas de usuario de prueba (conservando admin@unan.edu.ni y darikcas13@gmail.com)
  const usersRes = await fetch(`${url}/rest/v1/usuarios?select=id_usuario,correo`, { headers });
  const allUsers = await usersRes.json();
  const testUsers = allUsers.filter(u => u.correo !== 'admin@unan.edu.ni' && u.correo !== 'darikcas13@gmail.com');
  
  for (const u of testUsers) {
    await deleteFromTable('usuarios', `id_usuario=eq.${u.id_usuario}`);
  }

  // 7. Auth users de prueba
  const authRes = await fetch(`${url}/auth/v1/admin/users`, { headers });
  const authData = await authRes.json();
  if (authData.users) {
    const testAuthUsers = authData.users.filter(u => u.email !== 'admin@unan.edu.ni' && u.email !== 'darikcas13@gmail.com');
    for (const u of testAuthUsers) {
      const delAuth = await fetch(`${url}/auth/v1/admin/users/${u.id}`, {
        method: 'DELETE',
        headers
      });
      console.log(`Deleted auth user ${u.email}: status ${delAuth.status}`);
    }
  }

  console.log('--- Database cleaning completed successfully! ---');
}

clean().catch(console.error);

