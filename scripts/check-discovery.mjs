import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const out = path.resolve('outputs/test-modules');
await fs.mkdir(out,{recursive:true});
for(const name of ['places','more-places','place-photos','discovery','rail','gem-score','personalise','plan','itinerary-map']) {
  const source = await fs.readFile(`lib/${name}.ts`,'utf8');
  const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '(.+?)'/g,(_,name)=>`from '${name}.mjs'`);
  await fs.writeFile(path.join(out,`${name}.mjs`),js);
}
const {places,anchors,estimate,directions} = await import(pathToFileURL(path.join(out,'places.mjs')));
const {discover} = await import(pathToFileURL(path.join(out,'discovery.mjs')));
const {gemScore} = await import(pathToFileURL(path.join(out,'gem-score.mjs')));
const {stations,railRoute,railLines} = await import(pathToFileURL(path.join(out,'rail.mjs')));
const {planEstimate}=await import(pathToFileURL(path.join(out,'plan.mjs')));
const {matchPlaces,orderStops}=await import(pathToFileURL(path.join(out,'personalise.mjs')));
const {itineraryDirections,itineraryStart,formatSpend}=await import(pathToFileURL(path.join(out,'itinerary-map.mjs')));
const base = {anchor:'Matunga',mood:'All',budget:'any',hours:'any',query:'',indoor:false,sort:'near',closed:new Set()};
assert.equal(new Set(places.map(p => p.id)).size,places.length);
assert.equal(places.length,30,'Catalog must contain exactly 30 places');
assert(places.every(place => /\.(webp|jpg|jpeg|png)$/i.test(place.image)), 'Every listing must have a photograph rather than the old illustration');
assert.equal(new Set(anchors.map(a=>a.name)).size,anchors.length);
for(const p of places) { assert(anchors.some(a => a.name === p.station),`Missing station for ${p.name}`); assert(places.some(x => x.id === p.pair),`Broken pair for ${p.name}`); await fs.access(`public${p.image}`); assert(p.min <= p.max); }
assert.equal(discover({...base,query:'unknown-place-xyz'}).length,0);
assert(discover({...base,query:'  cafe   matunga '}).some(p => p.id === 'madras'));
assert(discover({...base,query:'CSMT'}).some(p => p.station === 'CSMT'));
for(const anchor of anchors.map(a => a.name)) {
  for(const budget of ['100','150','250']) for(const hours of ['1','2','3']) {
    const result = discover({...base,anchor,budget,hours});
    for(const p of result) { assert(estimate(p,anchor).high <= Number(budget)); assert(estimate(p,anchor).totalMin <= Number(hours)*60); }
  }
}
assert(discover({...base,indoor:true}).every(p => p.indoor));
assert(!discover({...base,closed:new Set(['madras'])}).some(p => p.id === 'madras'));
const costs = discover({...base,sort:'cost'}).map(p => estimate(p,'Matunga').high);
assert.deepEqual(costs,[...costs].sort((a,b) => a-b));
assert.equal(estimate(places[0],'Bandra',{lat:0,lng:0}).km,estimate(places[0],'Bandra').km);
assert.equal(new URL(directions(places[0],'Matunga',places[1])).searchParams.get('origin'),`${places[0].lat},${places[0].lng}`);
const gemSorted=discover({...base,sort:'gem'}).map(p=>gemScore(p).score);
assert.deepEqual(gemSorted,[...gemSorted].sort((a,b)=>b-a));
assert(discover({...base,hiddenOnly:true}).length>0);
assert(discover({...base,hiddenOnly:true}).every(p=>gemScore(p).score>=55));
const kyani=places.find(p=>p.id==='kyani-cafe'), sassoon=places.find(p=>p.id==='david-sassoon');
assert(gemScore(sassoon).score>gemScore(kyani).score,'Low review counts should improve discovery rank');
assert(gemScore(kyani,[{placeId:kyani.id,topic:'Local verification',status:'approved'}]).score>gemScore(kyani).score);
assert.equal(gemScore(kyani,[{placeId:kyani.id,topic:'Local verification',status:'pending'}]).score,gemScore(kyani).score);
assert.equal(gemScore(kyani,[{placeId:kyani.id,topic:'Local verification',status:'rejected'}]).score,gemScore(kyani).score);
assert.equal(gemScore(kyani,[{placeId:kyani.id,topic:'A local tip',status:'approved'}]).score,gemScore(kyani).score);
assert(gemScore(kyani,Array.from({length:20},()=>({placeId:kyani.id,topic:'Local verification',status:'approved'}))).boost<=1.2);
for(const from of stations) for(const to of stations) {
  const route=railRoute(from.name,to.name);assert(route,`Disconnected railway stations ${from.name} / ${to.name}`);
  assert.equal(route.stations[0],from.name);assert.equal(route.stations.at(-1),to.name);
  assert.equal(route.lines.length,route.stations.length-1);
  route.lines.forEach((line,i)=>{const a=railLines[line].indexOf(route.stations[i]),b=railLines[line].indexOf(route.stations[i+1]);assert.equal(Math.abs(a-b),1);});
}
assert(railRoute('Kalyan','Panvel').transfers>=1);
assert.equal(railRoute('Near me','Dadar'),null);
assert.equal(railRoute('Churchgate','Bandra').transfers,0);
const first=places.find(p=>p.id==='five-gardens'), second=places.find(p=>p.id==='madras');
const single=planEstimate([first],'Dadar'),pair=planEstimate([first,second],'Dadar');
assert.equal(single.high,estimate(first,'Dadar').high);
assert.equal(single.minutes,estimate(first,'Dadar').totalMin);
assert(pair.minutes>single.minutes);
assert(pair.high>=first.max+second.max);
assert.deepEqual(planEstimate([],'Dadar'),{low:0,high:0,minutes:0});
assert(estimate(places.find(p=>p.id==='karnala'),'Panvel').travelCost>=120);
// Personal recommendations keep constraints strict and their scores explainable.
const prefs={vibe:'Quiet',company:'Solo',anchor:'Matunga',area:'',budget:300,hours:5,student:false,category:'All',mode:'transit'};
const matches=matchPlaces(places,prefs,new Set());
assert(matches.length>0);
assert(matches.every(r=>r.score>=0&&r.score<=100&&r.reasons.length>=2&&r.trip.high<=300&&r.trip.totalMin<=300));
assert.deepEqual(matches.map(r=>r.score),matches.map(r=>r.score).sort((a,b)=>b-a));
assert(!matchPlaces(places,prefs,new Set(['five-gardens'])).some(r=>r.place.id==='five-gardens'));
assert.equal(matchPlaces(places,{...prefs,area:'unknown-neighborhood-xyz'},new Set()).length,0);
assert.equal(matchPlaces(places,{...prefs,budget:-1},new Set()).length,0);
assert.equal(matchPlaces(places,{...prefs,budget:NaN},new Set()).length,0);
const free=matchPlaces(places,{...prefs,budget:0,mode:'walking',student:true,category:'Free entry'},new Set());
assert(free.length>0);assert(free.every(r=>r.place.max===0&&r.trip.high===0&&r.trip.travelCost===0));
const study=matchPlaces(places,{...prefs,student:true,category:'Study break'},new Set());
assert(study.length>0);
const four=places.slice(0,4);
const reordered=orderStops(four,s=>planEstimate(s,'Dadar').minutes);
assert.equal(new Set(reordered.map(p=>p.id)).size,4);
assert(planEstimate(reordered,'Dadar').minutes<=planEstimate(four,'Dadar').minutes);
assert.equal(orderStops([four[0],four[0],...four],()=>0).length,4);
const walking=planEstimate(four,'Dadar',undefined,'walking');
assert.equal(walking.high,four.reduce((n,p)=>n+p.max,0));
assert(walking.minutes>four.reduce((n,p)=>n+p.duration,0));
assert.deepEqual(planEstimate([],'Dadar',undefined,'walking'),{low:0,high:0,minutes:0});
// A slower ordering may be the only one that fits a hard constraint.
const constrained=orderStops(four,s=>s[0].id===four[0].id?1:2,s=>s[0].id===four[1].id);
assert.equal(constrained[0].id,four[1].id);
const approved=[{placeId:kyani.id,topic:'Local verification',status:'approved'}];
assert.equal(matchPlaces(places,prefs,new Set(),undefined,approved).find(r=>r.place.id===kyani.id).gem,gemScore(kyani,approved).score);
const walkingUrl=new URL(itineraryDirections(four,'Matunga','walking'));
assert.equal(walkingUrl.searchParams.get('waypoints').split('|').length,3);
assert.equal(walkingUrl.searchParams.get('destination'),`${four[3].lat},${four[3].lng}`);
assert.equal(walkingUrl.searchParams.get('origin'),`${anchors.find(a=>a.name==='Matunga').lat},${anchors.find(a=>a.name==='Matunga').lng}`);
const transitUrl=new URL(itineraryDirections(four,'Matunga','transit'));
assert.equal(transitUrl.searchParams.get('waypoints'),null);
assert.equal(transitUrl.searchParams.get('destination'),`${four[0].lat},${four[0].lng}`);
assert.equal(itineraryStart('Near me'),undefined,'Missing GPS must not silently use an unrelated station');
assert.equal(new URL(itineraryDirections([four[0]],'Near me','walking')).searchParams.get('origin'),null);
assert.equal(formatSpend(0,0),'₹0');
assert.equal(formatSpend(0,100),'₹0–₹100');
console.log('PASS: constraint-aware ordering, approved GEM consistency, mobile-safe map links, transit legs and zero spend labels.');
console.log('PASS: personal matches, hard constraints, free walking, student discovery, four-stop optimisation and spend breakdown.');
console.log(`PASS: ${places.length} places, ${stations.length} railway stations, ${stations.length**2} rail journeys, assets, search, strict filters, Gem Score sorting, hidden gems, approved-only boosts and cap.`);
