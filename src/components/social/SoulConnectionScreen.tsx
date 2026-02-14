// ============================================================================
// VEYa Soul Connection Screen — Friend System UI
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  useSoulConnectionStore,
  SUPPORT_TYPES,
  ZODIAC_EMOJIS,
  type CosmicFriend,
  type CosmicWeather,
} from '@/stores/soulConnectionStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { borderRadius } from '@/theme/borderRadius';

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// ---------------------------------------------------------------------------
// Friend Card Component
// ---------------------------------------------------------------------------

interface FriendCardProps {
  friend: CosmicFriend;
  weather: CosmicWeather;
  onSendSupport: (friendId: string) => void;
  onPress: () => void;
  index: number;
}

function FriendCard({ friend, weather, onSendSupport, onPress, index }: FriendCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const weatherColors = {
    good: ['#059669', '#10B981'],
    neutral: ['#6366F1', '#818CF8'],
    challenging: ['#DC2626', '#EF4444'],
  };

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100 + index * 80)}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.friendCard}
      >
        <LinearGradient
          colors={['#FFFFFF', '#FDFBF7']}
          style={styles.friendCardGradient}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <LinearGradient
              colors={weatherColors[weather.overall]}
              style={styles.avatarRing}
            >
              <View style={styles.avatarInner}>
                <Text style={styles.avatarText}>
                  {ZODIAC_EMOJIS[friend.sunSign] || friend.avatar}
                </Text>
              </View>
            </LinearGradient>
            <View style={[styles.weatherDot, { backgroundColor: weatherColors[weather.overall][0] }]} />
          </View>

          {/* Info */}
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{friend.name}</Text>
            <Text style={styles.friendSign}>{friend.sunSign} {ZODIAC_EMOJIS[friend.sunSign]}</Text>
            <Text style={styles.weatherText}>{weather.emoji} {weather.summary}</Text>
          </View>

          {/* Support Button */}
          {weather.supportNeeded && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSendSupport(friend.id);
              }}
              style={styles.supportButton}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.supportButtonGradient}
              >
                <Text style={styles.supportButtonText}>🫂</Text>
              </LinearGradient>
            </Pressable>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Add Friend Modal
// ---------------------------------------------------------------------------

interface AddFriendModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (friend: { name: string; sunSign: string }) => void;
}

