const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkAllTables() {
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`);
  // OpenAPI spec from Supabase gives all paths and tables!
  const swagger = await res.json();
  const paths = Object.keys(swagger.paths || {}).map(p => p.replace('/', ''));
  console.log('Available tables in PostgREST:', paths);
}

checkAllTables().catch(console.error);

