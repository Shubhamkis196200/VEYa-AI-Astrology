// ============================================================================
// VEYa Daily Reading Generator — Deterministic, Offline-First
// ============================================================================
// Produces rich, poetic daily readings seeded by (zodiacSign + date).
// No network calls required. Same input → same output, always.
// ============================================================================

import type { ZodiacSign } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeneratedDailyReading {
  date: string;
  zodiacSign: ZodiacSign;
  energyScore: number;                    // 1–10
  briefing: string;                       // 2–3 sentences
  dos: [string, string];                  // 2 do's
  donts: [string, string];               // 2 don'ts
  transits: [TransitHighlight, TransitHighlight, TransitHighlight];
  luckyColor: string;
  luckyNumber: number;
  luckyTime: string;
  compatibility: { best: ZodiacSign; rising: ZodiacSign };
  moonPhase: MoonPhaseInfo;
}

export interface TransitHighlight {
  label: string;       // e.g. "Moon in Pisces"
  symbol: string;      // e.g. "☽"
  description: string; // poetic interpretation
}

export interface MoonPhaseInfo {
  name: string;        // "Waxing Crescent", "Full Moon", etc.
  emoji: string;       // 🌑🌒🌓🌔🌕🌖🌗🌘
  illumination: number; // 0–100
  guidance: string;    // short cosmic guidance
}

// ---------------------------------------------------------------------------
// Seeded Random — Mulberry32 (deterministic PRNG)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return hash;
}

function createRng(zodiacSign: string, date: string): () => number {
  const seed = hashString(`${zodiacSign}::${date}::veya-cosmic-v3`);
  return mulberry32(seed);
}

// Helper: pick from array using rng
function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

// ---------------------------------------------------------------------------
// Zodiac Metadata
// ---------------------------------------------------------------------------

const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

const SIGN_INDEX: Record<ZodiacSign, number> = {
  Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5,
  Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11,
};

type Element = 'fire' | 'earth' | 'air' | 'water';

const SIGN_ELEMENT: Record<ZodiacSign, Element> = {
  Aries: 'fire', Taurus: 'earth', Gemini: 'air', Cancer: 'water',
  Leo: 'fire', Virgo: 'earth', Libra: 'air', Scorpio: 'water',
  Sagittarius: 'fire', Capricorn: 'earth', Aquarius: 'air', Pisces: 'water',
};

const ELEMENT_COMPAT: Record<Element, Element[]> = {
  fire: ['fire', 'air'],
  earth: ['earth', 'water'],
  air: ['air', 'fire'],
  water: ['water', 'earth'],
};

// ---------------------------------------------------------------------------
// Content Templates — 12 per sign, rotating by day of year
// ---------------------------------------------------------------------------

