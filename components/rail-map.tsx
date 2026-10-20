'use client';
import { useRef, useState } from 'react';
import { lineColors, railLines, railRoute, stationByName, stations, type RailLine } from '../lib/rail';
import { estimate, money, type Place } from '../lib/places';

export function RailMap({results,anchor,origin,selected,stops=[],onStation,onSelect,onOpen}: {results:Place[];anchor:string;origin?:{lat:number;lng:number};selected?:Place;stops?:Place[];onStation:(name:string)=>void;onSelect:(place:Place)=>void;onOpen:(place:Place)=>void}) {
  const [enabled,setEnabled] = useState<RailLine[]>(['Western','Central','Harbour']);
  const [zoom,setZoom] = useState(1);
  const scrollRef=useRef<HTMLDivElement>(null);
  const fitMap=()=>{setZoom(1);scrollRef.current?.scrollTo({top:0,left:0});};
  const start = anchor === 'Powai' ? 'Kanjurmarg' : anchor;
  const destinations = stops.length ? stops : selected ? [selected] : [];
  const legs = destinations.map((place,i) => railRoute(i ? destinations[i-1].station : start,place.station));
  const routePoints = legs.filter(Boolean).flatMap(route => route!.stations).map(stationByName).filter(Boolean);
  const routeStations = new Set(routePoints.map(s => s!.name));
  const placeGroups = new Map<string,Place[]>();
  for(const place of results) placeGroups.set(place.station,[...(placeGroups.get(place.station) ?? []),place]);
  const stationVisible = (name:string) => enabled.some(line => railLines[line].includes(name));
  const handleKey = (event:React.KeyboardEvent, action:()=>void) => { if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); action(); } };
  return <section className="rail-panel" aria-label="Mumbai railway discovery map">
    <div className="rail-heading"><div><h3>Your city, along the local.</h3><p>Choose a station to change your starting point. Select a numbered place marker to explore.</p></div><div className="rail-zoom"><button type="button" aria-label="Zoom railway map out" disabled={zoom===1} onClick={()=>setZoom(z=>Math.max(1,z-.25))}>−</button><button type="button" aria-label="Reset railway map zoom" onClick={fitMap}>Fit</button><button type="button" aria-label="Zoom railway map in" disabled={zoom===2} onClick={()=>setZoom(z=>Math.min(2,z+.25))}>+</button></div></div>
    <div className="rail-legend">{(Object.keys(railLines) as RailLine[]).map(line=><label key={line}><input type="checkbox" checked={enabled.includes(line)} onChange={()=>setEnabled(current=>current.includes(line) ? current.filter(l=>l!==line) : [...current,line])}/><span style={{background:lineColors[line]}}/>{line}</label>)}<span className="rail-route-key">Orange dash = selected journey</span></div>
    <div className="rail-scroll" ref={scrollRef} tabIndex={0} aria-label="Scrollable railway map">
      <svg viewBox="0 0 960 690" className="rail-svg" style={{width:`${zoom*100}%`,height:600*zoom,minWidth:740*zoom}} role="group" aria-label="Schematic Western, Central and Harbour rail corridors">
        <rect width="960" height="690" fill="#faf9f2" rx="12"/>
        <text x="35" y="35" className="rail-water">MUMBAI &amp; NAVI MUMBAI</text>
        {(Object.keys(railLines) as RailLine[]).filter(line=>enabled.includes(line)).map(line=><polyline key={line} points={railLines[line].map(stationByName).map(s=>`${s!.x},${s!.y}`).join(' ')} stroke={lineColors[line]} strokeWidth="6" fill="none" strokeLinejoin="round" opacity=".8"/>)}
        {routePoints.length>1 && <polyline data-testid="rail-selected-route" points={routePoints.map(s=>`${s!.x},${s!.y}`).join(' ')} fill="none" stroke="#bc4a23" strokeWidth="4" strokeDasharray="8 6" strokeLinejoin="round"/>}
        {stations.filter(s=>stationVisible(s.name)).map(s=><g key={s.name} role="button" tabIndex={0} aria-label={`Start from ${s.name}`} onClick={()=>onStation(s.name)} onKeyDown={e=>handleKey(e,()=>onStation(s.name))} className="rail-station">
          <rect x={s.x-28} y={s.y-17} width="56" height="48" fill="transparent"/>
          {s.name === start && <circle cx={s.x} cy={s.y} r="15" fill="#df643e22" stroke="#b54729" strokeWidth="2"/>}
          <circle cx={s.x} cy={s.y} r="7" fill={s.name===start ? '#b54729' : '#fffdf7'} stroke={routeStations.has(s.name) ? '#b54729' : '#314a36'} strokeWidth="2"/>
          <text x={s.x} y={s.y+25} textAnchor="middle" className="rail-station-label">{s.name}</text>
          <title>{s.name} · set starting station</title>
        </g>)}
        {[...placeGroups].filter(([name])=>stationVisible(name)).flatMap(([name,group])=>group.map((place,i)=>{
          const station=stationByName(name); if(!station) return null;
          const x=station.x + 22 + (i%4)*23, y=station.y-20-Math.floor(i/4)*24;
          const index=results.findIndex(p=>p.id===place.id)+1;
          return <g key={place.id} role="button" tabIndex={0} aria-label={`Show ${place.name} on railway map`} onClick={()=>onSelect(place)} onKeyDown={e=>handleKey(e,()=>onSelect(place))} className="rail-place-marker"><circle cx={x} cy={y} r="10" fill={selected?.id===place.id || stops.some(s=>s.id===place.id) ? '#b54729' : '#244b3a'}/><text x={x} y={y+4} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">{index}</text><title>{place.name} · {place.station} + last-mile travel</title></g>;
        }))}
        <text x="35" y="660" className="rail-water">SCHEMATIC · INTERMEDIATE STOPS OMITTED · NOT TO SCALE</text>
      </svg>
    </div>
    <div className="rail-route-summary" aria-live="polite">{destinations.length>0 ? <>
      <strong>{anchor} → {destinations.map(p=>p.station).join(' → ')}</strong>
      {legs.some(l=>!l) ? <p>Choose a listed station to calculate the rail corridor. Near-me estimates use your location instead.</p> : <p>{legs.map((leg,i)=><span key={i}>{i>0 && ' · Next leg: '}{leg!.stations.join(' → ')}{leg!.transfers>0 ? ` (${leg!.transfers} interchange${leg!.transfers===1 ? '' : 's'})` : ''}</span>)}</p>}
      {anchor==='Powai' && <p>Powai is a road origin, connected here via Kanjurmarg. Extra last-mile travel is estimated.</p>}
      <p>Rail lines show the station corridor only. Walking, road access and return travel are estimated separately; confirm current service before leaving.</p>
    </> : <p>Select a place to see its station corridor.</p>}</div>
    {!stops.length && <div className="rail-place-list">{results.map((place,i)=>{const trip=estimate(place,anchor,origin);return <button key={place.id} className={'rail-result '+(selected?.id===place.id?'selected':'')} onClick={()=>onSelect(place)}><span className="rail-number">{i+1}</span><span><strong>{place.name}</strong><small>{place.station} · {money(trip.low,trip.high)} est. · ~{trip.totalMin} min incl. visit</small></span></button>;})}</div>}
    {selected && !stops.length && <div className="rail-selected"><div><strong>{selected.name}</strong><p>{selected.area} · {selected.walk} min walk from {selected.station}, approx.</p></div><button className="button primary" onClick={()=>onOpen(selected)}>See place details →</button></div>}
  </section>;
}
