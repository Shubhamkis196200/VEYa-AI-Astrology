// ============================================================================
// VEYa Tarot Card Database — Full 78-Card Deck
// ============================================================================

export interface TarotCard {
  id: number;
  name: string;
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number: number;
  emoji: string;
  keywords: string[];
  upright: string;
  reversed: string;
  element?: string;
  planet?: string;
  zodiac?: string;
}

// ---------------------------------------------------------------------------
// Major Arcana (22 cards)
// ---------------------------------------------------------------------------

const MAJOR_ARCANA: TarotCard[] = [
  { id: 0, name: 'The Fool', arcana: 'major', number: 0, emoji: '🃏', keywords: ['beginnings', 'innocence', 'spontaneity', 'free spirit'], upright: 'New beginnings, innocence, spontaneity, and a free spirit. Trust the journey ahead.', reversed: 'Holding back, recklessness, risk-taking without thought.', element: 'Air', planet: 'Uranus' },
  { id: 1, name: 'The Magician', arcana: 'major', number: 1, emoji: '🪄', keywords: ['manifestation', 'resourcefulness', 'power', 'inspired action'], upright: 'Manifestation, resourcefulness, power, and inspired action. You have everything you need.', reversed: 'Manipulation, poor planning, untapped talents.', element: 'Air', planet: 'Mercury' },
  { id: 2, name: 'The High Priestess', arcana: 'major', number: 2, emoji: '🌙', keywords: ['intuition', 'sacred knowledge', 'divine feminine', 'subconscious'], upright: 'Intuition, sacred knowledge, and the subconscious mind. Trust your inner voice.', reversed: 'Secrets, disconnected from intuition, withdrawal.', element: 'Water', planet: 'Moon' },
  { id: 3, name: 'The Empress', arcana: 'major', number: 3, emoji: '👑', keywords: ['femininity', 'beauty', 'nature', 'abundance'], upright: 'Femininity, beauty, nature, and abundance. Nurture yourself and others.', reversed: 'Creative block, dependence on others, emptiness.', element: 'Earth', planet: 'Venus' },
  { id: 4, name: 'The Emperor', arcana: 'major', number: 4, emoji: '🏛️', keywords: ['authority', 'establishment', 'structure', 'father figure'], upright: 'Authority, structure, and a solid foundation. Take charge of your path.', reversed: 'Domination, excessive control, lack of discipline.', element: 'Fire', zodiac: 'Aries' },
  { id: 5, name: 'The Hierophant', arcana: 'major', number: 5, emoji: '📿', keywords: ['spiritual wisdom', 'tradition', 'conformity', 'mentorship'], upright: 'Spiritual wisdom, tradition, and guidance from a mentor. Seek deeper meaning.', reversed: 'Personal beliefs, freedom, challenging the status quo.', element: 'Earth', zodiac: 'Taurus' },
  { id: 6, name: 'The Lovers', arcana: 'major', number: 6, emoji: '💕', keywords: ['love', 'harmony', 'relationships', 'values alignment'], upright: 'Love, harmony, relationships, and alignment of values. A meaningful connection.', reversed: 'Self-love, disharmony, imbalance, misalignment of values.', element: 'Air', zodiac: 'Gemini' },
  { id: 7, name: 'The Chariot', arcana: 'major', number: 7, emoji: '🏎️', keywords: ['control', 'willpower', 'success', 'determination'], upright: 'Control, willpower, success, and determination. Victory through inner strength.', reversed: 'Self-discipline lacking, opposition, lack of direction.', element: 'Water', zodiac: 'Cancer' },
  { id: 8, name: 'Strength', arcana: 'major', number: 8, emoji: '🦁', keywords: ['strength', 'courage', 'persuasion', 'compassion'], upright: 'Inner strength, bravery, compassion, and quiet influence. Gentle power prevails.', reversed: 'Self-doubt, weakness, insecurity, raw emotion.', element: 'Fire', zodiac: 'Leo' },
  { id: 9, name: 'The Hermit', arcana: 'major', number: 9, emoji: '🏔️', keywords: ['soul-searching', 'introspection', 'inner guidance', 'solitude'], upright: 'Soul-searching, introspection, and inner guidance. The answers are within.', reversed: 'Isolation, loneliness, withdrawal from life.', element: 'Earth', zodiac: 'Virgo' },
  { id: 10, name: 'Wheel of Fortune', arcana: 'major', number: 10, emoji: '🎡', keywords: ['good luck', 'karma', 'life cycles', 'destiny'], upright: 'Good luck, karma, life cycles, and destiny turning in your favor.', reversed: 'Bad luck, resistance to change, breaking cycles.', element: 'Fire', planet: 'Jupiter' },
  { id: 11, name: 'Justice', arcana: 'major', number: 11, emoji: '⚖️', keywords: ['justice', 'fairness', 'truth', 'cause and effect'], upright: 'Justice, fairness, truth, and accountability. What you put out returns to you.', reversed: 'Unfairness, lack of accountability, dishonesty.', element: 'Air', zodiac: 'Libra' },
  { id: 12, name: 'The Hanged Man', arcana: 'major', number: 12, emoji: '🙃', keywords: ['pause', 'surrender', 'new perspective', 'letting go'], upright: 'Pause, surrender, and seeing from a new perspective. Let go to move forward.', reversed: 'Delays, resistance, stalling, needless sacrifice.', element: 'Water', planet: 'Neptune' },
  { id: 13, name: 'Death', arcana: 'major', number: 13, emoji: '🦋', keywords: ['endings', 'change', 'transformation', 'transition'], upright: 'Endings, transformation, and transition. Something beautiful emerges from release.', reversed: 'Resistance to change, personal transformation delayed.', element: 'Water', zodiac: 'Scorpio' },
  { id: 14, name: 'Temperance', arcana: 'major', number: 14, emoji: '✨', keywords: ['balance', 'moderation', 'patience', 'purpose'], upright: 'Balance, moderation, patience, and finding your purpose. Harmony is the way.', reversed: 'Imbalance, excess, self-healing needed, realignment.', element: 'Fire', zodiac: 'Sagittarius' },
  { id: 15, name: 'The Devil', arcana: 'major', number: 15, emoji: '⛓️', keywords: ['shadow self', 'attachment', 'addiction', 'restriction'], upright: 'Shadow self, attachment, and restriction. Recognize what binds you to break free.', reversed: 'Releasing limiting beliefs, exploring dark thoughts, detachment.', element: 'Earth', zodiac: 'Capricorn' },
  { id: 16, name: 'The Tower', arcana: 'major', number: 16, emoji: '⚡', keywords: ['sudden change', 'upheaval', 'revelation', 'awakening'], upright: 'Sudden change, upheaval, and revelation. Destruction clears the way for truth.', reversed: 'Fear of change, averting disaster, delaying the inevitable.', element: 'Fire', planet: 'Mars' },
  { id: 17, name: 'The Star', arcana: 'major', number: 17, emoji: '⭐', keywords: ['hope', 'faith', 'renewal', 'serenity'], upright: 'Hope, faith, purpose, renewal, and serenity. Trust that you are guided.', reversed: 'Lack of faith, despair, self-trust issues, disconnection.', element: 'Air', zodiac: 'Aquarius' },
  { id: 18, name: 'The Moon', arcana: 'major', number: 18, emoji: '🌊', keywords: ['illusion', 'fear', 'anxiety', 'subconscious'], upright: 'Illusion, intuition, and the subconscious. Not everything is as it seems.', reversed: 'Release of fear, repressed emotion, inner confusion clearing.', element: 'Water', zodiac: 'Pisces' },
  { id: 19, name: 'The Sun', arcana: 'major', number: 19, emoji: '☀️', keywords: ['positivity', 'fun', 'warmth', 'success', 'vitality'], upright: 'Positivity, fun, warmth, success, and vitality. Joy radiates from within.', reversed: 'Inner child wounded, overly optimistic, temporary setback.', element: 'Fire', planet: 'Sun' },
  { id: 20, name: 'Judgement', arcana: 'major', number: 20, emoji: '📯', keywords: ['judgement', 'rebirth', 'inner calling', 'absolution'], upright: 'Judgement, rebirth, inner calling, and absolution. Answer your higher purpose.', reversed: 'Self-doubt, inner critic, ignoring the call.', element: 'Fire', planet: 'Pluto' },
  { id: 21, name: 'The World', arcana: 'major', number: 21, emoji: '🌍', keywords: ['completion', 'integration', 'accomplishment', 'travel'], upright: 'Completion, accomplishment, and wholeness. A beautiful cycle reaches its end.', reversed: 'Seeking personal closure, shortcuts, delays in completion.', element: 'Earth', planet: 'Saturn' },
];

