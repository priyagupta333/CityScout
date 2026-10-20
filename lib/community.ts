export const topics = ['Price / minimum spend','Opening hours','Seating / quietness','Entrance / accessibility','Closed / restricted','A local tip','New place suggestion','Local verification'] as const;
export type ContributionRow = { id:string; place_id:string|null; place_name:string; topic:string; note:string; status:string; created_at:string; reviewed_at:string|null; session_id:string };
export function publicReport(row: ContributionRow) { return { id:row.id, placeId:row.place_id, placeName:row.place_name, topic:row.topic, note:row.note, status:row.status, createdAt:row.created_at }; }
export function safeSameOrigin(request: Request) { const origin = request.headers.get('origin'); return !origin || origin === new URL(request.url).origin; }
