import fs from 'fs';

let code = fs.readFileSync('src/generation-service.js', 'utf8');

code = code.replace(
  'export async function proposeGeneration({data, load, solve = runGeneration}) {',
  `export async function proposeGeneration({data, load, solve = runGeneration}) {
  console.log('[DEBUG SERVICE 1] entered proposeGeneration');`
);

code = code.replace(
  'const result = await solve(context, options)',
  `console.log('[DEBUG SERVICE 2] calling solve');
  const result = await solve(context, options);
  console.log('[DEBUG SERVICE 3] solve returned:', typeof result, result ? Object.keys(result) : null);`
);

fs.writeFileSync('src/generation-service.js', code, 'utf8');
console.log('Updated generation-service.js successfully.');
