'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, Clock3, Coffee, Compass, Heart,
  Info, Key, Layers2, List, LogIn, LogOut, Map, MapPin, Navigation, Search,
  ShieldCheck, SlidersHorizontal, Sparkles, Sun, UserPlus, Wallet, X
} from 'lucide-react';
import { discover } from '../lib/discovery';
import { planEstimate } from '../lib/plan';
import { gemScore } from '../lib/gem-score';
import { RailMap } from '../components/rail-map';
import { useLibrary } from '../hooks/use-library';
import { anchors, directions, distanceKm, estimate, money, moods, places, type Mood, type Place } from '../lib/places';

export type ExplorerUser = {
  id: string;
  name: string;
  email: string;
  station: string;
  vibe: string;
  initials: string;
  createdAt: number;
};

type Tab = 'discover' | 'saved' | 'notes' | 'admin';
type Report = { id: string; placeId: string | null; placeName: string; topic: string; note: string; status: string; createdAt: string; };
const readStore = <T,>(key: string, fallback: T): T => { try { return JSON.parse(localStorage.getItem(key) || '') as T; } catch { return fallback; } };
const scrollToExplore = () => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });

export default function CityScoutApp() {
  const [tab, setTab] = useState<Tab>('discover');
  const [anchor, setAnchor] = useState('Matunga');
  const [origin, setOrigin] = useState<{ lat: number; lng: number }>();
  const [mood, setMood] = useState<Mood>('All');
  const [budget, setBudget] = useState('any');
  const [hours, setHours] = useState('any');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('gem');
  const [indoor, setIndoor] = useState(false);
  const [view, setView] = useState<'walk' | 'list' | 'map'>('list');
  const [mapFocus, setMapFocus] = useState('khotachiwadi');
  const [detail, setDetail] = useState<Place | null>(null);
  const [plan, setPlan] = useState<Place | null>(null);
  const [pairId, setPairId] = useState('');
  const [form, setForm] = useState(false);
  const [formPlace, setFormPlace] = useState('');
  const [formTopic,setFormTopic] = useState('A local tip');
  const [filters, setFilters] = useState(false);
  const [credits, setCredits] = useState(false);
  const [toast, setToast] = useState('');
  const [updates, setUpdates] = useState<Report[]>([]);
  const [queue, setQueue] = useState<Report[]>([]);
  const [adminKey, setAdminKey] = useState('');
  const [adminError, setAdminError] = useState('');
  const [visible, setVisible] = useState(16);
  const [booted, setBooted] = useState(false);

  // Authentication & Portal State
  const [entered, setEntered] = useState(false);
  const [currentUser, setCurrentUser] = useState<ExplorerUser | null>(null);
  const [userDropdown, setUserDropdown] = useState(false);
  const [authModal, setAuthModal] = useState(false);
  const [hiddenOnly,setHiddenOnly] = useState(false);
  const [scoreInfo,setScoreInfo] = useState<Place|null>(null);
  const [queueLoaded,setQueueLoaded] = useState(false);
  const [queueLoading,setQueueLoading] = useState(false);
  const [moderating,setModerating] = useState('');
  const [communityError,setCommunityError] = useState('');
  const {saved,setSaved,savedPlans,setSavedPlans,status:libraryStatus,libraryReady,flush:flushLibrary} = useLibrary(currentUser?.id,booted);

  // Horizontal Walk Container Ref
  const walkContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const restore = () => {
    try {
      for(const key of ['entered','anchor']) {
        const legacy = localStorage.getItem(`galli:${key}`);
        if(!localStorage.getItem(`apnashehar:${key}`) && legacy) localStorage.setItem(`apnashehar:${key}`,legacy);
      }
      if(localStorage.getItem('apnashehar:entered') === 'true') setEntered(true);
    } catch { /* Device storage is optional. */ }
    const preference = readStore('apnashehar:anchor','Matunga');
    if(anchors.some(a=>a.name===preference)) setAnchor(preference);
    fetch('/api/account',{cache:'no-store'}).then(r=>r.ok ? r.json() as Promise<{user:ExplorerUser|null}> : null).then(data=>{if(data?.user) {setCurrentUser(data.user);setEntered(true);}}).catch(()=>{});
    const params = new URLSearchParams(location.search);
    const selected = places.find(p => p.id === params.get('place'));
    if (selected) { setDetail(selected); setEntered(true); }
    const planIds = params.get('plan')?.split(',') ?? [];
    const selectedPlan = places.find(p => p.id === planIds[0]);
    if (selectedPlan) { setPlan(selectedPlan); setPairId(planIds[1] ?? ''); setEntered(true); }
    if (params.get('from') && anchors.some(a => a.name === params.get('from'))) setAnchor(params.get('from')!);
    if (params.get('view') === 'saved') { setTab('saved'); setEntered(true); }
    setBooted(true);
    }; restore();
  }, []);

  useEffect(() => { if (booted && anchor !== 'Near me') {try {localStorage.setItem('apnashehar:anchor', JSON.stringify(anchor));} catch {}}  }, [anchor, booted]);
  const refreshCommunity = useCallback(async () => {
    try {const r=await fetch('/api/community',{cache:'no-store'});if(!r.ok) throw new Error();const data=await r.json();setUpdates(Array.isArray(data)?data:[]);setCommunityError('');}
    catch {setCommunityError('Community updates are temporarily unavailable. Showing the sample catalog.');}
  },[]);
  useEffect(()=>{void Promise.resolve().then(refreshCommunity); const timer=setInterval(()=>void refreshCommunity(),30000); window.addEventListener('focus',refreshCommunity);return ()=>{clearInterval(timer);window.removeEventListener('focus',refreshCommunity);};},[refreshCommunity]);
  useEffect(() => { if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') navigator.serviceWorker.register('/sw.js').catch(() => {}); }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { 
    const escape = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') { 
        setDetail(null); setPlan(null); setForm(false); setFilters(false); setCredits(false); setUserDropdown(false); setAuthModal(false); setScoreInfo(null); history.replaceState(null,'',location.pathname); 
      } 
    }; 
    document.addEventListener('keydown', escape); 
    return () => document.removeEventListener('keydown', escape); 
  }, []);

  const showToast = (message: string) => setToast(message);

  // Authentication Handlers
  const handleLogin = (user: ExplorerUser) => {
    setCurrentUser(user);
    setEntered(true);
    setAuthModal(false);
    setUserDropdown(false);
    setOrigin(undefined);
    localStorage.setItem('apnashehar:entered', 'true');
    if (user.station) setAnchor(user.station);
    showToast(`Welcome back, ${user.name}! Ready to wander.`);
  };

  const handleSignUp = (newUser: ExplorerUser) => {
    setCurrentUser(newUser);
    setEntered(true);
    setAuthModal(false);
    setUserDropdown(false);
    setOrigin(undefined);
    localStorage.setItem('apnashehar:entered', 'true');
    if (newUser.station) setAnchor(newUser.station);
    showToast(`Explorer account created! Welcome to CityScout, ${newUser.name}.`);
  };

  const handleSignOut = async () => {
    try {await flushLibrary();const r=await fetch('/api/account',{method:'DELETE'});if(!r.ok) throw new Error();}
    catch {showToast('Could not sign out. Please retry.');return;}
    setTab('discover');setAdminKey('');setQueue([]);setQueueLoaded(false);setOrigin(undefined);
    setCurrentUser(null);
    setEntered(false);
    setUserDropdown(false);
    localStorage.removeItem('apnashehar:user');
    localStorage.removeItem('apnashehar:entered');
    showToast('Signed out of CityScout. See you in the lanes soon!');
  };

  const handleEnterGuest = () => {
    setEntered(true);
    localStorage.setItem('apnashehar:entered', 'true');
    setAuthModal(false); showToast('Welcome to CityScout. Your city, your kind of day.');
  };

  // Horizontal Walk Scrolling Helpers
  const scrollWalk = (direction: 'left' | 'right') => {
    if (walkContainerRef.current) {
      const scrollAmount = direction === 'left' ? -420 : 420;
      walkContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToPlace = (placeId: string) => {
    const el = document.getElementById(`walk-card-${placeId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const closed = useMemo(()=>new Set(updates.filter(r=>r.topic==='Closed / restricted').map(r=>r.placeId)),[updates]);
  const activePlaces = useMemo(()=>discover({anchor,origin,mood,budget,hours,query,indoor,sort,closed,hiddenOnly,observations:updates}),[anchor,origin,mood,budget,hours,query,indoor,sort,closed,hiddenOnly,updates]);
  const resetFilters = () => {setMood('All');setBudget('any');setHours('any');setIndoor(false);setHiddenOnly(false);setQuery('');};
  const focus = activePlaces.find(p => p.id === mapFocus) ?? activePlaces[0];
  const pair = pairId ? places.find(p => p.id === pairId && p.id !== plan?.id && !closed.has(p.id)) : undefined;
  const planStats = plan ? planEstimate(pair?[plan,pair]:[plan],anchor,origin) : null;

  const switchTab = (next: Tab) => {history.replaceState(null,'',location.pathname); setTab(next); setDetail(null); setPlan(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openPlace = (p: Place) => { setDetail(p); setPlan(null); history.replaceState(null, '', `?place=${p.id}`); };
  const closeDetail = () => { setDetail(null); history.replaceState(null, '', location.pathname); };
  const openPlan = (p: Place, partner = '', from = anchor) => { setPlan(p); setPairId(partner); setDetail(null); history.replaceState(null, '', `?plan=${p.id}${partner ? ',' + partner : ''}&from=${encodeURIComponent(from)}`); };
  const closePlan = () => { setPlan(null); history.replaceState(null, '', location.pathname); };
  const portableAnchor = anchor==='Near me' ? [...anchors].sort((a,b)=>distanceKm(a,origin??plan??anchors[0])-distanceKm(b,origin??plan??anchors[0]))[0].name : anchor;
  const planIds = plan ? [plan.id,...(pair?[pair.id]:[])] : [];
  const planIsSaved = savedPlans.some(p=>p.ids.join(',')===planIds.join(',')&&p.anchor===portableAnchor);
  const toggleSave = (id: string) => { if(!libraryReady) return showToast('Loading your saved list. Please try again.'); const exists = saved.includes(id); setSaved(previous=>previous.includes(id)?previous.filter(x=>x!==id):[...previous,id]); showToast(exists ? 'Removed from your saved places' : 'Saved for another day'); };
  const savePlan = () => {
    if(!libraryReady)return showToast('Loading your saved list. Please try again.');
    if(!plan)return;
    setSavedPlans(previous=>planIsSaved ? previous.filter(p=>!(p.ids.join(',')===planIds.join(',')&&p.anchor===portableAnchor)) : [...previous,{ids:planIds,anchor:portableAnchor,savedAt:Date.now()}]);
    showToast(planIsSaved?'Removed saved plan':anchor==='Near me'?`Saved from ${portableAnchor}; precise location is not stored.`:currentUser?'Mini-plan saved to your account':'Mini-plan saved on this device');
  };
  const shareUrl = (param: string) => `${location.origin}${location.pathname}?${param}`;
  const share = async (title: string, param: string) => { const url = shareUrl(param); try { if (navigator.share) await navigator.share({ title, url }); else { await navigator.clipboard.writeText(url); showToast('Link copied to clipboard'); } } catch (e) { if ((e as Error).name !== 'AbortError') showToast('Could not share this link'); } };
  const useLocation = () => { if (!navigator.geolocation) return showToast('Location is unavailable here'); navigator.geolocation.getCurrentPosition(pos => { setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setAnchor('Near me'); showToast('Using your approximate location for estimates'); }, () => showToast('Choose a station instead; location access was not available'), { enableHighAccuracy: false, timeout: 8000 }); };
  const loadQueue = useCallback(async (key=adminKey) => {
    if(!key.trim()) {setAdminError('Enter the moderator passphrase. Explorer sign-in is separate.');return;}
    setQueueLoading(true);
    try {const r=await fetch('/api/moderation',{headers:{'x-apnashehar-admin-key':key.trim()},cache:'no-store'});
      if(r.status===403){setQueue([]);setQueueLoaded(false);}
      if(!r.ok) throw new Error(r.status===403 ? 'Moderator passphrase not accepted. Enter the configured moderator passphrase.' : 'Queue unavailable. Please retry.');
      setQueue(await r.json());setAdminKey(key.trim());setAdminError('');setQueueLoaded(true);
    } catch(e) {setAdminError((e as Error).message);} finally {setQueueLoading(false);}
  },[adminKey]);
  useEffect(()=>{if(tab!=='admin'||!queueLoaded)return; const refresh=()=>void loadQueue();refresh();const timer=setInterval(refresh,15000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[tab,queueLoaded,loadQueue]);
  const moderate = async (id:string,status:'approved'|'rejected') => {
    setModerating(id);
    try {const r=await fetch('/api/moderation',{method:'PATCH',headers:{'content-type':'application/json','x-apnashehar-admin-key':adminKey},body:JSON.stringify({id,status})});if(!r.ok)throw new Error('Could not update this note.');await loadQueue();await refreshCommunity();showToast(status==='approved'?'Note approved.':'Note declined.');}
    catch(e){showToast((e as Error).message);}finally{setModerating('');}
  };
  const hasDialog=Boolean(detail||plan||form||filters||credits||authModal||scoreInfo);
  useEffect(()=>{
    if(!hasDialog)return;
    const previous=document.activeElement as HTMLElement|null, old=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const dialog=Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).pop();
    const items=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input,select,textarea,[tabindex="0"]')??[]).filter(e=>e.getClientRects().length);
    items()[0]?.focus();
    const trap=(e:KeyboardEvent)=>{if(e.key!=='Tab')return;const list=items(),first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}};
    document.addEventListener('keydown',trap);return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',trap);previous?.focus();};
  },[hasDialog,detail?.id,plan?.id,form,filters,credits,authModal,scoreInfo]);

  // Find Plan handler
  const findPlan = () => { 
    setTab('discover'); 
    setVisible(16); 
    setView('list'); 

    setTimeout(scrollToExplore, 120); 
    showToast(`Found ${activePlaces.length} gems for ${mood === 'All' ? 'your day' : mood} from ${anchor}!`);
  };


  // -------------------------------------------------------------
  // VIEW: GRAND ENTRANCE PORTAL (Shown if user has not entered)
  // -------------------------------------------------------------
  if (!entered) {
    return (
      <div className="entrance-portal">
        <div className="entrance-glow-1" />
        <div className="entrance-glow-2" />
        
        <header className="entrance-header">
          <div className="container entrance-header-inner">
            <button className="entrance-brand" onClick={() => {}} aria-label="CityScout portal">
              <span className="entrance-brand-icon"><Compass size={34} strokeWidth={2.2}/></span>
              <span>CityScout<span style={{color:'var(--orange)'}}>.</span></span>
            </button>
            <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
              <span className="entrance-badge"><MapPin size={13}/> MUMBAI EXPLORER PORTAL</span>
            </div>
          </div>
        </header>

        <main className="entrance-main">
          <div className="container">
            <div className="entrance-grid">
              
              {/* Left Story Side */}
              <div className="entrance-story">
                <div className="hero-tag"><Sparkles size={14}/> STEP INTO MUMBAI’S LANES</div>
                <span className="hindi-subtitle">अपना शहर — हर गली में एक नई कहानी</span>
                <h1>A little less obvious.<br/>A lot more <em>Mumbai.</em></h1>
                <p>
                  Beyond Marine Drive and tourist itineraries lie the living lanes of the city: timber balconies of Khotachiwadi, Portuguese walls of Ranwar, hot crispy Ashok Vada Pav in Dadar, stone steps of Banganga, and sunset vistas from Bandra Fort.
                </p>
                <p style={{fontSize:'14px', color:'#c2d4b8'}}>
                  Create your explorer profile to bookmark gems, wander station by station, and experience Mumbai through a continuous horizontal street stroll.
                </p>

                <div className="entrance-highlights">
                  <div className="highlight-stat">
                    <strong>{places.length}</strong>
                    <span>Curated Street Gems</span>
                  </div>
                  <div className="highlight-stat">
                    <strong>{anchors.length}</strong>
                    <span>Starting locations</span>
                  </div>
                  <div className="highlight-stat">
                    <strong>5 Moods</strong>
                    <span>Made for Mumbai</span>
                  </div>
                </div>
              </div>

              {/* Right Authentication Card */}
              <div>
                <AuthCard 
                  onLogin={handleLogin}
                  onSignUp={handleSignUp}
                  onGuest={handleEnterGuest}
                />
              </div>

            </div>
          </div>
        </main>
        
        {toast && <div className="toast" role="status"><CheckCircle2 size={18}/>{toast}</div>}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: MAIN CITYSCOUT APPLICATION (Entered)
  // -------------------------------------------------------------
  return <>
    <div className="topline">
      <span>THE GOOD SIDE OF MUMBAI, ONE LITTLE DETOUR AT A TIME · {places.length} CURATED CITY GEMS</span>
    </div>

    <header className="site-header">
      <div className="container header-inner">
        <button className="logo" onClick={() => switchTab('discover')} aria-label="CityScout home">
          <span className="logo-mark"><Compass size={32} strokeWidth={2}/></span>
          CityScout<span style={{color:'var(--orange)'}}>.</span>
        </button>

        <nav className="nav" aria-label="Main navigation">
          <button className={tab === 'discover' ? 'active' : ''} onClick={() => switchTab('discover')}>
            Discover
          </button>
          <button className={tab === 'notes' ? 'active' : ''} onClick={() => switchTab('notes')}>
            Our story
          </button>
          <button className={tab === 'saved' ? 'active' : ''} onClick={() => switchTab('saved')}>
            Saved{saved.length > 0 && <span>{saved.length}</span>}
          </button>
        </nav>

        <div className="header-actions">
          <span className="city-label"><MapPin size={14}/> MUMBAI</span>

          {/* User Profile Badge / Sign Out Dropdown */}
          {currentUser ? (
            <div className="user-menu-wrapper">
              <button 
                className="user-chip-btn" 
                onClick={() => setUserDropdown(!userDropdown)}
                aria-label="User profile and settings"
              >
                <div className="user-avatar-circle">{currentUser.initials}</div>
                <span>{currentUser.name.split(' ')[0]} · {currentUser.station}</span>
                <ChevronDown size={14}/>
              </button>

              {userDropdown && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <strong>{currentUser.name}</strong>
                    <small>{currentUser.email}</small>
                    <small style={{color:'var(--orange)'}}>Home: {currentUser.station} Station</small>
                  </div>
                  <button className="user-dropdown-item" onClick={() => { switchTab('saved'); setUserDropdown(false); }}>
                    <Heart size={15}/> My Saved Gems ({saved.length})
                  </button>
                  <button className="user-dropdown-item" onClick={() => { switchTab('admin'); setUserDropdown(false); }}>
                    <Key size={15}/> Curator Desk
                  </button>
                  <button className="user-dropdown-item signout-item" onClick={handleSignOut}>
                    <LogOut size={15}/> Sign Out &amp; Exit CityScout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="button secondary" onClick={() => setAuthModal(true)} style={{fontSize:'12px', minHeight:'38px', padding:'8px 14px'}}>
              <LogIn size={14}/> Sign In / Join
            </button>
          )}

          <button className="button accent" onClick={() => { setFormPlace(''); setForm(true); }}>
            Share a gem <ArrowUpRight size={15}/>
          </button>
        </div>
      </div>
    </header>

    {tab === 'discover' && <>
      <main>
        {/* Hero Section */}
        <div className="container hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="tiny-line"/> YOUR CITY. YOUR KIND OF DAY.</div>
            <h1>A little less obvious.<br/>A lot more <em>Mumbai.</em></h1>
            <p>Good places don’t always make the big lists. Find a little escape that fits your mood, your time, and what’s in your pocket.</p>
            <div className="hero-meta">
              <div className="avatar-stack"><span>म</span><span>G</span><span>मुं</span></div>
              <span>{places.length} Curated Places</span>
              <span>·</span>
              <span>Ranked for discovery, not popularity</span>
            </div>
            <div className="scroll-note"><ArrowDown size={14}/> Choose your mood and station below</div>
          </div>
          
          <div className="hero-visual">
            <img className="hero-photo" src="/images/khotachiwadi.webp" alt="Colorful lane in Khotachiwadi, Mumbai"/>
            <div className="photo-label">
              <MapPin size={16}/>
              <span><small>ANOTHER SIDE OF MUMBAI</small>Khotachiwadi, Girgaon</span>
            </div>
            <div className="photo-stamp">
              <Sun size={24}/>
              <span>GOOD DAYS</span>
              <span>START HERE</span>
            </div>
          </div>
        </div>

        {/* Planner Filter Bar */}
        <div className="container">
          <div className="planner-bar">
            <div className="planner-field">
              <label htmlFor="anchor">Starting from</label>
              <select id="anchor" value={anchor} onChange={e => { setAnchor(e.target.value); setOrigin(undefined); }}>
                <option value="Near me" disabled={!origin}>Near me</option>
                {anchors.map(a => <option key={a.name}>{a.name}</option>)}
              </select>
              <ChevronDown size={14}/>
            </div>
            <div className="planner-field">
              <label htmlFor="mood">In the mood for</label>
              <select id="mood" value={mood} onChange={e => setMood(e.target.value as Mood)}>
                {moods.map(m => <option key={m}>{m}</option>)}
              </select>
              <ChevronDown size={14}/>
            </div>
            <div className="planner-field">
              <label htmlFor="budget">My budget</label>
              <select id="budget" value={budget} onChange={e => setBudget(e.target.value)}>
                <option value="any">Any budget</option>
                <option value="100">Up to ₹100</option>
                <option value="150">Up to ₹150</option>
                <option value="250">Up to ₹250</option>
                <option value="400">Up to ₹400</option>
              </select>
              <ChevronDown size={14}/>
            </div>
            <div className="planner-field">
              <label htmlFor="time">I have</label>
              <select id="time" value={hours} onChange={e => setHours(e.target.value)}>
                <option value="any">Any time</option>
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="3">3 hours</option>
                <option value="5">Half a day</option>
              </select>
              <ChevronDown size={14}/>
            </div>
            <div className="planner-action">
              <button className="button primary" onClick={findPlan}>
                Find my kind of day <ArrowRight size={15}/>
              </button>
            </div>
          </div>
          <div className="planner-note">
            <span><Info size={14}/> Spend ranges include suburban local transit; check current details before departure.</span>
            <button onClick={useLocation}>Use my location</button>
          </div>
        </div>

        {/* Shortlist & Discovery Showcase */}
        <section id="explore" className="container discovery-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THE SHORTLIST</div>
              <h2>Worth the little detour.</h2>
              <p>Thoughtful picks for the way you actually spend a day in Mumbai.</p>
            </div>
            
            <div className="section-tools">
              <div className="view-toggle" aria-label="Results view">
                <button 
                  className={view === 'walk' ? 'active' : ''} 
                  onClick={() => setView('walk')} 
                  aria-label="Horizontal Street Walk view"
                  title="Horizontal Street Walk"
                >
                  <Navigation size={14}/>
                  <span>Street Walk</span>
                </button>
                <button 
                  className={view === 'list' ? 'active' : ''} 
                  onClick={() => setView('list')} 
                  aria-label="List view"
                >
                  <List size={14}/>
                  <span>Grid</span>
                </button>
                <button 
                  className={view === 'map' ? 'active' : ''} 
                  onClick={() => setView('map')} 
                  aria-label="Map view"
                >
                  <Map size={14}/>
                  <span>Map</span>
                </button>
              </div>
              <button 
                className={'filter-button ' + (indoor||hiddenOnly||budget!=='any'||hours!=='any' ? 'applied' : '')} 
                onClick={() => setFilters(true)} 
                aria-label="More filters"
              >
                <SlidersHorizontal size={14}/>
                <span>Filters</span>
              </button>
            </div>
          </div>

          <div className="mood-row">
            {moods.map(m => (
              <button 
                key={m} 
                className={'mood-chip ' + (mood === m ? 'active ' + m.toLowerCase().replace(/[^a-z]/g, '-') : '')} 
                onClick={() => { setMood(m); setVisible(16); }}
              >
                {m === 'Eat cheap' ? <Coffee/> : m === 'Slow down' ? <BookOpen/> : m === 'Catch a view' ? <Sun/> : m === 'Wander' ? <Navigation/> : m === 'Art & culture' ? <Sparkles/> : <Compass/>}
                {m}
              </button>
            ))}
            <label className="search-box">
              <Search size={14}/>
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search places or neighborhoods..." aria-label="Search places"/>
            </label>
          </div>

          <div className="discovery-controls"><label className="hidden-toggle"><input type="checkbox" checked={hiddenOnly} onChange={e=>{setHiddenOnly(e.target.checked);setVisible(16);}}/> Hidden gems only <small>Gem Score 55+</small></label><button className="text-button" onClick={()=>setScoreInfo(activePlaces[0]??places[0])}>How Gem Score works</button>{(mood!=='All'||budget!=='any'||hours!=='any'||query||indoor||hiddenOnly)&&<button className="text-button" onClick={resetFilters}>Clear all filters</button>}</div>
          <p className="sample-notice">Ratings, review counts, sample verification signals, costs and travel times are illustrative. Approved community verifications are shown separately.</p>
          {communityError&&<p className="service-notice" role="status">{communityError}</p>}
          <div className="results-line">
            <span>
              <strong style={{color:'var(--orange)'}}>{activePlaces.length}</strong> {activePlaces.length === 1 ? 'gem' : 'curated gems'} found from <strong>{anchor}</strong> station
            </span>
            <label>Sort by <select value={sort} onChange={e => setSort(e.target.value)}><option value="gem">Highest Gem Score</option><option value="near">Nearest to {anchor}</option><option value="cost">Lowest cost</option><option value="name">Alphabetical</option></select></label>
          </div>

          {activePlaces.length===0 ? <div className="empty"><Search size={30}/><h3>No places match these filters.</h3><p>Try another neighborhood, mood, budget or time allowance.</p><button className="button primary" onClick={resetFilters}>Clear filters</button></div> : view === 'walk' ? (
            /* ============================================================== */
            /* HORIZONTAL CITYSCOUT STREET WALK (Primary requested experience)     */
            /* ============================================================== */
            <div className="horizontal-walk-wrapper">
              <div className="street-trail-strip">
                <span className="street-trail-label">STREET TRAIL:</span>
                {activePlaces.map((p, idx) => (
                  <span key={p.id} style={{display:'inline-flex', alignItems:'center', gap:6}}>
                    <button 
                      className={'street-trail-stop ' + (p.category === mood ? 'matched' : '')} 
                      onClick={() => scrollToPlace(p.id)}
                    >
                      <MapPin size={11}/> {p.name} ({p.area})
                    </button>
                    {idx < activePlaces.length - 1 && <span className="street-trail-arrow">→</span>}
                  </span>
                ))}
              </div>

              <div className="horizontal-walk-topbar">
                <div className="cityscout-walk-badge">
                  <span className="live-dot" />
                  <span>YOUR MUMBAI STREET WALK</span>
                  <span className="cityscout-track-info">(Scroll horizontally with trackpad, mouse wheel, or arrows)</span>
                </div>
                <div className="cityscout-walk-nav-btns">
                  <button className="cityscout-nav-btn" onClick={() => scrollWalk('left')} aria-label="Scroll left in CityScout">
                    <ChevronLeft size={20}/>
                  </button>
                  <button className="cityscout-nav-btn" onClick={() => scrollWalk('right')} aria-label="Scroll right in CityScout">
                    <ChevronRight size={20}/>
                  </button>
                </div>
              </div>

              {/* The Horizontal Scrolling Track */}
              <div 
                className="horizontal-scroll-container" 
                ref={walkContainerRef}
                tabIndex={0} aria-label="Scrollable street walk"
              >
                {activePlaces.map((p, index) => {
                  const e = estimate(p, anchor, origin);
                  const moodBadgeClass = 'mood-badge-' + p.category.toLowerCase().replace(/[^a-z]/g, '-');
                  return (
                    <article 
                      className="horizontal-place-card" 
                      key={p.id} 
                      id={`walk-card-${p.id}`}
                    >
                      <span className="horizontal-card-milestone">
                        STOP {String(index+1).padStart(2,'0')} · {p.area}
                      </span>
                      
                      <div className="horizontal-card-media">
                        <img src={p.image} alt={p.name} loading="lazy" />
                        <button 
                          className={'save-button ' + (saved.includes(p.id) ? 'saved' : '')} 
                          onClick={() => toggleSave(p.id)} 
                          aria-label={saved.includes(p.id) ? `Remove ${p.name}` : `Save ${p.name}`}
                        >
                          <Heart size={16} fill={saved.includes(p.id) ? 'currentColor' : 'none'}/>
                        </button>
                        <span className="card-tag"><MapPin size={11}/> {p.station} Station</span>
                      </div>

                      <div className="horizontal-card-content"><GemBadge place={p} updates={updates} onExplain={()=>setScoreInfo(p)}/>
                        <div className="horizontal-card-meta">
                          <span className={'category-pill ' + moodBadgeClass}>{p.category}</span>
                          <span className="duration-tag">~{p.duration} mins on site</span>
                        </div>
                        
                        <h3 className="horizontal-card-title">
                          <button onClick={() => openPlace(p)}>{p.name}</button>
                        </h3>
                        <p className="horizontal-card-sub">{p.subtitle}</p>

                        <div className="horizontal-card-stats">
                          <div>
                            <span className="stat-label">Est. Spend from {anchor}</span>
                            <strong className="stat-value">{money(e.low, e.high)}</strong>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <span className="stat-label">Travel Time</span>
                            <strong className="stat-value">~{e.travelMin} min</strong>
                          </div>
                        </div>

                        <div className="horizontal-card-actions">
                          <button className="button primary" onClick={() => openPlace(p)}>
                            Step Inside <ArrowRight size={13}/>
                          </button>
                          <button className="button secondary" onClick={() => openPlan(p)} title="Build mini-plan">
                            Plan <ArrowUpRight size={13}/>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : view === 'list' ? (
            /* Traditional Grid View */
            <>
              <div className="place-grid">
                {activePlaces.slice(0, visible).map(p => (
                  <PlaceCard observations={updates} onExplain={setScoreInfo} 
                    key={p.id} 
                    place={p} 
                    anchor={anchor} 
                    origin={origin} 
                    saved={saved.includes(p.id)} 
                    onOpen={() => openPlace(p)} 
                    onSave={() => toggleSave(p.id)}
                  />
                ))}
              </div>
              {visible < activePlaces.length && (
                <button className="button secondary load-more" onClick={() => setVisible(visible + 8)}>
                  Show more places <ArrowDown size={14}/>
                </button>
              )}
            </>
          ) : (
            <RailMap origin={origin} results={activePlaces} anchor={anchor} selected={focus} onStation={name=>{setAnchor(name);setOrigin(undefined);}} onSelect={p=>setMapFocus(p.id)} onOpen={openPlace}/>
          )}
        </section>

        {/* Collections Section */}
        <section className="collections-section">
          <div className="container">
            <div className="section-heading">
              <div>
                <div className="eyebrow">A LITTLE INSPIRATION</div>
                <h2>Pick a feeling. We’ll find the place.</h2>
              </div>
            </div>
            <div className="collection-grid">
              <button className="collection-card" onClick={() => { setMood('Eat cheap'); scrollToExplore(); }}>
                <span className="eyebrow">01 / EAT WELL</span>
                <ArrowUpRight className="collection-arrow" size={19}/>
                <div>
                  <h3>Good food,<br/>good change.</h3>
                  <p>Small bites, big feelings.</p>
                </div>
                <Coffee className="collection-art" size={144}/>
              </button>
              
              <button className="collection-card" onClick={() => { setMood('Slow down'); scrollToExplore(); }}>
                <span className="eyebrow">02 / SLOW DOWN</span>
                <ArrowUpRight className="collection-arrow" size={19}/>
                <div>
                  <h3>A quieter kind<br/>of afternoon.</h3>
                  <p>For the hours that are just yours.</p>
                </div>
                <BookOpen className="collection-art" size={150}/>
              </button>
              
              <button className="collection-card" onClick={() => { setMood('Catch a view'); scrollToExplore(); }}>
                <span className="eyebrow">03 / GET OUTSIDE</span>
                <ArrowUpRight className="collection-arrow" size={19}/>
                <div>
                  <h3>Go where the<br/>sky opens up.</h3>
                  <p>A little sea air changes everything.</p>
                </div>
                <Sun className="collection-art" size={155}/>
              </button>
            </div>
          </div>
        </section>

        {/* Editorial Section */}
        <section className="container editorial-section">
          <div className="editorial-photos">
            <img src="/images/bandra-fort.jpg" alt="Bandra Fort coastal panorama in Mumbai" loading="lazy"/>
            <img src="/images/banganga.webp" alt="Banganga Tank in Mumbai" loading="lazy"/>
          </div>
          <div className="editorial-copy">
            <div className="eyebrow">THE GOOD STUFF IS CLOSE</div>
            <h2>There’s more to Mumbai than the usual list.</h2>
            <p>A lane you’ve walked past. A bookstore with an hour to spare. A coastal fort worth getting off the local train for. We’re collecting small city moments and the practical details that make them possible.</p>
            <button className="text-button" onClick={() => switchTab('notes')}>
              The story behind CityScout <ArrowRight size={14}/>
            </button>
          </div>
        </section>

        {/* Community Callout */}
        <div className="container">
          <div className="community-band">
            <div>
              <h2>Know a place we should know?</h2>
              <p>The best tips come from people who actually go. Help make this city guide better.</p>
            </div>
            <button className="button" onClick={() => { setFormPlace(''); setForm(true); }}>
              Share your local find <ArrowUpRight size={15}/>
            </button>
          </div>
        </div>
      </main>
    </>}

    {/* Saved Places Tab */}
    {tab === 'saved' && (
      <main className="container">
        <div className="page-intro">
          <div className="eyebrow">YOUR OWN LITTLE LIST</div>
          <h1>Saved for later.</h1>
          <p>{currentUser?'Your places and mini-plans sync with your explorer account.':'Your guest places and plans stay on this device.'}</p>
        </div>
        <p className="sync-status" role="status">{libraryStatus}</p><div className="saved-actions">
          <button className="button secondary" onClick={() => switchTab('discover')}>
            <ArrowLeft size={14}/> Discover more
          </button>
        </div>
        {savedPlans.length > 0 && <>
          <div className="section-heading"><h2>Your mini-plans</h2></div>
          <div className="collection-grid" style={{marginBottom:35}}>
            {savedPlans.map((p,i) => { 
              const first = places.find(x => x.id === p.ids[0]); 
              const second = places.find(x => x.id === p.ids[1]); 
              return first && (
                <button className="collection-card" key={i} onClick={() => { setOrigin(undefined); setAnchor(p.anchor); openPlan(first, second?.id, p.anchor); }}>
                  <span className="eyebrow">FROM {p.anchor.toUpperCase()}</span>
                  <ArrowUpRight className="collection-arrow" size={19}/>
                  <div>
                    <h3>{first.name}{second ? ` + ${second.name}` : ''}</h3>
                    <p>Open your saved plan</p>
                  </div>
                </button>
              ); 
            })}
          </div>
        </>}
        {!libraryReady ? <p role="status">Loading saved places…</p> : saved.length ? <>
          <div className="section-heading"><h2>Places to go</h2></div>
          <div className="place-grid" style={{marginBottom:55}}>
            {places.filter(p => saved.includes(p.id)).map(p => (
              <PlaceCard observations={updates} onExplain={setScoreInfo} key={p.id} place={p} anchor={anchor} origin={origin} saved onOpen={() => openPlace(p)} onSave={() => toggleSave(p.id)}/>
            ))}
          </div>
        </> : savedPlans.length === 0 && (
          <div className="empty" style={{marginBottom:55}}>
            <Heart size={28}/>
            <h3>Your list is waiting.</h3>
            <p>Tap the heart on any place you want to remember.</p>
            <button className="button primary" onClick={() => switchTab('discover')}>
              Explore Mumbai <ArrowRight size={14}/>
            </button>
          </div>
        )}
      </main>
    )}

    {/* Story / About Tab */}
    {tab === 'notes' && (
      <main className="container">
        <div className="page-intro">
          <div className="eyebrow">A NOTE FROM CITYSCOUT</div>
          <h1>The city is more than a checklist.</h1>
          <p>CityScout is a Mumbai-first discovery guide for the free hours, small budgets and everyday adventures that rarely make a tourist itinerary.</p>
        </div>
        <div className="about-grid">
          <div className="about-card"><Wallet size={28}/><h3>Know the real spend.</h3><p>We include an illustrative travel allowance and show costs as a range. Every estimate is marked until someone checks it locally.</p></div>
          <div className="about-card"><Clock3 size={28}/><h3>Make your time count.</h3><p>Start from a familiar station. Set a free hour or half a day. Get a shortlist that fits the shape of your day.</p></div>
          <div className="about-card"><ShieldCheck size={28}/><h3>Keep tips honest.</h3><p>Anyone can suggest a change. A review step separates community observations from published facts.</p></div>
        </div>
        <div className="notes-list">
          <div className="note-block">
            <div className="eyebrow">THE EDITORIAL RULE</div>
            <h2>A thoughtful guide, not a popularity contest.</h2>
            <p>We write for the person making a real plan: what’s special here, how long to stay, what it may cost, and what to check before leaving. The seed places on this prototype are examples, and their current prices, hours and access need on-the-ground verification.</p>
          </div>
          <div className="note-block">
            <div className="eyebrow">CARE FOR THE CITY</div>
            <h2>Good discovery comes with good manners.</h2>
            <p>Some destinations are homes, places of worship or sensitive natural spaces. CityScout includes etiquette and access notes, and avoids sending people into private or restricted areas. Report a problem on any place card if something has changed.</p>
          </div>
          <div className="note-block">
            <div className="eyebrow">IMAGE CREDITS</div>
            <h2>Real places, real photographs.</h2>
            <p>Place photographs include source credits and licence information. Images are resized, compressed and cropped to fit the interface.</p>
            <button className="text-button" onClick={() => setCredits(true)}>View photo credits <ArrowRight size={14}/></button>
          </div>
        </div>
        <div className="community-band">
          <div><h2>Help us find the next one.</h2><p>Suggest a place or correct a detail that changed.</p></div>
          <button className="button" onClick={() => setForm(true)}>Share a gem <ArrowUpRight size={15}/> </button>
        </div>
      </main>
    )}

    {/* Admin / Curator Desk Tab */}
    {tab === 'admin' && (
      <main className="container">
        <div className="page-intro">
          <div className="eyebrow">CURATOR DESK</div>
          <h1>Review the field notes.</h1>
          <p>Every community suggestion waits here until a curator checks it. Approved notes appear on the relevant place.</p>
        </div>
        <form style={{maxWidth:560,marginBottom:30}} onSubmit={e=>{e.preventDefault();void loadQueue();}}>{!queueLoaded&&<p className="service-notice">Queue locked. Enter the private moderator passphrase supplied by the site administrator. Explorer sign-in is separate.</p>}
          <div className="form-field">
            <label htmlFor="admin-key">Moderator passphrase</label>
            <input id="admin-key" type="password" autoComplete="off" disabled={Boolean(moderating)} value={adminKey} onChange={e => {setAdminKey(e.target.value);setQueueLoaded(false);setQueue([]);}} placeholder="Enter the private passphrase"/>
          </div>
          <button className="button primary" type="submit" disabled={queueLoading||Boolean(moderating)}>{queueLoading?'Loading…':queueLoaded?'Refresh review queue':'Unlock review queue'} <ArrowRight size={14}/></button>
          {adminError && <p className="error-message" role="alert" style={{marginTop:15}}>{adminError}</p>}{queueLoaded&&<p role="status">{queue.filter(r=>r.status==='pending').length} pending · {queue.length} total notes · Refreshes every 15 seconds</p>}
        </form>
        {queueLoaded&&queue.length===0&&<div className="empty"><h3>All caught up.</h3><p>New contributions will appear here.</p></div>}{queue.length > 0 && (
          <div style={{maxWidth:760,marginBottom:60}}>
            {queue.map(r => (
              <div className="moderation-card" key={r.id}>
                <span className={'status-pill '+r.status}>{r.status}</span>
                <h3>{r.placeName || 'New place'} · {r.topic}</h3>
                <p>{r.note}</p>
                <p>{new Date(r.createdAt).toLocaleString('en-IN')}</p>
                <div className="moderation-actions">
                  <button className="button primary" disabled={Boolean(moderating)||r.status==='approved'} onClick={() => moderate(r.id,'approved')}>Approve</button>
                  <button className="button secondary" disabled={Boolean(moderating)||r.status==='rejected'} onClick={() => moderate(r.id,'rejected')}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    )}

    {/* Footer */}
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <button className="logo" style={{fontSize:32}} onClick={() => switchTab('discover')}>
              <span className="logo-mark"><Compass size={22}/></span>CityScout<span style={{color:'var(--orange)'}}>.</span>
            </button>
            <p>Small discoveries. Better days.</p>
          </div>
          <div className="footer-links">
            <button onClick={() => switchTab('discover')}>Explore</button>
            <button onClick={() => switchTab('notes')}>Our story</button>
            <button onClick={() => setCredits(true)}>Photo credits</button>
            <button onClick={() => setForm(true)}>Share a place</button>
            <button onClick={() => setEntered(false)}>Portal Entrance</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 CityScout. Made with care for Mumbai. · {places.length} curated places. Sample data.</span>
          <button onClick={() => switchTab('admin')}>Curator desk</button>
        </div>
      </div>
    </footer>

    {/* Place Detail Dialog Modal */}
    {detail && (
      <div className="overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) closeDetail(); }}>
        <article className="dialog" role="dialog" aria-modal="true" aria-label={detail.name}>
          <button className="icon-button dialog-close" onClick={closeDetail} aria-label="Close place details"><X size={20}/></button>
          <div className="detail-hero">
            <img src={detail.image} alt={detail.name}/>
            <span className="eyebrow">{detail.area} · {detail.category}</span>
          </div>
          <div className="detail-body"><GemBadge place={detail} updates={updates} onExplain={()=>{setScoreInfo(detail);setDetail(null);}}/>{closed.has(detail.id)&&<p className="service-notice">A community report marks this place closed or restricted. Verify access before traveling.</p>}
            <div className="detail-title-row">
              <span className="preview-pill"><Info size={12}/> Curated place · sample data</span>
              <button className="icon-button" onClick={() => toggleSave(detail.id)} aria-label={saved.includes(detail.id) ? 'Remove saved place' : 'Save place'}>
                <Heart size={22} fill={saved.includes(detail.id) ? 'currentColor' : 'none'}/>
              </button>
            </div>
            <h2>{detail.name}</h2>
            <p className="detail-sub">{detail.subtitle}</p>
            <div className="detail-stats">
              <div className="detail-stat">
                <small>EST. SPEND FROM {anchor}</small>
                <strong>{money(estimate(detail,anchor,origin).low,estimate(detail,anchor,origin).high)}</strong>
              </div>
              <div className="detail-stat">
                <small>ROUND TRIP + VISIT</small>
                <strong>~{estimate(detail,anchor,origin).totalMin} min</strong>
              </div>
              <div className="detail-stat">
                <small>NEAREST STATION</small>
                <strong>{detail.station}</strong>
              </div>
            </div>
            <div className="detail-columns">
              <div>
                <h3>Why make the stop?</h3>
                <p>{detail.description}</p>
                <div className="local-tip">
                  <div className="eyebrow">A LITTLE LOCAL TIP</div>
                  <p>{detail.tip}</p>
                </div>
                <div className="practical-list">
                  <p><Clock3 size={15}/> Best time: {detail.best}</p>
                  <p><Navigation size={15}/> Approximately {detail.walk} minutes on foot from {detail.station} station; verify route before going.</p>
                  <p><Layers2 size={15}/> {detail.seating}</p>
                  <p><Info size={15}/> Accessibility: {detail.accessibility}</p>
                </div>
              </div>
              <div className="cost-panel">
                <h3>Make it a plan.</h3>
                <div className="cost-row"><span>Place spend, per person</span><strong>{money(detail.min,detail.max)}</strong></div>
                <div className="cost-row"><span>Estimated local transit</span><strong>~₹{estimate(detail,anchor,origin).travelCost}</strong></div>
                <div className="cost-row total"><span>Estimated total</span><strong>{money(estimate(detail,anchor,origin).low,estimate(detail,anchor,origin).high)}</strong></div>
                <p>Indicative only. Transport depends on route and fare; purchases and current prices may differ.</p>
              </div>
            </div>
            <div className="caution"><Info size={15}/><span>{detail.caveat}</span></div>
            <div className="detail-actions">
              <button className="button primary" disabled={closed.has(detail.id)} onClick={() => openPlan(detail)}>Build a mini-plan <ArrowRight size={14}/></button>
              <a className="button secondary" href={directions(detail,anchor === 'Near me' ? undefined : anchor)} target="_blank" rel="noopener noreferrer">Directions <ArrowUpRight size={14}/></a>
              <button className="button secondary" onClick={() => share(detail.name,`place=${detail.id}`)}>Share</button>
              <button className="button secondary" onClick={() => { setFormTopic('A local tip'); setFormPlace(detail.id); setForm(true); setDetail(null); }}>Report a change</button>
            </div>
            <div className="source-note">
              <a href={detail.source} target="_blank" rel="noopener noreferrer">Place reference</a><a href={detail.creditUrl} target="_blank" rel="noopener noreferrer">{detail.credit} · {detail.license}</a>
              <span>Coordinates: {detail.lat.toFixed(3)}, {detail.lng.toFixed(3)}</span>
            </div>
            {updates.filter(r => r.placeId === detail.id && r.topic !== 'Closed / restricted').length > 0 && (
              <div className="community-updates">
                <h3>Recently shared by the community</h3>
                {updates.filter(r => r.placeId === detail.id && r.topic !== 'Closed / restricted').map(r => (
                  <div className="update-item" key={r.id}>
                    <p>{r.note}</p>
                    <small>{r.topic} · {new Date(r.createdAt).toLocaleDateString('en-IN')} · community observation</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>
    )}

    {/* Plan Builder Modal */}
    {plan && planStats && (
      <div className="overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) closePlan(); }}>
        <article className="dialog" role="dialog" aria-modal="true" aria-label="Mini-plan">
          <button className="icon-button dialog-close" onClick={closePlan} aria-label="Close mini-plan"><X size={20}/></button>
          <div className="plan-header">
            <div className="eyebrow">A SMALL PLAN FOR A GOOD DAY</div>
            <h2>Your Mumbai mini-plan.</h2>
            <p>Starting from {anchor} · One or two thoughtful stops, your way.</p>
            <div className="plan-summary">
              <div><small>EST. TOTAL SPEND</small><strong>{money(planStats.low,planStats.high)}</strong></div>
              <div><small>EST. WHOLE TRIP</small><strong>~{Math.ceil(planStats.minutes/15)*15} min</strong></div>
            </div>
          </div>
          <div className="plan-body"><RailMap origin={origin} results={pair?[plan,pair]:[plan]} anchor={anchor} selected={plan} stops={pair?[plan,pair]:[plan]} onStation={name=>{setAnchor(name);setOrigin(undefined);history.replaceState(null,'',`?plan=${plan.id}${pair?','+pair.id:''}&from=${encodeURIComponent(name)}`);}} onSelect={openPlace} onOpen={openPlace}/>
            <div className="timeline-item"><span className="timeline-dot"/><h3>Leave from {anchor}</h3><p>Allow approximately {estimate(plan,anchor,origin).travelMin} minutes to your first stop. Check live service before departure.</p></div>
            <div className="timeline-item"><span className="timeline-dot"/><div className="timeline-card"><img src={plan.image} alt=""/><div><h3>{plan.name}</h3><p>{plan.area} · around {plan.duration} minutes here</p><button onClick={() => openPlace(plan)}>See place details</button></div></div></div>
            {pair && <div className="timeline-item"><span className="timeline-dot"/><div className="timeline-card"><img src={pair.image} alt=""/><div><h3>{pair.name}</h3><p>{pair.area} · around {pair.duration} minutes here</p><button onClick={() => openPlace(pair)}>See place details</button></div></div></div>}
            <div className="timeline-item"><span className="timeline-dot"/><h3>Head back with a story</h3><p>Return travel is included as an estimate; choose the route that suits you.</p></div>
            <div className="plan-option">
              <label htmlFor="pair">{pair ? 'Swap your second stop' : 'Have more time? Add a second stop'}</label>
              <select id="pair" value={pairId} onChange={e => { setPairId(e.target.value); history.replaceState(null,'',`?plan=${plan.id}${e.target.value ? ','+e.target.value : ''}&from=${encodeURIComponent(anchor)}`); }}>
                <option value="">One stop is enough</option>
                {places.filter(p => p.id !== plan.id && !closed.has(p.id)).sort((a,b) => distanceKm(a,plan) - distanceKm(b,plan)).map(p => <option key={p.id} value={p.id}>{p.name} · {p.area}</option>)}
              </select>
            </div>
            <div className="caution"><Info size={15}/><span>Cost and travel time are planning estimates based on suburban rail and walking.</span></div>
            <div className="detail-actions">
              <button className="button primary" disabled={closed.has(plan.id)&&!planIsSaved} onClick={savePlan}>{planIsSaved?'Remove saved plan':'Save this plan'} <Heart size={14}/></button>
              <button className="button secondary" onClick={() => share('My CityScout mini-plan',`plan=${plan.id}${pair ? ','+pair.id : ''}&from=${encodeURIComponent(portableAnchor)}`)}>Share plan <ArrowUpRight size={14}/></button>
              <a className="button secondary" href={directions(plan,anchor === 'Near me' ? undefined : anchor)} target="_blank" rel="noopener noreferrer">First stop directions <Navigation size={14}/></a>{pair&&<a className="button secondary" href={directions(plan,undefined,pair)} target="_blank" rel="noopener noreferrer">Next stop directions <Navigation size={14}/></a>}
            </div>
          </div>
        </article>
      </div>
    )}

    {/* Filter Dialog */}
    {filters && (
      <div className="overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setFilters(false); }}>
        <div className="dialog small form-dialog" role="dialog" aria-modal="true" aria-label="Discovery filters">
          <button className="icon-button dialog-close" onClick={() => setFilters(false)} aria-label="Close filters"><X size={20}/></button>
          <div className="eyebrow">MAKE IT YOUR KIND OF DAY</div>
          <h2>Fine-tune the shortlist.</h2>
          <div className="form-field">
            <label htmlFor="filter-budget">Maximum estimated spend</label>
            <select id="filter-budget" value={budget} onChange={e => setBudget(e.target.value)}>
              <option value="any">Any budget</option>
              <option value="100">Up to ₹100</option>
              <option value="150">Up to ₹150</option>
              <option value="250">Up to ₹250</option>
              <option value="400">Up to ₹400</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="filter-time">Time available, including travel</label>
            <select id="filter-time" value={hours} onChange={e => setHours(e.target.value)}>
              <option value="any">Any time</option>
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="5">Half a day</option>
            </select>
          </div>
          <label className="check-label">
            <input type="checkbox" checked={indoor} onChange={e => setIndoor(e.target.checked)}/> Indoor places only
          </label>
          <label className="check-label"><input type="checkbox" checked={hiddenOnly} onChange={e=>setHiddenOnly(e.target.checked)}/> Hidden gems only (Gem Score 55+)</label><div className="form-actions">
            <button className="button secondary" onClick={() => { setBudget('any'); setHours('any'); setIndoor(false); setHiddenOnly(false); }}>Clear filters</button>
            <button className="button primary" onClick={() => setFilters(false)}>Show {activePlaces.length} places <ArrowRight size={14}/></button>
          </div>
        </div>
      </div>
    )}

    {/* Auth Modal (if opened from header) */}
    {authModal && (
      <div className="overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setAuthModal(false); }}>
        <div className="dialog small" data-auth-surface="true" role="dialog" aria-modal="true">
          <button className="icon-button dialog-close" onClick={() => setAuthModal(false)} aria-label="Close authentication modal"><X size={20}/></button>
          <AuthCard 
            onLogin={handleLogin}
            onSignUp={handleSignUp}
            onGuest={handleEnterGuest}
          />
        </div>
      </div>
    )}

    {/* Community Contribution Dialog */}
    {form && (
      <Contribution initialPlace={formPlace} initialTopic={formTopic} onClose={() => setForm(false)} onSuccess={() => {showToast('Thanks — your note is waiting for review');if(queueLoaded)void loadQueue();}}/>
    )}

    {scoreInfo&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setScoreInfo(null);}}><section className="dialog small form-dialog" role="dialog" aria-modal="true" aria-label="Gem Score explained"><button className="icon-button dialog-close" aria-label="Close score explanation" onClick={()=>setScoreInfo(null)}><X/></button><div className="eyebrow">QUALITY OVER CROWD SIZE</div><h2>How Gem Score works.</h2><ScoreExplanation place={scoreInfo} updates={updates}/><button className="button primary" onClick={()=>{setFormTopic('Local verification');setFormPlace(scoreInfo.id);setForm(true);setScoreInfo(null);}}>Share a local verification</button></section></div>}
    {/* Photo Credits Dialog */}
    {credits && (
      <div className="overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setCredits(false); }}>
        <div className="dialog small form-dialog" role="dialog" aria-modal="true" aria-label="Photo credits">
          <button className="icon-button dialog-close" onClick={() => setCredits(false)} aria-label="Close credits"><X size={20}/></button>
          <div className="eyebrow">REAL MUMBAI, REAL PHOTOGRAPHS</div>
          <h2>Photo credits.</h2>
          <p>Photographers, image sources and licence information for the places in CityScout.</p>
          <div className="credits-grid">
            {places.map(p => (
              <div className="credit-item" key={p.id}>
                <img src={p.image} alt=""/>
                <div>
                  <a href={p.creditUrl} target="_blank" rel="noopener noreferrer"><strong>{p.name}</strong></a>
                  <p>{p.credit} · {p.license}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {toast && <div className="toast" role="status"><CheckCircle2 size={18}/>{toast}</div>}
  </>;
}

// -------------------------------------------------------------
// COMPONENT: AUTH & ENTRANCE CARD (Login / Sign Up / Guest)
// -------------------------------------------------------------
function AuthCard({ 
  onLogin, 
  onSignUp, 
  onGuest 
}: { 
  onLogin: (user: ExplorerUser) => void; 
  onSignUp: (user: ExplorerUser) => void; 
  onGuest: () => void; 
}) {
  const [tab, setTab] = useState<'signup' | 'signin'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [station, setStation] = useState('Bandra');
  const [vibe, setVibe] = useState('Wanderer');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [busy,setBusy] = useState(false);
  const authenticate = async (event:React.FormEvent,action:'signup'|'signin')=>{
    event.preventDefault();setError('');setBusy(true);
    try {const r=await fetch('/api/account',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action,name,email,password,station,vibe})});const data=await r.json() as {user:ExplorerUser;error?:string};if(!r.ok)throw new Error(data.error||'Sign-in failed. Please retry.');if(action==='signup')onSignUp(data.user);else onLogin(data.user);}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };

  return (
    <div className="auth-box">
      <div className="auth-tabs">
        <button 
          className={'auth-tab-btn ' + (tab === 'signup' ? 'active' : '')} 
          onClick={() => { setTab('signup'); setError(''); }}
        >
          <UserPlus size={14} style={{display:'inline', marginRight:4}}/> Create Account
        </button>
        <button 
          className={'auth-tab-btn ' + (tab === 'signin' ? 'active' : '')} 
          onClick={() => { setTab('signin'); setError(''); }}
        >
          <LogIn size={14} style={{display:'inline', marginRight:4}}/> Sign In
        </button>
      </div>

      {tab === 'signup' ? (
        <form onSubmit={e=>authenticate(e,'signup')}>
          <h2 className="auth-form-title">Join CityScout</h2>
          <p className="auth-form-desc">Create your city explorer profile to bookmark gems and wander.</p>
          
          <div className="auth-field">
            <label htmlFor="reg-name">Your Full Name</label>
            <input 
              id="reg-name" 
              type="text" 
              placeholder="e.g. Priya Sharma" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="reg-email">Email Address</label>
            <input 
              id="reg-email" 
              type="email" 
              placeholder="e.g. priya@gmail.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
            <div className="auth-field">
              <label htmlFor="reg-station">Home Station</label>
              <select id="reg-station" value={station} onChange={e => setStation(e.target.value)}>
                {anchors.map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
              </select>
            </div>
            
            <div className="auth-field">
              <label htmlFor="reg-vibe">Explorer Vibe</label>
              <select id="reg-vibe" value={vibe} onChange={e => setVibe(e.target.value)}>
                <option value="Wanderer">🧭 CityScout Wanderer</option>
                <option value="Coffee lover">☕ Coffee &amp; Snack</option>
                <option value="Heritage seeker">🏛️ Heritage Seeker</option>
                <option value="Sunset chaser">🌅 Sunset Chaser</option>
              </select>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="reg-pwd">Password</label>
            <input 
              id="reg-pwd" 
              type="password" 
              placeholder="At least 8 characters" minLength={8} maxLength={128} autoComplete="new-password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>

          {error && <p className="error-message" style={{margin:'10px 0', fontSize:'12px'}}>{error}</p>}

          <button className="auth-submit-btn" type="submit" disabled={busy}>
            Create Account &amp; Enter CityScout <ArrowRight size={15}/>
          </button>
        </form>
      ) : (
        <form onSubmit={e=>authenticate(e,'signin')}>
          <h2 className="auth-form-title">Welcome Back</h2>
          <p className="auth-form-desc">Sign in to resume your Mumbai discovery route.</p>

          <div className="auth-field">
            <label htmlFor="login-email">Email Address</label>
            <input 
              id="login-email" 
              type="email" 
              placeholder="Your email address" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-pwd">Password</label>
            <input 
              id="login-pwd" 
              type="password" 
              placeholder="Your password" autoComplete="current-password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>

          {error && <p className="error-message" style={{margin:'10px 0', fontSize:'12px'}}>{error}</p>}

          <button className="auth-submit-btn" type="submit" disabled={busy}>
            Sign In &amp; Enter CityScout <ArrowRight size={15}/>
          </button>

        </form>
      )}

      {/* Guest Explorer Option */}
      <div style={{marginTop:'18px', paddingTop:'16px', borderTop:'1px solid rgba(255,255,255,0.1)', textAlign:'center'}}>
        <button 
          onClick={onGuest} 
          style={{background:'none', color:'#c3d1b7', fontSize:'12px', textDecoration:'underline'}}
        >
          Or continue as a Guest Explorer without signing in →
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENT: PLACE CARD (Grid View)
// -------------------------------------------------------------
function PlaceCard({ place:p, anchor, origin, saved, onOpen, onSave, observations=[], onExplain }: { place: Place; anchor: string; origin?: {lat:number;lng:number}; saved:boolean; onOpen:()=>void; onSave:()=>void; observations?:Report[]; onExplain?:(p:Place)=>void }) {
  const e = estimate(p,anchor,origin);
  const moodBadgeClass = 'mood-badge-' + p.category.toLowerCase().replace(/[^a-z]/g, '-');
  return (
    <article className="place-card">
      <div className="card-image">
        <button className="card-photo-button" onClick={onOpen} aria-label={`Open ${p.name}`}>
          <img src={p.image} alt={p.name} loading="lazy"/>
        </button>
        <button 
          className={'save-button '+(saved?'saved':'')} 
          onClick={onSave} 
          aria-label={saved ? `Remove ${p.name} from saved` : `Save ${p.name}`}
        >
          <Heart size={16} fill={saved?'currentColor':'none'}/>
        </button>
        <span className="card-tag"><MapPin size={11}/>{p.area}</span>
      </div>
      <GemBadge place={p} updates={observations} onExplain={()=>onExplain?.(p)}/><div className="card-topline">
        <span className={'category-pill ' + moodBadgeClass}>{p.category}</span>
        <ArrowUpRight size={14}/>
      </div>
      <h3 className="card-title">
        <button onClick={onOpen}>{p.name}</button>
      </h3>
      <p className="card-subtitle">{p.subtitle}</p>
      <div className="card-facts">
        <strong style={{color:'var(--green)', fontSize:'13px'}}>{money(e.low,e.high)} est.</strong>
        <i/>
        <span>~{e.totalMin} min incl. visit</span>
      </div>
      <div className="card-footer">
        <Info size={12}/>{p.best}
      </div>
    </article>
  );
}

// -------------------------------------------------------------
// COMPONENT: COMMUNITY CONTRIBUTION FORM
// -------------------------------------------------------------
function Contribution({ initialPlace, initialTopic, onClose, onSuccess }: { initialPlace:string; initialTopic:string; onClose:()=>void; onSuccess:()=>void }) {
  const [placeId,setPlaceId] = useState(initialPlace);
  const [newName,setNewName] = useState('');
  const [topic,setTopic] = useState(initialPlace?initialTopic:'New place suggestion');
  const [note,setNote] = useState('');
  const [visited,setVisited] = useState(false);
  const [sending,setSending] = useState(false);
  const [done,setDone] = useState(false);
  const [error,setError] = useState('');
  
  const submit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    setError(''); 
    if(topic==='Local verification'&&!placeId)return setError('Select a listed place to verify.');
    if (note.trim().length < 15) return setError('Please add at least 15 characters of useful detail.'); 
    if (!placeId && newName.trim().length < 3) return setError('Add the place name.'); 
    if (!visited) return setError('Please confirm this is from your own recent experience.'); 
    setSending(true); 
    try { 
      const res = await fetch('/api/contributions', { 
        method:'POST', 
        headers:{'content-type':'application/json'}, 
        body:JSON.stringify({ 
          placeId: placeId || null, 
          placeName: placeId ? places.find(p=>p.id===placeId)?.name : newName.trim(), 
          topic, 
          note:note.trim() 
        }) 
      }); 
      if (!res.ok) { 
        const data = await res.json().catch(()=>({})) as {error?:string}; 
        throw new Error(data.error || 'Could not save your note. Try again.'); 
      } 
      setDone(true); 
      onSuccess(); 
    } catch(e) { 
      setError((e as Error).message); 
    } finally { 
      setSending(false); 
    } 
  };

  return (
    <div className="overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog small form-dialog" role="dialog" aria-modal="true" aria-label="Share a local tip">
        <button className="icon-button dialog-close" onClick={onClose} aria-label="Close contribution"><X size={20}/></button>
        {done ? (
          <div className="success-panel">
            <CheckCircle2 size={46}/>
            <h3>Thanks for looking out.</h3>
            <p>Your field note is saved for a curator to review. Helpful, specific updates make CityScout worth using.</p>
            <button className="button primary" onClick={onClose}>Back to the city <ArrowRight size={14}/></button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="eyebrow">YOUR CITY KNOWS BEST</div>
            <h2>Share what you found.</h2>
            <p>Suggest a place or correct a detail. We review notes before they appear publicly.</p>
            <div className="form-field">
              <label htmlFor="con-place">Which place?</label>
              <select id="con-place" value={placeId} onChange={e=>{setPlaceId(e.target.value);setTopic(e.target.value?'A local tip':'New place suggestion');}}>
                <option value="">A place that’s not listed yet</option>
                {places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {!placeId && (
              <div className="form-field">
                <label htmlFor="con-name">Place name</label>
                <input id="con-name" value={newName} onChange={e => setNewName(e.target.value)} maxLength={90} placeholder="What’s it called?"/>
              </div>
            )}
            <div className="form-field">
              <label htmlFor="con-topic">What should we know?</label>
              <select id="con-topic" value={topic} onChange={e => setTopic(e.target.value)}>
                <option>Price / minimum spend</option>
                <option>Opening hours</option>
                <option>Seating / quietness</option>
                <option>Entrance / accessibility</option>
                <option>Closed / restricted</option>
                <option>A local tip</option>
                <option>New place suggestion</option><option>Local verification</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="con-note">The useful detail</label>
              <textarea id="con-note" value={note} onChange={e => setNote(e.target.value)} minLength={15} maxLength={600} placeholder="What changed? When did you go? What would help someone decide?"/>
            </div>
            <label className="check-label">
              <input type="checkbox" checked={visited} onChange={e => setVisited(e.target.checked)}/> 
              This note is based on my own recent visit or direct knowledge.
            </label>
            {topic==='Local verification'&&<p className="form-helper">Describe what you personally checked and when. Only approved verification notes affect Gem Score; one active verification per browser session and place.</p>}<p className="form-helper">Please avoid private information, unverified claims and photos of people without permission. Submissions may be edited for clarity before publication.</p>
            {error && <p className="error-message" role="alert">{error}</p>}
            <div className="form-actions">
              <button type="button" className="button secondary" onClick={onClose}>Cancel</button>
              <button className="button primary" type="submit" disabled={sending}>
                {sending ? 'Sending…' : 'Send for review'} <ArrowRight size={14}/>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function GemBadge({place,updates,onExplain}:{place:Place;updates:Report[];onExplain:()=>void}) {
  const signal=gemScore(place,updates);
  return <button className={'gem-score '+(signal.hidden?'hidden-gem':'')} onClick={onExplain} aria-label={`Explain Gem Score ${signal.score} for ${place.name}`}><Sparkles size={15}/><strong>Gem Score {signal.score}</strong><span>{signal.hidden?'Hidden gem':'Sample signals'}</span>{signal.localVerifications>0&&<span>+{signal.localVerifications} approved verification{signal.localVerifications===1?'':'s'}</span>}</button>;
}
function ScoreExplanation({place,updates}:{place:Place;updates:Report[]}) {
  const signal=gemScore(place,updates);
  return <div className="score-explanation"><h3>{place.name}</h3><p className="score-number">{signal.score}<small>/100</small></p><p><strong>Gem Score = rating × 20 × (1 − crowd penalty) × verification boost.</strong> Scores of 55+ qualify for the hidden-gem filter.</p><dl><div><dt>Sample rating</dt><dd>{signal.rating.toFixed(1)} / 5</dd></div><div><dt>Sample review count</dt><dd>{signal.reviews.toLocaleString()}</dd></div><div><dt>Crowd penalty</dt><dd>{(signal.crowdPenalty*100).toFixed(1)}%</dd></div><div><dt>Sample verification signals</dt><dd>{signal.sampleVerifications}</dd></div><div><dt>Approved community verifications</dt><dd>{signal.localVerifications}</dd></div><div><dt>Combined boost (maximum 20%)</dt><dd>×{signal.boost.toFixed(3)}</dd></div></dl><p>Popularity penalty = min(0.55, 0.30 + 0.25 × log10(reviews) / log10(2400)). Three verification signals reach the maximum boost. Ratings, counts and seeded verification signals are illustrative, not live Google reviews. Approved “Local verification” notes are separate community observations. Approval or rejection recalculates scores.</p></div>;
}
