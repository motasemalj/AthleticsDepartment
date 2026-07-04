import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/theme/tokens';

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  compact,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(320)} style={[styles.wrap, compact && { paddingVertical: spacing.xl }]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.accent} />
      </View>
      <AppText variant="headline" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="captionRegular" tone="secondary" align="center" style={{ maxWidth: 280 }}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} size="sm" style={{ marginTop: spacing.xs }} />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.huge,
    paddingHorizontal: spacing.lg,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
