import { env } from '../../../db/runtime';
import { account, cookie, hashPassword, profile, token, type AccountRow } from '../../../lib/account';
import { anchors } from '../../../lib/places';
import { safeSameOrigin } from '../../../lib/community';

const headers = {'Cache-Control':'no-store'};
export async function GET(request: Request) {
  const user = await account(request);
  return Response.json({user: user ? profile(user) : null}, {headers});
}
export async function POST(request: Request) {
  if (!safeSameOrigin(request)) return Response.json({error:'Invalid request origin'}, {status:403});
  if (!env.DB) return Response.json({error:'Database unavailable. Configure DATABASE_URL and run npm run db:setup.'}, {status:503});
  let data;
  try { data = await request.json() as Record<string, unknown>; } catch { return Response.json({error:'Invalid JSON'}, {status:400}); }
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 128 || !['signup','signin'].includes(String(data.action))) return Response.json({error:'Enter a valid email and a password of 8–128 characters.'}, {status:400});
  let user = await env.DB.prepare('SELECT * FROM explorer_users WHERE email = ?').bind(email).first<AccountRow>();
  if (data.action === 'signup') {
    if (user) return Response.json({error:'An account with this email already exists. Please sign in.'}, {status:409});
    const name = typeof data.name === 'string' ? data.name.trim().slice(0,80) : '';
    if (!name || !anchors.some(a => a.name === data.station)) return Response.json({error:'Add your name and choose a home station.'}, {status:400});
    const salt = crypto.randomUUID();
    user = {id:crypto.randomUUID(),name,email,station:String(data.station),vibe:String(data.vibe || 'Wanderer').slice(0,80),salt,password_hash:await hashPassword(password,salt),created_at:new Date().toISOString()};
    try { await env.DB.prepare('INSERT INTO explorer_users (id,name,email,station,vibe,password_hash,salt,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(user.id,user.name,user.email,user.station,user.vibe,user.password_hash,user.salt,user.created_at).run(); }
    catch { return Response.json({error:'Could not create this account. Try signing in or retry.'}, {status:409}); }
  } else {
    const candidate = await hashPassword(password, user?.salt ?? 'unknown-account');
    if (!user || user.password_hash !== candidate) return Response.json({error:'Email or password is incorrect.'}, {status:401});
  }
  const session = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO explorer_sessions (id,user_id,expires_at) VALUES (?,?,?)').bind(session,user.id,new Date(Date.now()+2592000000).toISOString()).run();
  return Response.json({user:profile(user)}, {status:data.action === 'signup' ? 201 : 200,headers:{...headers,'Set-Cookie':cookie(request,session)}});
}
export async function DELETE(request: Request) {
  if (!safeSameOrigin(request)) return Response.json({error:'Invalid request origin'}, {status:403});
  const session = token(request);
  if (session && env.DB) await env.DB.prepare('DELETE FROM explorer_sessions WHERE id = ?').bind(session).run();
  return Response.json({ok:true}, {headers:{...headers,'Set-Cookie':cookie(request,'',0)}});
}
