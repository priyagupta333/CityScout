import { anchors, distanceKm, estimate, type Place } from './places';
import { gemScore, type Observation } from './gem-score';

export type Vibe = 'Quiet' | 'Adventurous' | 'Aesthetic' | 'Social';
export type StudentCategory = 'All' | 'Free entry' | 'Study break' | 'Parks & views';
export type Preferences = { vibe: Vibe; company: 'Solo' | 'Friends'; budget: number; anchor: string; area: string; student: boolean; category: StudentCategory; hours: number; mode?: 'transit'|'walking' };
const words: Record<Vibe, RegExp> = {
  Quiet: /quiet|peace|calm|garden|reading|lake|slow/i,
  Adventurous: /fort|hill|forest|walk|wander|nature|explor|steps/i,
  Aesthetic: /art|heritage|sunset|view|photo|graffiti|gothic|sea/i,
  Social: /food|coffee|cafe|chai|market|park|promenade|eat/i,
};
export function matchPlaces(catalog: Place[], prefs: Preferences, closed: Set<string | null>, origin?: {lat:number;lng:number}, observations: Observation[] = []) {
  if (!Number.isFinite(prefs.budget) || prefs.budget < 0 || !Number.isFinite(prefs.hours) || prefs.hours <= 0) return [];
  return catalog.flatMap(place => {
    const trip = estimate(place,prefs.anchor,origin);
    if(prefs.mode==='walking') {
      const start=(prefs.anchor==='Near me'?origin:undefined)??anchors.find(a=>a.name===prefs.anchor)??anchors[0];
      trip.travelMin=walkingLeg(start,place);trip.travelCost=0;trip.low=place.min;trip.high=place.max;trip.totalMin=place.duration+trip.travelMin*2;
    }
    const text = `${place.name} ${place.area} ${place.category} ${place.subtitle} ${place.tags.join(' ')}`;
    if (closed.has(place.id) || trip.high > prefs.budget || trip.totalMin > prefs.hours*60) return [];
    if (prefs.area.trim() && !`${place.name} ${place.area} ${place.station} ${place.tags.join(' ')}`.toLowerCase().includes(prefs.area.trim().toLowerCase())) return [];
    if (prefs.student && prefs.category === 'Free entry' && place.max !== 0) return [];
    if (prefs.student && prefs.category === 'Study break' && !/quiet|garden|reading|library|book|study/i.test(text)) return [];
    if (prefs.student && prefs.category === 'Parks & views' && !/park|garden|view|sea|lake|waterfront/i.test(text)) return [];
    const vibe = words[prefs.vibe].test(text);
    const company = prefs.company === 'Solo' ? /quiet|reading|book|art|walk|garden/i.test(text) : /food|cafe|coffee|park|market|view|promenade|eat/i.test(text);
    const near = Math.max(0,1-trip.km/30);
    const headroom = prefs.budget === 0 ? 1 : 1-trip.high/prefs.budget;
    const score = Math.round(40*Number(vibe)+20*Number(company)+20*headroom+20*near);
    const reasons = [vibe ? `${prefs.vibe.toLowerCase()} tags fit your vibe` : 'fits your practical constraints', `within ₹${prefs.budget} estimated total`, ...(company ? [prefs.company === 'Solo' ? 'tags suit a solo break' : 'tags suit time with friends'] : []), ...(trip.km<5 ? ['close to your starting point'] : [])];
    return [{place,score,reasons,trip,gem:gemScore(place,observations).score}];
  }).sort((a,b)=>b.score-a.score || a.trip.high-b.trip.high || a.place.name.localeCompare(b.place.name));
}

// At most four stops: enumerate every ordering, including the return to origin.
export function orderStops(stops: Place[], cost: (stops: Place[])=>number, accepts: (stops:Place[])=>boolean = ()=>true): Place[] {
  const unique = [...new Map(stops.map(p=>[p.id,p])).values()].slice(0,4);
  let best=unique, bestCost=cost(unique),feasible:Place[]|undefined,feasibleCost=Infinity;
  function walk(prefix:Place[],rest:Place[]) {
    if(!rest.length) {const value=cost(prefix);if(value<bestCost){best=prefix;bestCost=value;}if(accepts(prefix)&&value<feasibleCost){feasible=prefix;feasibleCost=value;}return;}
    rest.forEach((p,i)=>walk([...prefix,p],rest.filter((_,j)=>j!==i)));
  }
  walk([],unique);return feasible??best;
}

export function thriftSearch(area:string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`thrift vintage second hand shops ${area.trim() || 'Mumbai'}`)}`;
}

export function walkingLeg(a:{lat:number;lng:number},b:{lat:number;lng:number}) {
  // Straight-line distance with a detour allowance, not a street routing API.
  return Math.ceil(distanceKm(a,b)*1.3*15);
}
