const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
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

  console.log('=== TABLAS Y CONTEO ACTUAL ===');
  for (const table of tables) {
    const { data, count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`${table}: ERROR (${error.message})`);
    } else {
      console.log(`${table}: ${count} filas`);
    }
  }
}

check();

