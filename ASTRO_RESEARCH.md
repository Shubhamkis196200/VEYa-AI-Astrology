# ASTRO RESEARCH — Birth Chart, Moon Phase, Transits (React Native)

> Sources: npm registry JSON, GitHub API/README. Dates/stars/downloads reflect snapshots retrieved **2026‑02‑14** (UTC).

---

## ✅ Recommended Library (Best Fit)

### **Option A (Best Accuracy & Feature‑Complete): `react-native-swisseph` (Swiss Ephemeris)**
- **Install**: `npm install react-native-swisseph@0.1` (RN 0.76+ / New Architecture)
- **Why**: Only option with **full houses + ascendant** via Swiss Ephemeris API. Highest accuracy, supports sidereal/ayanamsa, house systems, etc.
- **Trade‑off**: Requires **native module** (C/C++) and iOS/Android build steps. Not pure JS.

### **Option B (Pure JS fallback): `astronomy-engine` + custom house/ASC math**
- **Install**: `npm install astronomy-engine`
- **Why**: Pure JS, accurate (~±1 arcminute), works in RN, has moon phases + planet positions.
- **Trade‑off**: No built‑in **houses/ascendant** — must compute house cusps and ASC yourself.

---

## 1) Natal Chart Code Example

### A) **React Native + Swiss Ephemeris (Recommended)**
```ts
import * as swe from 'react-native-swisseph';

const SIGNS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];

const toSign = (lon: number) => {
  const norm = ((lon % 360) + 360) % 360;
  return SIGNS[Math.floor(norm / 30)];
};

export function calcNatalChart(params: {
  year: number; month: number; day: number;
  hour: number; minute: number; second: number;
  lat: number; lon: number; altitude?: number;
}) {
  const { year, month, day, hour, minute, second, lat, lon, altitude = 0 } = params;

  // Convert UTC -> Julian day
  const { tjdUt } = swe.sweUtcToJd(
    year, month, day, hour, minute, second,
    swe.SE_GREG_CAL
  );

  // Set observer location (topocentric)
  swe.sweSetTopo(lon, lat, altitude);

  // Calculate houses (Placidus example: 'P')
  const houses = swe.sweHouses(tjdUt, 0, lat, lon, 'P');
  const ascendant = houses.ascmc[0];   // Ascendant
  const mc = houses.ascmc[1];          // Midheaven

  // Planet positions (ecliptic longitude)
  const flag = swe.SEFLG_SWIEPH; // or SEFLG_MOSEPH for no data files
  const planets = [
    { name: 'Sun', id: swe.SE_SUN },
    { name: 'Moon', id: swe.SE_MOON },
    { name: 'Mercury', id: swe.SE_MERCURY },
    { name: 'Venus', id: swe.SE_VENUS },
    { name: 'Mars', id: swe.SE_MARS },
    { name: 'Jupiter', id: swe.SE_JUPITER },
    { name: 'Saturn', id: swe.SE_SATURN },
    { name: 'Uranus', id: swe.SE_URANUS },
    { name: 'Neptune', id: swe.SE_NEPTUNE },
    { name: 'Pluto', id: swe.SE_PLUTO },
  ];

  const positions = planets.map(p => {
    const res = swe.sweCalcUt(tjdUt, p.id, flag);
    const lon = res.longitude; // 0..360
    return {
      ...p,
      longitude: lon,
      sign: toSign(lon),
    };
  });

  return {
    ascendant,
    ascendantSign: toSign(ascendant),
    mc,
    houseCusps: houses.cusp, // 1..12
    planets: positions,
  };
}
```

### B) **Pure JS (No native modules) — `astronomy-engine`**
> Use this for planet longitudes + moon/sun positions, but you must implement ascendant/house cusps yourself.
```ts
import * as Astronomy from 'astronomy-engine';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const toSign = (lon:number) => SIGNS[Math.floor(((lon%360)+360)%360 / 30)];

const date = new Date(Date.UTC(1993, 4, 16, 9, 30, 0));
const bodies = ['Sun','Moon','Mercury','Venus','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'] as const;

const positions = bodies.map(b => {
  const lon = Astronomy.EclipticLongitude(b, date); // deg
  return { body: b, longitude: lon, sign: toSign(lon) };
});

// NOTE: You must compute houses/ASC separately (e.g., Placidus or Whole Sign).
```

---

## 2) Moon Phase Calculation (Pure JS, Offline)

### Using **astronomy-engine** (simple + accurate)
```ts
import * as Astronomy from 'astronomy-engine';

const phaseName = (angle:number) => {
  const a = ((angle % 360) + 360) % 360;
  if (a < 22.5 || a >= 337.5) return 'New Moon';
  if (a < 67.5) return 'Waxing Crescent';
  if (a < 112.5) return 'First Quarter';
  if (a < 157.5) return 'Waxing Gibbous';
  if (a < 202.5) return 'Full Moon';
  if (a < 247.5) return 'Waning Gibbous';
  if (a < 292.5) return 'Last Quarter';
  return 'Waning Crescent';
};

export function moonPhaseNow(date = new Date()) {
  const angle = Astronomy.MoonPhase(date); // 0=new, 180=full
  const illum = Astronomy.Illumination('Moon', date).phase_fraction * 100;
  const nextFull = Astronomy.SearchMoonPhase(180, date, 40); // within 40 days
  const nextNew  = Astronomy.SearchMoonPhase(0, date, 40);

  return {
    phaseAngle: angle,
    phaseName: phaseName(angle),
    illuminationPct: illum,
    nextFullMoon: nextFull.date,
    nextNewMoon: nextNew.date,
  };
}
```