const BRIEFING_TEMPLATES: Record<ZodiacSign, readonly string[]> = {
  Aries: [
    "A surge of cardinal fire courses through your chart today, igniting your boldest ambitions. The cosmos invites you to lead with your heart — breakthroughs await those who dare to begin. Let your inner warrior shine without reservation.",
    "Mars whispers of courage wrapped in tenderness today. Channel your fierce energy into building rather than battling. The universe rewards your audacity with unexpected gifts.",
    "Your ruling fire burns bright and steady like a beacon today. Others will seek your warmth — share it generously, for giving amplifies your own radiance. A spontaneous adventure may rewrite your plans in the most beautiful way.",
    "The celestial ram charges forward with crystalline clarity today. Trust the impulse that rises before doubt can settle — it carries ancient wisdom. Your pioneering spirit opens doors that logic alone cannot find.",
    "A golden thread of initiative weaves through your hours. Today favors first steps, fresh starts, and fearless conversations. The stars applaud your refusal to play small.",
    "Cosmic sparks dance around your sign, amplifying your natural magnetism. What you initiate today carries momentum far beyond this moment. Your enthusiasm is contagious — let it ripple outward.",
    "The heavens honor your warrior spirit with a day of potent alignment. Passion meets purpose in a rare cosmic embrace. Move quickly when inspiration strikes — the window is luminous but brief.",
    "A fiery renaissance stirs within your soul today. Old dreams you shelved may suddenly feel urgent and alive again. The stars say: reclaim what your heart never truly released.",
    "Dynamic planetary currents fuel your trademark boldness. Today is less about patience and more about beautiful, decisive action. The cosmos clears the path — you need only walk it.",
    "Your aura blazes with cardinal radiance today, drawing allies and opportunities toward you. Speak your vision aloud; the universe is listening with unusual attentiveness. Courage is your cosmic currency.",
    "The celestial forge is lit — today shapes raw desire into golden purpose. Let your instincts guide your hands and your heart guide your words. What you create now carries lasting power.",
    "A rare alignment between Mars and the lunar nodes electrifies your potential. Today you are both sword and shield — fiercely protective of what matters, boldly claiming what's next. Trust your fire.",
  ],
  Taurus: [
    "The earth beneath your feet hums with a rich, steady frequency today. Beauty reveals itself in the smallest details — a perfect cup of tea, sunlight on stone, a kind word remembered. Let yourself receive fully.",
    "Venus wraps your day in velvet. Your senses are heightened, your taste impeccable, your instincts sound as ancient oak. Trust what feels right in your body — it knows before your mind catches up.",
    "A lush current of abundance flows through your chart, dear Taurus. What you tend with patience today grows into something magnificent. The cosmos rewards your devotion to quality over speed.",
    "Today the stars invite you to cultivate rather than chase. Your steady presence is a gift others desperately need right now. Ground yourself in ritual, and watch the world arrange itself around your calm.",
    "Earthy luxuries carry extra magic today — savor them without guilt. The planets celebrate your ability to find the sacred in the sensual. Your body is a temple; honor it with something beautiful.",
    "The cosmic garden is in full bloom for your sign. Seeds planted weeks ago show their first tender shoots. Resist the urge to rush — your timeline is perfect, even when it feels slow.",
    "A deep serenity settles over your spirit today, like morning mist over green hills. From this stillness, profound clarity emerges. The answers you seek are already growing in the fertile soil of your subconscious.",
    "Venus and the Moon conspire to heighten your already exquisite taste. Today, invest in lasting beauty — relationships, craftsmanship, experiences that age like fine wine. The ephemeral holds no power over you.",
    "Your steadfast nature becomes your greatest superpower today. While others waver, you stand firm and clear — a lighthouse in cosmic fog. Important decisions made now have staying power.",
    "Rich, golden light suffuses your chart today. Material and emotional abundance are deeply intertwined — as you open your heart, your world expands in tangible ways. Generosity returns tenfold.",
    "The bull finds its sacred pasture today — a place of peace, plenty, and purposeful rest. You've earned this moment of harvest. Let yourself feast on the fruits of your patient labor.",
    "An earthy symphony plays through your hours, harmonizing body, heart, and purpose. Today, even practical tasks carry a shimmer of magic. You are building something timeless — never doubt the blueprint.",
  ],
  Gemini: [
    "Mercury's quicksilver light dances through your mind today, connecting ideas like stars in a new constellation. Conversations carry hidden treasures — listen between the lines. Your words have unusual power to inspire and transform.",
    "The cosmic twins are perfectly synchronized today. Your dual nature becomes your gift — hold complexity without choosing sides. A message arriving from an unexpected direction changes your perspective beautifully.",
    "Your mind sparkles with mercurial brilliance, weaving connections others cannot see. Today favors writing, speaking, and sharing your kaleidoscopic vision. The universe adores your curiosity — follow it fearlessly.",
    "Intellectual alchemy is yours today, dear Gemini. Transform scattered thoughts into golden insights. A conversation that begins casually may unlock a door you didn't know existed.",
    "The air element crackles with electric potential around your sign. Social connections amplify your creativity tenfold. Today's casual encounter may become tomorrow's grand collaboration.",
    "Wings of thought carry you across vast inner landscapes today. Let your mind wander — it knows exactly where to go. The most brilliant idea arrives disguised as a daydream.",
    "Mercury bestows linguistic magic upon you today. Your words land with precision and grace, healing where they touch. Use this gift wisely — what you communicate now echoes far into the future.",
    "A symphony of synapses fires in perfect rhythm. Today you are the bridge between worlds — connecting people, ideas, and possibilities that were waiting for your spark. Embrace your role as cosmic messenger.",
    "Your characteristic adaptability becomes luminous flexibility today. Where others see obstacles, you see doorways. Every change in plans is the universe rerouting you toward something more magnificent.",
    "The celestial twins whisper secrets of sacred duality. Hold both joy and depth, lightness and meaning. Today you prove that complexity is not confusion — it is richness beyond measure.",
    "A literary wind blows through your chart, stirring creative expression to new heights. Whether journaling, texting, or storytelling over dinner, your words today are woven with cosmic thread.",
    "Mercury retrograde cannot touch you today — your mental agility outpaces any planetary mischief. Clarity comes in flashes of silver-bright insight. Trust your quickest, most instinctive thoughts.",
  ],
  Cancer: [
    "The Moon, your celestial guardian, cradles your heart in luminous tenderness today. Your intuition is a deep, clear well — draw from it freely. A moment of emotional honesty creates ripples of healing.",
    "Tidal waves of compassion flow through your chart, connecting you to the collective heart. Your nurturing instincts are perfectly calibrated today. Someone close to you needs exactly the warmth only you can give.",
    "Your inner sanctuary glows with pearlescent light today. The cosmos invites you to retreat into your shell — not from fear, but from sacred self-care. What you nurture in private grows powerful in public.",
    "A silvery thread of intuition guides every step today. Trust the feelings that arise before breakfast, the dreams that linger past waking. Your emotional intelligence is your most valuable currency.",
    "The cosmic crab carries its home wherever it goes, and today that home radiates extraordinary warmth. Your presence alone is healing to those around you. Domestic magic — cooking, decorating, gathering — carries extra potency.",
    "Lunar tides pull ancient wisdom to the surface of your consciousness. Memories become medicine today. A conversation about the past unlocks a profound understanding of the present.",
    "Today your empathic gifts are amplified to exquisite sensitivity. Set boundaries like prayer beads — each one sacred, each one protecting your ability to love fully. Your 'no' empowers your deepest 'yes.'",
    "The ocean of your emotional depth reveals hidden pearls today. Dive beneath surface concerns to find the treasure that's been forming in the darkness. What emerges is both beautiful and hard-won.",
    "Maternal cosmic energy floods your chart with protective grace. Whether nurturing a project, a person, or yourself — your care creates miracles today. The smallest gesture of tenderness carries enormous power.",
    "A waxing current of emotional clarity illuminates your innermost landscape. What felt confusing last week now reveals its perfect logic. Trust the heart's intelligence — it speaks a language the mind is still learning.",
    "Your shell becomes a chrysalis today, dear Cancer. Something beautiful is transforming within you. Honor the in-between — the becoming is as sacred as the bloom.",
    "The Moon weaves silver light through every interaction today. Your sensitivity is not weakness but a rare and precious frequency. Those attuned to beauty will recognize your signal immediately.",
  ],
  Leo: [
    "Your solar radiance blazes at full magnitude today, illuminating everything you touch with golden warmth. The stage is yours — not for performance, but for authentic self-expression that inspires others to find their own light.",
    "The cosmic lion's heart beats with magnificent generosity today. Your warmth draws people into your orbit like planets around the Sun. Lead with love, and the crown adjusts itself upon your head.",
    "Creative fire roars through your chart, demanding expression. Whether through art, conversation, or simply the way you walk into a room — today you are a living masterpiece. Let yourself be seen, fully and unapologetically.",
    "Royal planetary alignments honor your sign with extra brilliance. Today you shine not by trying, but by being. Your natural confidence opens doors that no key could — walk through them with grace.",
    "The Sun, your ruling star, aligns with your deepest desires today. What your heart has been quietly wanting suddenly feels possible and near. Announce your intentions to the universe — it responds to your certainty.",
    "Golden abundance cascades through your chart like summer sunlight. Creativity, romance, and joy are not separate today — they merge into one radiant stream. Follow the warmth.",
    "A majestic alignment empowers your natural leadership. People look to you today not because you demand it, but because your light is impossible to ignore. Use this visibility to elevate everyone around you.",
    "The celestial lion stretches luxuriously under a canopy of favorable stars. Today is for savoring — rich conversations, beautiful spaces, meaningful recognition. You've earned every golden moment.",
    "Your personal magnetism reaches peak intensity today. Hearts and opportunities orient toward you like sunflowers tracking the light. Accept admiration gracefully — it nourishes your ability to give even more.",
    "Dramatic cosmic currents sweep through your chart, but this is your kind of drama — theatrical, beautiful, and deeply meaningful. Embrace the grand gesture. Today, subtlety is overrated.",
    "The universe conspires to celebrate you today, Leo. Small victories accumulate into a symphony of validation. Let yourself roar with joy — your happiness gives others permission to find theirs.",
    "Solar flares of inspiration illuminate your creative chambers. What you imagine today has the power to become real. Sketch it, speak it, begin it — the cosmos is your co-creator.",
  ],
  Virgo: [
    "Mercury's analytical grace meets divine intuition in your chart today. Your gift for seeing patterns reveals something hidden in plain sight. Trust your meticulous mind — it's leading you toward a breakthrough wrapped in simplicity.",
    "The cosmic healer within you awakens with extraordinary clarity. Today, your precision becomes a form of love — every detail you tend to is an offering to the sacred. Small acts carry enormous significance.",
    "A pristine clarity descends upon your consciousness today like morning dew. The clutter — mental, emotional, physical — becomes suddenly obvious and easy to release. What remains is essential and beautiful.",
    "Your earthy wisdom blooms with quiet authority today. While the world chases spectacle, you cultivate substance. The universe rewards your devotion to craft with a moment of pure, satisfying mastery.",
    "Celestial order aligns with your innate desire for harmony. Systems you've been refining click into place with satisfying precision. Today, efficiency is not cold — it's the most elegant form of care.",
    "The maiden of the zodiac holds a sheaf of golden wheat — today, it's harvest time. What you've carefully tended now bears fruit. Allow yourself to enjoy the abundance your diligence has created.",
    "Mercury illuminates the intersection of heart and mind today. Your analytical nature doesn't diminish your depth — it deepens it. Solutions that honor both logic and feeling emerge with graceful ease.",
    "A quiet revolution stirs in your chart. Small, mindful adjustments today create cascading improvements throughout your life. You understand what others overlook: transformation begins in the details.",
    "Your perfectionism transforms into artistry today, dear Virgo. Every task becomes a canvas for excellence. The world needs your discerning eye — bring beauty to the ordinary and watch it become extraordinary.",
    "Healing planetary aspects activate your natural wellness instincts. Body, mind, and spirit seek integration today. The ritual of self-care — however humble — becomes profoundly regenerative.",
    "The cosmos honors the service you provide so selflessly. Today, let the universe serve you. Accept help, receive compliments, rest without justification. Your worth is not measured in output.",
    "Mercurial wisdom flows through your hands today — everything you touch improves. Whether organizing a closet or restructuring a dream, your gift for refinement is cosmically amplified. Trust your process.",
  ],
  Libra: [
    "Venus paints your day in rose gold and soft lilac, dear Libra. Beauty is not just around you — it flows through you, coloring every interaction with grace. Today, your natural diplomacy resolves what force could never untangle.",
    "The cosmic scales find their perfect point of balance today. Decisions that felt impossible suddenly reveal their elegant solution. Trust the equilibrium you feel in your body — it reflects celestial truth.",
    "Your aesthetic sense is cosmically supercharged today. You don't just see beauty — you create it wherever you go. Partnerships glow with renewed warmth, and even challenging conversations find harmonious resolution.",
    "A silk thread of Venusian grace connects your heart to every encounter today. Your charm is not manipulation — it's the universe's way of softening the world through you. Let your sweetness be its own strength.",
    "Relational alchemy is yours today, Libra. You transform conflicts into connections with an ease that borders on magical. The stars remind you: your gift for peace is not passive — it's profoundly powerful.",
    "The celestial scales tip toward joy today, spilling golden light into your creative and romantic spheres. Indulge in what delights you without apology. Pleasure is not a distraction — it's your compass.",
    "Venus bestows an extra measure of her legendary charm upon you today. Negotiations, creative projects, and romantic encounters all benefit from your heightened ability to find the sweet spot. Trust your taste.",
    "A harmonious planetary chord resonates through your chart, creating opportunities for meaningful partnership. Today, 'we' is more powerful than 'I.' Collaborate, co-create, commune — your best ideas emerge from connection.",
    "Your innate sense of justice becomes cosmically amplified today. The right thing and the beautiful thing are one and the same. When you follow your aesthetic instinct, you inadvertently serve the greater good.",
    "Balanced cosmic energies pour through your sign like champagne — effervescent, golden, celebratory. Today deserves a toast. What you've been working to harmonize finally sings in perfect accord.",
    "The mirror of relationship reflects your most radiant self today. See yourself through the eyes of those who love you. The image is more accurate than the one your inner critic offers.",
    "A Venusian renaissance illuminates your chart. Art, beauty, and connection are not luxuries today — they are necessities of the soul. Design your hours like a gallery curator: only what moves you deserves space.",
  ],
  Scorpio: [
    "Plutonian depths call you toward profound transformation today. What others fear to face, you alchemize into power. A truth surfaces that has been waiting in the shadows — receive it as the gift it is.",
    "The cosmic phoenix stirs within your chart, ancient wings unfurling. Today, something you thought was finished reveals it was merely chrysalis. The rebirth is more beautiful than anything that came before.",
    "Your legendary intensity becomes laser-focused clarity today. Penetrating insights cut through illusion like a diamond through glass. Use this perception wisely — what you see, you cannot unsee, but understanding brings peace.",
    "Deep underground rivers of emotion carry precious stones to the surface today. Your vulnerability is not weakness — it's the bravest thing in any room. What you share from your depths resonates at a frequency that heals.",
    "Scorpio's gift for metamorphosis reaches its apex today. Let go of what has completed its cycle with the dignity it deserves. The void that remains is not empty — it's pregnant with possibility.",
    "Magnetic currents intensify around your sign, drawing truth and opportunity from hidden places. Trust the pull — even when it leads somewhere unexpected. Your instinct for the essential is impeccable today.",
    "Pluto whispers secrets of regeneration through your chart. Wounds that seemed permanent begin their sacred mending today. The scar becomes a story of resilience — wear it like an heirloom.",
    "A cauldron of transformative energy bubbles in your cosmic kitchen. Today you are both alchemist and ingredient — changing and being changed. The gold that emerges is earned, authentic, and entirely yours.",
    "Your psychic antennae are exquisitely tuned today. You sense what remains unspoken, feel what hides beneath the surface. This gift of perception is your birthright — use it with compassion, and it becomes love.",
    "The eagle aspect of Scorpio soars today, granting you perspective that only altitude provides. From up here, the pattern makes perfect sense. What seemed like chaos below is actually choreography.",
    "Intimate connections carry extraordinary depth today. A conversation that begins ordinarily may descend into territory that changes everything. Welcome the depth — you were built for these waters.",
    "Cosmic intensity wraps around you like a velvet cloak today. Your presence is felt before you speak. Use this magnetism to draw what serves your highest evolution — release the rest like smoke into wind.",
  ],
  Sagittarius: [
    "Jupiter's expansive laughter echoes through your chart today, opening doors you didn't know existed. Your natural optimism is not naïveté — it's cosmic intelligence. The universe rewards those who believe in the grand adventure.",
    "The celestial archer draws back the bowstring with exquisite focus today. Your aim is true. Release your arrow of intention and watch it fly — it knows the target better than you do.",
    "Wanderlust of the soul stirs within you, seeking not miles but meaning. Today brings wisdom wrapped in unexpected packaging — a stranger's comment, a sudden insight, a book falling open to the right page.",
    "Jupiterian abundance overflows in your chart, manifesting as generosity of spirit, wealth of ideas, and richness of experience. Today, more is more. Expand, explore, embrace.",
    "Your philosophical nature sparkles with practical wisdom today. Grand theories find ground-level application. Share your vision — it's not too big, too idealistic, or too bold. It's exactly the size the world needs.",
    "The cosmic centaur gallops toward the horizon with unbridled joy today. Every ending is a beginning, every border is a doorway. Your freedom-loving heart finds exactly the adventure it craves.",
    "Fire-tipped arrows of inspiration streak across your mental sky. Capture these shooting stars before they pass — journal, voice memo, napkin sketch — whatever it takes. Today's visions are tomorrow's reality.",
    "Jupiter opens the atlas of possibility and points directly at your chart. Travel — whether physical, intellectual, or spiritual — transforms you today. Cross a threshold you've been circling. The other side is magnificent.",
    "Your truth-telling gift becomes especially potent today. Honesty delivered with your natural warmth doesn't wound — it liberates. Say what needs to be said. The right people will thank you for your courage.",
    "A festive current runs through your hours, turning the mundane into celebration. Your infectious enthusiasm reminds everyone that life is meant to be enjoyed. Be the permission slip others need to lighten up.",
    "Sagittarian fire illuminates the philosophical corners of your chart. Questions matter more than answers today. The quest itself — curious, joyful, unending — is the treasure you've been seeking.",
    "The great benefic Jupiter showers your sign with blessings that arrive as invitations, chances, and happy accidents. Say yes more than no today. The universe is throwing you a cosmic party — attend with wild enthusiasm.",
  ],
  Capricorn: [
    "Saturn's ancient wisdom meets fresh ambition in your chart today. The mountain goat finds a new, more elegant path upward — not harder, but smarter. Your patience is about to be spectacularly rewarded.",
    "Crystalline determination infuses your every action today. What you build now has the permanence of stone and the beauty of cathedral architecture. The cosmos honors your commitment to excellence.",
    "Your earthy pragmatism is shot through with threads of golden intuition today. Trust the strategy that feels right in your bones. The most practical path and the most inspired path are the same today.",
    "The sea-goat surfaces from deep waters into clear mountain air today. Emotional intelligence and worldly ambition merge into unstoppable clarity. You're not just climbing — you're ascending.",
    "Saturn's rings align in your favor, creating structural support for your grandest plans. Today, lay foundations with the confidence that they will hold weight you can't yet imagine. Build for centuries.",
    "A quiet revolution unfolds in your chart — not dramatic, but deeply decisive. Your understated power moves mountains while others shout at walls. The world will notice the results, even if it missed the method.",
    "Capricorn's legendary discipline becomes joyful devotion today. The work is the meditation, the effort is the prayer, and the structure is the art. Find pleasure in your mastery — you've earned it.",
    "Ancient planetary wisdom channels through your sign with unusual potency. Elders, mentors, and traditions carry messages meant specifically for you today. The past has a gift for your future.",
    "Your ambition wears a crown of compassion today. Leading with both strength and sensitivity, you discover that true authority is earned through service. Others follow because you care, not because you command.",
    "Mountain air fills your chart with clarity and purpose. From your hard-won vantage point, the landscape of possibility unfolds in breathtaking detail. Strategic decisions made today echo for years.",
    "The cosmos acknowledges your tireless efforts with a day of tangible progress. What was invisible becomes visible. What was planned becomes real. The architecture of your dreams takes shape before your eyes.",
    "Saturnian blessings arrive in their preferred form today: earned, substantial, and enduring. A milestone reached or a recognition received confirms what you've always known — slow and steady builds empires.",
  ],
  Aquarius: [
    "Uranian lightning illuminates your chart with revolutionary clarity today. Your vision of the future is not fantasy — it's prophecy. Share your electric ideas with those brave enough to receive them.",
    "The water bearer pours innovation into the collective stream today. Your unique perspective is exactly what a situation requires. Don't dilute your eccentricity — amplify it. The world is ready.",
    "A frequency only Aquarius can detect pulses through the cosmic web today. You're receiving downloads from the future — flashes of insight that won't make sense to others for months. Trust and record them.",
    "Your humanitarian heart beats in rhythm with the cosmos today. Acts of community, connection, and collective care carry unusual power. You're not just helping individuals — you're shifting paradigms.",
    "Uranus sparks brilliance in the most unexpected neural pathways today. Solutions arrive sideways, upside-down, and perfectly effective. Your unconventional approach is the algorithm the universe was searching for.",
    "The cosmic rebel finds their cause today — not through anger, but through visionary compassion. Your ability to imagine better systems, kinder structures, and freer futures is your greatest gift. Use it.",
    "Electric blue currents of inspiration course through your chart. Technology, art, and social connection intersect in fascinating ways today. You are the bridge between what is and what could be.",
    "Your detachment becomes a superpower today — not cold, but clarifying. From this elevated vantage point, you see solutions invisible to those tangled in emotion. Offer your perspective as a gift, not a critique.",
    "Aquarian individuality shines like a beacon in a world of conformity. Today, your weirdness is your wisdom. The thing that makes you different is the thing that makes you essential.",
    "A wave of collective consciousness carries fresh insight to your shores. You understand something about humanity today that few can articulate. This understanding is both your burden and your sacred mission.",
    "Futuristic energy crackles through your chart like a Tesla coil. Inventions, innovations, and inspired connections spark in rapid succession. Ground these electric visions with at least one concrete action.",
    "The universe celebrates your refusal to be ordinary today. Every convention you question, every norm you reimagine, creates space for others to breathe. Your freedom is contagious — spread it generously.",
  ],
  Pisces: [
    "Neptune's ethereal mist parts to reveal crystalline beauty in your chart today. Your dreams are not escapes — they are previews of coming attractions. What you feel in your soul is already taking form in the world.",
    "The cosmic fish swims between realms today, carrying wisdom from the depths to the surface. Your intuition speaks in poetry, painting, and sudden knowing. Trust the images that float across your inner ocean.",
    "A symphony of compassion plays through your chart, each note a prayer, each rest a healing silence. Your empathy is the rarest medicine — apply it first to yourself, then watch it overflow to others.",
    "Piscean magic intensifies today, blurring the line between imagination and reality in the most beautiful way. What you visualize with clarity has unusual power to manifest. Dream deliberately and lavishly.",
    "The veil between worlds thins around your sign today, granting access to creative and spiritual dimensions others can only imagine. Channel what you receive into something tangible — art, music, words, kindness.",
    "Neptune crowns you with iridescent intuition today. Your sensitivity is not oversensitivity — it's the frequency of the divine made human. Honor every feeling as a message from the cosmos.",
    "Oceanic depths of emotion and creativity converge in your chart. Today, let yourself be moved — by beauty, by sorrow, by the sheer miracle of existence. Your willingness to feel fully is your greatest art.",
    "The two fish swim in sacred spiral today, uniting your earthly and celestial natures. Spiritual insights find practical expression; daily routines become rituals. Everything is imbued with meaning when you pay attention.",
    "Your psychic gifts reach a luminous peak today. Pay attention to synchronicities, repeated symbols, and the inexplicable pull of certain ideas. The universe is writing you a love letter in invisible ink — you can read it.",
    "A tidal wave of creative inspiration floods your chart with colors unnamed in any language. Don't analyze — simply create. What emerges will surprise you with its beauty and its truth.",
    "The cosmic ocean holds you in its vast, gentle embrace today. Surrender the need to control and let yourself float. The current knows where to carry you. Trust is your compass; love is your anchor.",
    "Neptunian grace makes everything shimmer with hidden significance today. A stranger's smile, a cloud formation, a song heard in passing — the universe communicates through beauty, and you speak this language fluently.",
  ],
};

