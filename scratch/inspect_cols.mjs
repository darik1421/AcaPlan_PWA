const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const tables = [
  'pwa_clases_borrador',
  'pwa_borrador_carreras',
  'pwa_ciclo_borrador',
  'pwa_borradores_horario',
  'pwa_reglas_consecutivas',
  'pwa_componentes_asignacion',
  'pwa_necesidades_recursos',
  'pwa_necesidades_asignacion',
  'pwa_asignacion_docentes',
  'pwa_asignaciones_academicas',
  'pwa_docentes_academicos',
  'pwa_datos_ano_carrera',
  'pwa_importaciones',
  'pwa_directores_departamento',
  'pwa_coordinadores_carrera'
];

async function inspectColumns() {
  for (const t of tables) {
    const res = await fetch(`${url}/rest/v1/${t}?limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` }
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      console.log(`${t} columns:`, Object.keys(data[0]));
    } else {
      console.log(`${t}: empty or error:`, data);
    }
  }
}

inspectColumns().catch(console.error);

