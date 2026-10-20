'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Maximize2, Navigation } from 'lucide-react';
import { itineraryDirections, itineraryStart, type TravelMode } from '../lib/itinerary-map';
import type { Place } from '../lib/places';

export function ItineraryMap({stops,anchor,origin,mode}:{stops:Place[];anchor:string;origin?:{lat:number;lng:number};mode:TravelMode}) {
  const host=useRef<HTMLDivElement>(null);
  const mapRef=useRef<LeafletMap|null>(null);
  const fitRef=useRef<()=>void>(()=>{});
  const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
  const [retry,setRetry]=useState(0);
  const routeKey=JSON.stringify([anchor,origin?.lat,origin?.lng,stops.map(p=>[p.id,p.name,p.lat,p.lng])]);
  useEffect(()=>{
    let cancelled=false,dispose:(()=>void)|undefined;
    async function initialise() {
      const L=await import('leaflet');
      if(cancelled||!host.current)return;
      const map=L.map(host.current,{scrollWheelZoom:false,zoomControl:true});
      mapRef.current=map;
      dispose=()=>{map.remove();if(mapRef.current===map)mapRef.current=null;};
      const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      });
      let loaded=false;
      const timeout=setTimeout(()=>{if(!cancelled&&!loaded)setStatus('error');},12000);
      tiles.on('tileload',()=>{loaded=true;clearTimeout(timeout);if(!cancelled)setStatus('ready');});
      tiles.on('tileerror',()=>{if(!cancelled&&!loaded)setStatus('error');});
      tiles.addTo(map);
      const start=itineraryStart(anchor,origin);
      const points=[...(start?[{...start,label:'S',name:`Start & return: ${anchor}`}]:[]),...stops.map((p,i)=>({...p,label:String(i+1),name:p.name}))];
      for(const point of points) {
        const icon=L.divIcon({className:'itinerary-pin-wrap',html:`<span class="itinerary-pin${point.label==='S'?' itinerary-pin-start':''}"><span class="itinerary-pin-label">${point.label}</span></span>`,iconSize:[36,42],iconAnchor:[18,40],tooltipAnchor:[0,-40]});
        // Text nodes avoid interpreting catalog labels as HTML.
        const label=document.createElement('span');label.textContent=point.name;
        L.marker([point.lat,point.lng],{icon,title:point.name,alt:point.name,keyboard:true}).bindTooltip(label,{direction:'top'}).addTo(map);
      }
      const bounds=L.latLngBounds(points.map(p=>[p.lat,p.lng] as [number,number]));
      const fit=()=>{map.invalidateSize();if(bounds.isValid())map.fitBounds(bounds,{padding:[48,48],maxZoom:15,animate:false});};
      fitRef.current=fit;fit();
      const resize=new ResizeObserver(()=>map.invalidateSize());resize.observe(host.current);
      dispose=()=>{clearTimeout(timeout);resize.disconnect();map.remove();if(mapRef.current===map)mapRef.current=null;fitRef.current=()=>{};};
    }
    // A fresh keyed surface starts in the loading state without leaking old maps.
    void initialise().catch(()=>{if(!cancelled)setStatus('error');});
    return()=>{cancelled=true;dispose?.();};
    // routeKey includes every value used to create geographic layers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[routeKey,retry]);
  const start=itineraryStart(anchor,origin);
  return <section className="itinerary-map" aria-label="Itinerary street map">
    <header className="itinerary-map-heading"><div><span className="eyebrow">YOUR STOPS, ON THE MAP</span><h3>A real view of your day.</h3><p>Start at {anchor}, explore {stops.length} stop{stops.length===1?'':'s'}, then return.</p></div><button className="button secondary" type="button" onClick={()=>fitRef.current()} aria-label="Fit all itinerary stops on map"><Maximize2 size={15}/> Fit stops</button></header>
    <div className="itinerary-map-surface"><div ref={host} className="itinerary-leaflet" aria-label="Interactive street map with numbered destination markers"/>{status==='loading'&&<p className="itinerary-map-status" role="status">Loading street map…</p>}{status==='error'&&<div className="itinerary-map-status" role="status"><span>Street tiles are unavailable. Your stops and directions still work.</span><button onClick={()=>{setStatus('loading');setRetry(n=>n+1);}}>Retry map</button></div>}</div>
    <ol className="itinerary-map-legend" aria-label="Itinerary stop order">{start&&<li><span className="itinerary-legend-start">S</span><div><strong>{anchor}</strong><small>Start & return</small></div></li>}{stops.map((place,i)=><li key={place.id}><span>{i+1}</span><div><strong>{place.name}</strong><small>{place.area}</small></div></li>)}</ol>
    <footer className="itinerary-map-footer"><p><MapPin size={16}/>{mode==='walking'?'Pins show destinations. Open the walking route for street navigation; return directions are below.':'Open the first transit leg here, then use the directions at each stop. Pins show destinations.'}</p><a className="button primary" href={itineraryDirections(stops,anchor,mode,origin)} target="_blank" rel="noopener noreferrer"><Navigation size={16}/>{mode==='walking'?'Open walking route':'First stop directions'} ↗</a></footer>
  </section>;
}