// ---------------------------------------------------------------------------
// Do / Don't Templates
// ---------------------------------------------------------------------------

const DO_TEMPLATES: readonly string[] = [
  "Follow the impulse that makes your heart beat faster",
  "Send a message to someone you've been thinking about",
  "Begin the creative project whispering in your soul",
  "Invest in a moment of luxurious self-care",
  "Write down three things you're genuinely grateful for",
  "Speak your truth with warmth and conviction",
  "Trust your body's wisdom about what it needs",
  "Create something beautiful, even if no one sees it",
  "Set a boundary that protects your peace",
  "Take the scenic route and notice the details",
  "Make a decision you've been postponing",
  "Offer genuine praise to someone who deserves it",
  "Reconnect with a practice that nourishes your spirit",
  "Share your vision with someone who believes in you",
  "Move your body in a way that brings you joy",
  "Spend time in nature, even briefly — the earth grounds you",
  "Invest energy in your most important relationship",
  "Begin something without waiting for perfect conditions",
  "Choose depth over breadth in today's conversations",
  "Wear something that makes you feel luminous",
  "Cook something nourishing with love and intention",
  "Read something that expands your perspective",
  "Listen to music that elevates your frequency",
  "Practice radical honesty with yourself today",
  "Celebrate a small win — they compound into greatness",
  "Tend to your home space as an act of self-love",
  "Forgive someone quietly, starting with yourself",
  "Plant a seed — literal or metaphorical — it will grow",
  "Allow yourself to feel deeply without judgment",
  "Make art out of today's ordinary moments",
  "Ask for help — it's an act of courage, not weakness",
  "Savor your meals slowly and with full presence",
  "Let curiosity lead you somewhere unexpected today",
  "Express affection generously and without condition",
  "Protect your morning hours — they set the cosmic tone",
  "Journal about what your future self would tell you",
];

