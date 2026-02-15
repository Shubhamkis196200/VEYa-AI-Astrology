// ============================================================================
// VEYa Astrology Engine — Real Astronomical Calculations
// ============================================================================
// Uses astronomy-engine (pure JS, zero native deps) for accurate planetary
// positions, moon phases, transits, and aspect calculations.
// This is the SINGLE SOURCE OF TRUTH for all astronomical data in the app.
// ============================================================================

import * as Astronomy from 'astronomy-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlanetPosition {
  name: string;
  longitude: number;       // ecliptic longitude 0-360
  sign: string;            // zodiac sign name
  signDegree: number;      // degree within sign (0-30)
  signMinute: number;      // arc-minute within degree
  retrograde: boolean;
  symbol: string;
}

export interface MoonPhaseInfo {
  phaseName: string;
  illumination: number;    // 0-1
  phaseAngle: number;      // 0-360
  moonSign: string;
  moonDegree: number;
  moonSignDegree: number;
  daysUntilFullMoon: number;
  daysUntilNewMoon: number;
  nextFullMoonDate: Date;
  nextNewMoonDate: Date;
  emoji: string;
}

export interface TransitAspect {
  transitPlanet: string;
  natalPlanet: string;
  aspectType: string;
  aspectSymbol: string;
  orb: number;
  isApplying: boolean;
  interpretation: string;
}

export interface DailyTransitSummary {
  date: string;
  planets: PlanetPosition[];
  moonPhase: MoonPhaseInfo;
  majorAspects: TransitAspect[];
  cosmicWeather: string;
  energyLevel: number;
}

export interface MonthEvent {
  date: Date;
  type: 'full_moon' | 'new_moon' | 'ingress' | 'retrograde' | 'direct' | 'aspect';
  description: string;
  impact: 'positive' | 'challenging' | 'neutral' | 'significant';
  emoji: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

const ZODIAC_SYMBOLS = [
  '♈', '♉', '♊', '♋', '♌', '♍',
  '♎', '♏', '♐', '♑', '♒', '♓',
] as const;

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀',
  Mars: '♂', Jupiter: '♃', Saturn: '♄',
  Uranus: '♅', Neptune: '♆', Pluto: '♇',
};

const ASPECT_TYPES = [
  { name: 'Conjunction', symbol: '☌', angle: 0, orb: 8, nature: 'neutral' },
  { name: 'Sextile', symbol: '⚹', angle: 60, orb: 6, nature: 'positive' },
  { name: 'Square', symbol: '□', angle: 90, orb: 7, nature: 'challenging' },
  { name: 'Trine', symbol: '△', angle: 120, orb: 8, nature: 'positive' },
  { name: 'Opposition', symbol: '☍', angle: 180, orb: 8, nature: 'challenging' },
] as const;

const ASTRONOMY_BODIES: Array<{ name: string; body: Astronomy.Body }> = [
  { name: 'Sun', body: Astronomy.Body.Sun },
  { name: 'Moon', body: Astronomy.Body.Moon },
  { name: 'Mercury', body: Astronomy.Body.Mercury },
  { name: 'Venus', body: Astronomy.Body.Venus },
  { name: 'Mars', body: Astronomy.Body.Mars },
  { name: 'Jupiter', body: Astronomy.Body.Jupiter },
  { name: 'Saturn', body: Astronomy.Body.Saturn },
  { name: 'Uranus', body: Astronomy.Body.Uranus },
  { name: 'Neptune', body: Astronomy.Body.Neptune },
  { name: 'Pluto', body: Astronomy.Body.Pluto },
];

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Get zodiac sign from ecliptic longitude (0-360)
 */
export function getZodiacSign(longitude: number): string {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[index];
}

export function getZodiacSymbol(longitude: number): string {
  const normalized = ((longitude % 360) + 360) % 360;
  const index = Math.floor(normalized / 30);
  return ZODIAC_SYMBOLS[index];
}

