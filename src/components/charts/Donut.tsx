import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/Text';
import { colors } from '@/theme/tokens';

export function Donut({
  segments,
  size = 140,
  strokeWidth = 16,
  centerLabel,
  centerSublabel,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerSublabel?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const withOffsets = segments.reduce<{ frac: number; offset: number; color: string }[]>((acc, s) => {
    const prev = acc[acc.length - 1];
    acc.push({ frac: s.value / total, offset: prev ? prev.offset + prev.frac : 0, color: s.color });
    return acc;
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceHigh} strokeWidth={strokeWidth} fill="none" />
        {withOffsets.map((s, i) => {
          const dash = Math.max(0, s.frac * c - 4);
          return (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={s.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-s.offset * c}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        {centerLabel ? <AppText variant="title">{centerLabel}</AppText> : null}
        {centerSublabel ? (
          <AppText variant="micro" tone="tertiary">
            {centerSublabel}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