const DONT_TEMPLATES: readonly string[] = [
  "Resist the urge to rush — cosmic timing is perfect",
  "Avoid dimming your light to make others comfortable",
  "Don't make permanent decisions based on temporary emotions",
  "Resist comparing your chapter three to someone else's chapter twenty",
  "Avoid overexplaining yourself — your 'no' is a complete sentence",
  "Don't ignore the fatigue whispering for rest",
  "Resist the temptation to people-please at your own expense",
  "Avoid starting difficult conversations via text today",
  "Don't let perfectionism steal your momentum",
  "Resist replaying yesterday's mistakes — they're already composting into wisdom",
  "Avoid overscheduling your evening — space is where magic lives",
  "Don't dismiss a compliment — receive it like sunlight",
  "Resist the impulse to fix what isn't broken",
  "Avoid gossip — your words carry extra weight today",
  "Don't suppress the emotion rising in your chest — let it pass through",
  "Resist multitasking during meaningful conversations",
  "Avoid making financial decisions from a place of anxiety",
  "Don't underestimate the power of a good night's rest",
  "Resist offering advice when someone simply needs to be heard",
  "Avoid abandoning plans at the first sign of difficulty",
  "Don't let the urgent crowd out the important",
  "Resist checking your phone first thing upon waking",
  "Avoid saying yes out of obligation rather than desire",
  "Don't minimize your accomplishments — they matter",
  "Resist the gravitational pull of negativity online",
  "Avoid skipping meals — your body is your temple today",
  "Don't wait for external validation to begin",
  "Resist the narrative that you need to earn rest",
  "Avoid engaging with energy vampires — protect your aura",
  "Don't confuse being busy with being productive",
  "Resist taking on other people's emotions as your own",
  "Avoid making promises you can't joyfully keep",
  "Don't second-guess the decision you made with full presence",
  "Resist the illusion that you're behind — you're perfectly placed",
  "Avoid emotional eating — pause and ask what you truly hunger for",
  "Don't force closure where the story is still unfolding",
];

