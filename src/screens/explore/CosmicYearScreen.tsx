import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CosmicEvent {
  date: string;
  event: string;
  meaning: string;
  emoji: string;
  isPast: boolean;
}

const TODAY = new Date();

function buildEvents(): CosmicEvent[] {
  const raw = [
    { date: '2026-01-11', event: 'Mercury Direct in Sagittarius', meaning: 'Communication clears — ideal for signing contracts and making travel plans.', emoji: '☿' },
    { date: '2026-02-06', event: 'New Moon in Aquarius', meaning: 'Set intentions for community, innovation, and social impact.', emoji: '🌑' },
    { date: '2026-03-29', event: 'Full Moon in Libra', meaning: 'Emotional peak in partnerships — seek balance and honest communication.', emoji: '🌕' },
    { date: '2026-04-07', event: 'Solar Eclipse in Aries', meaning: 'Powerful new beginnings. Eclipses accelerate destiny — trust the leap.', emoji: '🌑' },
    { date: '2026-05-01', event: 'Pluto Retrograde begins', meaning: 'Internalize transformation. Review power dynamics and deep personal truths.', emoji: '♇' },
    { date: '2026-06-11', event: 'Jupiter enters Gemini', meaning: 'Growth through learning, writing, and curious exploration over the next year.', emoji: '♃' },
    { date: '2026-08-08', event: "Lion's Gate Portal 8/8", meaning: 'Sirius aligns with the Earth and Sun — a portal for abundance manifestation.', emoji: '⭐' },
    { date: '2026-09-21', event: 'Autumnal Equinox', meaning: 'Balance of light and dark. A powerful moment for inner harvest and release.', emoji: '⚖️' },
    { date: '2026-10-02', event: 'Solar Eclipse in Libra', meaning: 'Fated shifts in relationships and justice. Doors open and close swiftly.', emoji: '🌑' },
    { date: '2026-11-15', event: 'Mars Direct in Leo', meaning: 'Creative energy and ambition surge forward after a period of revision.', emoji: '♂' },
    { date: '2026-12-21', event: 'Winter Solstice · Capricorn Season', meaning: 'The longest night. Set intentions for the year ahead under Saturn\'s steady gaze.', emoji: '❄️' },
  ];

  return raw.map(e => ({
    ...e,
    isPast: new Date(e.date) < TODAY,
  }));
}

const EVENTS = buildEvents();

interface Props { onClose: () => void; }

export default function CosmicYearScreen({ onClose }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={22} color="#1A1625" />
        </Pressable>
        <Text style={styles.headerTitle}>Cosmic Year 2026</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Key astrological events shaping 2026</Text>

        {EVENTS.map((event, i) => {
          const eventDate = new Date(event.date);
          const isToday = eventDate.toDateString() === TODAY.toDateString();
          return (
            <View key={i} style={[styles.eventRow, event.isPast && !isToday && styles.eventRowPast]}>
              {/* Timeline line */}
              <View style={styles.timelineCol}>
                <View style={[
                  styles.dot,
                  isToday && styles.dotToday,
                  event.isPast && !isToday && styles.dotPast,
                ]} />
                {i < EVENTS.length - 1 && <View style={styles.line} />}
              </View>

              {/* Content */}
              <View style={styles.eventContent}>
                <View style={styles.eventTop}>
                  <Text style={[styles.eventDate, event.isPast && !isToday && styles.textPast]}>
                    {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                  {isToday && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>Today</Text></View>}
                </View>
                <View style={styles.eventCard}>
                  <View style={styles.eventCardHeader}>
                    <Text style={styles.eventEmoji}>{event.emoji}</Text>
                    <Text style={[styles.eventName, event.isPast && !isToday && styles.textPast]}>
                      {event.event}
                    </Text>
                  </View>
                  <Text style={[styles.eventMeaning, event.isPast && !isToday && styles.textPast]}>
                    {event.meaning}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, color: '#1A1625' },

  content: { paddingHorizontal: 16, paddingTop: 16 },

  intro: {
    fontFamily: 'Inter_400Regular', fontSize: 13, color: '#64748B',
    marginBottom: 20, textAlign: 'center',
  },

  eventRow: { flexDirection: 'row', marginBottom: 0 },
  eventRowPast: { opacity: 0.55 },

  timelineCol: {
    width: 24, alignItems: 'center', paddingTop: 16,
  },
  dot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#8B5CF6', zIndex: 1,
  },
  dotToday: { backgroundColor: '#D4A547', width: 14, height: 14, borderRadius: 7 },
  dotPast: { backgroundColor: '#CBD5E1' },
  line: {
    flex: 1, width: 2, backgroundColor: 'rgba(139,92,246,0.15)', marginTop: 4,
  },

  eventContent: { flex: 1, paddingLeft: 12, paddingBottom: 20 },
  eventTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  eventDate: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#8B5CF6' },
  textPast: { color: '#94A3B8' },
  todayBadge: {
    backgroundColor: '#D4A547', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
  },
  todayBadgeText: { fontFamily: 'Inter_700Bold', fontSize: 10, color: '#FFFFFF' },

  eventCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  eventCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  eventEmoji: { fontSize: 18 },
  eventName: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#1A1625', flex: 1 },
  eventMeaning: {
    fontFamily: 'Inter_400Regular', fontSize: 12, color: '#64748B', lineHeight: 18,
  },
});