function getSignDegree(longitude: number): number {
  return longitude % 30;
}

/**
 * Calculate ecliptic longitude for a celestial body at a given time.
 */
function getEclipticLongitude(body: Astronomy.Body, date: Date): number {
  const time = Astronomy.MakeTime(date);

  if (body === Astronomy.Body.Sun) {
    const equ = Astronomy.SunPosition(time);
    const ecl = Astronomy.Ecliptic(equ.vec);
    return ecl.elon;
  }

  if (body === Astronomy.Body.Moon) {
    const geo = Astronomy.EclipticGeoMoon(time);
    return geo.lon;
  }

  // Other planets: geocentric equatorial → ecliptic
  const equ = Astronomy.GeoVector(body, time, true);
  const ecl = Astronomy.Ecliptic(equ);
  return ecl.elon;
}

/**
 * Check if a planet is retrograde by comparing positions
 */
function isRetrograde(body: Astronomy.Body, date: Date): boolean {
  if (body === Astronomy.Body.Sun || body === Astronomy.Body.Moon) return false;
  const now = getEclipticLongitude(body, date);
  const dayAhead = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const future = getEclipticLongitude(body, dayAhead);
  // Handle wrapping around 360°
  let diff = future - now;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get current positions of all planets
 */
export function getCurrentTransits(date: Date = new Date()): PlanetPosition[] {
  return ASTRONOMY_BODIES.map(({ name, body }) => {
    const longitude = getEclipticLongitude(body, date);
    const sign = getZodiacSign(longitude);
    const signDeg = getSignDegree(longitude);
    const degree = Math.floor(signDeg);
    const minute = Math.round((signDeg - degree) * 60);
    const retrograde = isRetrograde(body, date);

    return {
      name,
      longitude,
      sign,
      signDegree: degree,
      signMinute: minute,
      retrograde,
      symbol: PLANET_SYMBOLS[name] || '⭐',
    };
  });
}

/**
 * Get current moon phase with full details
 */
export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const time = Astronomy.MakeTime(date);

  // Moon phase angle (0 = New, 90 = First Quarter, 180 = Full, 270 = Last Quarter)
  const phaseAngle = Astronomy.MoonPhase(time);

  // Illumination
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, time);

  // Moon position for zodiac sign
  const moonGeo = Astronomy.EclipticGeoMoon(time);
  const moonSign = getZodiacSign(moonGeo.lon);
  const moonSignDeg = getSignDegree(moonGeo.lon);

  // Phase name
  const phaseName = getMoonPhaseName(phaseAngle);
  const emoji = getMoonPhaseEmoji(phaseAngle);

  // Next Full Moon (phase = 180°)
  const nextFull = Astronomy.SearchMoonPhase(180, time, 30);
  const nextFullDate = nextFull ? nextFull.date : new Date(date.getTime() + 15 * 86400000);
  const daysUntilFull = (nextFullDate.getTime() - date.getTime()) / 86400000;

  // Next New Moon (phase = 0°)
  const nextNew = Astronomy.SearchMoonPhase(0, time, 30);
  const nextNewDate = nextNew ? nextNew.date : new Date(date.getTime() + 15 * 86400000);
  const daysUntilNew = (nextNewDate.getTime() - date.getTime()) / 86400000;

  return {
    phaseName,
    illumination: illum.phase_fraction,
    phaseAngle,
    moonSign,
    moonDegree: moonGeo.lon,
    moonSignDegree: Math.floor(moonSignDeg),
    daysUntilFullMoon: Math.round(daysUntilFull * 10) / 10,
    daysUntilNewMoon: Math.round(daysUntilNew * 10) / 10,
    nextFullMoonDate: nextFullDate,
    nextNewMoonDate: nextNewDate,
    emoji,
  };
}