// ---------------------------------------------------------------------------
// Minor Arcana — Helper to generate suits
// ---------------------------------------------------------------------------

const SUIT_CONFIG = {
  wands: { element: 'Fire', emoji: '🔥', keywords: ['passion', 'energy', 'creativity', 'ambition'] },
  cups: { element: 'Water', emoji: '💧', keywords: ['emotion', 'intuition', 'relationships', 'feelings'] },
  swords: { element: 'Air', emoji: '⚔️', keywords: ['intellect', 'truth', 'conflict', 'clarity'] },
  pentacles: { element: 'Earth', emoji: '🪙', keywords: ['material', 'practical', 'wealth', 'security'] },
} as const;

type SuitName = keyof typeof SUIT_CONFIG;

const CARD_MEANINGS: Record<SuitName, Array<{ name: string; upright: string; reversed: string; keywords: string[] }>> = {
  wands: [
    { name: 'Ace of Wands', upright: 'Inspiration, new opportunities, growth, potential. A spark of creative fire ignites.', reversed: 'An emerging idea not yet fully formed, delays, lack of direction.', keywords: ['inspiration', 'new opportunity', 'growth'] },
    { name: 'Two of Wands', upright: 'Future planning, progress, decisions, discovery. The world is in your hands.', reversed: 'Fear of unknown, lack of planning, playing it safe.', keywords: ['planning', 'discovery', 'decisions'] },
    { name: 'Three of Wands', upright: 'Progress, expansion, foresight, overseas opportunities. Your efforts bear fruit.', reversed: 'Playing small, lack of foresight, unexpected delays.', keywords: ['expansion', 'foresight', 'progress'] },
    { name: 'Four of Wands', upright: 'Celebration, joy, harmony, relaxation, homecoming. Dance in the light.', reversed: 'Personal celebration needed, transition, lack of support.', keywords: ['celebration', 'harmony', 'home'] },
    { name: 'Five of Wands', upright: 'Conflict, disagreements, competition, tension. Growth through challenge.', reversed: 'Inner conflict, conflict avoidance, release of tension.', keywords: ['conflict', 'competition', 'tension'] },
    { name: 'Six of Wands', upright: 'Public recognition, progress, self-confidence. Victory and acclaim.', reversed: 'Private achievement, fall from grace, egotism.', keywords: ['success', 'recognition', 'confidence'] },
    { name: 'Seven of Wands', upright: 'Challenge, competition, perseverance. Stand your ground with courage.', reversed: 'Exhaustion, giving up, overwhelmed by opposition.', keywords: ['perseverance', 'challenge', 'courage'] },
    { name: 'Eight of Wands', upright: 'Movement, speed, progress, quick decisions. Things are accelerating.', reversed: 'Delays, frustration, resisting change, internal alignment.', keywords: ['speed', 'movement', 'progress'] },
    { name: 'Nine of Wands', upright: 'Resilience, grit, last stand, persistence. You are closer than you think.', reversed: 'Exhaustion, giving up, overwhelm, paranoia.', keywords: ['resilience', 'persistence', 'courage'] },
    { name: 'Ten of Wands', upright: 'Burden, extra responsibility, hard work, completion. Nearly at the finish line.', reversed: 'Doing it all, failing to delegate, release of burden.', keywords: ['burden', 'hard work', 'completion'] },
    { name: 'Page of Wands', upright: 'Exploration, excitement, freedom. A new creative adventure calls.', reversed: 'Newly formed ideas not yet ready, redirected energy.', keywords: ['exploration', 'excitement', 'discovery'] },
    { name: 'Knight of Wands', upright: 'Energy, passion, inspired action, adventure. Charge forward boldly.', reversed: 'Passion project delayed, haste, scattered energy.', keywords: ['energy', 'passion', 'adventure'] },
    { name: 'Queen of Wands', upright: 'Courage, confidence, independence, warmth. Your radiant spirit inspires.', reversed: 'Self-respect needed, self-confidence rebuilding, introverted.', keywords: ['confidence', 'warmth', 'independence'] },
    { name: 'King of Wands', upright: 'Natural leader, vision, entrepreneur, honour. Lead with your heart.', reversed: 'Impulsive, overbearing, unachievable expectations.', keywords: ['leadership', 'vision', 'honour'] },
  ],
  cups: [
    { name: 'Ace of Cups', upright: 'Love, new relationships, compassion, creativity. Your heart overflows.', reversed: 'Self-love, intuition blocked, repressed emotions.', keywords: ['love', 'new feelings', 'compassion'] },
    { name: 'Two of Cups', upright: 'Unified love, partnership, mutual attraction. Two hearts beat as one.', reversed: 'Self-love, break-ups, disharmony, distrust.', keywords: ['partnership', 'unity', 'attraction'] },
    { name: 'Three of Cups', upright: 'Celebration, friendship, creativity, community. Joy shared is doubled.', reversed: 'Independence, alone time, hard partying, gossip.', keywords: ['celebration', 'friendship', 'community'] },
    { name: 'Four of Cups', upright: 'Meditation, contemplation, apathy, reevaluation. Look within.', reversed: 'Sudden awareness, choosing happiness, acceptance.', keywords: ['contemplation', 'meditation', 'apathy'] },
    { name: 'Five of Cups', upright: 'Regret, failure, disappointment, pessimism. Grief is part of healing.', reversed: 'Personal setbacks accepted, self-forgiveness, moving on.', keywords: ['regret', 'loss', 'healing'] },
    { name: 'Six of Cups', upright: 'Revisiting the past, childhood memories, innocence, joy. Sweet nostalgia.', reversed: 'Living in the past, forgiveness, lack of playfulness.', keywords: ['nostalgia', 'innocence', 'memories'] },
    { name: 'Seven of Cups', upright: 'Opportunities, choices, wishful thinking, illusion. Dream but act.', reversed: 'Alignment, personal values, overwhelmed by choices.', keywords: ['choices', 'dreams', 'illusion'] },
    { name: 'Eight of Cups', upright: 'Disappointment, abandonment, withdrawal, search for truth. Walk toward growth.', reversed: 'Trying one more time, indecision, aimless drifting.', keywords: ['walking away', 'seeking', 'growth'] },
    { name: 'Nine of Cups', upright: 'Contentment, satisfaction, gratitude, wish come true. Savor this moment.', reversed: 'Inner happiness, materialism, dissatisfaction.', keywords: ['contentment', 'wishes fulfilled', 'joy'] },
    { name: 'Ten of Cups', upright: 'Divine love, blissful relationships, harmony, alignment. Emotional fulfillment.', reversed: 'Disconnection, misaligned values, struggling relationships.', keywords: ['harmony', 'love', 'fulfillment'] },
    { name: 'Page of Cups', upright: 'Creative opportunities, intuitive messages, curiosity. A tender new feeling.', reversed: 'New ideas blocked, emotional immaturity, insecurity.', keywords: ['creativity', 'intuition', 'curiosity'] },
    { name: 'Knight of Cups', upright: 'Creativity, romance, charm, imagination. Follow your heart gracefully.', reversed: 'Overactive imagination, unrealistic, jealousy.', keywords: ['romance', 'charm', 'imagination'] },
    { name: 'Queen of Cups', upright: 'Compassionate, caring, emotionally stable, intuitive. Nurture with wisdom.', reversed: 'Inner feelings, self-care needed, co-dependency.', keywords: ['compassion', 'emotional wisdom', 'nurturing'] },
    { name: 'King of Cups', upright: 'Emotionally balanced, compassionate, diplomatic. Master of the heart.', reversed: 'Self-compassion, inner feelings, moodiness.', keywords: ['emotional balance', 'diplomacy', 'wisdom'] },
  ],
  swords: [
    { name: 'Ace of Swords', upright: 'Breakthrough, clarity, sharp mind, new idea. Truth cuts through.', reversed: 'Inner clarity needed, re-thinking an idea, clouded judgement.', keywords: ['clarity', 'truth', 'breakthrough'] },
    { name: 'Two of Swords', upright: 'Difficult choices, weighing options, an impasse. Trust your intuition.', reversed: 'Indecision, confusion, information overload.', keywords: ['choice', 'stalemate', 'balance'] },
    { name: 'Three of Swords', upright: 'Heartbreak, emotional pain, sorrow, grief. Healing begins with feeling.', reversed: 'Recovery, forgiveness, releasing pain, optimism.', keywords: ['heartbreak', 'sorrow', 'healing'] },
    { name: 'Four of Swords', upright: 'Rest, relaxation, meditation, contemplation. Recharge your spirit.', reversed: 'Exhaustion, burn-out, deep contemplation, stagnation.', keywords: ['rest', 'recovery', 'meditation'] },
    { name: 'Five of Swords', upright: 'Conflict, disagreements, competition, defeat. Choose your battles wisely.', reversed: 'Reconciliation, forgiveness, moving on from conflict.', keywords: ['conflict', 'defeat', 'resolution'] },
    { name: 'Six of Swords', upright: 'Transition, change, rite of passage, release. Smoother waters ahead.', reversed: 'Personal transition, resistance, unfinished business.', keywords: ['transition', 'moving on', 'healing'] },
    { name: 'Seven of Swords', upright: 'Deception, trickery, tactics, strategy. Look beneath the surface.', reversed: 'Coming clean, rethinking approach, conscience.', keywords: ['strategy', 'deception', 'wit'] },
    { name: 'Eight of Swords', upright: 'Imprisonment, entrapment, self-victimization. The cage door is open.', reversed: 'Self-acceptance, new perspective, freedom.', keywords: ['restriction', 'powerlessness', 'freedom'] },
    { name: 'Nine of Swords', upright: 'Anxiety, worry, fear, depression. The night is darkest before dawn.', reversed: 'Inner turmoil easing, hope, reaching out for help.', keywords: ['anxiety', 'worry', 'hope'] },
    { name: 'Ten of Swords', upright: 'Painful endings, deep wounds, betrayal, crisis. Rock bottom is a foundation.', reversed: 'Recovery, regeneration, resisting an inevitable end.', keywords: ['endings', 'renewal', 'recovery'] },
    { name: 'Page of Swords', upright: 'New ideas, curiosity, thirst for knowledge. A sharp mind awakens.', reversed: 'Self-expression blocked, all talk no action, haste.', keywords: ['curiosity', 'intellect', 'new ideas'] },
    { name: 'Knight of Swords', upright: 'Ambitious, action-oriented, driven to succeed. Charge with purpose.', reversed: 'Impulsive, burnout, no direction, restless.', keywords: ['ambition', 'action', 'drive'] },
    { name: 'Queen of Swords', upright: 'Independent, unbiased judgement, clear boundaries, direct communication.', reversed: 'Overly emotional, easily influenced, bitchy, cold.', keywords: ['independence', 'clarity', 'boundaries'] },
    { name: 'King of Swords', upright: 'Intellectual power, authority, truth. Lead with logic and fairness.', reversed: 'Quiet power, inner truth, misuse of power.', keywords: ['authority', 'truth', 'intellect'] },
  ],
  pentacles: [
    { name: 'Ace of Pentacles', upright: 'New financial opportunity, manifestation, abundance. Plant the seed.', reversed: 'Lost opportunity, lack of planning, lack of foresight.', keywords: ['opportunity', 'abundance', 'manifestation'] },
    { name: 'Two of Pentacles', upright: 'Multiple priorities, time management, prioritization, adaptability.', reversed: 'Over-committed, disorganization, financial disarray.', keywords: ['balance', 'adaptability', 'juggling'] },
    { name: 'Three of Pentacles', upright: 'Teamwork, collaboration, learning, implementation. Together we build.', reversed: 'Disharmony, lack of teamwork, working alone.', keywords: ['teamwork', 'skill', 'collaboration'] },
    { name: 'Four of Pentacles', upright: 'Saving money, security, conservatism, scarcity. Hold wisely, not tightly.', reversed: 'Over-spending, greed, self-protection, release.', keywords: ['security', 'control', 'saving'] },
    { name: 'Five of Pentacles', upright: 'Financial loss, poverty, lack mindset, isolation. Help is nearer than you think.', reversed: 'Recovery from financial loss, spiritual poverty ending.', keywords: ['hardship', 'loss', 'recovery'] },
    { name: 'Six of Pentacles', upright: 'Giving, receiving, sharing wealth, generosity, charity.', reversed: 'Self-care, unpaid debts, one-sided charity.', keywords: ['generosity', 'giving', 'receiving'] },
    { name: 'Seven of Pentacles', upright: 'Long-term view, sustainable results, perseverance, investment.', reversed: 'Lack of long-term vision, limited success, impatience.', keywords: ['patience', 'investment', 'growth'] },
    { name: 'Eight of Pentacles', upright: 'Apprenticeship, repetitive tasks, mastery, skill development.', reversed: 'Self-development, perfectionism, misdirected activity.', keywords: ['mastery', 'skill', 'dedication'] },
    { name: 'Nine of Pentacles', upright: 'Abundance, luxury, self-sufficiency, financial independence.', reversed: 'Self-worth, over-investment, hustling too hard.', keywords: ['abundance', 'luxury', 'independence'] },
    { name: 'Ten of Pentacles', upright: 'Wealth, financial security, family, long-term success, inheritance.', reversed: 'Financial failure, loneliness, loss of legacy.', keywords: ['legacy', 'wealth', 'family'] },
    { name: 'Page of Pentacles', upright: 'Manifestation, financial opportunity, skill development. New material venture.', reversed: 'Lack of progress, procrastination, learning from failure.', keywords: ['opportunity', 'learning', 'ambition'] },
    { name: 'Knight of Pentacles', upright: 'Hard work, productivity, routine, conservatism. Steady progress wins.', reversed: 'Self-discipline lacking, boredom, feeling stuck.', keywords: ['hard work', 'routine', 'reliability'] },
    { name: 'Queen of Pentacles', upright: 'Nurturing, practical, providing financially, working parent.', reversed: 'Financial independence needed, self-care, work-home imbalance.', keywords: ['nurturing', 'practical', 'abundance'] },
    { name: 'King of Pentacles', upright: 'Wealth, business, leadership, security, discipline, abundance.', reversed: 'Financially inept, obsessed with wealth, stubborn.', keywords: ['wealth', 'security', 'leadership'] },
  ],
};

