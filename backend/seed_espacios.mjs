const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

const PABELLONES_DATA = [
  {
    nombre: 'Pabellón C',
    aulas: [
      { codigo: 'C1', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'C2', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'C3', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'C4', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'C5', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'C6', capacidad: 35, tipo: 'aula', sede: 'CUR' },
    ],
  },
  {
    nombre: 'Pabellón D',
    aulas: [
      { codigo: 'D1', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'D2', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'D3', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'D4', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'D5', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'D6', capacidad: 35, tipo: 'aula', sede: 'CUR' },
    ],
  },
  {
    nombre: 'Pabellón E',
    aulas: [
      { codigo: 'E1', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'E2', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'E3', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'E4', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'E5', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'E6', capacidad: 35, tipo: 'aula', sede: 'CUR' },
    ],
  },
  {
    nombre: 'Pabellón Ocavide',
    aulas: [
      { codigo: 'Ocavide 1', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'Ocavide 2', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'Ocavide 3', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'Ocavide 4', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'Ocavide 5', capacidad: 35, tipo: 'aula', sede: 'CUR' },
      { codigo: 'Ocavide 6', capacidad: 35, tipo: 'aula', sede: 'CUR' },
    ],
  },
  {
    nombre: 'Biblioteca',
    aulas: [
      { codigo: 'Sala Grande', capacidad: 50, tipo: 'sala', sede: 'CUR' },
      { codigo: 'Sala Pequeña', capacidad: 25, tipo: 'sala', sede: 'CUR' },
    ],
  },
];

async function seedSpaces() {
  console.log('Seeding pabellones y aulas...');

  // 1. Check existing pabellones
  const existingPabellonesRes = await fetch(`${url}/rest/v1/pabellones?select=*`, { headers });
  const existingPabellones = await existingPabellonesRes.json();
  const pabellonMap = new Map((existingPabellones || []).map(p => [p.nombre.toLowerCase(), p]));

  // 2. Check existing aulas
  const existingAulasRes = await fetch(`${url}/rest/v1/aulas?select=*`, { headers });
  const existingAulas = await existingAulasRes.json();
  const aulaMap = new Map((existingAulas || []).map(a => [`${a.id_pabellon}_${a.codigo.toLowerCase()}`, a]));

  const summary = [];

  for (const group of PABELLONES_DATA) {
    let pRecord = pabellonMap.get(group.nombre.toLowerCase());
    if (!pRecord) {
      const pRes = await fetch(`${url}/rest/v1/pabellones`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nombre: group.nombre }),
      });
      if (!pRes.ok) {
        throw new Error(`Failed to insert pabellon ${group.nombre}: ${pRes.status} ${await pRes.text()}`);
      }
      const inserted = await pRes.json();
      pRecord = inserted[0];
      pabellonMap.set(group.nombre.toLowerCase(), pRecord);
    }

    const aulasCreated = [];
    for (const aula of group.aulas) {
      const key = `${pRecord.id_pabellon}_${aula.codigo.toLowerCase()}`;
      let aRecord = aulaMap.get(key);
      if (!aRecord) {
        const aRes = await fetch(`${url}/rest/v1/aulas`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            codigo: aula.codigo,
            id_pabellon: pRecord.id_pabellon,
            capacidad: aula.capacidad,
            tipo: aula.tipo,
            sede: aula.sede,
            estado: 'activo',
          }),
        });
        if (!aRes.ok) {
          throw new Error(`Failed to insert aula ${aula.codigo}: ${aRes.status} ${await aRes.text()}`);
        }
        const aInserted = await aRes.json();
        aRecord = aInserted[0];
        aulaMap.set(key, aRecord);
      }
      aulasCreated.push(aRecord);
    }

    summary.push({
      id_pabellon: pRecord.id_pabellon,
      nombre: pRecord.nombre,
      aulasCount: aulasCreated.length,
      aulas: aulasCreated.map(a => a.codigo),
    });
  }

  console.log('Finished seeding:');
  console.log(JSON.stringify(summary, null, 2));
}

seedSpaces().catch(console.error);

