import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/Text';
import { colors, motion, radius, spacing } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  haptic?: boolean;
}

const heights: Record<Size, number> = { lg: 54, md: 46, sm: 36 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading,
  disabled,
  fullWidth,
  style,
  haptic = true,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isDisabled = disabled || loading;

  const bg =
    variant === 'primary' ? colors.accent
    : variant === 'secondary' ? colors.surfaceHigh
    : variant === 'danger' ? colors.dangerMuted
    : 'transparent';
  const fg =
    variant === 'primary' ? colors.textOnAccent
    : variant === 'danger' ? colors.danger
    : variant === 'ghost' ? colors.textSecondary
    : colors.text;

  return (
    <Animated.View style={[animStyle, fullWidth && { alignSelf: 'stretch' }, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
        disabled={isDisabled}
        onPressIn={() => (scale.value = withTiming(0.97, { duration: motion.fast }))}
        onPressOut={() => (scale.value = withTiming(1, { duration: motion.fast }))}
        onPress={() => {
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={({ pressed }) => [
          styles.base,
          {
            height: heights[size],
            backgroundColor: bg,
            borderRadius: size === 'sm' ? radius.sm : radius.md,
            opacity: isDisabled ? 0.45 : pressed ? 0.9 : 1,
          },
          variant === 'outline' && { borderWidth: 1.5, borderColor: colors.borderStrong },
          size === 'sm' && { paddingHorizontal: spacing.sm },
        ]}>
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : (
          <View style={styles.content}>
            {icon ? <Ionicons name={icon} size={size === 'sm' ? 15 : 18} color={fg} /> : null}
            <AppText
              variant={size === 'sm' ? 'caption' : 'bodySemi'}
              color={fg}
              numberOfLines={1}>
              {label}
            </AppText>
            {iconRight ? <Ionicons name={iconRight} size={size === 'sm' ? 15 : 18} color={fg} /> : null}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
