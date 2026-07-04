import React, { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { AppText } from '@/components/ui/Text';
import { colors, spacing } from '@/theme/tokens';

export function LineChart({
  data,
  height = 140,
  color = colors.accent,
  labels,
  formatValue = (v) => `${v}`,
}: {
  data: number[];
  height?: number;
  color?: string;
  labels?: string[];
  formatValue?: (v: number) => string;
}) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (data.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }} onLayout={onLayout}>
        <AppText variant="captionRegular" tone="tertiary">
          Not enough data yet
        </AppText>
      </View>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padTop = 14;
  const padBottom = 6;
  const chartH = height - padTop - padBottom;

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: padTop + chartH * (1 - (v - min) / range),
  }));

  // Smooth cubic path
  let d = `M ${points[0]!.x} ${points[0]!.y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1]!;
    const p1 = points[i]!;
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const area = `${d} L ${width} ${height} L 0 ${height} Z`;
  const last = points[points.length - 1]!;
  const gradId = `grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <View onLayout={onLayout}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <AppText variant="micro" tone="tertiary">
          {formatValue(min)}
        </AppText>
        <AppText variant="micro" tone="tertiary">
          {formatValue(max)}
        </AppText>
      </View>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={color} stopOpacity={0.01} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill={`url(#${gradId})`} />
          <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Circle cx={last.x} cy={last.y} r={5} fill={colors.background} stroke={color} strokeWidth={2.5} />
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      {labels && labels.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xxs }}>
          {labels.map((l, i) => (
            <AppText key={`${l}-${i}`} variant="micro" tone="tertiary">
              {l}
            </AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}
