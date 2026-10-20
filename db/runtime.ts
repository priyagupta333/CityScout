import { neon } from '@neondatabase/serverless';

// Compatibility boundary for the existing parameterized repository queries.
// No connection string is created during static rendering or exposed to clients.
function client() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  return neon(url);
}

class Statement {
  constructor(readonly text: string, readonly values: unknown[] = []) {}
  bind(...values: unknown[]) { return new Statement(this.text, values); }
  private query() {
    // Application queries use question marks only as value placeholders.
    let position = 0;
    return this.text.replace(/\?/g, () => `$${++position}`);
  }
  execution(sql = client()) { return sql.query(this.query(), this.values); }
  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const rows = await this.execution();
    return (rows[0] as T | undefined) ?? null;
  }
  async all<T = Record<string, unknown>>() {
    return { results: await this.execution() as T[] };
  }
  async run() { await this.execution(); return { success: true }; }
}

const database = {
  prepare(text: string) { return new Statement(text); },
  async batch(statements: Statement[]) {
    const sql = client();
    return sql.transaction(statements.map(statement => statement.execution(sql)));
  },
};

export const env = {
  get DB() { return process.env.DATABASE_URL ? database : undefined; },
  get MODERATION_KEY() { return process.env.MODERATION_KEY; },
};