function generateMinorArcana(): TarotCard[] {
  const cards: TarotCard[] = [];
  let id = 22; // Start after Major Arcana

  for (const [suit, config] of Object.entries(SUIT_CONFIG) as Array<[SuitName, typeof SUIT_CONFIG[SuitName]]>) {
    const meanings = CARD_MEANINGS[suit];
    meanings.forEach((card, index) => {
      cards.push({
        id: id++,
        name: card.name,
        arcana: 'minor',
        suit,
        number: index + 1,
        emoji: config.emoji,
        keywords: card.keywords,
        upright: card.upright,
        reversed: card.reversed,
        element: config.element,
      });
    });
  }

  return cards;
}

// ---------------------------------------------------------------------------
// Full Deck
// ---------------------------------------------------------------------------

export const TAROT_DECK: TarotCard[] = [...MAJOR_ARCANA, ...generateMinorArcana()];
export const MAJOR_ARCANA_CARDS = MAJOR_ARCANA;
export const MINOR_ARCANA_CARDS = generateMinorArcana();

// ---------------------------------------------------------------------------
// Daily Card Selection (deterministic per day + user)
// ---------------------------------------------------------------------------

/**
 * Get today's daily tarot card — deterministic based on date + user seed
 * Same card all day for the same user
 */
export function getDailyCard(userSeed: string = 'veya-user'): TarotCard {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const seed = hashString(`${dateStr}-${userSeed}`);
  const index = Math.abs(seed) % TAROT_DECK.length;
  return TAROT_DECK[index];
}

/**
 * Get cards for a spread (non-repeating)
 */
export function getSpreadCards(count: number, userSeed: string = 'veya-user'): TarotCard[] {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const baseSeed = hashString(`${dateStr}-${userSeed}-spread`);

  const available = [...TAROT_DECK];
  const selected: TarotCard[] = [];

  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.abs(hashString(`${baseSeed}-${i}`)) % available.length;
    selected.push(available.splice(idx, 1)[0]);
  }

  return selected;
}

/**
 * Check if a card is reversed (50% chance, deterministic per day + position)
 */
export function isCardReversed(cardId: number, position: number, userSeed: string = 'veya-user'): boolean {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const hash = hashString(`${dateStr}-${userSeed}-reversed-${cardId}-${position}`);
  return hash % 2 === 0;
}

// Simple string hash
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
