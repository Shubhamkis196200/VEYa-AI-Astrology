/**
 * VEYa — Screen 03: Birth Date
 * Collects the user's birth date via wheel-style pickers
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '@/stores/onboardingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 100 }, (_, i) => 2024 - i);

// ─────────────────────────────────────────────────────────────
// WHEEL PICKER COMPONENT
// ─────────────────────────────────────────────────────────────

interface WheelPickerProps {
  data: (string | number)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  label: string;
}

function WheelPicker({ data, selectedIndex, onSelect, label }: WheelPickerProps) {
  const flatListRef = useRef<FlatList>(null);
  
  // Add padding items for visual centering
  const paddedData = useMemo(() => {
    const padding = Math.floor(VISIBLE_ITEMS / 2);
    const padItems: (string | number)[] = Array(padding).fill('');
    return [...padItems, ...data, ...padItems];
  }, [data]);

  const handleScrollEnd = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    
    if (clampedIndex !== selectedIndex) {
      onSelect(clampedIndex);
      Haptics.selectionAsync();
    }
  }, [data.length, onSelect, selectedIndex]);

  const renderItem = useCallback(({ item, index }: { item: string | number; index: number }) => {
    const padding = Math.floor(VISIBLE_ITEMS / 2);
    const dataIndex = index - padding;
    const isSelected = dataIndex === selectedIndex;
    const isEmpty = item === '';

    return (
      <View style={styles.pickerItem}>
        {!isEmpty && (
          <Text style={[
            styles.pickerItemText,
            isSelected && styles.pickerItemTextSelected,
          ]}>
            {item}
          </Text>
        )}
      </View>
    );
  }, [selectedIndex]);

  return (
    <View style={styles.pickerWrapper}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerContainer}>
        {/* Selection highlight */}
        <View style={styles.selectionHighlight} pointerEvents="none" />
        
        <FlatList
          ref={flatListRef}
          data={paddedData}
          renderItem={renderItem}
          keyExtractor={(_, index) => `${label}-${index}`}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          initialScrollIndex={selectedIndex}
          getItemLayout={(_, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          nestedScrollEnabled={true}
          style={styles.flatList}
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function BirthDateScreen() {
  const insets = useSafeAreaInsets();
  const { updateData, nextStep } = useOnboardingStore();

  const [selectedMonth, setSelectedMonth] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedYear, setSelectedYear] = useState(YEARS.indexOf(2000));

  const actualDay = selectedDay + 1;
  const actualYear = YEARS[selectedYear];
  const sunSign = useMemo(() => getSunSign(selectedMonth, actualDay), [selectedMonth, actualDay]);

  const isValid = useMemo(() => {
    const date = new Date(actualYear, selectedMonth, actualDay);
    const now = new Date();
    if (date >= now) return false;
    const age = now.getFullYear() - date.getFullYear();
    return age >= 13 && age <= 120;
  }, [actualYear, selectedMonth, actualDay]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleContinue = () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({
      birthDate: new Date(actualYear, selectedMonth, actualDay).toISOString(),
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

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <Text style={styles.icon}>🎂</Text>
        
        {/* Title */}
        <Text style={styles.title}>When were you born?</Text>
        <Text style={styles.subtitle}>The stars remember your arrival</Text>

        {/* Date Pickers */}
        <View style={styles.pickersRow}>
          <WheelPicker
            data={MONTHS}
            selectedIndex={selectedMonth}
            onSelect={setSelectedMonth}
            label="MONTH"
          />
          <WheelPicker
            data={DAYS}
            selectedIndex={selectedDay}
            onSelect={setSelectedDay}
            label="DAY"
          />
          <WheelPicker
            data={YEARS}
            selectedIndex={selectedYear}
            onSelect={setSelectedYear}
            label="YEAR"
          />
        </View>

        {/* Sun Sign Display */}
        <View style={styles.sunSignContainer}>
          <Text style={styles.sunSignEmoji}>{sunSign.emoji}</Text>
          <Text style={styles.sunSignText}>Your Sun sign is {sunSign.name}</Text>
        </View>
      </View>

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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
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
  pickersRow: {
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
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  pickerContainer: {
    height: PICKER_HEIGHT,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
    zIndex: 1,
  },
  flatList: {
    flex: 1,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontFamily: typography.fonts.bodyMedium,
    fontSize: 18,
    color: colors.textMuted,
  },
  pickerItemTextSelected: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 20,
    color: colors.primary,
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
