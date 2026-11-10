const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const tables = [
    'pwa_publicaciones_horario',
    'pwa_clases_borrador',
    'pwa_movimientos_borrador',
    'pwa_borrador_carreras',
    'pwa_ciclo_borrador',
    'pwa_historial_ciclo',
    'pwa_borradores_horario',
    'pwa_reglas_consecutivas',
    'pwa_restricciones_docentes',
    'pwa_restricciones_academicas',
    'pwa_componentes_asignacion',
    'pwa_necesidades_recursos',
    'pwa_necesidades_asignacion',
    'pwa_asignacion_docentes',
    'pwa_asignaciones_academicas',
    'pwa_asignaturas_academicas',
    'pwa_docentes_academicos',
    'pwa_datos_ano_carrera',
    'pwa_importaciones',
    'aula_recurso',
    'aulas',
    'pabellones',
    'recursos',
    'usuarios',
    'carreras',
    'pwa_departamentos',
    'pwa_carrera_departamento',
    'periodos'
  ];

  for (const t of tables) {
    const res = await fetch(`${url}/rest/v1/${t}?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: '0-0',
        Prefer: 'count=exact'
      }
    });
    const cr = res.headers.get('content-range');
    const count = cr ? cr.split('/')[1] : 'unknown';
    console.log(`${t}: ${count} (status ${res.status})`);
  }
}

run().catch(console.error);

