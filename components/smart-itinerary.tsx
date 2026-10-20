'use client';
import { anchors, distanceKm, money, places, type Place } from '../lib/places';
import { planEstimate } from '../lib/plan';
import { orderStops } from '../lib/personalise';
import { RailMap } from './rail-map';
import { ItineraryMap } from './itinerary-map';
import { formatSpend } from '../lib/itinerary-map';

type Mode='transit'|'walking';
export function SmartItinerary({stops,anchor,origin,mode,budget,minutes,onMinutes,closed,saved,onStops,onAnchor,onMode,onBudget,onOpen,onSave,onShare,onClose}:{stops:Place[];anchor:string;origin?:{lat:number;lng:number};mode:Mode;budget?:number;minutes?:number;onMinutes:(minutes:number|undefined)=>void;closed:Set<string|null>;saved:boolean;onStops:(stops:Place[])=>void;onAnchor:(name:string)=>void;onMode:(mode:Mode)=>void;onBudget:(budget:number|undefined)=>void;onOpen:(p:Place)=>void;onSave:()=>void;onShare:()=>void;onClose:()=>void}) {
  const stats=planEstimate(stops,anchor,origin,mode);
  const spendLow=stops.reduce((n,p)=>n+p.min,0),spendHigh=stops.reduce((n,p)=>n+p.max,0);
  const restricted=stops.some(p=>closed.has(p.id));
  const over=budget!==undefined&&stats.high>budget;
  const tooLong=minutes!==undefined&&stats.minutes>minutes;
  return <div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><article className="dialog" role="dialog" aria-modal="true" aria-label="Mini-plan">
    <button className="icon-button dialog-close" onClick={onClose} aria-label="Close mini-plan">×</button>
    <div className="plan-header"><div className="eyebrow">DISCOVER MORE. PLAN A LITTLE SMARTER.</div><h2>Your Mumbai mini-itinerary.</h2><p>Starting from {anchor} · {stops.length} of 4 stops · Per-person estimates</p><div className="plan-summary"><div><small>EST. TOTAL SPEND</small><strong>{formatSpend(stats.low,stats.high)}</strong></div><div><small>EST. WHOLE TRIP</small><strong>~{Math.ceil(stats.minutes/15)*15} min</strong></div></div></div>
    <div className="plan-body"><div className="smart-fields"><label>Travel mode<select value={mode} onChange={e=>onMode(e.target.value as Mode)}><option value="transit">Rail + walking estimates</option><option value="walking">Walking only estimates</option></select></label><label>Budget per person (optional)<input type="number" min="0" max="10000" value={budget??''} onChange={e=>onBudget(e.target.value===''?undefined:Math.min(10000,Math.max(0,Number(e.target.value))))}/></label><label>Time limit in minutes (optional)<input type="number" min="1" max="10000" value={minutes??''} onChange={e=>onMinutes(e.target.value===''?undefined:Math.min(10000,Math.max(1,Number(e.target.value))))}/></label></div>
      {tooLong&&<p className="error-message" role="alert">This outing exceeds your {minutes}-minute allowance by approximately {stats.minutes-minutes!} minutes. Remove a stop, change travel or allow more time.</p>}
      {over&&<p className="error-message" role="alert">This outing exceeds your ₹{budget} budget by an estimated ₹{stats.high-budget!}. Remove a stop or adjust your budget.</p>}
      {restricted&&<p className="error-message" role="alert">A selected place is reported closed or restricted. Remove it before saving this outing.</p>}
      <ItineraryMap key={JSON.stringify([anchor,origin,stops.map(p=>p.id)])} stops={stops} anchor={anchor} origin={origin} mode={mode}/>{mode==='transit'&&<details className="rail-corridor-details"><summary>See schematic railway connections</summary><RailMap origin={origin} results={stops} anchor={anchor} selected={stops[0]} stops={stops} onStation={onAnchor} onSelect={onOpen} onOpen={onOpen}/></details>}
      <div className="timeline-item"><span className="timeline-dot"/><h3>Leave from {anchor}</h3><p>Outward and return travel are included. Check actual routes and access before leaving.</p></div>
      {stops.map((stop,i)=><div className="timeline-item" key={stop.id}><span className="timeline-dot"/><div className="timeline-card"><img src={stop.image} alt=""/><div><h3>{i+1}. {stop.name}</h3><p>{stop.area} · ~{stop.duration} minutes · {money(stop.min,stop.max)} place spend</p><p>Hours unverified; check access. Best-time note: {stop.best}</p><div className="smart-actions"><details className="itinerary-stop-details"><summary>Place details</summary><p>{stop.description}</p><p>{stop.caveat}</p></details><button aria-label={`Move ${stop.name} earlier`} disabled={i===0} onClick={()=>{const next=[...stops];[next[i-1],next[i]]=[next[i],next[i-1]];onStops(next);}}>Move up</button><button disabled={stops.length===1} onClick={()=>onStops(stops.filter(p=>p.id!==stop.id))}>Remove</button><a href={legDirection(stop,i?stops[i-1]:undefined,anchor,mode,origin)} target="_blank" rel="noopener noreferrer">Directions ↗</a></div></div></div></div>)}
      <div className="timeline-item"><span className="timeline-dot"/><h3>Return to {anchor}</h3><p>~{stats.minutes} minutes including visits and estimated return travel.</p><a href={returnDirection(stops[stops.length-1],anchor,mode,origin)} target="_blank" rel="noopener noreferrer">Return directions ↗</a></div>
      <div className="plan-option"><label htmlFor="add-stop">Add another stop ({stops.length}/4)</label><select id="add-stop" value="" disabled={stops.length>=4} onChange={e=>{const next=places.find(p=>p.id===e.target.value);if(next)onStops([...stops,next]);}}><option value="">Choose a place</option>{places.filter(p=>!stops.some(s=>s.id===p.id)&&!closed.has(p.id)).sort((a,b)=>distanceKm(a,stops[stops.length-1])-distanceKm(b,stops[stops.length-1])).map(p=><option key={p.id} value={p.id}>{p.name} · {p.area}</option>)}</select></div>
      <button className="button secondary" onClick={()=>onStops(orderStops(stops,s=>planEstimate(s,anchor,origin,mode).minutes,s=>{const estimate=planEstimate(s,anchor,origin,mode);return (budget===undefined||estimate.high<=budget)&&(minutes===undefined||estimate.minutes<=minutes);}))}>Optimise stop order</button>
      <div className="cost-panel"><h3>Estimated spend per person</h3><div className="cost-row"><span>All place spending</span><strong>{money(spendLow,spendHigh)}</strong></div><div className="cost-row"><span>Transport allowance</span><strong>₹{stats.high-spendHigh}</strong></div><div className="cost-row total"><span>Total estimate</span><strong>{formatSpend(stats.low,stats.high)}</strong></div></div>
      <div className="caution"><span>{mode==='walking'?'Walking estimates use straight-line distance plus a detour allowance, not verified pedestrian routes. Long walks may be impractical.':'Rail times use schematic corridor estimates. Street-map pins show destinations, not live service or a routed path.'} Prices and hours are unverified; confirm opening hours before departure.</span></div>
      <div className="detail-actions"><button className="button primary" disabled={!saved&&(restricted||over||tooLong)} onClick={onSave}>{saved?'Remove saved plan':'Save this itinerary'}</button><button className="button secondary" onClick={onShare}>Share itinerary ↗</button></div>
    </div>
  </article></div>;
}
function startPoint(anchor:string,origin?:{lat:number;lng:number}) {return (anchor==='Near me'?origin:anchors.find(a=>a.name===anchor));}
function legDirection(stop:Place,previous:Place|undefined,anchor:string,mode:Mode,origin?:{lat:number;lng:number}) {
  const start=previous??startPoint(anchor,origin);
  const params=new URLSearchParams({api:'1',destination:`${stop.lat},${stop.lng}`,travelmode:mode});
  if(start)params.set('origin',`${start.lat},${start.lng}`);
  return `https://www.google.com/maps/dir/?${params}`;
}
function returnDirection(stop:Place,anchor:string,mode:Mode,origin?:{lat:number;lng:number}) {
  const end=startPoint(anchor,origin);
  const params=new URLSearchParams({api:'1',origin:`${stop.lat},${stop.lng}`,destination:end?`${end.lat},${end.lng}`:anchor,travelmode:mode});
  return `https://www.google.com/maps/dir/?${params}`;
}
