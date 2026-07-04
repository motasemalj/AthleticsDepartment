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
  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.surfaceHigh} strokeWidth={strokeWidth} fill="none" />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = Math.max(0, frac * c - 4);
          const el = (
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
              strokeDashoffset={-offset * c}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
          offset += frac;
          return el;
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
