const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function inspectDetails() {
  const aulas = await fetch(`${url}/rest/v1/aulas?select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  }).then(r => r.json());
  console.log('AULAS:', aulas);

  const pabellones = await fetch(`${url}/rest/v1/pabellones?select=*`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  }).then(r => r.json());
  console.log('PABELLONES:', pabellones);

  const users = await fetch(`${url}/rest/v1/usuarios?select=id_usuario,nombre,correo,rol,estado`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  }).then(r => r.json());
  console.log('USUARIOS:', users);
}

inspectDetails().catch(console.error);

