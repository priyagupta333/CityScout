import { env } from 'cloudflare:workers';

export type AccountRow = {id:string;name:string;email:string;station:string;vibe:string;password_hash:string;salt:string;created_at:string};
export function profile(row: AccountRow) {
  return {id:row.id,name:row.name,email:row.email,station:row.station,vibe:row.vibe,initials:row.name.split(/\s+/).map(n => n[0]).join('').slice(0,2).toUpperCase(),createdAt:Date.parse(row.created_at)};
}
export async function hashPassword(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'}, key, 256);
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2,'0')).join('');
}
export function cookie(request: Request, value: string, age = 2592000) {
  return `apnashehar_auth=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export function token(request: Request) { return request.headers.get('cookie')?.match(/(?:^|;\s*)apnashehar_auth=([a-zA-Z0-9-]+)/)?.[1]; }
export async function account(request: Request) {
  const session = token(request);
  if (!session || !env.DB) return null;
  return env.DB.prepare('SELECT u.* FROM explorer_users u JOIN explorer_sessions s ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > ?').bind(session, new Date().toISOString()).first<AccountRow>();
}
