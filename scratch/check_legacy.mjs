const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const legacy = [
  'docentes',
  'asignaturas',
  'horarios',
  'bloques_clase',
  'secciones',
  'seccion_asignatura',
  'programacion_academica',
  'disponibilidad_docente',
  'pwa_directores_departamento',
  'pwa_permisos_usuario',
  'pwa_ocupaciones_horario',
  'pwa_sedes_traslado',
  'pwa_cuadriculas',
  'pwa_grupos_turnos'
];

async function check() {
  for (const t of legacy) {
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
    console.log(`${t}: ${count}`);
  }
}

check().catch(console.error);