---

## 3) Transit Positions (Current Planets + Aspects)

### Swiss Ephemeris (RN) — Transit calculation
```ts
import * as swe from 'react-native-swisseph';

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const toSign = (lon:number) => SIGNS[Math.floor(((lon%360)+360)%360 / 30)];
const angleDiff = (a:number,b:number) => {
  const d = Math.abs(a-b) % 360;
  return d > 180 ? 360 - d : d;
};

const ASPECTS = [
  { name: 'Conjunction', angle: 0, orb: 8 },
  { name: 'Opposition', angle: 180, orb: 8 },
  { name: 'Square', angle: 90, orb: 6 },
  { name: 'Trine', angle: 120, orb: 6 },
  { name: 'Sextile', angle: 60, orb: 4 },
];

export function getTransitsNow() {
  const now = new Date();
  const { tjdUt } = swe.sweUtcToJd(
    now.getUTCFullYear(),
    now.getUTCMonth()+1,
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
    swe.SE_GREG_CAL
  );

  const flag = swe.SEFLG_SWIEPH;
  const bodies = [
    { name: 'Sun', id: swe.SE_SUN },
    { name: 'Moon', id: swe.SE_MOON },
    { name: 'Mercury', id: swe.SE_MERCURY },
    { name: 'Venus', id: swe.SE_VENUS },
    { name: 'Mars', id: swe.SE_MARS },
    { name: 'Jupiter', id: swe.SE_JUPITER },
    { name: 'Saturn', id: swe.SE_SATURN },
  ];

  const positions = bodies.map(b => {
    const res = swe.sweCalcUt(tjdUt, b.id, flag);
    return { ...b, lon: res.longitude, sign: toSign(res.longitude) };
  });

  const aspects = [] as {a:string,b:string,aspect:string,orb:number}[];
  for (let i=0;i<positions.length;i++) {
    for (let j=i+1;j<positions.length;j++) {
      const d = angleDiff(positions[i].lon, positions[j].lon);
      for (const asp of ASPECTS) {
        const orb = Math.abs(d - asp.angle);
        if (orb <= asp.orb) {
          aspects.push({ a: positions[i].name, b: positions[j].name, aspect: asp.name, orb });
        }
      }
    }
  }

  return { positions, aspects };
}
```

---

## 4) Comparison Table (Libraries Evaluated)

| Library | npm package | Install | Bundle size (unpacked) | RN Compatible | Accuracy | API Example for natal chart | Last updated (GitHub) | Stars | npm downloads (last week) |
|---|---|---|---:|---|---|---|---|---:|---:|
| **astronomia** | `astronomia` | `npm i astronomia` | **18.7 MB** (unpacked) | ✅ Pure JS (browser compatible) | High (Meeus/VSOP87) but **not astrology‑specific** | Need to combine `planetposition`, `sidereal`, `globe` to compute ASC/houses manually | 2026‑02‑04 | 167 | 400,187 |
| **swisseph** | `swisseph` | `npm i swisseph` | **14.0 MB** | ❌ Node C++ addon only | Very high; supports Moshier (0.1 arcsec), Swiss (0.001 arcsec) | Example via `swe_calc_ut` + `swe_houses` (Node) | 2026‑02‑13 | 239 | 2,097 |
| **sweph** | `sweph` | `npm i sweph` | **1.9 MB** | ❌ Node N‑API addon only | Very high (Swiss Ephemeris bindings) | Example via `calc`/`house` (Node) | 2026‑02‑10 | 172 | 2,724 |
| **ephemeris** | `ephemeris` | `npm i ephemeris` | **3.7 MB** | ✅ Likely (pure JS, no native deps) | Moderate‑high (Moshier) | `ephemeris.getAllPlanets(date, lon, lat, height)` returns ecliptic longitudes | 2026‑01‑18 | 52 | 594 |
| **astrologer** | `astrologer` | (unpublished) | N/A | N/A | N/A | N/A | N/A | N/A | 0 |
| **astronomy-engine** | `astronomy-engine` | `npm i astronomy-engine` | **1.8 MB** | ✅ Pure JS | ~±1 arcminute | `EclipticLongitude(body, date)`; **no houses/ASC** | 2026‑02‑13 | 808 | 23,770 |
| **react-native-swisseph** | `react-native-swisseph` | `npm i react-native-swisseph@0.1` | Native module | ✅ RN (native) | Swiss Ephemeris (highest) | `sweCalcUt` + `sweHouses` | 2026‑01‑19 | 15 | N/A |

**Notes**:
- `react-native-swisseph` is the **only** RN‑friendly library that directly supports **houses + ascendant** without custom math.
- Pure JS options give planet positions and moon phases, but **require custom house/ASC algorithms**.

---

## Recommendation Summary

✅ **If you can use native modules** → **react-native-swisseph** (Swiss Ephemeris) is the only full‑fidelity RN solution (ASC + houses + planets).

✅ **If you must stay pure JS** → **astronomy-engine** for planets + moon phase, and implement your own house system (Placidus/Whole Sign) using sidereal time + local latitude.

---

### Sources (key)
- React Native Swiss Ephemeris README (API list) — `react-native-swisseph`
- Swiss Ephemeris Node binding README — `swisseph`
- `ephemeris` README example (Moshier)
- `astronomia` README (Meeus/VSOP87)
- `astronomy-engine` README (accuracy + features)