// ---------------------------------------------------------------------------
// Transit Templates
// ---------------------------------------------------------------------------

interface TransitTemplate {
  label: string;
  symbol: string;
  descriptions: readonly string[];
}

const TRANSIT_TEMPLATES: readonly TransitTemplate[] = [
  {
    label: 'Moon in Aries',
    symbol: '☽',
    descriptions: [
      "Emotional courage surges — act on what you feel before the mind intervenes",
      "Fiery lunar energy sparks bold emotional declarations",
      "Your feelings burn bright and clear; honor their urgency",
    ],
  },
  {
    label: 'Moon in Pisces',
    symbol: '☽',
    descriptions: [
      "The veil thins between intuition and insight — trust your inner tides",
      "Dreamy lunar currents heighten creativity and empathy",
      "Your emotional world becomes a gateway to the mystical",
    ],
  },
  {
    label: 'Venus trine Jupiter',
    symbol: '♀',
    descriptions: [
      "Love expands beyond boundaries — expect warmth from unexpected quarters",
      "Abundance flows through relationships and creative pursuits",
      "A golden aspect of grace amplifies beauty in every connection",
    ],
  },
  {
    label: 'Mercury in Aquarius',
    symbol: '☿',
    descriptions: [
      "Thoughts turn electric — brilliant ideas arrive from the future",
      "Communication becomes inventive and refreshingly unconventional",
      "Your mind downloads revolutionary insights — capture them quickly",
    ],
  },
  {
    label: 'Mars sextile Neptune',
    symbol: '♂',
    descriptions: [
      "Inspired action flows effortlessly — follow the creative current",
      "Warrior energy meets mystic vision in a powerful creative dance",
      "Your drive is infused with spiritual purpose today",
    ],
  },
  {
    label: 'Sun conjunct Pluto',
    symbol: '☉',
    descriptions: [
      "Profound transformation emerges from the core of your being",
      "Deep personal power surfaces — use it to regenerate, not dominate",
      "Identity undergoes a quiet metamorphosis that others will notice before you do",
    ],
  },
  {
    label: 'Jupiter in Taurus',
    symbol: '♃',
    descriptions: [
      "Material abundance meets spiritual contentment — savor both equally",
      "Expansion happens through patience and sensory delight",
      "The great benefic grows your garden slowly but magnificently",
    ],
  },
  {
    label: 'Saturn trine Moon',
    symbol: '♄',
    descriptions: [
      "Emotional maturity becomes your quiet superpower today",
      "Structure and feeling find rare harmony — build from the heart",
      "Steady emotional foundations support ambitious dreams",
    ],
  },
  {
    label: 'Venus in Capricorn',
    symbol: '♀',
    descriptions: [
      "Love takes its most committed, elegant form — quality over intensity",
      "Relationships benefit from mature devotion and patient tenderness",
      "Beauty reveals itself through discipline and enduring craftsmanship",
    ],
  },
  {
    label: 'Mercury square Mars',
    symbol: '☿',
    descriptions: [
      "Words carry sharp edges — choose precision over speed in conversations",
      "Mental friction generates brilliant insights if channeled thoughtfully",
      "Debate energizes your mind but guard against unnecessary conflict",
    ],
  },
  {
    label: 'Neptune sextile Pluto',
    symbol: '♆',
    descriptions: [
      "Collective spiritual evolution hums beneath the surface of daily life",
      "Dreams carry transformative messages — pay attention to symbols",
      "A generational current of healing flows through personal encounters",
    ],
  },
  {
    label: 'Uranus trine Sun',
    symbol: '♅',
    descriptions: [
      "Breakthrough energy arrives as exhilarating freedom and clarity",
      "Your authentic self blazes through convention with irresistible charm",
      "Innovation and identity merge — you become the change you envision",
    ],
  },
  {
    label: 'Mars in Scorpio',
    symbol: '♂',
    descriptions: [
      "Willpower reaches obsidian intensity — focus it on what truly matters",
      "Strategic action from the depths produces unstoppable momentum",
      "Your drive transforms into a laser of purposeful, magnetic intention",
    ],
  },
  {
    label: 'Moon conjunct Venus',
    symbol: '☽',
    descriptions: [
      "Heart and soul align in a tender embrace — love flows effortlessly",
      "Emotional beauty infuses every interaction with Venusian grace",
      "Your aesthetic sense and emotional truth speak the same language today",
    ],
  },
  {
    label: 'Sun trine Jupiter',
    symbol: '☉',
    descriptions: [
      "Optimism is cosmically justified — the universe genuinely has your back today",
      "Your vitality and vision expand together in golden proportion",
      "Opportunities arrive dressed in enthusiasm and warmth",
    ],
  },
  {
    label: 'Mercury trine Neptune',
    symbol: '☿',
    descriptions: [
      "Words become poetry naturally — express yourself from the soul",
      "Intuitive thinking and logical clarity unite in rare harmony",
      "Communication transcends the literal and touches the sublime",
    ],
  },
  {
    label: 'Venus square Saturn',
    symbol: '♀',
    descriptions: [
      "Love asks for maturity today — tenderness tempered by honest boundaries",
      "Relationships deepen through the willingness to face uncomfortable truths",
      "Beauty that endures requires the patience to be shaped by time",
    ],
  },
  {
    label: 'Jupiter sextile Saturn',
    symbol: '♃',
    descriptions: [
      "Expansion and structure dance together — dream big, build solid",
      "Wisdom bridges the gap between ambition and discipline today",
      "The best of both worlds: visionary faith and practical mastery",
    ],
  },
];

