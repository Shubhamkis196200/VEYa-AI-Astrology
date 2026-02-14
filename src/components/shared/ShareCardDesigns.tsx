import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '@/theme/typography';
import ZodiacIcon from '@/components/shared/ZodiacIcon';

export interface ShareCardInsight {
  title: string;
  body: string;
  date: string;
}

export interface ShareCardUserData {
  name: string;
  signName: string;
  signEmoji?: string;
}

interface ShareCardDesignsProps {
  variant?: 'story' | 'post';
  insight: ShareCardInsight;
  user: ShareCardUserData;
}

const CARD_SIZES = {
  story: { width: 1080, height: 1920, padding: 120 },
  post: { width: 1080, height: 1080, padding: 90 },
};

export default function ShareCardDesigns({
  variant = 'story',
  insight,
  user,
}: ShareCardDesignsProps) {
  const size = CARD_SIZES[variant];

  return (
    <View style={[styles.frame, { width: size.width, height: size.height }]}> 
      <LinearGradient
        colors={['#1B0B38', '#3C1D6E', '#7D3E9A', '#D4A547']}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[styles.card, { padding: size.padding }]}
      >
        <View style={styles.starsLayer}>
          <Text style={[styles.star, styles.starTop]}>✦</Text>
          <Text style={[styles.star, styles.starMid]}>✧</Text>
          <Text style={[styles.star, styles.starBottom]}>✦</Text>
          <View style={[styles.orb, styles.orbTop]} />
          <View style={[styles.orb, styles.orbBottom]} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.signBubble}>
              <ZodiacIcon sign={user.signName} variant="symbol" size={54} color="#FFFFFF" />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.date}>{insight.date}</Text>
            </View>
          </View>
          <View style={styles.signRow}>
            <Text style={styles.signLabel}>{user.signName}</Text>
            <Text style={styles.signEmoji}>{user.signEmoji || '✨'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{insight.title}</Text>
          <Text style={styles.body}>{insight.body}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.brand}>VEYa · Your AI Astrologer</Text>
          <Text style={styles.brandTag}>Cosmic insight, beautifully delivered</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

export function StoryShareCard(props: Omit<ShareCardDesignsProps, 'variant'>) {
  return <ShareCardDesigns {...props} variant="story" />;
}

export function PostShareCard(props: Omit<ShareCardDesignsProps, 'variant'>) {
  return <ShareCardDesigns {...props} variant="post" />;
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#0B051A',
  },
  card: {
    flex: 1,
    borderRadius: 60,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  starsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 26,
    textShadowColor: 'rgba(212,165,71,0.35)',
    textShadowRadius: 12,
  },
  starTop: { top: 80, right: 140 },
  starMid: { top: 520, left: 110, fontSize: 18 },
  starBottom: { bottom: 240, right: 160, fontSize: 22 },
  orb: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(212,165,71,0.15)',
  },
  orbTop: { top: 180, left: -30 },
  orbBottom: { bottom: 120, right: -50 },
  header: {
    gap: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  signBubble: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 8,
  },
  name: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 44,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  date: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 24,
    color: 'rgba(255,255,255,0.75)',
  },
  signRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signLabel: {
    fontFamily: typography.fonts.displayRegular,
    fontSize: 30,
    color: '#FFFFFF',
  },
  signEmoji: {
    fontSize: 30,
  },
  content: {
    gap: 28,
  },
  title: {
    fontFamily: typography.fonts.display,
    fontSize: 58,
    lineHeight: 68,
    color: '#FFFFFF',
  },
  body: {
    fontFamily: typography.fonts.body,
    fontSize: 34,
    lineHeight: 52,
    color: 'rgba(255,255,255,0.92)',
  },
  footer: {
    alignItems: 'center',
    gap: 6,
  },
  brand: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.6,
  },
  brandTag: {
    fontFamily: typography.fonts.body,
    fontSize: 20,
    color: 'rgba(255,255,255,0.6)',
  },
});
