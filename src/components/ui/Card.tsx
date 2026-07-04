import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { AppText } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/theme/tokens';

export function Card({
  children,
  style,
  onPress,
  padded = true,
  raised,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padded?: boolean;
  raised?: boolean;
}) {
  const inner = (
    <View
      style={[
        styles.card,
        raised && { backgroundColor: colors.surfaceRaised },
        padded && { padding: spacing.md },
        style,
      ]}>
      {children}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.995 : 1 }] })}>
      {inner}
    </Pressable>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <AppText variant="headline">{title}</AppText>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
          <AppText variant="caption" tone="accent">
            {action}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderFaint,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
});
