import { env } from 'cloudflare:workers';
import { places } from '../../../lib/places';
import { safeSameOrigin, topics } from '../../../lib/community';

export async function POST(request: Request) {
  if (!safeSameOrigin(request)) return Response.json({error:'Invalid request origin'}, {status:403});
  if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({error:'Send JSON'}, {status:415});
  if (Number(request.headers.get('content-length') || 0) > 5000) return Response.json({error:'Note is too large'}, {status:413});
  if (!env.DB) return Response.json({error:'Community storage is unavailable'}, {status:503});
  let data: Record<string,unknown>;
  try { data = await request.json(); } catch { return Response.json({error:'Invalid JSON'}, {status:400}); }
  const placeId = typeof data.placeId === 'string' && data.placeId ? data.placeId : null;
  const known = placeId ? places.find(p => p.id === placeId) : null;
  if (placeId && !known) return Response.json({error:'Unknown place'}, {status:400});
  const placeName = known?.name ?? (typeof data.placeName === 'string' ? data.placeName.trim().slice(0,90) : '');
  const topic = typeof data.topic === 'string' ? data.topic : '';
  const note = typeof data.note === 'string' ? data.note.trim() : '';
  if (placeName.length < 3 || !topics.includes(topic as typeof topics[number]) || note.length < 15 || note.length > 600) return Response.json({error:'Please add a place, a topic, and 15–600 characters of detail.'}, {status:400});
  if(topic === 'Local verification' && !known) return Response.json({error:'Choose a listed place to verify.'},{status:400});
  let session = request.headers.get('cookie')?.match(/(?:^|; )apnashehar_session=([a-zA-Z0-9-]+)/)?.[1];
  const newSession = !session;
  if (!session) session = crypto.randomUUID();
  if(topic === 'Local verification') {
    const previous = await env.DB.prepare("SELECT id FROM contributions WHERE session_id = ? AND place_id = ? AND topic = 'Local verification' AND status IN ('pending','approved')").bind(session,placeId).first();
    if(previous) return Response.json({error:'You already have a pending or approved verification for this place.'},{status:409});
  }
  const since = new Date(Date.now() - 86400000).toISOString();
  const count = await env.DB.prepare('SELECT COUNT(*) as n FROM contributions WHERE session_id = ? AND created_at >= ?').bind(session,since).first<{n:number}>();
  if ((count?.n || 0) >= 6) return Response.json({error:'Daily submission limit reached. Please try tomorrow.'}, {status:429});
  const id = crypto.randomUUID(), createdAt = new Date().toISOString();
  await env.DB.prepare('INSERT INTO contributions (id, place_id, place_name, topic, note, status, created_at, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id,placeId,placeName,topic,note,'pending',createdAt,session).run();
  const headers = new Headers({ 'Cache-Control':'no-store' });
  if (newSession) headers.append('Set-Cookie',`apnashehar_session=${session}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`);
  return Response.json({ id, status:'pending' }, { status:201, headers });
}
