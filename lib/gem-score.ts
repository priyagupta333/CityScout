import { places, type Place } from './places';
export type Observation = {placeId:string|null;topic:string;status?:string};
// Explicit sample signals for the prototype, not scraped ratings or real votes.
// The two pitch examples are retained as sample inputs.
const sampleSignals: Record<string,[number,number,number]> = {
  'kyani-cafe':[4.5,2400,0], 'david-sassoon':[4.6,85,3],
  'madras':[4.5,4100,1], 'ashok-vada':[4.4,3200,0],
  'five-gardens':[4.6,110,2], 'sewri-fort':[4.3,78,2],
  'kumbharwada':[4.4,65,3], 'ranwar-village':[4.6,95,3],
  'khotachiwadi':[4.5,130,2], 'durgadi-fort':[4.3,190,2],
  'marine-drive':[4.7,14000,0], 'gateway-india':[4.6,22000,0],
  'juhu-beach':[4.2,18000,0], 'jewel-park':[4.4,850,1],
  'sagar-vihar':[4.3,720,1], 'karnala':[4.4,2700,1],
};
export function gemScore(place: Place, observations: Observation[] = []) {
  const index = places.findIndex(p => p.id === place.id);
  const [rating,reviews,sampleVerifications] = sampleSignals[place.id] ?? [4.2+(Math.max(0,index)%5)/10,240+(Math.max(0,index)%7)*170,0];
  const localVerifications = observations.filter(o => o.placeId === place.id && o.topic === 'Local verification' && (!o.status || o.status === 'approved')).length;
  const crowdPenalty = Math.min(.55,.30 + .25*Math.log10(Math.max(1,reviews))/Math.log10(2400));
  const boost = 1 + Math.min(.20,(sampleVerifications+localVerifications)*(.20/3));
  const raw = rating*20*(1-crowdPenalty)*boost;
  const score = Math.min(100,Math.round(raw));
  return {score,rating,reviews,crowdPenalty,boost,sampleVerifications,localVerifications,hidden:score>=55};
}
