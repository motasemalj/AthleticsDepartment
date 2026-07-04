import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppText } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/theme/tokens';

export function ListRow({
  icon,
  iconColor = colors.textSecondary,
  iconBg = colors.surfaceHigh,
  title,
  subtitle,
  right,
  chevron = true,
  onPress,
  destructive,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={
        onPress
          ? () => {
              Haptics.selectionAsync();
              onPress();
            }
          : undefined
      }
      style={({ pressed }) => [styles.row, pressed && onPress ? { opacity: 0.7 } : null]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: destructive ? colors.dangerMuted : iconBg }]}>
          <Ionicons name={icon} size={17} color={destructive ? colors.danger : iconColor} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText variant="bodySemi" tone={destructive ? 'danger' : 'primary'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 1 }}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
      {chevron && onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 56,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
