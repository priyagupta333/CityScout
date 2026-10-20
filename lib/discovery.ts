import { estimate, places, type Mood, type Place } from './places';
import { gemScore, type Observation } from './gem-score';

export function discover(options: { anchor: string; origin?: {lat:number;lng:number}; mood: Mood; budget: string; hours: string; query: string; indoor: boolean; sort: string; closed: Set<string | null>; hiddenOnly?:boolean; observations?:Observation[] }): Place[] {
  const terms = options.query.trim().toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
  return places.filter(p => {
    const trip = estimate(p, options.anchor, options.origin);
    const text = `${p.name} ${p.area} ${p.station} ${p.category} ${p.subtitle} ${p.tags.join(' ')} ${p.indoor ? 'indoor' : 'outdoor'}`.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    return !options.closed.has(p.id) && (options.mood === 'All' || p.category === options.mood)
      && (!options.hiddenOnly || gemScore(p,options.observations).hidden)
      && (!options.indoor || p.indoor) && (options.budget === 'any' || trip.high <= Number(options.budget))
      && (options.hours === 'any' || trip.totalMin <= Number(options.hours) * 60)
      && terms.every(term => text.includes(term));
  }).sort((a, b) => options.sort === 'gem' ? gemScore(b,options.observations).score-gemScore(a,options.observations).score || a.name.localeCompare(b.name) : options.sort === 'name' ? a.name.localeCompare(b.name) : options.sort === 'cost' ? estimate(a, options.anchor, options.origin).high - estimate(b, options.anchor, options.origin).high : estimate(a, options.anchor, options.origin).km - estimate(b, options.anchor, options.origin).km);
}
