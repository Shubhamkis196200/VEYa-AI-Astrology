/**
 * VEYa — AnimatedPressable
 *
 * Consolidated `Animated.createAnimatedComponent(Pressable)` that was
 * declared in 12+ files. Import this instead of recreating it everywhere.
 */

import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default AnimatedPressable;
