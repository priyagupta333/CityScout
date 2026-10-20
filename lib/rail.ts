export type RailLine = 'Western' | 'Central' | 'Harbour';
export const lineColors: Record<RailLine,string> = {Western:'#a33c54',Central:'#2767a0',Harbour:'#247850'};
export const stations = [
  {name:'Churchgate',lat:18.935,lng:72.827,x:100,y:590},
  {name:'Marine Lines',lat:18.943,lng:72.823,x:100,y:525},
  {name:'Charni Road',lat:18.952,lng:72.819,x:100,y:460},
  {name:'Mumbai Central',lat:18.969,lng:72.819,x:100,y:395},
  {name:'Dadar',lat:19.018,lng:72.843,x:300,y:330},
  {name:'Bandra',lat:19.055,lng:72.841,x:100,y:265},
  {name:'Vile Parle',lat:19.1006,lng:72.8433,x:100,y:200},
  {name:'Andheri',lat:19.119,lng:72.847,x:100,y:135},
  {name:'Borivali',lat:19.23,lng:72.856,x:100,y:70},
  {name:'CSMT',lat:18.94,lng:72.835,x:400,y:590},
  {name:'Byculla',lat:18.978,lng:72.833,x:300,y:460},
  {name:'Matunga',lat:19.027,lng:72.85,x:400,y:265},
  {name:'Kurla',lat:19.065,lng:72.88,x:500,y:330},
  {name:'Ghatkopar',lat:19.086,lng:72.909,x:500,y:240},
  {name:'Kanjurmarg',lat:19.129,lng:72.928,x:500,y:175},
  {name:'Thane',lat:19.186,lng:72.976,x:570,y:110},
  {name:'Dombivli',lat:19.218,lng:73.086,x:700,y:70},
  {name:'Kalyan',lat:19.235,lng:73.13,x:830,y:70},
  {name:'Sewri',lat:18.998,lng:72.855,x:400,y:500},
  {name:'Wadala Road',lat:19.017,lng:72.859,x:500,y:420},
  {name:'Vashi',lat:19.063,lng:72.998,x:650,y:420},
  {name:'Nerul',lat:19.033,lng:73.018,x:730,y:500},
  {name:'Belapur',lat:19.019,lng:73.039,x:800,y:550},
  {name:'Panvel',lat:18.99,lng:73.12,x:860,y:615},
];
export const railLines: Record<RailLine,string[]> = {
  Western:['Churchgate','Marine Lines','Charni Road','Mumbai Central','Dadar','Bandra','Vile Parle','Andheri','Borivali'],
  Central:['CSMT','Byculla','Dadar','Matunga','Kurla','Ghatkopar','Kanjurmarg','Thane','Dombivli','Kalyan'],
  Harbour:['CSMT','Sewri','Wadala Road','Kurla','Vashi','Nerul','Belapur','Panvel'],
};
export const stationByName = (name: string) => stations.find(s => s.name === name);
export type RailRoute = {stations:string[];lines:RailLine[];minutes:number;transfers:number};
// Schematic corridors omit intermediate stops. Durations are sample estimates,
// never a timetable. Dijkstra tracks the line to account for interchange time.
export function railRoute(from: string, to: string): RailRoute | null {
  if(!stationByName(from) || !stationByName(to)) return null;
  const queue = [{name:from,line:'' as RailLine | '',minutes:0,path:[from],lines:[] as RailLine[],transfers:0}];
  const visited = new Set<string>();
  while(queue.length) {
    queue.sort((a,b) => a.minutes-b.minutes);
    const current = queue.shift()!;
    const key = current.name+current.line;
    if(visited.has(key)) continue;
    visited.add(key);
    if(current.name === to) return {stations:current.path,lines:current.lines,minutes:Math.ceil(current.minutes),transfers:current.transfers};
    for(const line of Object.keys(railLines) as RailLine[]) {
      const index = railLines[line].indexOf(current.name);
      if(index < 0) continue;
      for(const next of [railLines[line][index-1],railLines[line][index+1]].filter(Boolean)) {
        const a = stationByName(current.name)!, b = stationByName(next)!;
        const km = Math.hypot((a.lat-b.lat)*111,(a.lng-b.lng)*105);
        const change = Boolean(current.line && current.line !== line);
        queue.push({name:next,line,minutes:current.minutes+Math.max(4,km*2)+ (change ? 8 : 0),path:[...current.path,next],lines:[...current.lines,line],transfers:current.transfers+Number(change)});
      }
    }
  }
  return null;
}
