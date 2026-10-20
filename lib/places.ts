import { morePlaces } from './more-places';
import { stations, railRoute } from './rail';
export type Mood = 'All' | 'Eat cheap' | 'Slow down' | 'Wander' | 'Art & culture' | 'Catch a view';

export type Place = {
  id: string;
  name: string;
  area: string;
  station: string;
  category: Mood;
  subtitle: string;
  description: string;
  tip: string;
  caveat: string;
  image: string;
  credit: string;
  creditUrl: string;
  license: string;
  lat: number;
  lng: number;
  min: number;
  max: number;
  duration: number;
  walk: number;
  best: string;
  indoor: boolean;
  tags: string[];
  accessibility: string;
  source: string;
  seating: string;
  pair: string;
};

export const anchors = [...stations,
  { name: 'Powai', lat: 19.119, lng: 72.906 },
];

export const moods: Mood[] = ['All', 'Eat cheap', 'Slow down', 'Wander', 'Art & culture', 'Catch a view'];

export const places: Place[] = [
  ...morePlaces,
  // --- EAT CHEAP ---
  {
    id: 'madras',
    name: 'Filter Coffee at Café Madras',
    area: 'Matunga',
    station: 'Matunga',
    category: 'Eat cheap',
    subtitle: 'Steaming degree coffee and crispy butter podi dosas.',
    description: 'A neighborhood institution since 1940. Fast-moving steel tumblers, fragrant chicory filter coffee, and fluffy idlis. Keep the plan unhurried: grab breakfast and wander through the flower lanes of Matunga.',
    tip: 'Visit between 8 AM and 10 AM or after 3 PM to avoid the long waiting queues. Try the Pineapple Sheera.',
    caveat: 'Cash/UPI accepted. Closed on Mondays.',
    image: '/images/madras.webp',
    credit: 'Cafe Madras',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Cafe_Madras_Entrance.jpg',
    license: 'CC BY-SA 3.0',
    lat: 19.027,
    lng: 72.855,
    min: 70,
    max: 180,
    duration: 45,
    walk: 6,
    best: 'Morning breakfast or 4 PM filter coffee',
    indoor: true,
    tags: ['Filter coffee', 'South Indian', 'Iconic Breakfast'],
    accessibility: 'Ground floor entry with 1 small step.',
    source: 'https://commons.wikimedia.org/wiki/File:Cafe_Madras_Entrance.jpg',
    seating: 'Traditional shared wooden dining tables.',
    pair: 'ashok-vada'
  },
  {
    id: 'ashok-vada',
    name: 'Ashok Vada Pav (Kirti College)',
    area: 'Prabhadevi',
    station: 'Dadar',
    category: 'Eat cheap',
    subtitle: 'The golden crispy chura vada pav benchmark of Mumbai.',
    description: 'Standing for over 35 years near Kirti College, Ashok Vada Pav is revered for its secret blend of forty herbs and spices, hot piping batata vada, and mountains of crunchy besan choora with zesty garlic chutney.',
    tip: 'Ask for extra "choora" (crispy batter crumbs) in your pav. Perfect with a hot cutting chai nearby.',
    caveat: 'Expect a bustling crowd in the evening; eat standing by the stall.',
    image: '/images/ashok-vada.jpg',
    credit: 'ApnaShehar Mumbai Archives',
    creditUrl: 'https://en.wikipedia.org/wiki/Vada_pav',
    license: 'Editorial',
    lat: 19.019,
    lng: 72.833,
    min: 25,
    max: 60,
    duration: 30,
    walk: 10,
    best: 'Mid-afternoon 3 PM to 6 PM',
    indoor: false,
    tags: ['Street Food', 'Vada Pav', 'Pocket-Friendly'],
    accessibility: 'Street side pavement stall, step-free access.',
    source: 'https://en.wikipedia.org/wiki/Vada_pav',
    seating: 'Street standing stall.',
    pair: 'dadar-flower'
  },
  {
    id: 'kyani-cafe',
    name: 'Kyani & Co. Bakery & Chai',
    area: 'Marine Lines',
    station: 'Churchgate',
    category: 'Eat cheap',
    subtitle: 'Brun maska, mawa cakes, and vintage Irani charm since 1904.',
    description: 'One of the oldest surviving Irani cafes in Bombay. Beneath high wooden ceilings, vintage mirrors, and whirring ceiling fans, sip sweet Irani chai with warm butter-soaked crusty bun maska or fresh mawa cakes.',
    tip: 'Dip the crusty bun maska deep into hot Irani chai. Take a pack of khari biscuits and wine biscuits home.',
    caveat: 'Historic venue; vintage seating can be snug during lunch hours.',
    image: '/images/kyani-cafe.jpg',
    credit: 'ApnaShehar Heritage Collection',
    creditUrl: 'https://en.wikipedia.org/wiki/Irani_caf%C3%A9',
    license: 'Editorial',
    lat: 18.941,
    lng: 72.827,
    min: 50,
    max: 150,
    duration: 50,
    walk: 5,
    best: 'Morning tea or quiet 4 PM snack',
    indoor: true,
    tags: ['Irani Cafe', 'Vintage Bombay', 'Bun Maska'],
    accessibility: 'Ground level entrance with wide doorway.',
    source: 'https://en.wikipedia.org/wiki/Irani_caf%C3%A9',
    seating: 'Classic bentwood chairs with marble top tables.',
    pair: 'kitab'
  },

  // --- SLOW DOWN ---
  {
    id: 'banganga',
    name: 'A pause at Banganga Tank',
    area: 'Walkeshwar',
    station: 'Charni Road',
    category: 'Slow down',
    subtitle: 'Ancient stone steps, freshwater springs, and peaceful bells.',
    description: 'A sacred 12th-century stone water tank surrounded by historic temple precincts, resting ducks, and peaceful steps. As the city hums beyond the ridge, Banganga offers an authentic timeless serenity.',
    tip: 'Remove footwear before descending closer to the water. Sit peacefully on the upper shaded steps.',
    caveat: 'Active religious precinct. Dress respectfully; do not swim or disturb ceremonies.',
    image: '/images/banganga.webp',
    credit: 'Oknitop',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Bangangatank.jpg',
    license: 'CC BY-SA 3.0',
    lat: 18.946,
    lng: 72.794,
    min: 0,
    max: 20,
    duration: 60,
    walk: 18,
    best: 'Early morning or gentle late afternoon',
    indoor: false,
    tags: ['Sacred Tank', 'Quiet Sanctuary', 'Ancient Heritage'],
    accessibility: 'Stone steps around the perimeter.',
    source: 'https://en.wikipedia.org/wiki/Banganga_Tank',
    seating: 'Wide stone ghat steps.',
    pair: 'khotachiwadi'
  },
  {
    id: 'kitab',
    name: 'Get lost at Kitab Khana',
    area: 'Fort',
    station: 'CSMT',
    category: 'Slow down',
    subtitle: 'Lofty wooden bookshelves, quiet nooks, and a good chapter.',
    description: 'Housed within the 160-year-old Somaiya Bhavan, Kitab Khana is an independent book lover’s paradise with teakwood interiors, warm incandescent reading lights, and curated Indian and world literature.',
    tip: 'Explore the regional literature section and ask the passionate book curators for recommendations.',
    caveat: 'A quiet book sanctuary; keep phones on silent.',
    image: '/images/kitab.webp',
    credit: 'Trace',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Kitab_Khana_Bookshop_Mumbai_-_inner_view_right.jpg',
    license: 'CC BY-SA 4.0',
    lat: 18.932,
    lng: 72.831,
    min: 0,
    max: 120,
    duration: 60,
    walk: 8,
    best: 'Unrushed weekday afternoon',
    indoor: true,
    tags: ['Bookstore', 'Quiet Reading', 'Heritage Teak'],
    accessibility: 'Step-free entrance and ground floor shelving.',
    source: 'https://en.wikipedia.org/wiki/Kitab_Khana',
    seating: 'Plush armchairs and reading benches.',
    pair: 'david-sassoon'
  },
  {
    id: 'david-sassoon',
    name: 'David Sassoon Garden & Reading Hall',
    area: 'Kala Ghoda',
    station: 'Churchgate',
    category: 'Slow down',
    subtitle: 'Venetian Gothic arches and leafy garden quiet in South Mumbai.',
    description: 'Built in 1870 from yellow Malad stone, this restored Victorian Gothic library features an arched verandah overlooking a lush, quiet garden courtyard away from Kala Ghoda traffic.',
    tip: 'Sit on the shady garden benches under the heritage palm trees for a calming reading hour.',
    caveat: 'Main indoor reading halls require library membership; garden and lobby are accessible.',
    image: '/images/david-sassoon.jpg',
    credit: 'ApnaShehar Heritage Vault',
    creditUrl: 'https://en.wikipedia.org/wiki/David_Sassoon_Library',
    license: 'Editorial',
    lat: 18.929,
    lng: 72.832,
    min: 0,
    max: 30,
    duration: 60,
    walk: 10,
    best: 'Late afternoon breeze 3 PM to 5 PM',
    indoor: false,
    tags: ['Gothic Library', 'Garden Courtyard', 'Heritage Quiet'],
    accessibility: 'Ground level garden and paved walkways.',
    source: 'https://en.wikipedia.org/wiki/David_Sassoon_Library',
    seating: 'Garden benches and shaded arcade.',
    pair: 'kala-ghoda'
  },

  // --- WANDER ---
  {
    id: 'khotachiwadi',
    name: 'Khotachiwadi Heritage Lanes',
    area: 'Girgaon',
    station: 'Charni Road',
    category: 'Wander',
    subtitle: 'Timber balconies, pastel cottages, and village stillness.',
    description: 'An idyllic 19th-century East Indian heritage hamlet tucked behind the bustling markets of Girgaon. Pastel cottages, carved wooden verandahs, and peaceful winding lanes preserve old Bombay.',
    tip: 'Keep your voice gentle and walk slowly. Support local home bakers and resident artists.',
    caveat: 'Active residential neighborhood. Respect private homes and porches.',
    image: '/images/khotachiwadi.webp',
    credit: 'Ingo Mehling',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Khotachiwadi_-_Street.jpg',
    license: 'CC BY-SA 4.0',
    lat: 18.956,
    lng: 72.822,
    min: 0,
    max: 0,
    duration: 50,
    walk: 8,
    best: 'Morning light 8 AM to 11 AM',
    indoor: false,
    tags: ['Heritage Alleyways', 'Architecture', 'Hidden Village'],
    accessibility: 'Paved pedestrian lanes with minor uneven stones.',
    source: 'https://en.wikipedia.org/wiki/Khotachiwadi',
    seating: 'Public stone ledges.',
    pair: 'banganga'
  },
  {
    id: 'ranwar-village',
    name: 'Ranwar Village & Graffiti Lanes',
    area: 'Bandra West',
    station: 'Bandra',
    category: 'Wander',
    subtitle: '300-year-old Portuguese village lanes and open-air murals.',
    description: 'A 1716 East Indian village in the heart of suburban Bandra. Wander through narrow cross-lanes bordered by wooden porches, crucifix shrines, flowering bougainvillea, and striking street art murals.',
    tip: 'Wander from Chapel Road into Ranwar square, then stop by a local bakery for fresh pav or gutli.',
    caveat: 'Narrow shared alleys; watch out for occasional delivery scooters.',
    image: '/images/ranwar-village.jpg',
    credit: 'ApnaShehar Urban Walkways',
    creditUrl: 'https://en.wikipedia.org/wiki/Ranwar',
    license: 'Editorial',
    lat: 19.054,
    lng: 72.834,
    min: 0,
    max: 50,
    duration: 60,
    walk: 12,
    best: 'Late afternoon daylight',
    indoor: false,
    tags: ['Bandra Alleys', 'Street Murals', 'Heritage Hamlet'],
    accessibility: 'Flat pedestrian alleyways.',
    source: 'https://en.wikipedia.org/wiki/Ranwar',
    seating: 'Village square benches.',
    pair: 'bandra-fort'
  },
  {
    id: 'dadar-flower',
    name: 'Dadar Flower Market (Phool Galli)',
    area: 'Dadar West',
    station: 'Dadar',
    category: 'Wander',
    subtitle: 'A sensory dawn kaleidoscope of marigolds and fresh roses.',
    description: 'Before the city wakes, Mumbai’s largest wholesale floral market transforms into an extraordinary spectacle of color and scent. Baskets overflowing with fiery orange marigolds, mogra, orchids, and tuberoses.',
    tip: 'Reach by 6 AM to 8 AM for the peak market energy and soft morning rays.',
    caveat: 'Busy, fast-paced commercial market floor. Wear sturdy walking shoes.',
    image: '/images/dadar-flower.jpg',
    credit: 'ApnaShehar Sensory Trails',
    creditUrl: 'https://en.wikipedia.org/wiki/Dadar',
    license: 'Editorial',
    lat: 19.021,
    lng: 72.842,
    min: 0,
    max: 50,
    duration: 45,
    walk: 3,
    best: 'Early morning 5:30 AM to 8:30 AM',
    indoor: false,
    tags: ['Flower Market', 'Sensory Dawn', 'Local Life'],
    accessibility: 'Covered and open stalls; wet floor areas.',
    source: 'https://en.wikipedia.org/wiki/Dadar',
    seating: 'No seating; walking market.',
    pair: 'ashok-vada'
  },

  // --- ART & CULTURE ---
  {
    id: 'kala-ghoda',
    name: 'The Kala Ghoda Art Precinct',
    area: 'Fort',
    station: 'Churchgate',
    category: 'Art & culture',
    subtitle: 'Gothic facades, street art, and free-spirited galleries.',
    description: 'Mumbai’s premier arts and design district. Stroll between neo-classical buildings, blue-stone sidewalks, outdoor artist showcases, and contemporary public exhibition spaces.',
    tip: 'Most art galleries around Ropewalk Lane offer free public entry. Check out Jehangir Art Gallery nearby.',
    caveat: 'Most indoor galleries are closed on Sundays.',
    image: '/images/kala-ghoda.webp',
    credit: 'Pradeep717',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Kala_Ghoda_Statue.jpg',
    license: 'CC BY-SA 4.0',
    lat: 18.928,
    lng: 72.831,
    min: 0,
    max: 0,
    duration: 60,
    walk: 10,
    best: 'Tuesday to Saturday afternoon',
    indoor: false,
    tags: ['Art District', 'Galleries', 'Colonial Facades'],
    accessibility: 'Paved pavements with curb ramps.',
    source: 'https://en.wikipedia.org/wiki/Kala_Ghoda',
    seating: 'Art district stone benches.',
    pair: 'david-sassoon'
  },
  {
    id: 'bhau-daji',
    name: 'Dr. Bhau Daji Lad City Museum',
    area: 'Byculla',
    station: 'Byculla',
    category: 'Art & culture',
    subtitle: 'Mumbai’s oldest museum with Victorian gold-leaf stencils.',
    description: 'Established in 1872, this magnificent Palladian Renaissance museum showcases the history of Bombay’s communities, maps, early photography, and dioramas beneath a mint-green and gold-leaf vaulted ceiling.',
    tip: 'Take time to examine the miniature dioramas of 19th-century Mumbai crafts and costumes on the upper mezzanine.',
    caveat: 'Closed on Wednesdays and select public holidays.',
    image: '/images/bhau-daji.webp',
    credit: 'Sailko',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Dr._Bhau_Daji_Lad_Museum,_esterno_01.jpg',
    license: 'CC BY 3.0',
    lat: 18.979,
    lng: 72.835,
    min: 10,
    max: 50,
    duration: 90,
    walk: 8,
    best: 'Morning or quiet mid-afternoon',
    indoor: true,
    tags: ['Heritage Museum', 'Victorian Architecture', 'Bombay History'],
    accessibility: 'Ramp access at museum entrance and elevator to upper floor.',
    source: 'https://www.bdlmuseum.org/',
    seating: 'Benches in gallery halls and botanical garden plaza.',
    pair: 'kumbharwada'
  },
  {
    id: 'kumbharwada',
    name: 'Kumbharwada Artisan Potters',
    area: 'Dharavi / Sion',
    station: 'Dadar',
    category: 'Art & culture',
    subtitle: 'Generations of master potters shaping clay in open courtyards.',
    description: 'A 150-year-old settlement where centuries-old ceramic traditions thrive. Courtyards lined with red clay pots, terracotta matkas, and ornate lamps baked in traditional brick kilns.',
    tip: 'Always ask politely before photographing artisans at their wheels. Buy a handmade clay cup or diya.',
    caveat: 'Active craft workspace; watch out for hot kiln areas.',
    image: '/images/kumbharwada.jpg',
    credit: 'ApnaShehar Crafts Archive',
    creditUrl: 'https://en.wikipedia.org/wiki/Dharavi',
    license: 'Editorial',
    lat: 19.041,
    lng: 72.855,
    min: 0,
    max: 50,
    duration: 50,
    walk: 10,
    best: 'Morning light 9 AM to 12 PM',
    indoor: false,
    tags: ['Pottery', 'Living Craft', 'Terracotta Art'],
    accessibility: 'Narrow courtyard pathways.',
    source: 'https://en.wikipedia.org/wiki/Dharavi',
    seating: 'Artisan workshop stools upon request.',
    pair: 'bhau-daji'
  },

  // --- CATCH A VIEW ---
  {
    id: 'bandra-fort',
    name: 'Bandra Fort (Castella de Aguada)',
    area: 'Bandra Land’s End',
    station: 'Bandra',
    category: 'Catch a view',
    subtitle: 'Portuguese stone bastions, crashing waves, and the Sea Link horizon.',
    description: 'Perched at Land’s End since 1640, this coastal stone fortification commands sweeping panoramic vistas of the Arabian Sea and the graceful arcs of the Bandra-Worli Sea Link.',
    tip: 'Arrive 45 minutes before sunset. Sit along the stone ramparts and feel the cool ocean spray.',
    caveat: 'Rocks past the seawall are slippery and dangerous during high tide; stay inside the fort.',
    image: '/images/bandra-fort.jpg',
    credit: 'ApnaShehar Coastal Archives',
    creditUrl: 'https://en.wikipedia.org/wiki/Castella_de_Aguada',
    license: 'Editorial',
    lat: 19.041,
    lng: 72.818,
    min: 0,
    max: 0,
    duration: 60,
    walk: 20,
    best: 'Sunset golden hour 5:30 PM to 6:45 PM',
    indoor: false,
    tags: ['Sea Link View', 'Sunset Horizon', 'Portuguese Fort'],
    accessibility: 'Paved garden ramp to the lower fort tier.',
    source: 'https://en.wikipedia.org/wiki/Castella_de_Aguada',
    seating: 'Amphitheatre stone steps and sea-facing benches.',
    pair: 'ranwar-village'
  },
  {
    id: 'worli-seaface',
    name: 'Worli Sea Face Promenade',
    area: 'Worli',
    station: 'Dadar',
    category: 'Catch a view',
    subtitle: 'Rumbling Arabian Sea waves, sea spray, and skyline silhouettes.',
    description: 'A sweeping curved coastal promenade beloved by Mumbai residents. Wide open horizons, cooling ocean winds, and dramatic sunset colors reflecting over the water and distant skyline.',
    tip: 'Grab a roasted corn bhutta seasoned with lime and chili powder from a promenade vendor.',
    caveat: 'During monsoon high tide, massive waves crash over the sea wall; maintain safe distance.',
    image: '/images/worli-seaface.jpg',
    credit: 'ApnaShehar Coastal Vistas',
    creditUrl: 'https://en.wikipedia.org/wiki/Worli_Sea_Face',
    license: 'Editorial',
    lat: 19.012,
    lng: 72.815,
    min: 0,
    max: 40,
    duration: 50,
    walk: 15,
    best: 'Breezy evening 5 PM to 8 PM',
    indoor: false,
    tags: ['Ocean Promenade', 'Sea Breeze', 'Skyline View'],
    accessibility: 'Flat, wide, step-free promenade with continuous ramps.',
    source: 'https://en.wikipedia.org/wiki/Worli_Sea_Face',
    seating: 'Continuous granite promenade seating ledge.',
    pair: 'ashok-vada'
  },
  {
    id: 'gilbert',
    name: 'Gilbert Hill Volcanic Monolith',
    area: 'Andheri West',
    station: 'Andheri',
    category: 'Catch a view',
    subtitle: 'A 66-million-year-old basalt wonder rising above the suburbs.',
    description: 'A colossal 200-foot vertical column of black basalt rock dating back to the Mesozoic era, formed by ancient volcanic activity. Ascend the carved steps to reach a tranquil hilltop temple overlooking suburban Mumbai.',
    tip: 'Climb during clear daylight hours. The panoramic 360-degree view of Andheri and the western coast is striking.',
    caveat: 'Steep stone staircase (around 180 steps); unsuitable for strollers or wheelchairs.',
    image: '/images/gilbert.webp',
    credit: 'Oknitop',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Gilbert_Hill.jpg',
    license: 'CC BY-SA 3.0',
    lat: 19.119,
    lng: 72.84,
    min: 0,
    max: 0,
    duration: 50,
    walk: 12,
    best: 'Early morning or clear dry evening',
    indoor: false,
    tags: ['Prehistoric Basalt', 'Hilltop View', 'Geology'],
    accessibility: 'Steep flight of stone stairs.',
    source: 'https://en.wikipedia.org/wiki/Gilbert_Hill',
    seating: 'Temple pavilion seating on the plateau.',
    pair: 'powai'
  },
  {
    id: 'powai',
    name: 'Powai Lake Lakeside Promenade',
    area: 'Powai',
    station: 'Kanjurmarg',
    category: 'Catch a view',
    subtitle: 'Calm water mirrors, open horizon, and evening skies.',
    description: 'An expansive peaceful lake fringed by hills, gardens, and flowering pink water lilies. A refreshing sanctuary in the eastern suburbs for evening breezes and horizon gazing.',
    tip: 'Walk along the promenade near the heritage pump house for the clearest, uncrowded water vistas.',
    caveat: 'Stay on the paved walkway; do not enter the water or muddy embankments.',
    image: '/images/powai.webp',
    credit: 'Packerworld',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Powai_Lake_Summer.JPG',
    license: 'CC BY-SA 3.0',
    lat: 19.128,
    lng: 72.904,
    min: 0,
    max: 0,
    duration: 45,
    walk: 15,
    best: 'Golden hour 5 PM to 7 PM',
    indoor: false,
    tags: ['Lakeside', 'Open Horizon', 'Fresh Breeze'],
    accessibility: 'Flat paved promenade along the lake front.',
    source: 'https://en.wikipedia.org/wiki/Powai_Lake',
    seating: 'Lakeside park benches.',
    pair: 'gilbert'
  }
];

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Realistic Mumbai Suburban transit calculation (suburban local train return ticket: ₹10 to ₹35)
export function estimate(place: Place, anchor: string, origin?: { lat: number; lng: number }) {
  const start = (anchor === 'Near me' ? origin : undefined) ?? anchors.find(a => a.name === anchor) ?? anchors[0];
  const km = distanceKm(start, place);
  
  // Real transit fare: ₹10 for local, ₹15 for medium, ₹25-₹35 for cross-city
  const travelCost = (km < 3 ? 10 : km < 10 ? 15 : km < 20 ? 25 : 35) + (place.id === 'karnala' ? 120 : 0);
  const rail = railRoute(anchor === 'Powai' ? 'Kanjurmarg' : anchor,place.station);
  const travelMin = km < 2 ? Math.ceil(km * 12) : rail ? Math.ceil(rail.minutes + 8 + place.walk + (anchor === 'Powai' ? 20 : 0) + (place.id === 'karnala' ? 40 : 0)) : Math.ceil(10 + km * 2.2 + place.walk);

  return {
    km,
    travelMin,
    travelCost,
    totalMin: place.duration + travelMin * 2,
    low: place.min + travelCost,
    high: place.max + travelCost
  };
}

export function money(min: number, max: number) {
  if (min === max) {
    return min === 0 ? 'Free entry' : `₹${min}`;
  }
  return min === 0 ? `Free – ₹${max}` : `₹${min}–${max}`;
}

export function directions(place: Place, anchor?: string, second?: Place) {
  const destination = second ?? place;
  const params = new URLSearchParams({ api: '1', destination: `${destination.lat},${destination.lng}`, travelmode: 'transit' });
  if(second) params.set('origin', `${place.lat},${place.lng}`);
  else if (anchor && anchor !== 'Near me') params.set('origin', `${anchor} Station, Mumbai`);
  return `https://www.google.com/maps/dir/?${params}`;
}