// ---------------------------------------------------------------------------
// Lucky Colors, Times
// ---------------------------------------------------------------------------

const LUCKY_COLORS: readonly string[] = [
  'Celestial Gold', 'Rose Quartz Pink', 'Midnight Sapphire', 'Amber Honey',
  'Moonstone Silver', 'Deep Amethyst', 'Emerald Forest', 'Copper Sunset',
  'Pearl White', 'Obsidian Black', 'Champagne Blush', 'Indigo Twilight',
  'Crimson Velvet', 'Sage Mist', 'Burnt Sienna', 'Lavender Haze',
  'Opal Iridescent', 'Teal Ocean', 'Ivory Dream', 'Malachite Green',
  'Dusty Mauve', 'Arctic Blue', 'Warm Terracotta', 'Golden Saffron',
];

const LUCKY_TIMES: readonly string[] = [
  '6:11 AM — the golden hour of intention',
  '7:33 AM — when the morning star peaks',
  '8:08 AM — a portal of cosmic alignment',
  "9:22 AM — Mercury's window of clarity",
  '10:10 AM — mirror hour of manifestation',
  "11:11 AM — the universe's whisper",
  '12:12 PM — solar zenith of power',
  '1:44 PM — afternoon wave of inspiration',
  '2:22 PM — angelic frequency activation',
  '3:33 PM — the trinity hour of creation',
  '4:44 PM — a window for grounding magic',
  '5:55 PM — twilight portal of transformation',
  '6:30 PM — Venus hour of connection',
  '7:07 PM — evening star illumination',
  '8:18 PM — lunar embrace of intuition',
  "9:09 PM — Neptune's dreamtime portal",
  '10:10 PM — cosmic reflection hour',
  '11:01 PM — the mystic midnight approach',
];

