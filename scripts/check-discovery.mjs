import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const out = path.resolve('outputs/test-modules');
await fs.mkdir(out,{recursive:true});
for(const name of ['places','more-places','place-photos','discovery','rail','gem-score','plan']) {
  const source = await fs.readFile(`lib/${name}.ts`,'utf8');
  const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace(/from '(.+?)'/g,(_,name)=>`from '${name}.mjs'`);
  await fs.writeFile(path.join(out,`${name}.mjs`),js);
}
const {places,anchors,estimate,directions} = await import(pathToFileURL(path.join(out,'places.mjs')));
const {discover} = await import(pathToFileURL(path.join(out,'discovery.mjs')));
const {gemScore} = await import(pathToFileURL(path.join(out,'gem-score.mjs')));
const {stations,railRoute,railLines} = await import(pathToFileURL(path.join(out,'rail.mjs')));
const {planEstimate}=await import(pathToFileURL(path.join(out,'plan.mjs')));
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
console.log(`PASS: ${places.length} places, ${stations.length} railway stations, ${stations.length**2} rail journeys, assets, search, strict filters, Gem Score sorting, hidden gems, approved-only boosts and cap.`);
