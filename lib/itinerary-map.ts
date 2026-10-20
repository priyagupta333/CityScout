import { anchors, type Place } from './places';

export type TravelMode = 'transit' | 'walking';
export function itineraryStart(anchor: string, origin?: {lat:number;lng:number}) {
  return anchor === 'Near me' ? origin : anchors.find(a=>a.name===anchor);
}

// Mobile browsers support three waypoints. The final stop is the destination;
// return navigation is a separate link. Transit URLs do not support waypoints.
export function itineraryDirections(stops: Place[], anchor: string, mode: TravelMode, origin?: {lat:number;lng:number}) {
  const start=itineraryStart(anchor,origin);
  const point=(p:{lat:number;lng:number})=>`${p.lat},${p.lng}`;
  const params=new URLSearchParams({api:'1',travelmode:mode});
  if(start)params.set('origin',point(start));
  if(stops.length)params.set('destination',point(mode==='transit'?stops[0]:stops[stops.length-1]));
  if(mode==='walking'&&stops.length>1)params.set('waypoints',stops.slice(0,-1).map(point).join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}

export function formatSpend(low:number,high:number) {
  return low===high?`₹${low}`:`₹${low}–₹${high}`;
}
