/**
 * VEYa — Screen 03: Birth Date (Simplified)
 * Collects the user's birth date via native date picker
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';

// ─────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────

const colors = {
  background: '#FDFBF7',
  surface: '#F5F0E8',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B6B80',
  textMuted: '#9B9BAD',
  primary: '#8B5CF6',
  primaryDark: '#7C3AED',
  accentGold: '#D4A547',
  inputBorder: '#E5DFD5',
  inputBorderFocused: '#D4A547',
  disabled: 'rgba(26, 26, 46, 0.3)',
};

const typography = {
  fonts: {
    display: 'PlayfairDisplay-Bold',
    body: 'Inter-Regular',
    bodyMedium: 'Inter-Medium',
    bodySemiBold: 'Inter-SemiBold',
  },
};

// ─────────────────────────────────────────────────────────────
// ZODIAC SIGNS
// ─────────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  { name: 'Capricorn', emoji: '♑', startMonth: 0, startDay: 1, endMonth: 0, endDay: 19 },
  { name: 'Aquarius', emoji: '♒', startMonth: 0, startDay: 20, endMonth: 1, endDay: 18 },
  { name: 'Pisces', emoji: '♓', startMonth: 1, startDay: 19, endMonth: 2, endDay: 20 },
  { name: 'Aries', emoji: '♈', startMonth: 2, startDay: 21, endMonth: 3, endDay: 19 },
  { name: 'Taurus', emoji: '♉', startMonth: 3, startDay: 20, endMonth: 4, endDay: 20 },
  { name: 'Gemini', emoji: '♊', startMonth: 4, startDay: 21, endMonth: 5, endDay: 20 },
  { name: 'Cancer', emoji: '♋', startMonth: 5, startDay: 21, endMonth: 6, endDay: 22 },
  { name: 'Leo', emoji: '♌', startMonth: 6, startDay: 23, endMonth: 7, endDay: 22 },
  { name: 'Virgo', emoji: '♍', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { name: 'Libra', emoji: '♎', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { name: 'Scorpio', emoji: '♏', startMonth: 9, startDay: 23, endMonth: 10, endDay: 21 },
  { name: 'Sagittarius', emoji: '♐', startMonth: 10, startDay: 22, endMonth: 11, endDay: 21 },
  { name: 'Capricorn', emoji: '♑', startMonth: 11, startDay: 22, endMonth: 11, endDay: 31 },
];

function getSunSign(month: number, day: number) {
  for (const sign of ZODIAC_SIGNS) {
    if (
      (month === sign.startMonth && day >= sign.startDay) ||
      (month === sign.endMonth && day <= sign.endDay)
    ) {
      return sign;
    }
  }
  return ZODIAC_SIGNS[0];
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 100 }, (_, i) => 2024 - i);

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function BirthDateScreen() {
  const insets = useSafeAreaInsets();
  const { updateData, nextStep } = useOnboardingStore();

  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2000);

  const sunSign = useMemo(() => getSunSign(selectedMonth, selectedDay), [selectedMonth, selectedDay]);

  const isValid = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, selectedDay);
    const now = new Date();
    if (date >= now) return false;
    const age = now.getFullYear() - date.getFullYear();
    return age >= 13 && age <= 120;
  }, [selectedYear, selectedMonth, selectedDay]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleContinue = () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({
      birthDate: new Date(selectedYear, selectedMonth, selectedDay).toISOString(),
      sunSign: sunSign.name,
    });
    nextStep();
    router.push('/(auth)/onboarding/birth-time');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M15 18l-6-6 6-6" stroke={colors.textPrimary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </Svg>
        </Pressable>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotComplete]} />
          <View style={[styles.progressBar, styles.progressBarComplete]} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressBar} />
          <View style={styles.progressDot} />
          <View style={styles.progressBar} />
          <View style={styles.progressDot} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <Text style={styles.icon}>🎂</Text>
        
        {/* Title */}
        <Text style={styles.title}>When were you born?</Text>
        <Text style={styles.subtitle}>The stars remember your arrival</Text>

        {/* Date Selectors */}
        <View style={styles.pickersContainer}>
          {/* Month Picker */}
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Month</Text>
            <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
              {MONTHS.map((month, index) => (
                <Pressable
                  key={month}
                  style={[styles.pickerItem, selectedMonth === index && styles.pickerItemSelected]}
                  onPress={() => setSelectedMonth(index)}
                >
                  <Text style={[styles.pickerItemText, selectedMonth === index && styles.pickerItemTextSelected]}>
                    {month}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Day Picker */}
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Day</Text>
            <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
              {DAYS.map((day) => (
                <Pressable
                  key={day}
                  style={[styles.pickerItem, selectedDay === day && styles.pickerItemSelected]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[styles.pickerItemText, selectedDay === day && styles.pickerItemTextSelected]}>
                    {day}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Year Picker */}
          <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>Year</Text>
            <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
              {YEARS.map((year) => (
                <Pressable
                  key={year}
                  style={[styles.pickerItem, selectedYear === year && styles.pickerItemSelected]}
                  onPress={() => setSelectedYear(year)}
                >
                  <Text style={[styles.pickerItemText, selectedYear === year && styles.pickerItemTextSelected]}>
                    {year}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Sun Sign Display */}
        <View style={styles.sunSignContainer}>
          <Text style={styles.sunSignEmoji}>{sunSign.emoji}</Text>
          <Text style={styles.sunSignText}>Your Sun sign is {sunSign.name}</Text>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Pressable
          onPress={handleContinue}
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          disabled={!isValid}
        >
          <LinearGradient
            colors={isValid ? [colors.primary, colors.primaryDark] : [colors.disabled, colors.disabled]}
            style={styles.continueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.continueText}>Continue</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 44,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  progressDotComplete: {
    backgroundColor: colors.accentGold,
  },
  progressDotActive: {
    backgroundColor: colors.accentGold,
    width: 24,
    borderRadius: 4,
  },
  progressBar: {
    width: 24,
    height: 2,
    backgroundColor: colors.surface,
    marginHorizontal: 4,
  },
  progressBarComplete: {
    backgroundColor: colors.accentGold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: typography.fonts.display,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  pickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  picker: {
    height: 200,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  pickerItemText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  pickerItemTextSelected: {
    color: colors.primary,
    fontFamily: typography.fonts.bodySemiBold,
  },
  sunSignContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  sunSignEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  sunSignText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: colors.background,
  },
  continueButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 17,
    color: '#FFFFFF',
  },
});