// ---------------------------------------------------------------------------
// Moon Phase Calculator (approximation)
// ---------------------------------------------------------------------------

function getMoonPhase(date: Date): MoonPhaseInfo {
  // Known new moon: Jan 6, 2000
  const knownNewMoon = new Date(2000, 0, 6, 18, 14);
  const lunarCycle = 29.53058770576;
  const diffDays = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const phase = ((diffDays % lunarCycle) + lunarCycle) % lunarCycle;
  const illumination = Math.round((1 - Math.cos((phase / lunarCycle) * 2 * Math.PI)) / 2 * 100);

  if (phase < 1.85) return { name: 'New Moon', emoji: '🌑', illumination, guidance: 'Set intentions in the fertile darkness — seeds planted now carry extraordinary potential.' };
  if (phase < 7.38) return { name: 'Waxing Crescent', emoji: '🌒', illumination, guidance: 'Tender shoots of intention emerge — nurture your dreams with gentle, consistent action.' };
  if (phase < 9.23) return { name: 'First Quarter', emoji: '🌓', illumination, guidance: 'Challenges refine your resolve. Push through resistance — the cosmos tests your commitment to grow.' };
  if (phase < 14.77) return { name: 'Waxing Gibbous', emoji: '🌔', illumination, guidance: 'Refinement phase — adjust, polish, and prepare. Culmination approaches with building luminosity.' };
  if (phase < 16.61) return { name: 'Full Moon', emoji: '🌕', illumination, guidance: 'Maximum illumination reveals what was hidden. Celebrate fruition and release what no longer serves.' };
  if (phase < 22.15) return { name: 'Waning Gibbous', emoji: '🌖', illumination, guidance: 'Share the harvest of your wisdom. Gratitude amplifies abundance — give freely from your overflow.' };
  if (phase < 24.00) return { name: 'Last Quarter', emoji: '🌗', illumination, guidance: 'Release and forgive. Clear space for the next cycle — let go with grace and trust.' };
  return { name: 'Waning Crescent', emoji: '🌘', illumination, guidance: 'Rest in the cosmic dark. Surrender control and allow the universe to prepare your next chapter.' };
}

