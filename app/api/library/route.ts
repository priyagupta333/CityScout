import { env } from '../../../db/runtime';
import { account } from '../../../lib/account';
import { safeSameOrigin } from '../../../lib/community';
import { anchors, places } from '../../../lib/places';

export async function GET(request: Request) {
  const user = await account(request);
  if (!user) return Response.json({error:'Please sign in'}, {status:401});
  const row = await env.DB!.prepare('SELECT saved, plans FROM explorer_library WHERE user_id = ?').bind(user.id).first<{saved:string;plans:string}>();
  return Response.json({saved:row ? JSON.parse(row.saved) : [],plans:row ? JSON.parse(row.plans) : []}, {headers:{'Cache-Control':'no-store'}});
}
export async function PUT(request: Request) {
  if (!safeSameOrigin(request)) return Response.json({error:'Invalid request origin'}, {status:403});
  const user = await account(request);
  if (!user) return Response.json({error:'Please sign in again to sync your list'}, {status:401});
  let body;
  try { const raw = await request.text(); if(raw.length > 50000) return Response.json({error:'Library too large'}, {status:413}); body = JSON.parse(raw); }
  catch { return Response.json({error:'Invalid JSON'}, {status:400}); }
  const validId = (id: unknown) => typeof id === 'string' && places.some(p => p.id === id);
  if (!Array.isArray(body.saved) || !body.saved.every(validId) || !Array.isArray(body.plans) || body.plans.length > 100 || !body.plans.every((p: {ids?: unknown[];anchor?:string;savedAt?:number}) => p && Array.isArray(p.ids) && p.ids.length >= 1 && p.ids.length <= 2 && p.ids.every(validId) && typeof p.anchor === 'string' && (anchors.some(a => a.name === p.anchor) || p.anchor === 'Near me') && typeof p.savedAt === 'number' && Number.isFinite(p.savedAt))) return Response.json({error:'Invalid saved items'}, {status:400});
  await env.DB!.prepare('INSERT INTO explorer_library (user_id,saved,plans) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET saved=excluded.saved, plans=excluded.plans').bind(user.id,JSON.stringify([...new Set(body.saved)]),JSON.stringify(body.plans)).run();
  return Response.json({ok:true}, {headers:{'Cache-Control':'no-store'}});
}
