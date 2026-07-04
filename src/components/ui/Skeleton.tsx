import React, { useEffect } from 'react';
import { type DimensionValue, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing } from '@/theme/tokens';

export function Skeleton({
  width = '100%',
  height = 16,
  round,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  round?: boolean;
  style?: ViewStyle;
}) {
  const opacity = useSharedValue(0.45);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.85, { duration: 700 }), withTiming(0.45, { duration: 700 })),
      -1
    );
  }, [opacity]);
  const anim = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: round ? height / 2 : radius.xs, backgroundColor: colors.skeleton },
        anim,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <Animated.View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.sm,
      }}>
      <Skeleton width="55%" height={18} />
      <Skeleton width="90%" height={12} />
      <Skeleton width="72%" height={12} />
    </Animated.View>
  );
}
