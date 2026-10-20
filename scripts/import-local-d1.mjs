// Optional, additive import. Reads local D1 only; never deletes source records.
import nextEnv from '@next/env';
import { neon } from '@neondatabase/serverless';
import { execFileSync } from 'node:child_process';

nextEnv.loadEnvConfig(process.cwd());
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL missing');
  const sql = neon(process.env.DATABASE_URL);
  const tables = ['explorer_users', 'explorer_sessions', 'explorer_library', 'contributions', 'moderation_audit'];
  const queries = [];
  const counts = [];
  for (const table of tables) {
    const output = execFileSync(process.execPath, [
      '--import', './scripts/sites-env.mjs', './node_modules/wrangler/bin/wrangler.js',
      'd1', 'execute', 'DB', '--local', '--config', 'wrangler.local.json',
      '--persist-to', '.wrangler/state', '--command', `SELECT * FROM ${table}`, '--json',
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const result = JSON.parse(output);
    const rows = result.flatMap(part => part.results ?? []);
    for (const row of rows) {
      const columns = Object.keys(row);
      if (!columns.every(column => /^[a-z_]+$/.test(column))) throw new Error('unexpected column');
      const primary = table === 'explorer_library' ? 'user_id' : 'id';
      queries.push(sql.query(
        `INSERT INTO ${table} (${columns.join(',')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(',')}) ON CONFLICT (${primary}) DO NOTHING`,
        columns.map(column => row[column]),
      ));
    }
    counts.push(`${table}: ${rows.length} source rows`);
  }
  if (queries.length) await sql.transaction(queries);
  console.log('PASS: additive local D1 import completed in one transaction.');
  counts.forEach(count => console.log(count));
  console.log('Existing rows with matching IDs were preserved; local D1 was not changed.');
} catch {
  console.error('Import failed; no credential or record contents logged. Verify local D1, Neon setup and possible email conflicts.');
  process.exitCode = 1;
}
