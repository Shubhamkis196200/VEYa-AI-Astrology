// ============================================================================
// VEYa Cosmic Year Timeline — Annual Transit Overview
// ============================================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Share,
  Linking,
  Platform,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Astronomy from 'astronomy-engine';
import {
  calculateAspects,
  getCurrentTransits,
  type PlanetPosition,
} from '@/services/astroEngine';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface YearEvent {
  id: string;
  date: Date;
  endDate?: Date; // for retrograde periods
  type: 'retrograde' | 'eclipse' | 'transit' | 'best_period';
  title: string;
  description: string;
  impact: 'positive' | 'neutral' | 'challenging' | 'transformative';
  planet?: string;
}

interface CosmicYearTimelineProps {
  year?: number;
  natalPositions?: PlanetPosition[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const IMPACT_COLORS: Record<YearEvent['impact'], string> = {
  positive: colors.success,
  neutral: colors.secondary,
  challenging: colors.error,
  transformative: colors.primary,
};

const IMPACT_GRADIENTS: Record<YearEvent['impact'], readonly [string, string, string]> = {
  positive: ['#064E3B', '#10B981', '#34D399'] as const,
  neutral: ['#0F172A', '#1E293B', '#334155'] as const,
  challenging: ['#7F1D1D', '#DC2626', '#F87171'] as const,
  transformative: ['#2E1065', '#7C3AED', '#A78BFA'] as const,
};

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateRange(start: Date, end?: Date): string {
  if (!end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function createCalendarUrl(event: YearEvent): string {
  const start = event.date.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const end = (event.endDate || new Date(event.date.getTime() + 2 * 60 * 60 * 1000))
    .toISOString()
    .replace(/[-:]|\.\d{3}/g, '');

  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(event.description);

  if (Platform.OS === 'ios') {
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  }

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
}

function getRetrogradePeriods(planetName: string, year: number): YearEvent[] {
  const events: YearEvent[] = [];
  let inRetro = false;
  let startDate: Date | null = null;

  for (let day = 0; day < 366; day++) {
    const date = new Date(year, 0, 1 + day, 12, 0, 0);
    if (date.getFullYear() !== year) break;

    const transit = getCurrentTransits(date).find((p) => p.name === planetName);
    const isRetro = !!transit?.retrograde;

    if (isRetro && !inRetro) {
      inRetro = true;
      startDate = date;
    }

    if (!isRetro && inRetro && startDate) {
      const endDate = new Date(date.getTime() - 86400000);
      events.push({
        id: `${planetName}-rx-${startDate.toISOString()}`,
        date: startDate,
        endDate,
        type: 'retrograde',
        title: `${planetName} Retrograde`,
        description: `A reflective cycle for ${planetName.toLowerCase()} themes — slow down, review, and recalibrate.`,
        impact: 'challenging',
        planet: planetName,
      });
      inRetro = false;
      startDate = null;
    }
  }

  if (inRetro && startDate) {
    const endDate = new Date(year, 11, 31, 12, 0, 0);
    events.push({
      id: `${planetName}-rx-${startDate.toISOString()}`,
      date: startDate,
      endDate,
      type: 'retrograde',
      title: `${planetName} Retrograde`,
      description: `A reflective cycle for ${planetName.toLowerCase()} themes — slow down, review, and recalibrate.`,
      impact: 'challenging',
      planet: planetName,
    });
  }

  return events;
}

function getEclipseEvents(year: number): YearEvent[] {
  const events: YearEvent[] = [];
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  let time = Astronomy.MakeTime(new Date(year, 0, 1, 12, 0, 0));
  for (let i = 0; i < 10; i++) {
    const eclipse: any = Astronomy.SearchLunarEclipse(time);
    const date: Date | undefined = eclipse?.peak?.date;
    if (!date || date > endDate) break;
    events.push({
      id: `lunar-${date.toISOString()}`,
      date,
      type: 'eclipse',
      title: 'Lunar Eclipse',
      description: `${eclipse?.kind || 'Lunar'} eclipse — emotional revelations and release.`,
      impact: 'transformative',
    });
    time = Astronomy.MakeTime(new Date(date.getTime() + 20 * 86400000));
  }

  time = Astronomy.MakeTime(new Date(year, 0, 1, 12, 0, 0));
  for (let i = 0; i < 10; i++) {
    const eclipse: any = Astronomy.SearchGlobalSolarEclipse(time);
    const date: Date | undefined = eclipse?.peak?.date;
    if (!date || date > endDate) break;
    events.push({
      id: `solar-${date.toISOString()}`,
      date,
      type: 'eclipse',
      title: 'Solar Eclipse',
      description: `${eclipse?.kind || 'Solar'} eclipse — powerful resets and new beginnings.`,
      impact: 'transformative',
    });
    time = Astronomy.MakeTime(new Date(date.getTime() + 20 * 86400000));
  }

  return events;
}

function getJupiterSaturnTransits(
  year: number,
  natalPositions?: PlanetPosition[],
): YearEvent[] {
  if (!natalPositions?.length) return [];

  const events: YearEvent[] = [];
  for (let month = 0; month < 12; month++) {
    const date = new Date(year, month, 15, 12, 0, 0);
    const transits = getCurrentTransits(date);
    const aspects = calculateAspects(transits, natalPositions).filter((a) =>
      ['Jupiter', 'Saturn'].includes(a.transitPlanet)
    );

    const strongest = aspects[0];
    if (!strongest || strongest.orb > 2.5) continue;

    const isPositive = ['Trine', 'Sextile'].includes(strongest.aspectType);
    const isChallenging = ['Square', 'Opposition'].includes(strongest.aspectType);

    events.push({
      id: `${strongest.transitPlanet}-${strongest.natalPlanet}-${date.toISOString()}`,
      date,
      type: 'transit',
      title: `${strongest.transitPlanet} ${strongest.aspectType} natal ${strongest.natalPlanet}`,
      description: strongest.interpretation,
      impact: isPositive
        ? 'positive'
        : isChallenging
          ? 'challenging'
          : 'transformative',
      planet: strongest.transitPlanet,
    });
  }

  return events;
}

function getBestMonths(year: number, natalPositions?: PlanetPosition[]): YearEvent[] {
  const scores = Array.from({ length: 12 }, () => ({
    love: 0,
    career: 0,
    creativity: 0,
  }));

  for (let month = 0; month < 12; month++) {
    const date = new Date(year, month, 15, 12, 0, 0);
    const transits = getCurrentTransits(date);
    const venus = transits.find((p) => p.name === 'Venus');
    const jupiter = transits.find((p) => p.name === 'Jupiter');

    if (natalPositions?.length) {
      const aspects = calculateAspects(transits, natalPositions);
      for (const aspect of aspects) {
        const isPositive = ['Trine', 'Sextile', 'Conjunction'].includes(aspect.aspectType);
        if (!isPositive) continue;

        if (aspect.transitPlanet === 'Venus' && ['Venus', 'Moon', 'Sun'].includes(aspect.natalPlanet)) {
          scores[month].love += 2;
        }
        if (['Jupiter', 'Saturn'].includes(aspect.transitPlanet) && ['Sun', 'Mars', 'Saturn'].includes(aspect.natalPlanet)) {
          scores[month].career += 2;
        }
        if (['Venus', 'Neptune', 'Uranus'].includes(aspect.transitPlanet) && ['Moon', 'Venus', 'Neptune'].includes(aspect.natalPlanet)) {
          scores[month].creativity += 2;
        }
      }
    } else {
      if (venus && ['Taurus', 'Libra', 'Pisces'].includes(venus.sign)) scores[month].love += 2;
      if (jupiter && !jupiter.retrograde) scores[month].career += 2;
      if (venus && ['Pisces', 'Leo', 'Aquarius'].includes(venus.sign)) scores[month].creativity += 2;
    }
  }

  const bestLove = scores.reduce((best, s, i) => (s.love > scores[best].love ? i : best), 0);
  const bestCareer = scores.reduce((best, s, i) => (s.career > scores[best].career ? i : best), 0);
  const bestCreativity = scores.reduce((best, s, i) => (s.creativity > scores[best].creativity ? i : best), 0);

  return [
    {
      id: `best-love-${year}-${bestLove}`,
      date: new Date(year, bestLove, 1, 12, 0, 0),
      type: 'best_period',
      title: 'Best Month for Love',
      description: `Hearts open easily this month — plan dates, deepen intimacy, and let yourself receive love.`,
      impact: 'positive',
    },
    {
      id: `best-career-${year}-${bestCareer}`,
      date: new Date(year, bestCareer, 1, 12, 0, 0),
      type: 'best_period',
      title: 'Best Month for Career',
      description: `Career momentum builds — pitch boldly, negotiate confidently, and aim higher.`,
      impact: 'positive',
    },
    {
      id: `best-creativity-${year}-${bestCreativity}`,
      date: new Date(year, bestCreativity, 1, 12, 0, 0),
      type: 'best_period',
      title: 'Best Month for Creativity',
      description: `Inspiration flows — create, collaborate, and share your art with the world.`,
      impact: 'positive',
    },
  ];
}

function buildYearEvents(year: number, natalPositions?: PlanetPosition[]): YearEvent[] {
  const events: YearEvent[] = [];

  events.push(...getRetrogradePeriods('Mercury', year));
  events.push(...getRetrogradePeriods('Venus', year));
  events.push(...getEclipseEvents(year));
  events.push(...getJupiterSaturnTransits(year, natalPositions));
  events.push(...getBestMonths(year, natalPositions));

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CosmicYearTimeline({ year, natalPositions }: CosmicYearTimelineProps) {
  const currentYear = year || new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const events = useMemo(
    () => buildYearEvents(currentYear, natalPositions),
    [currentYear, natalPositions],
  );

  const scrollRef = useRef<ScrollView>(null);
  const monthOffsets = useRef<Record<number, number>>({});
  const didScroll = useRef(false);

  const [selectedEvent, setSelectedEvent] = useState<YearEvent | null>(null);

  useEffect(() => {
    if (didScroll.current) return;
    const offset = monthOffsets.current[currentMonth];
    if (offset !== undefined) {
      didScroll.current = true;
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, offset - 40), animated: true });
      });
    }
  }, [events, currentMonth]);