function getMoonPhaseName(angle: number): string {
  if (angle < 11.25) return 'New Moon';
  if (angle < 78.75) return 'Waxing Crescent';
  if (angle < 101.25) return 'First Quarter';
  if (angle < 168.75) return 'Waxing Gibbous';
  if (angle < 191.25) return 'Full Moon';
  if (angle < 258.75) return 'Waning Gibbous';
  if (angle < 281.25) return 'Last Quarter';
  if (angle < 348.75) return 'Waning Crescent';
  return 'New Moon';
}

function getMoonPhaseEmoji(angle: number): string {
  if (angle < 11.25) return '🌑';
  if (angle < 78.75) return '🌒';
  if (angle < 101.25) return '🌓';
  if (angle < 168.75) return '🌔';
  if (angle < 191.25) return '🌕';
  if (angle < 258.75) return '🌖';
  if (angle < 281.25) return '🌗';
  if (angle < 348.75) return '🌘';
  return '🌑';
}

/**
 * Calculate aspects between two sets of planetary positions
 */
export function calculateAspects(
  transitPositions: PlanetPosition[],
  natalPositions: PlanetPosition[],
): TransitAspect[] {
  const aspects: TransitAspect[] = [];

  for (const transit of transitPositions) {
    for (const natal of natalPositions) {
      // Skip Moon-Moon (too fast to be meaningful)
      if (transit.name === 'Moon' && natal.name === 'Moon') continue;

      for (const aspectType of ASPECT_TYPES) {
        let diff = Math.abs(transit.longitude - natal.longitude);
        if (diff > 180) diff = 360 - diff;

        const orb = Math.abs(diff - aspectType.angle);
        // Tighter orbs for outer planets, looser for Sun/Moon
        const maxOrb = (transit.name === 'Sun' || transit.name === 'Moon')
          ? aspectType.orb
          : aspectType.orb - 1;

        if (orb <= maxOrb) {
          aspects.push({
            transitPlanet: transit.name,
            natalPlanet: natal.name,
            aspectType: aspectType.name,
            aspectSymbol: aspectType.symbol,
            orb: Math.round(orb * 10) / 10,
            isApplying: orb < aspectType.orb / 2,
            interpretation: generateAspectInterpretation(
              transit.name,
              natal.name,
              aspectType.name,
              transit.sign,
            ),
          });
        }
      }
    }
  }

  // Sort by orb (tighter = more important)
  return aspects.sort((a, b) => a.orb - b.orb);
}

