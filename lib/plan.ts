import { distanceKm, estimate, type Place } from './places';
import { railRoute } from './rail';

export function planEstimate(stops:Place[],anchor:string,origin?:{lat:number;lng:number}) {
  if(!stops.length)return {low:0,high:0,minutes:0};
  const first=estimate(stops[0],anchor,origin),last=estimate(stops[stops.length-1],anchor,origin);
  let minutes=first.travelMin+last.travelMin+stops.reduce((n,p)=>n+p.duration,0);
  let travelCost=stops.length===1?first.travelCost:Math.ceil((first.travelCost+last.travelCost)/2);
  for(let i=1;i<stops.length;i++) {
    const a=stops[i-1],b=stops[i],km=distanceKm(a,b);
    const rail=railRoute(a.station,b.station);
    minutes+=km<2?Math.ceil(km*15):Math.ceil((rail?.minutes??km*3)+a.walk+b.walk+8+(a.id==='karnala'||b.id==='karnala'?40:0));
    if(km>=2)travelCost+=(km<10?15:25)+(a.id==='karnala'||b.id==='karnala'?60:0);
  }
  return {low:stops.reduce((n,p)=>n+p.min,0)+travelCost,high:stops.reduce((n,p)=>n+p.max,0)+travelCost,minutes};
}
