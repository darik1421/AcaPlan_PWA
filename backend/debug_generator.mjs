import { generateProposal } from './src/generation.js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

async function setup() {
  console.log('1. Normalizing sede in pwa_datos_ano_carrera to CUR:');
  const patchSedeRes = await fetch(url + '/rest/v1/pwa_datos_ano_carrera?id_periodo=eq.1', {
    method: 'PATCH',
    headers: { Authorization: 'Bearer ' + serviceKey, apikey: serviceKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sede: 'CUR' })
  });
  console.log('Patch sede status:', patchSedeRes.status);

  console.log('\n2. Populating pwa_necesidades_asignacion for all assignments:');
  const asigRes = await fetch(url + '/rest/v1/pwa_asignaciones_academicas?select=id&id_periodo=eq.1', {
    headers: { Authorization: 'Bearer ' + serviceKey, apikey: serviceKey }
  });
  const asigs = await asigRes.json();
  console.log(`Found ${asigs.length} assignments in periodo 1`);

  const needsRows = asigs.map(a => ({
    id_asignacion: a.id,
    tipo_espacio: 'aula',
    actualizado_por: 1
  }));

  const needsRes = await fetch(url + '/rest/v1/pwa_necesidades_asignacion', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + serviceKey,
      apikey: serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    },
    body: JSON.stringify(needsRows)
  });
  console.log('Insert needs status:', needsRes.status);

  console.log('\n3. Testing pwa_generador context:');
  const loginRes = await fetch(url + '/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@unan.edu.ni', password: 'Docente2026*' })
  });
  const { access_token } = await loginRes.json();
  const auth = 'Bearer ' + access_token;

  const rpcRes = await fetch(url + '/rest/v1/rpc/pwa_generador', {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'context', payload: { id: 19, version_reglas: 1 } })
  });
  const context = await rpcRes.json();
  console.log('Asignaciones en borrador 19:', context.snapshot?.asignaciones?.length);
  const a0 = context.snapshot?.asignaciones?.[0];
  console.log('Sample asignacion necesidades:', a0?.necesidades);

  console.log('\n4. Running generateProposal on borrador 19:');
  const startTime = Date.now();
  try {
    const proposal = generateProposal(context, { id: 19, lockedDays: [], modoProfundo: false });
    console.log(`generateProposal finished in ${Date.now() - startTime}ms!`);
    console.log('Listo para guardar:', proposal.listo_para_guardar);
    console.log('Clases generadas:', proposal.clases?.length);
    console.log('Conflictos:', proposal.revision?.conflictos?.length);
    console.log('Pendientes:', proposal.revision?.pendientes?.length);
    console.log('Mensaje:', proposal.mensaje);
    if (proposal.clases?.length > 0) {
      console.log('Sample generated class:', proposal.clases[0]);
    }
  } catch (err) {
    console.error('generateProposal error:', err.status, err.message);
  }
}

setup().catch(console.error);