// ---------------------------------------------------------------------------
// Main Generator
// ---------------------------------------------------------------------------

export function generateDailyReadingForSign(
  zodiacSign: ZodiacSign,
  dateStr: string, // YYYY-MM-DD
): GeneratedDailyReading {
  const rng = createRng(zodiacSign, dateStr);
  const date = new Date(dateStr + 'T12:00:00Z');
  const dayOfYear = getDayOfYear(date);

  // --- Energy Score (1–10) weighted by sign element cycle ---
  const baseEnergy = Math.floor(rng() * 5) + 4; // 4–8 base
  const elementBonus = rng() > 0.6 ? 1 : 0;
  const cosmicBonus = rng() > 0.8 ? 1 : 0;
  const energyScore = Math.min(10, Math.max(1, baseEnergy + elementBonus + cosmicBonus));

  // --- Briefing (rotated by day of year) ---
  const templates = BRIEFING_TEMPLATES[zodiacSign];
  const briefingIndex = dayOfYear % templates.length;
  const briefing = templates[briefingIndex];

  // --- Do / Don't ---
  const dos = pickN(DO_TEMPLATES, 2, rng) as [string, string];
  const donts = pickN(DONT_TEMPLATES, 2, rng) as [string, string];

  // --- Transits ---
  const selectedTransits = pickN(TRANSIT_TEMPLATES, 3, rng);
  const transits = selectedTransits.map((t) => ({
    label: t.label,
    symbol: t.symbol,
    description: pick(t.descriptions, rng),
  })) as [TransitHighlight, TransitHighlight, TransitHighlight];

  // --- Lucky elements ---
  const luckyColor = pick(LUCKY_COLORS, rng);
  const luckyNumber = Math.floor(rng() * 99) + 1;
  const luckyTime = pick(LUCKY_TIMES, rng);

  // --- Compatibility ---
  const element = SIGN_ELEMENT[zodiacSign];
  const compatElements = ELEMENT_COMPAT[element];
  const compatSigns = ZODIAC_SIGNS.filter(
    (s) => s !== zodiacSign && compatElements.includes(SIGN_ELEMENT[s])
  );
  const shuffledCompat = [...compatSigns].sort(() => rng() - 0.5);
  const compatibility = {
    best: shuffledCompat[0],
    rising: shuffledCompat[1],
  };

  // --- Moon Phase ---
  const moonPhase = getMoonPhase(date);

  return {
    date: dateStr,
    zodiacSign,
    energyScore,
    briefing,
    dos,
    donts,
    transits,
    luckyColor,
    luckyNumber,
    luckyTime,
    compatibility,
    moonPhase,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Convenience: get today's reading for a sign
// ---------------------------------------------------------------------------

export function getTodayReadingForSign(zodiacSign: ZodiacSign): GeneratedDailyReading {
  const today = new Date().toISOString().split('T')[0];
  return generateDailyReadingForSign(zodiacSign, today);
}
