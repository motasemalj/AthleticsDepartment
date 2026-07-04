import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppText } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/theme/tokens';

type BadgeTone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'violet' | 'neutral';

const tones: Record<BadgeTone, { bg: string; fg: string }> = {
  accent: { bg: colors.accentMuted, fg: colors.accent },
  success: { bg: colors.successMuted, fg: colors.success },
  warning: { bg: colors.warningMuted, fg: colors.warning },
  danger: { bg: colors.dangerMuted, fg: colors.danger },
  info: { bg: colors.infoMuted, fg: colors.info },
  violet: { bg: colors.violetMuted, fg: colors.violet },
  neutral: { bg: colors.surfaceHigh, fg: colors.textSecondary },
};

export function Badge({
  label,
  tone = 'neutral',
  icon,
  style,
}: {
  label: string;
  tone?: BadgeTone;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  const t = tones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }, style]}>
      {icon ? <Ionicons name={icon} size={11} color={t.fg} /> : null}
      <AppText variant="micro" color={t.fg} uppercase>
        {label}
      </AppText>
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  icon,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && { opacity: 0.8 },
        style,
      ]}>
      {icon ? (
        <Ionicons name={icon} size={14} color={selected ? colors.textOnAccent : colors.textSecondary} />
      ) : null}
      <AppText variant="caption" color={selected ? colors.textOnAccent : colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: { backgroundColor: colors.accent },
});
