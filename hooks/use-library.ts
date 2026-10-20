'use client';
import { useEffect, useRef, useState } from 'react';
import { anchors, places } from '../lib/places';

export type SavedPlan = {ids:string[];anchor:string;savedAt:number;mode?:'transit'|'walking';budget?:number;minutes?:number};
type Library = {saved:string[];plans:SavedPlan[]};
function clean(value: Partial<Library> | null): Library {
  if (!value || typeof value !== 'object') return {saved:[],plans:[]};
  return {saved:Array.isArray(value.saved) ? value.saved.filter(id => places.some(p => p.id === id)) : [],plans:Array.isArray(value.plans) ? value.plans.filter(p => p && Array.isArray(p.ids) && p.ids.length > 0 && p.ids.length <= 4 && (p.mode === undefined || p.mode === 'transit' || p.mode === 'walking') && (p.budget === undefined || (typeof p.budget === 'number' && Number.isFinite(p.budget) && p.budget >= 0 && p.budget <= 10000)) && (p.minutes === undefined || (typeof p.minutes === 'number' && Number.isFinite(p.minutes) && p.minutes >= 1 && p.minutes <= 10000)) && Number.isFinite(p.savedAt) && new Set(p.ids).size === p.ids.length && p.ids.every(id => places.some(x => x.id === id)) && (anchors.some(a => a.name === p.anchor) || p.anchor === 'Near me')) : []};
}
function read(key: string): Library {
  try { return clean(JSON.parse(localStorage.getItem(key) || '{}')); } catch { return {saved:[],plans:[]}; }
}
function has(key: string) { try { return Boolean(localStorage.getItem(key)); } catch { return false; } }
export function useLibrary(userId: string | undefined, booted: boolean) {
  const key = `apnashehar:library:${userId || 'guest'}`;
  const [saved,setSaved] = useState<string[]>([]);
  const [savedPlans,setSavedPlans] = useState<SavedPlan[]>([]);
  const [readyKey,setReadyKey] = useState('');
  const [status,setStatus] = useState('Loading saved items…');
  const baseline = useRef('');
  const pending = useRef(Promise.resolve());
  const owner = useRef(key);
  useEffect(() => { owner.current = key; }, [key]);

  useEffect(() => {
    if (!booted) return;
    let cancelled = false;
    const load = async () => {
      let data = read(key);
      if (!userId && !has(key)) {
        try { data = clean({saved:JSON.parse(localStorage.getItem('apnashehar:saved') || localStorage.getItem('galli:saved') || '[]'),plans:JSON.parse(localStorage.getItem('apnashehar:plans') || localStorage.getItem('galli:plans') || '[]')}); } catch { /* malformed legacy data is ignored */ }
      }
      let message = 'Saved on this device';
      if (userId) {
        try {
          await pending.current;
          if (cancelled) return;
          if (has(`${key}:dirty`)) {
            data = read(key);
            const retry = await fetch('/api/library',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
            if(!retry.ok) throw new Error('Sync failed');
            try { localStorage.removeItem(`${key}:dirty`); } catch {}
          }
          const before = baseline.current;
          const response = await fetch('/api/library', {cache:'no-store'});
          if (!response.ok) throw new Error('Library unavailable');
          data = clean(await response.json());
          if(before !== baseline.current) return;
          message = 'Synced with your explorer account';
        } catch { message = 'Offline copy · changes stay on this device until you retry'; }
      }
      if (cancelled) return;
      baseline.current = JSON.stringify(data);
      setSaved(data.saved); setSavedPlans(data.plans); setStatus(message); setReadyKey(key);
    };
    void load();
    const refresh = () => { if(userId) void load(); };
    window.addEventListener('focus',refresh);
    window.addEventListener('online',refresh);
    return () => { cancelled = true; window.removeEventListener('focus',refresh); window.removeEventListener('online',refresh); };
  }, [key,userId,booted]);

  useEffect(() => {
    if (readyKey !== key) return;
    const serialized = JSON.stringify({saved,plans:savedPlans});
    try { localStorage.setItem(key,serialized); } catch { queueMicrotask(() => setStatus('Device storage is full or unavailable')); }
    if (serialized === baseline.current) return;
    baseline.current = serialized;
    if (!userId) return;
    try { localStorage.setItem(`${key}:dirty`,'true'); } catch {}
    pending.current = pending.current.then(async () => {
      if(owner.current === key) setStatus('Syncing saved items…');
      try {
        const response = await fetch('/api/library', {method:'PUT',headers:{'Content-Type':'application/json'},body:serialized,keepalive:true});
        if(!response.ok) throw new Error('Sync failed');
        if(owner.current === key && baseline.current === serialized) { try { localStorage.removeItem(`${key}:dirty`); } catch {} }
        if(owner.current === key) setStatus('Synced with your explorer account');
      } catch { if(owner.current === key) setStatus('Sync unavailable · your items are safe on this device'); }
    });
  }, [saved,savedPlans,key,readyKey,userId]);

  useEffect(() => {
    const refresh = (event: StorageEvent) => {
      if(event.key !== key) return;
      const data = read(key); baseline.current = JSON.stringify(data); setSaved(data.saved); setSavedPlans(data.plans);
    };
    window.addEventListener('storage',refresh);
    return () => window.removeEventListener('storage',refresh);
  }, [key]);
  return {saved,setSaved,savedPlans,setSavedPlans,status,libraryReady:readyKey === key,flush:() => pending.current};
}