  const handleEventPress = (event: YearEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEvent(event);
  };

  const handleShare = async (event: YearEvent) => {
    try {
      await Share.share({
        message: `✨ ${event.title}\n${event.description}\n${formatDateRange(event.date, event.endDate)} — via VEYa`,
      });
    } catch (error) {
      console.warn('[CosmicYearTimeline] Share failed', error);
    }
  };

  const handleAddToCalendar = (event: YearEvent) => {
    const url = createCalendarUrl(event);
    Linking.openURL(url).catch((error) =>
      console.warn('[CosmicYearTimeline] Calendar link failed', error),
    );
  };

  const grouped = useMemo(() => {
    const byMonth: Record<number, YearEvent[]> = {};
    for (let i = 0; i < 12; i++) byMonth[i] = [];
    for (const event of events) {
      byMonth[event.date.getMonth()].push(event);
    }
    return byMonth;
  }, [events]);

  return (
    <Animated.View entering={FadeInUp.duration(800)} style={styles.container}>
      <Text style={styles.title}>Your Cosmic Year</Text>
      <Text style={styles.subtitle}>Major transits & power months ahead</Text>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {MONTHS.map((month, index) => {
          const isCurrent = index === currentMonth;
          const monthEvents = grouped[index] || [];

          return (
            <View
              key={month}
              style={styles.monthBlock}
              onLayout={(event) => {
                monthOffsets.current[index] = event.nativeEvent.layout.y;
              }}
            >
              <View style={[styles.monthLabelColumn, isCurrent && styles.currentMonthColumn]}>
                <Text style={[styles.monthLabel, isCurrent && styles.currentMonthLabel]}>
                  {month.slice(0, 3).toUpperCase()}
                </Text>
                {isCurrent && <Text style={styles.currentTag}>NOW</Text>}
              </View>

              <View style={styles.eventsColumn}>
                <View style={styles.timelineLine} />

                {monthEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={styles.node} />
                    <Text style={styles.emptyText}>Quiet skies — space to integrate.</Text>
                  </View>
                ) : (
                  monthEvents.map((event, idx) => (
                    <Animated.View
                      key={event.id}
                      entering={FadeInUp.duration(400).delay(100 + idx * 60)}
                      style={styles.eventRow}
                    >
                      <View
                        style={[
                          styles.node,
                          { backgroundColor: IMPACT_COLORS[event.impact] },
                        ]}
                      />
                      <Pressable
                        style={styles.eventCardWrap}
                        onPress={() => handleEventPress(event)}
                      >
                        <LinearGradient
                          colors={IMPACT_GRADIENTS[event.impact]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.eventCard}
                        >
                          <View style={styles.eventHeader}>
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            <Text style={styles.eventDate}>
                              {formatDateRange(event.date, event.endDate)}
                            </Text>
                          </View>
                          <Text style={styles.eventDescription} numberOfLines={2}>
                            {event.description}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    </Animated.View>
                  ))
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Event Detail Modal */}
      <Modal
        visible={!!selectedEvent}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedEvent(null)}>
          <Pressable style={styles.modalCard} onPress={() => null}>
            {selectedEvent && (
              <>
                <LinearGradient
                  colors={IMPACT_GRADIENTS[selectedEvent.impact]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalGradient}
                >
                  <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                  <Text style={styles.modalDate}>
                    {formatDateRange(selectedEvent.date, selectedEvent.endDate)}
                  </Text>
                  <Text style={styles.modalDescription}>{selectedEvent.description}</Text>
                </LinearGradient>

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.actionButton, styles.primaryButton]}
                    onPress={() => handleAddToCalendar(selectedEvent)}
                  >
                    <Text style={styles.actionTextPrimary}>Add to Calendar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionButton, styles.secondaryButton]}
                    onPress={() => handleShare(selectedEvent)}
                  >
                    <Text style={styles.actionTextSecondary}>Share</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  title: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  monthBlock: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  monthLabelColumn: {
    width: 60,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  currentMonthColumn: {
    backgroundColor: colors.accentGoldLight,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs,
  },
  monthLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.textSecondary,
  },
  currentMonthLabel: {
    color: colors.accentGold,
  },
  currentTag: {
    marginTop: spacing.xs,
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 10,
    color: colors.accentGold,
    letterSpacing: 1.2,
  },
  eventsColumn: {
    flex: 1,
    paddingLeft: spacing.md,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  node: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    marginTop: 14,
  },
  eventCardWrap: {
    flex: 1,
    marginLeft: spacing.md,
  },
  eventCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  eventTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 14,
    color: colors.white,
    flex: 1,
    paddingRight: spacing.sm,
  },
  eventDate: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  eventDescription: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyText: {
    marginLeft: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  modalGradient: {
    padding: spacing.xl,
  },
  modalTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 20,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  modalDate: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginBottom: spacing.md,
  },
  modalDescription: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionTextPrimary: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 13,
    color: colors.white,
  },
  actionTextSecondary: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textPrimary,
  },
});