function AddFriendModal({ visible, onClose, onAdd }: AddFriendModalProps) {
  const [name, setName] = useState('');
  const [selectedSign, setSelectedSign] = useState<string | null>(null);

  const handleAdd = () => {
    if (!name.trim() || !selectedSign) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAdd({ name: name.trim(), sunSign: selectedSign });
    setName('');
    setSelectedSign(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeInUp.duration(300)} style={styles.modalContainer}>
          <LinearGradient
            colors={['#1B0B38', '#2D1B4E']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Add a Soul Connection</Text>
              <Text style={styles.modalSubtitle}>
                Connect with someone to share cosmic support
              </Text>
            </View>

            {/* Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Their Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter their name..."
                placeholderTextColor="rgba(255, 255, 255, 0.4)"
                style={styles.textInput}
              />
            </View>

            {/* Sign Picker */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Their Sun Sign</Text>
              <View style={styles.signGrid}>
                {ZODIAC_SIGNS.map((sign) => (
                  <Pressable
                    key={sign}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedSign(sign);
                    }}
                    style={[
                      styles.signButton,
                      selectedSign === sign && styles.signButtonSelected,
                    ]}
                  >
                    <Text style={styles.signEmoji}>{ZODIAC_EMOJIS[sign]}</Text>
                    <Text style={[
                      styles.signName,
                      selectedSign === sign && styles.signNameSelected,
                    ]}>
                      {sign}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAdd}
                style={[styles.addButton, (!name.trim() || !selectedSign) && styles.addButtonDisabled]}
                disabled={!name.trim() || !selectedSign}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  style={styles.addButtonGradient}
                >
                  <Text style={styles.addButtonText}>Add Connection ✨</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Send Support Modal
// ---------------------------------------------------------------------------

interface SendSupportModalProps {
  visible: boolean;
  friend: CosmicFriend | null;
  onClose: () => void;
  onSend: (type: keyof typeof SUPPORT_TYPES) => void;
}

function SendSupportModal({ visible, friend, onClose, onSend }: SendSupportModalProps) {
  if (!friend) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View entering={FadeInUp.duration(300)} style={styles.supportModalContainer}>
          <LinearGradient
            colors={['#1B0B38', '#2D1B4E']}
            style={styles.supportModalContent}
          >
            <Text style={styles.supportModalTitle}>
              Send cosmic support to {friend.name} ✨
            </Text>
            
            <View style={styles.supportOptions}>
              {(Object.entries(SUPPORT_TYPES) as [keyof typeof SUPPORT_TYPES, typeof SUPPORT_TYPES[keyof typeof SUPPORT_TYPES]][]).map(([key, support]) => (
                <Pressable
                  key={key}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    onSend(key);
                    onClose();
                  }}
                  style={styles.supportOption}
                >
                  <Text style={styles.supportOptionEmoji}>{support.emoji}</Text>
                  <Text style={styles.supportOptionLabel}>{support.label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={onClose} style={styles.supportCancelButton}>
              <Text style={styles.supportCancelText}>Maybe later</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SoulConnectionScreen() {
  const {
    friends,
    addFriend,
    sendSupport,
    getAllFriendsWeather,
    getFriendsNeedingSupport,
  } = useSoulConnectionStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<CosmicFriend | null>(null);

  const friendsWithWeather = getAllFriendsWeather();
  const needingSupport = getFriendsNeedingSupport();

  const handleSendSupport = (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (friend) {
      setSelectedFriend(friend);
      setSupportModalVisible(true);
    }
  };

  const handleAddFriend = (data: { name: string; sunSign: string }) => {
    addFriend(data);
  };

  const handleSupportSend = (type: keyof typeof SUPPORT_TYPES) => {
    if (selectedFriend) {
      sendSupport(selectedFriend.id, type);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
        <Text style={styles.title}>Soul Connections</Text>
        <Text style={styles.subtitle}>Your cosmic support network</Text>
      </Animated.View>

      {/* Alert: Friends Needing Support */}
      {needingSupport.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.alertCard}>
          <LinearGradient
            colors={['rgba(220, 38, 38, 0.15)', 'rgba(239, 68, 68, 0.1)']}
            style={styles.alertGradient}
          >
            <Text style={styles.alertEmoji}>🫂</Text>
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>
                {needingSupport.length} friend{needingSupport.length > 1 ? 's' : ''} could use support
              </Text>
              <Text style={styles.alertSubtitle}>
                {needingSupport.map(f => f.name).join(', ')} {needingSupport.length > 1 ? 'are' : 'is'} going through challenging transits
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* Friends List */}
      {friendsWithWeather.length > 0 ? (
        <View style={styles.friendsList}>
          {friendsWithWeather.map(({ friend, weather }, index) => (
            <FriendCard
              key={friend.id}
              friend={friend}
              weather={weather}
              onSendSupport={handleSendSupport}
              onPress={() => handleSendSupport(friend.id)}
              index={index}
            />
          ))}
        </View>
      ) : (
        <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌟</Text>
          <Text style={styles.emptyTitle}>No connections yet</Text>
          <Text style={styles.emptySubtitle}>
            Add friends to share cosmic support and see how the stars align for them
          </Text>
        </Animated.View>
      )}

      {/* Add Friend Button */}
      <Animated.View entering={FadeInUp.duration(400).delay(400)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setAddModalVisible(true);
          }}
          style={styles.addFriendButton}
        >
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED']}
            style={styles.addFriendGradient}
          >
            <Text style={styles.addFriendText}>+ Add Soul Connection</Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      {/* Modals */}
      <AddFriendModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddFriend}
      />
      <SendSupportModal
        visible={supportModalVisible}
        friend={selectedFriend}
        onClose={() => setSupportModalVisible(false)}
        onSend={handleSupportSend}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: colors.textMuted,
  },

  // Alert Card
  alertCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  alertGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  alertEmoji: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    color: 'rgba(220, 38, 38, 0.8)',
  },

  // Friend Card
  friendsList: {
    marginBottom: spacing.lg,
  },
  friendCard: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  friendCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatarSection: {
    position: 'relative',
  },
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  weatherDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.background,
  },
  friendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  friendName: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  friendSign: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 2,
  },
  weatherText: {
    fontFamily: typography.fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  supportButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  supportButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportButtonText: {
    fontSize: 20,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Add Friend Button
  addFriendButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  addFriendGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addFriendText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontFamily: typography.fonts.body,
    fontSize: 16,
    color: '#FFFFFF',
  },
  signGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  signButton: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  signButtonSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  signEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  signName: {
    fontFamily: typography.fonts.body,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  signNameSelected: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  addButton: {
    flex: 2,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },

  // Support Modal
  supportModalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  supportModalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 20,
    alignItems: 'center',
  },
  supportModalTitle: {
    fontFamily: typography.fonts.displaySemiBold,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  supportOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  supportOption: {
    width: '45%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  supportOptionEmoji: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  supportOptionLabel: {
    fontFamily: typography.fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  supportCancelButton: {
    paddingVertical: spacing.sm,
  },
  supportCancelText: {
    fontFamily: typography.fonts.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});
