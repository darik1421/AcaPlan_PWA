const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkCatalogs() {
  const depts = await fetch(`${url}/rest/v1/pwa_departamentos?select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  }).then(r => r.json());
  console.log('DEPARTAMENTOS:', depts);

  const carreras = await fetch(`${url}/rest/v1/carreras?select=id_carrera,codigo,nombre`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  }).then(r => r.json());
  console.log('CARRERAS COUNT:', carreras.length);
  console.log('CARRERAS SAMPLE:', carreras.slice(0, 5));
}

checkCatalogs().catch(console.error);

