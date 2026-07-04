import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/theme/tokens';

export function StatCard({
  icon,
  iconColor = colors.accent,
  iconBg = colors.accentMuted,
  label,
  value,
  delta,
  deltaPositive,
  style,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  return (
    <Card style={[styles.card, style]} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={16} color={iconColor} />
        </View>
        {delta ? (
          <View style={styles.deltaWrap}>
            <Ionicons
              name={deltaPositive ? 'trending-up' : 'trending-down'}
              size={12}
              color={deltaPositive ? colors.success : colors.danger}
            />
            <AppText variant="micro" tone={deltaPositive ? 'success' : 'danger'}>
              {delta}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText variant="stat" style={{ marginTop: spacing.sm }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="captionRegular" tone="secondary" numberOfLines={1}>
        {label}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
