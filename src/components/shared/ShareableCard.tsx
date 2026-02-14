import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import ZodiacIcon from '@/components/shared/ZodiacIcon';

interface ShareableCardProps {
  title: string;
  body: string;
  signName: string;
  date: string;
}

export default function ShareableCard({
  title,
  body,
  signName,
  date,
}: ShareableCardProps) {
  return (
    <View style={styles.frame}>
      <LinearGradient
        colors={['#120B2D', '#3B1F6B', '#7B3FF2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={[styles.sparkle, styles.sparkleTop]}>✦</Text>
        <Text style={[styles.sparkle, styles.sparkleMid]}>✧</Text>
        <Text style={[styles.sparkle, styles.sparkleBottom]}>✦</Text>

        <View style={styles.header}>
          <View style={styles.signBubble}>
            <ZodiacIcon sign={signName} variant="symbol" size={44} color={colors.white} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.date}>{date}</Text>
            <Text style={styles.sign}>{signName}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.watermark}>✨ VEYa — Your AI Astrologer</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 1080,
    height: 1920,
    backgroundColor: '#0B0620',
  },
  card: {
    flex: 1,
    padding: 90,
    justifyContent: 'space-between',
  },
  sparkle: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 26,
  },
  sparkleTop: { top: 90, right: 120 },
  sparkleMid: { top: 520, left: 80, fontSize: 18 },
  sparkleBottom: { bottom: 220, right: 160, fontSize: 22 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  signBubble: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 6,
  },
  date: {
    fontSize: 28,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  sign: {
    fontSize: 34,
    fontFamily: 'PlayfairDisplay-SemiBold',
    color: colors.white,
  },
  content: {
    gap: 28,
  },
  title: {
    fontSize: 58,
    fontFamily: 'PlayfairDisplay-Bold',
    color: colors.white,
    lineHeight: 70,
  },
  body: {
    fontSize: 34,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 54,
  },
  footer: {
    alignItems: 'center',
  },
  watermark: {
    fontSize: 26,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.5,
  },
});