function generateAspectInterpretation(
  transitPlanet: string,
  natalPlanet: string,
  aspectType: string,
  transitSign: string,
): string {
  const interpretations: Record<string, Record<string, Record<string, string>>> = {
    Conjunction: {
      Sun: {
        Sun: `Solar return energy — a day of renewed vitality and self-expression`,
        Moon: `Emotional clarity meets willpower — trust your instincts today`,
        Venus: `Love and creativity are amplified — express your heart`,
        Mars: `Bold energy surge — take decisive action on what matters`,
        Jupiter: `Expansion and optimism — a lucky day for new beginnings`,
        Saturn: `A grounding check-in — structure meets purpose`,
      },
      Moon: {
        Sun: `Feelings and identity align — emotional authenticity shines`,
        Moon: `Deep emotional resonance — honor your inner world`,
        Venus: `Heart-centered nurturing — beauty and comfort call to you`,
        Mars: `Emotional passion — channel feelings into meaningful action`,
      },
      Venus: {
        Sun: `Charm and grace highlight your personality — radiate warmth`,
        Moon: `Tenderness and beauty — relationships feel harmonious`,
        Venus: `Venus return — love, art, and pleasure are magnified`,
        Mars: `Magnetic attraction — passion meets affection`,
      },
      Mars: {
        Sun: `Drive and ambition intensify — pursue goals fearlessly`,
        Moon: `Emotional courage — defend what matters to you`,
        Venus: `Desire meets beauty — romantic and creative fire`,
        Mars: `Mars return — raw energy and determination peak`,
      },
      Jupiter: {
        Sun: `Blessings and expansion — the universe opens doors`,
        Moon: `Emotional generosity — joy comes from giving`,
        Venus: `Love expands — relationships grow in beautiful ways`,
      },
      Saturn: {
        Sun: `Discipline meets purpose — lay foundations for the long term`,
        Moon: `Emotional maturity — wisdom through patience`,
        Venus: `Commitment deepens — love tested and strengthened`,
      },
    },
    Trine: {
      default: { _: `Flowing harmony between ${transitPlanet} in ${transitSign} and your natal ${natalPlanet} — natural ease and positive energy` },
    },
    Sextile: {
      default: { _: `Opportunities arise as ${transitPlanet} in ${transitSign} supports your natal ${natalPlanet} — take the initiative` },
    },
    Square: {
      default: { _: `Creative tension between ${transitPlanet} in ${transitSign} and your natal ${natalPlanet} — growth through challenge` },
    },
    Opposition: {
      default: { _: `Awareness and balance needed as ${transitPlanet} in ${transitSign} opposes your natal ${natalPlanet} — see both sides` },
    },
  };

  const aspectInterps = interpretations[aspectType];
  if (!aspectInterps) {
    return `${transitPlanet} ${aspectType.toLowerCase()} your natal ${natalPlanet} — a significant celestial connection`;
  }

  // Try specific planet-to-planet interpretation
  const planetInterps = aspectInterps[transitPlanet];
  if (planetInterps && planetInterps[natalPlanet]) {
    return planetInterps[natalPlanet];
  }

  // Fall back to default for this aspect type
  if (aspectInterps.default) {
    const defaultInterp = aspectInterps.default;
    return typeof defaultInterp === 'string' ? defaultInterp : defaultInterp._ || defaultInterp[Object.keys(defaultInterp)[0]];
  }

  return `${transitPlanet} in ${transitSign} ${aspectType.toLowerCase()}s your natal ${natalPlanet}`;
}

/**
 * Get a full daily transit summary
 */
export function getDailyTransitSummary(
  date: Date = new Date(),
  natalPositions?: PlanetPosition[],
): DailyTransitSummary {
  const planets = getCurrentTransits(date);
  const moonPhase = getMoonPhase(date);

  // Calculate aspects if natal chart provided
  const majorAspects = natalPositions
    ? calculateAspects(planets, natalPositions).slice(0, 8)
    : [];

  // Determine cosmic weather
  const retrogradeCount = planets.filter((p) => p.retrograde).length;
  const retrogrades = planets.filter((p) => p.retrograde).map((p) => p.name);

  let cosmicWeather = '';
  let energyLevel = 7;

  if (retrogradeCount >= 3) {
    cosmicWeather = `High retrograde energy (${retrogrades.join(', ')} Rx) — reflection and revision over action. Patience is your superpower today.`;
    energyLevel = 4;
  } else if (retrogradeCount >= 1) {
    cosmicWeather = `${retrogrades.join(' and ')} retrograde — review and reassess in ${retrogrades.length === 1 ? 'that' : 'those'} area${retrogrades.length > 1 ? 's' : ''} of life.`;
    energyLevel = 6;
  }

  // Moon phase energy modifier
  if (moonPhase.phaseName === 'Full Moon') {
    cosmicWeather += ' Full Moon illumination — emotions and insights peak.';
    energyLevel = Math.min(10, energyLevel + 2);
  } else if (moonPhase.phaseName === 'New Moon') {
    cosmicWeather += ' New Moon — ideal for setting intentions and planting seeds.';
    energyLevel = Math.max(1, energyLevel - 1);
  }

  // Check for challenging aspects
  const challenges = majorAspects.filter(
    (a) => a.aspectType === 'Square' || a.aspectType === 'Opposition',
  );
  const harmonies = majorAspects.filter(
    (a) => a.aspectType === 'Trine' || a.aspectType === 'Sextile',
  );

  if (harmonies.length > challenges.length) {
    cosmicWeather += ' Overall supportive energy — the cosmos is working with you.';
    energyLevel = Math.min(10, energyLevel + 1);
  } else if (challenges.length > harmonies.length) {
    cosmicWeather += ' Some tension in the air — navigate with awareness and compassion.';
    energyLevel = Math.max(1, energyLevel - 1);
  }

  if (!cosmicWeather.trim()) {
    cosmicWeather = `${moonPhase.phaseName} in ${moonPhase.moonSign} — ${getMoonSignEnergy(moonPhase.moonSign)}.`;
  }

  return {
    date: date.toISOString().split('T')[0],
    planets,
    moonPhase,
    majorAspects,
    cosmicWeather: cosmicWeather.trim(),
    energyLevel: Math.max(1, Math.min(10, energyLevel)),
  };
}

