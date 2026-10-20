'use client';
import { useMemo, useState } from 'react';
import { anchors, places, type Place } from '../lib/places';
import { matchPlaces, orderStops, thriftSearch, type Preferences, type StudentCategory, type Vibe } from '../lib/personalise';
import { formatSpend } from '../lib/itinerary-map';
import type { Observation } from '../lib/gem-score';
import { planEstimate } from '../lib/plan';

export function SmartFinder({anchor,origin,closed,observations=[],onAnchor,onOpen,onPlan,onContribute}:{anchor:string;origin?:{lat:number;lng:number};closed:Set<string|null>;observations?:Observation[];onAnchor:(name:string)=>void;onOpen:(p:Place)=>void;onPlan:(stops:Place[],budget:number,mode:'transit'|'walking',minutes:number)=>void;onContribute:()=>void}) {
  const [vibe,setVibe]=useState<Vibe>('Quiet');
  const [company,setCompany]=useState<'Solo'|'Friends'>('Solo');
  const [budget,setBudget]=useState('300');
  const [area,setArea]=useState('');
  const [hours,setHours]=useState('5');
  const [mode,setMode]=useState<'transit'|'walking'>('transit');
  const [student,setStudent]=useState(false);
  const [category,setCategory]=useState<StudentCategory>('All');
  const [submitted,setSubmitted]=useState(false);
  const [selected,setSelected]=useState<string[]>([]);
  const [error,setError]=useState('');
  const valid=budget.trim()!==''&&Number.isFinite(Number(budget))&&Number(budget)>=0&&Number(budget)<=10000;
  const prefs:Preferences={vibe,company,budget:Number(budget),anchor,area,student,category,hours:Number(hours),mode};
  const results=matchPlaces(places,prefs,closed,origin,observations);
  const eligible=selected.filter(id=>results.some(r=>r.place.id===id));
  const picked=eligible.map(id=>places.find(p=>p.id===id)!);
  const fits=(stops:Place[])=>{const total=planEstimate(stops,anchor,origin,mode);return total.high<=Number(budget)&&total.minutes<=Number(hours)*60;};
  const ordered=orderStops(picked,s=>planEstimate(s,anchor,origin,mode).minutes,fits);
  const stats=planEstimate(ordered,anchor,origin,mode);
  const signature=JSON.stringify([prefs,origin]);
  const [lastSearch,setLastSearch]=useState('');
  // Derive selection against current constraints; hidden/closed stops never leak into generation.
  const current=submitted&&lastSearch===signature&&valid;
  function search() {if(!valid){setError('Enter a budget from ₹0 to ₹10,000.');return;}setLastSearch(signature);setSubmitted(true);setSelected([]);setError('');}
  function makeDay() {
    if(!valid){setError('Enter a valid budget first.');return;}
    let day:Place[]=[];
    for(const {place} of results) {
      const candidate=orderStops([...day,place],s=>planEstimate(s,anchor,origin,mode).minutes,fits);
      const cost=planEstimate(candidate,anchor,origin,mode);
      if(cost.high<=Number(budget)&&cost.minutes<=Number(hours)*60) day=candidate;
      if(day.length===4)break;
    }
    setLastSearch(signature);setSubmitted(true);setSelected(day.map(p=>p.id));
    setError(day.length ? (day.length===1?'Only one stop fits. You can open it as a single-stop plan or adjust your answers.':'') : 'No outing fits these constraints. Try a different starting point, more time or a higher budget.');
  }
  function generate() {
    if(!picked.length){setError('Select up to four places, or make a day automatically.');return;}
    const totals=planEstimate(ordered,anchor,origin,mode);
    if(totals.high>Number(budget)||totals.minutes>Number(hours)*60){setError('The combined outing exceeds your budget or time. Remove a stop or adjust your answers.');return;}
    setError('');onPlan(ordered,Number(budget),mode,Number(hours)*60);
  }
  const thriftLink=useMemo(()=>thriftSearch(area||anchor),[area,anchor]);
  return <section className="container smart-finder" aria-labelledby="smart-title">
    <div className="smart-heading"><div><div className="eyebrow">YOUR VIBE. YOUR CITY.</div><h2 id="smart-title">Find your kind of escape.</h2><p>A few answers. A personal shortlist. A little more Mumbai.</p></div><button type="button" className={'button '+(student?'primary':'secondary')} aria-pressed={student} onClick={()=>{setStudent(!student);setSubmitted(false);setSelected([]);setError('');}}>Student Budget Mode {student?'on':'off'}</button></div>
    <form onSubmit={e=>{e.preventDefault();search();}}>
      <div className="smart-fields">
        <label>Your vibe<select value={vibe} onChange={e=>setVibe(e.target.value as Vibe)}>{['Quiet','Adventurous','Aesthetic','Social'].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Exploring with<select value={company} onChange={e=>setCompany(e.target.value as 'Solo'|'Friends')}><option>Solo</option><option>Friends</option></select></label>
        <label>Starting from<select value={anchor} onChange={e=>onAnchor(e.target.value)}>{anchor==='Near me'&&<option>Near me</option>}{anchors.map(a=><option key={a.name}>{a.name}</option>)}</select></label>
        <label>Budget per person (₹)<input type="number" min="0" max="10000" required value={budget} onChange={e=>setBudget(e.target.value)}/></label>
        <label>Area or station (optional)<input placeholder="e.g. Navi Mumbai" value={area} onChange={e=>setArea(e.target.value)}/></label>
        <label>Time available<select value={hours} onChange={e=>setHours(e.target.value)}><option value="2">2 hours</option><option value="3">3 hours</option><option value="5">5 hours</option><option value="8">8 hours</option></select></label>
        <label>Travel<select value={mode} onChange={e=>setMode(e.target.value as 'transit'|'walking')}><option value="transit">Rail + walking estimates</option><option value="walking">Walking only estimates</option></select></label>
        {student&&<label>Student discovery<select value={category} onChange={e=>setCategory(e.target.value as StudentCategory)}>{['All','Free entry','Study break','Parks & views'].map(x=><option key={x}>{x}</option>)}</select></label>}
      </div>
      {student&&<div className="smart-presets">{[0,100,300].map(n=><button type="button" className="button secondary" key={n} onClick={()=>{setBudget(String(n));if(n===0)setMode('walking');}}>{n===0?'Free outing (walk)':`Under ₹${n}`}</button>)}<span>Custom budget above. Study-break tags do not guarantee permission to study.</span></div>}
      <div className="smart-actions"><button className="button primary" type="submit">Find my matches</button><button className="button secondary" type="button" onClick={makeDay}>Make my day under ₹{valid?budget:'…'}</button></div>
    </form>
    <details className="match-method"><summary>How matching works</summary><p>Vibe-tag fit 40 points, solo/friends tag fit 20, remaining budget 20, proximity 20. Budget, area, closures and round-trip time are strict filters. The percentage is a rule-based compatibility index, not a probability or a live AI prediction. GEM score is a separate hidden-gem signal using sample data. Walking estimates use straight-line distance plus a detour allowance, not verified pedestrian routes.</p></details>
    {error&&<p className="error-message" role="alert">{error}</p>}
    {submitted&&!current&&<p role="status">Your answers changed. Find matches again to refresh your shortlist.</p>}
    {current&&<div aria-live="polite"><h3>{results.length} matching places</h3><p>Select up to four for a mini-itinerary. Each place fits individually; the combined outing is checked separately.</p>
      {!results.length&&<p className="empty">No places fit all your answers. Adjust your budget, area, time or travel choice.</p>}
      <div className="smart-results">{results.map(({place,score,reasons,trip,gem})=><article className="smart-result" key={place.id}>
        <div className="match-label">{score}% match <small>GEM {gem} · sample signals</small></div><h3>{place.name}</h3><p>{reasons.join(' · ')}.</p><p>{place.area} · {formatSpend(trip.low,trip.high)} est. · ~{trip.totalMin} min round trip</p>
        <div className="smart-actions"><button className="button secondary" onClick={()=>onOpen(place)}>Place details</button><button className={'button '+(eligible.includes(place.id)?'primary':'secondary')} aria-pressed={eligible.includes(place.id)} disabled={!eligible.includes(place.id)&&eligible.length===4} onClick={()=>{setSelected(eligible.includes(place.id)?eligible.filter(id=>id!==place.id):[...eligible,place.id]);setError('');}}>{eligible.includes(place.id)?'Remove stop':'Add stop'}</button></div>
      </article>)}</div>
      {picked.length>0&&<div className="smart-selection"><strong>{picked.length}/4 stops · {formatSpend(stats.low,stats.high)} per person est. · ~{stats.minutes} min</strong><p>{ordered.map(p=>p.name).join(' → ')}</p>{(stats.high>Number(budget)||stats.minutes>Number(hours)*60)&&<p className="error-message">Combined outing exceeds your budget or time.</p>}<button className="button primary" disabled={!picked.length||stats.high>Number(budget)||stats.minutes>Number(hours)*60} onClick={generate}>{picked.length===1?'Open single-stop plan':'Build smart itinerary'}</button></div>}
    </div>}
    {student&&<aside className="student-note"><h3>Thrift finds & student savings</h3><p>Explore second-hand and vintage shopping near your chosen area. Our catalog has no verified thrift inventory or student discounts yet; prices and offers are not included in your itinerary estimate.</p><article><h4>Vintage discovery lead: Chor Bazaar</h4><p>Incredible India identifies Chor Bazaar as a place to browse vintage items and curiosities. Individual shop stock, prices and opening hours need checking.</p><a href="https://www.incredibleindia.gov.in/en/maharashtra/mumbai" target="_blank" rel="noopener noreferrer">Tourism source ↗</a> · <a href={thriftSearch('Chor Bazaar Mumbai')} target="_blank" rel="noopener noreferrer">Explore shops on Maps ↗</a></article><div className="smart-actions"><a className="button secondary" href={thriftLink} target="_blank" rel="noopener noreferrer">Find nearby thrift shops ↗</a><button className="button secondary" onClick={onContribute}>Suggest a thrift store or verified offer</button></div><p>Free entry does not mean free travel or free purchases. Discounts will only be shown after verification.</p></aside>}
  </section>;
}
