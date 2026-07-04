import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AppText } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/theme/tokens';

export function BarChart({
  data,
  height = 140,
  color = colors.accent,
  highlightIndex,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  highlightIndex?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={[styles.row, { height: height + 24 }]}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * height);
        const active = highlightIndex === undefined || highlightIndex === i;
        return (
          <View key={`${d.label}-${i}`} style={styles.col}>
            <Animated.View
              entering={FadeInUp.delay(i * 40).duration(320)}
              style={{
                height: h,
                width: '68%',
                borderRadius: radius.xs,
                backgroundColor: active ? color : colors.surfaceHigh,
              }}
            />
            <AppText variant="micro" tone={active ? 'secondary' : 'tertiary'} numberOfLines={1}>
              {d.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xxs },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
});
