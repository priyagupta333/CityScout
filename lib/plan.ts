import { anchors, distanceKm, estimate, type Place } from './places';
import { railRoute } from './rail';
import { walkingLeg } from './personalise';

export function planEstimate(stops:Place[],anchor:string,origin?:{lat:number;lng:number},mode:'transit'|'walking'='transit') {
  if(!stops.length)return {low:0,high:0,minutes:0};
  if(mode==='walking') {
    const start=(anchor==='Near me'?origin:undefined)??anchors.find(a=>a.name===anchor)??anchors[0];
    const route=[start,...stops,start];
    const minutes=stops.reduce((n,p)=>n+p.duration,0)+route.slice(1).reduce((n,p,i)=>n+walkingLeg(route[i],p),0);
    return {low:stops.reduce((n,p)=>n+p.min,0),high:stops.reduce((n,p)=>n+p.max,0),minutes};
  }
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