function getMoonSignEnergy(sign: string): string {
  const energies: Record<string, string> = {
    Aries: 'fiery motivation and bold action',
    Taurus: 'grounded comfort and sensory pleasure',
    Gemini: 'curiosity, conversation, and mental agility',
    Cancer: 'deep nurturing and emotional sensitivity',
    Leo: 'creative expression and warm confidence',
    Virgo: 'practical refinement and attention to detail',
    Libra: 'harmony, partnership, and aesthetic beauty',
    Scorpio: 'transformative depth and emotional intensity',
    Sagittarius: 'adventure, optimism, and philosophical expansion',
    Capricorn: 'disciplined focus and ambitious drive',
    Aquarius: 'innovative thinking and humanitarian vision',
    Pisces: 'intuitive flow and spiritual connection',
  };
  return energies[sign] || 'cosmic attunement';
}

/**
 * Get monthly events for the transit calendar
 */
export function getMonthEvents(year: number, month: number): MonthEvent[] {
  const events: MonthEvent[] = [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month
  const daysInMonth = endDate.getDate();

  // Track planet signs to detect ingresses
  const previousSigns: Record<string, string> = {};
  const previousRetro: Record<string, boolean> = {};

  // Initialize with day before month starts
  const dayBefore = new Date(startDate.getTime() - 86400000);
  for (const { name, body } of ASTRONOMY_BODIES) {
    const lon = getEclipticLongitude(body, dayBefore);
    previousSigns[name] = getZodiacSign(lon);
    previousRetro[name] = isRetrograde(body, dayBefore);
  }

  // Scan each day
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d, 12, 0, 0);

    // Check moon phases
    const moonPhaseAngle = Astronomy.MoonPhase(Astronomy.MakeTime(date));
    const prevDay = new Date(date.getTime() - 86400000);
    const prevMoonAngle = Astronomy.MoonPhase(Astronomy.MakeTime(prevDay));

    // Full Moon detection (phase crosses 180)
    if ((prevMoonAngle < 180 && moonPhaseAngle >= 180) ||
        (prevMoonAngle > 350 && moonPhaseAngle < 10)) {
      if (prevMoonAngle < 180 && moonPhaseAngle >= 180) {
        const moonGeo = Astronomy.EclipticGeoMoon(Astronomy.MakeTime(date));
        const moonSign = getZodiacSign(moonGeo.lon);
        events.push({
          date,
          type: 'full_moon',
          description: `Full Moon in ${moonSign}`,
          impact: 'significant',
          emoji: '🌕',
        });
      }
    }

    // New Moon detection (phase crosses 0/360)
    if ((prevMoonAngle > 340 && moonPhaseAngle < 20) ||
        (prevMoonAngle > moonPhaseAngle && moonPhaseAngle < 10)) {
      const moonGeo = Astronomy.EclipticGeoMoon(Astronomy.MakeTime(date));
      const moonSign = getZodiacSign(moonGeo.lon);
      events.push({
        date,
        type: 'new_moon',
        description: `New Moon in ${moonSign}`,
        impact: 'significant',
        emoji: '🌑',
      });
    }

    // Check planet sign changes and retrogrades
    for (const { name, body } of ASTRONOMY_BODIES) {
      if (name === 'Moon') continue; // Moon changes signs too frequently
      const lon = getEclipticLongitude(body, date);
      const currentSign = getZodiacSign(lon);
      const currentRetro = isRetrograde(body, date);

      // Sign ingress
      if (previousSigns[name] && currentSign !== previousSigns[name]) {
        events.push({
          date,
          type: 'ingress',
          description: `${name} enters ${currentSign}`,
          impact: ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(name)
            ? 'significant'
            : 'neutral',
          emoji: PLANET_SYMBOLS[name] || '⭐',
        });
      }

      // Retrograde/Direct station
      if (previousRetro[name] !== undefined && currentRetro !== previousRetro[name]) {
        events.push({
          date,
          type: currentRetro ? 'retrograde' : 'direct',
          description: `${name} stations ${currentRetro ? 'retrograde' : 'direct'} in ${currentSign}`,
          impact: 'challenging',
          emoji: currentRetro ? '⏪' : '⏩',
        });
      }

      previousSigns[name] = currentSign;
      previousRetro[name] = currentRetro;
    }
  }

  // Sort by date
  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Format transits as a human-readable string for AI prompts
 */
