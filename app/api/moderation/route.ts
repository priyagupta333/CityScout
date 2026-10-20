import { env } from '../../../db/runtime';
import { publicReport, safeSameOrigin, type ContributionRow } from '../../../lib/community';

function authorized(request: Request) {
  const configured = env.MODERATION_KEY;
  const supplied = request.headers.get('x-apnashehar-admin-key');
  if (!configured || !supplied || configured.length !== supplied.length) return false;
  let diff = 0;
  for (let i=0;i<configured.length;i++) diff |= configured.charCodeAt(i) ^ supplied.charCodeAt(i);
  return diff === 0;
}
export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({error:'Moderator access unavailable'}, {status:403});
  if (!env.DB) return Response.json({error:'Storage unavailable'}, {status:503});
  const result = await env.DB.prepare("SELECT id, place_id, place_name, topic, note, status, created_at, reviewed_at, session_id FROM contributions ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT 200").all<ContributionRow>();
  return Response.json(result.results.map(publicReport), {headers:{'Cache-Control':'no-store'}});
}
export async function PATCH(request: Request) {
  if (!safeSameOrigin(request) || !authorized(request)) return Response.json({error:'Moderator access denied'}, {status:403});
  if (!env.DB) return Response.json({error:'Storage unavailable'}, {status:503});
  let data: {id?:unknown;status?:unknown};
  try { data = await request.json(); } catch { return Response.json({error:'Invalid JSON'}, {status:400}); }
  if (typeof data.id !== 'string' || !['approved','rejected'].includes(String(data.status))) return Response.json({error:'Invalid decision'}, {status:400});
  const row = await env.DB.prepare('SELECT status FROM contributions WHERE id = ?').bind(data.id).first<{status:string}>();
  if (!row) return Response.json({error:'Note not found'}, {status:404});
  if (row.status === data.status) return Response.json({ok:true});
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE contributions SET status = ?, reviewed_at = ? WHERE id = ?').bind(data.status,now,data.id),
    env.DB.prepare('INSERT INTO moderation_audit (id, contribution_id, action, created_at) VALUES (?, ?, ?, ?)').bind(crypto.randomUUID(),data.id,data.status,now),
  ]);
  return Response.json({ok:true,status:data.status});
}
