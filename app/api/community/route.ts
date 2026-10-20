import { env } from '../../../db/runtime';
import { publicReport, type ContributionRow } from '../../../lib/community';

export async function GET() {
  if (!env.DB) return Response.json({error:'Community storage unavailable'}, {status:503});
  const result = await env.DB.prepare("SELECT id, place_id, place_name, topic, note, status, created_at, reviewed_at, session_id FROM contributions WHERE status = 'approved' ORDER BY reviewed_at DESC LIMIT 100").all<ContributionRow>();
  return Response.json(result.results.map(publicReport), { headers:{ 'Cache-Control':'no-store' } });
}