export function formatTransitsForPrompt(planets: PlanetPosition[]): string {
  const lines: string[] = ['Current Planetary Positions:'];
  for (const p of planets) {
    const retro = p.retrograde ? ' (Retrograde)' : '';
    lines.push(`  ${p.symbol} ${p.name}: ${p.sign} ${p.signDegree}°${p.signMinute}'${retro}`);
  }
  return lines.join('\n');
}

/**
 * Format moon phase for AI prompts
 */
export function formatMoonForPrompt(moon: MoonPhaseInfo): string {
  return [
    `Moon Phase: ${moon.emoji} ${moon.phaseName} (${Math.round(moon.illumination * 100)}% illuminated)`,
    `Moon Sign: ${moon.moonSign} ${moon.moonSignDegree}°`,
    `Next Full Moon: ${Math.round(moon.daysUntilFullMoon)} days`,
    `Next New Moon: ${Math.round(moon.daysUntilNewMoon)} days`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Planetary Hours
// ---------------------------------------------------------------------------

export interface PlanetaryHour {
  planet: string;
  symbol: string;
  color: string;
  startTime: Date;
  endTime: Date;
  isCurrent: boolean;
  hourNumber: number; // 1-24
  isDay: boolean;
}

export interface PlanetaryHoursData {
  currentHour: PlanetaryHour;
  todayHours: PlanetaryHour[];
  sunrise: Date;
  sunset: Date;
  dayRuler: string;
  dayRulerSymbol: string;
}

// Chaldean order of planets for planetary hours
const PLANETARY_HOUR_ORDER = [
  { name: 'Saturn', symbol: '♄', color: '#5B5B7A' },
  { name: 'Jupiter', symbol: '♃', color: '#7B68EE' },
  { name: 'Mars', symbol: '♂', color: '#CD5C5C' },
  { name: 'Sun', symbol: '☉', color: '#FFB347' },
  { name: 'Venus', symbol: '♀', color: '#DDA0DD' },
  { name: 'Mercury', symbol: '☿', color: '#87CEEB' },
  { name: 'Moon', symbol: '☽', color: '#E8E8E8' },
];

// Day rulers (planetary day rulers, starting with Sunday)
const DAY_RULERS = [
  { name: 'Sun', symbol: '☉' },      // Sunday
  { name: 'Moon', symbol: '☽' },     // Monday
  { name: 'Mars', symbol: '♂' },     // Tuesday
  { name: 'Mercury', symbol: '☿' },  // Wednesday
  { name: 'Jupiter', symbol: '♃' },  // Thursday
  { name: 'Venus', symbol: '♀' },    // Friday
  { name: 'Saturn', symbol: '♄' },   // Saturday
];

/**
 * Get planetary hours for a given date and location
 * Uses astronomy-engine for accurate sunrise/sunset
 */
export function getPlanetaryHours(
  date: Date = new Date(),
  latitude: number = 40.7128, // Default: NYC
  longitude: number = -74.0060
): PlanetaryHoursData {
  const time = Astronomy.MakeTime(date);
  const observer: Astronomy.Observer = {
    latitude,
    longitude,
    height: 0
  };

  // Get sunrise and sunset for today
  const sunriseSearch = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, time, 1);
  const sunsetSearch = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, time, 1);

  // Fallback times if calculation fails (shouldn't happen at normal latitudes)
  const sunrise = sunriseSearch?.date || new Date(date.setHours(6, 0, 0, 0));
  const sunset = sunsetSearch?.date || new Date(date.setHours(18, 0, 0, 0));

  // Get yesterday's sunset for night hours before today's sunrise
  const yesterday = new Date(date.getTime() - 86400000);
  const yesterdayTime = Astronomy.MakeTime(yesterday);
  const yesterdaySunsetSearch = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, yesterdayTime, 1);
  const yesterdaySunset = yesterdaySunsetSearch?.date || new Date(yesterday.setHours(18, 0, 0, 0));

  // Get tomorrow's sunrise for night hours after today's sunset
  const tomorrow = new Date(date.getTime() + 86400000);
  const tomorrowTime = Astronomy.MakeTime(tomorrow);
  const tomorrowSunriseSearch = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, tomorrowTime, 1);
  const tomorrowSunrise = tomorrowSunriseSearch?.date || new Date(tomorrow.setHours(6, 0, 0, 0));

  // Calculate day and night hour lengths
  const dayLengthMs = sunset.getTime() - sunrise.getTime();
  const nightLengthMs = tomorrowSunrise.getTime() - sunset.getTime();
  const dayHourMs = dayLengthMs / 12;
  const nightHourMs = nightLengthMs / 12;

  // Get day of week (0 = Sunday)
  const dayOfWeek = date.getDay();
  const dayRuler = DAY_RULERS[dayOfWeek];

  // Find starting index in Chaldean order for first day hour
  const dayRulerIndex = PLANETARY_HOUR_ORDER.findIndex(p => p.name === dayRuler.name);

  const hours: PlanetaryHour[] = [];
  const now = date.getTime();

  // Generate 12 day hours (starting from sunrise)
  for (let i = 0; i < 12; i++) {
    const planetIndex = (dayRulerIndex + i) % 7;
    const planet = PLANETARY_HOUR_ORDER[planetIndex];
    const startTime = new Date(sunrise.getTime() + i * dayHourMs);
    const endTime = new Date(sunrise.getTime() + (i + 1) * dayHourMs);

    hours.push({
      planet: planet.name,
      symbol: planet.symbol,
      color: planet.color,
      startTime,
      endTime,
      isCurrent: now >= startTime.getTime() && now < endTime.getTime(),
      hourNumber: i + 1,
      isDay: true,
    });
  }

  // Generate 12 night hours (starting from sunset)
  for (let i = 0; i < 12; i++) {
    const planetIndex = (dayRulerIndex + 12 + i) % 7;
    const planet = PLANETARY_HOUR_ORDER[planetIndex];
    const startTime = new Date(sunset.getTime() + i * nightHourMs);
    const endTime = new Date(sunset.getTime() + (i + 1) * nightHourMs);

    hours.push({
      planet: planet.name,
      symbol: planet.symbol,
      color: planet.color,
      startTime,
      endTime,
      isCurrent: now >= startTime.getTime() && now < endTime.getTime(),
      hourNumber: i + 13,
      isDay: false,
    });
  }

  // Find current hour
  const currentHour = hours.find(h => h.isCurrent) || hours[0];

  return {
    currentHour,
    todayHours: hours,
    sunrise,
    sunset,
    dayRuler: dayRuler.name,
    dayRulerSymbol: dayRuler.symbol,
  };
}

