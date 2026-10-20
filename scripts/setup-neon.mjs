import nextEnv from '@next/env';
import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

nextEnv.loadEnvConfig(process.cwd());
try {
  if (!process.env.DATABASE_URL) throw new Error('missing configuration');
  const sql = neon(process.env.DATABASE_URL);
  await sql.query('CREATE TABLE IF NOT EXISTS _apnashehar_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
  // Ordered, idempotent migrations; atomic per migration and safe to repeat.
  for (const file of readdirSync('postgres').filter(name => name.endsWith('.sql')).sort()) {
    const source = readFileSync(`postgres/${file}`, 'utf8').replace(/\r\n/g, '\n');
    const checksum = createHash('sha256').update(source).digest('hex');
    const applied = await sql.query('SELECT checksum FROM _apnashehar_migrations WHERE name = $1', [file]);
    if (applied.length) {
      if (applied[0].checksum !== checksum) throw new Error('applied migration was edited');
      console.log(`Already applied ${file}`);
      continue;
    }
    const statements = source.split(';').map(s => s.trim()).filter(Boolean);
    await sql.transaction([
      ...statements.map(statement => sql.query(statement)),
      sql.query('INSERT INTO _apnashehar_migrations (name, checksum) VALUES ($1, $2)', [file, checksum]),
    ]);
    console.log(`Applied ${file}`);
  }
  const result = await sql.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('explorer_users','explorer_sessions','explorer_library','contributions','moderation_audit') ORDER BY tablename");
  if (result.length !== 5) throw new Error('schema verification failed');
  console.log('PASS: Neon connected; all five application tables exist.');
} catch {
  console.error('Neon setup failed. Check DATABASE_URL, network access and database permissions. Credentials have not been logged.');
  process.exitCode = 1;
}
