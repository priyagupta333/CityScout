import assert from 'node:assert/strict';
import fs from 'node:fs';
import nextEnv from '@next/env';
import { neon } from '@neondatabase/serverless';
nextEnv.loadEnvConfig(process.cwd());
const base = process.env.APP_URL || 'http://localhost:3000';
let authCookie = '', noteCookie = '', userId = '', sessionId = '';
const createdReports = [];
const email = `qa-${crypto.randomUUID()}@example.test`, password = crypto.randomUUID();
const key = process.env.MODERATION_KEY;
const request = async (path,method='GET',body,extra={}) => fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',...(authCookie ? {Cookie:authCookie} : {}),...extra},...(body ? {body:JSON.stringify(body)} : {})});
try {
  let r = await request('/api/account','POST',{action:'signup',name:'QA Explorer',email,password,station:'Bandra',vibe:'Wanderer'});
  assert.equal(r.status,201,await r.clone().text());
  userId = (await r.json()).user.id; authCookie = r.headers.get('set-cookie').split(';')[0];
  assert(!r.headers.get('set-cookie').includes('Secure'),'Local HTTP must accept the session cookie');
  r = await request('/api/account'); assert.equal((await r.json()).user.id,userId);
  r = await request('/api/account','POST',{action:'signin',email,password:'incorrect-password'}); assert.equal(r.status,401);
  r = await request('/api/library','PUT',{saved:['madras','bandra-fort'],plans:[{ids:['madras','ashok-vada'],anchor:'Matunga',savedAt:Date.now()}]}); assert.equal(r.status,200);
  r = await request('/api/library'); const saved = await r.json(); assert.equal(saved.saved.length,2); assert.equal(saved.plans.length,1);
  r = await request('/api/library','PUT',{saved:['missing-id'],plans:[]}); assert.equal(r.status,400);
  r = await request('/api/library','PUT',{saved:[],plans:[]},{Origin:'https://invalid.example'}); assert.equal(r.status,403);
  r = await request('/api/contributions','POST',{placeId:'missing',topic:'A local tip',note:'This must not be saved.'}); assert.equal(r.status,400);
  for(let i=0;i<7;i++) {
    r = await request('/api/contributions','POST',{placeId:'madras',topic:i===0?'Local verification':'A local tip',note:`QA round-trip check ${i}: useful note for testing the local queue.`},noteCookie ? {Cookie:noteCookie} : {});
    assert.equal(r.status,i < 6 ? 201 : 429,await r.clone().text());
    if(i < 6) createdReports.push((await r.json()).id);
    if(!noteCookie && r.headers.get('set-cookie')) { noteCookie = r.headers.get('set-cookie').split(';')[0]; sessionId = noteCookie.split('=')[1]; }
    if(i===0) {
      const duplicate=await request('/api/contributions','POST',{placeId:'madras',topic:'Local verification',note:'Duplicate verification must not inflate the Gem Score.'},{Cookie:noteCookie});
      assert.equal(duplicate.status,409);
    }
  }
  r = await request('/api/moderation', 'GET',undefined,{'x-apnashehar-admin-key':'wrong-key'}); assert.equal(r.status,403);
  if(key) {
    const admin = {'x-apnashehar-admin-key':key};
    r = await request('/api/moderation','GET',undefined,admin); assert.equal(r.status,200);
    assert((await r.json()).some(p => p.id === createdReports[0] && p.status === 'pending'));
    r = await request('/api/moderation','PATCH',{id:createdReports[0],status:'approved'},admin); assert.equal(r.status,200);
    r = await request('/api/community'); assert((await r.json()).some(p => p.id === createdReports[0] && p.topic === 'Local verification' && p.status === 'approved'));
    r = await request('/api/moderation','PATCH',{id:createdReports[0],status:'rejected'},admin); assert.equal(r.status,200);
    r = await request('/api/community'); assert(!(await r.json()).some(p => p.id === createdReports[0]));
    console.log('PASS: contribution → moderation → publication → rejection and immediate public sync.');
  } else throw new Error('Configure MODERATION_KEY in .env.local to verify moderation.');
  r = await request('/api/account','DELETE'); assert.equal(r.status,200);
  r = await request('/api/account'); assert.equal((await r.json()).user,null);
  r = await request('/api/account','POST',{action:'signin',email,password}); assert.equal(r.status,200);
  authCookie = r.headers.get('set-cookie').split(';')[0];
  r = await request('/api/library'); assert.deepEqual((await r.json()).saved,['madras','bandra-fort']);
  console.log('PASS: account creation, password rejection, session restore, saved plans, sign-out/sign-in persistence, origin validation and six-note rate limit.');
} finally {
  // Remove only the rows created by this test; preserve all existing user data.
  const sql = [
    ...createdReports.map(id => `DELETE FROM moderation_audit WHERE contribution_id='${id}'; DELETE FROM contributions WHERE id='${id}';`),
    ...(userId ? [`DELETE FROM explorer_library WHERE user_id='${userId}'; DELETE FROM explorer_sessions WHERE user_id='${userId}'; DELETE FROM explorer_users WHERE id='${userId}';`] : []),
  ].join('\n');
  if(sql) {
    fs.mkdirSync('outputs',{recursive:true}); fs.writeFileSync('outputs/qa-cleanup.sql',sql);
    const sqlClient = neon(process.env.DATABASE_URL);
    await sqlClient.transaction(sql.split(';').map(statement => statement.trim()).filter(Boolean).map(statement => sqlClient.query(statement)));
  }
  void sessionId;
}