// ---------------------------------------------------------------------------
// Retrograde Tracker
// ---------------------------------------------------------------------------

export interface RetrogradeInfo {
  planet: string;
  symbol: string;
  sign: string;
  isRetrograde: boolean;
  stationDate?: Date;
  stationType?: 'retrograde' | 'direct';
  endDate?: Date;
  interpretation: string;
}

export interface RetrogradeData {
  currentRetrogrades: RetrogradeInfo[];
  upcomingRetrogrades: RetrogradeInfo[];
  retrogradeCount: number;
  message: string;
}

/**
 * Get comprehensive retrograde information
 */
export function getRetrogradeData(date: Date = new Date()): RetrogradeData {
  const planets = getCurrentTransits(date);
  const currentRetrogrades: RetrogradeInfo[] = [];
  const upcomingRetrogrades: RetrogradeInfo[] = [];

  // Retrograde interpretations
  const retroInterps: Record<string, string> = {
    Mercury: 'Communication, travel, and technology require extra attention. Review contracts carefully.',
    Venus: 'Love and relationships under review. Past connections may resurface.',
    Mars: 'Energy may feel blocked. Avoid starting new physical projects.',
    Jupiter: 'Inner growth over outer expansion. Reassess beliefs and goals.',
    Saturn: 'Restructuring responsibilities. Old limitations surface for healing.',
    Uranus: 'Internal revolution. Unexpected changes to your sense of freedom.',
    Neptune: 'Spiritual introspection. Dreams and intuition intensify.',
    Pluto: 'Deep psychological transformation. Hidden power dynamics revealed.',
  };

  // Check each planet (excluding Sun and Moon which don't retrograde)
  for (const p of planets) {
    if (p.name === 'Sun' || p.name === 'Moon') continue;

    if (p.retrograde) {
      // Find approximate end date by scanning forward
      let endDate: Date | undefined;
      for (let d = 1; d <= 120; d++) {
        const futureDate = new Date(date.getTime() + d * 86400000);
        const body = ASTRONOMY_BODIES.find(b => b.name === p.name)?.body;
        if (body && !isRetrograde(body, futureDate)) {
          endDate = futureDate;
          break;
        }
      }

      currentRetrogrades.push({
        planet: p.name,
        symbol: p.symbol,
        sign: p.sign,
        isRetrograde: true,
        endDate,
        interpretation: retroInterps[p.name] || 'A time for inner reflection.',
      });
    } else {
      // Check if retrograde is coming in next 60 days
      for (let d = 1; d <= 60; d++) {
        const futureDate = new Date(date.getTime() + d * 86400000);
        const body = ASTRONOMY_BODIES.find(b => b.name === p.name)?.body;
        if (body && isRetrograde(body, futureDate)) {
          upcomingRetrogrades.push({
            planet: p.name,
            symbol: p.symbol,
            sign: getZodiacSign(getEclipticLongitude(body, futureDate)),
            isRetrograde: false,
            stationDate: futureDate,
            stationType: 'retrograde',
            interpretation: retroInterps[p.name] || 'Prepare for reflection period.',
          });
          break;
        }
      }
    }
  }

  // Generate summary message
  let message = '';
  if (currentRetrogrades.length === 0) {
    message = 'No planets are retrograde. Clear skies for forward momentum!';
  } else if (currentRetrogrades.length === 1) {
    message = `${currentRetrogrades[0].planet} is retrograde. ${currentRetrogrades[0].interpretation.split('.')[0]}.`;
  } else if (currentRetrogrades.length <= 3) {
    const names = currentRetrogrades.map(r => r.planet).join(', ');
    message = `${names} are retrograde. A time for review and reflection.`;
  } else {
    message = `${currentRetrogrades.length} planets retrograde. Major review period — patience is key.`;
  }

  return {
    currentRetrogrades,
    upcomingRetrogrades: upcomingRetrogrades.slice(0, 3),
    retrogradeCount: currentRetrogrades.length,
    message,
  };
}
