import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/Text';
import { colors, motion, radius } from '@/theme/tokens';
import { clamp } from '@/utils';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 7,
  color = colors.accent,
  trackColor = colors.surfaceHigh,
  label,
  sublabel,
}: {
  progress: number; // 0..1
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withTiming(clamp(progress, 0, 1), { duration: motion.slow });
  }, [progress, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {label ? (
        <View style={{ alignItems: 'center' }}>
          <AppText variant="bodySemi" style={{ fontSize: size * 0.2 }}>
            {label}
          </AppText>
          {sublabel ? (
            <AppText variant="micro" tone="tertiary">
              {sublabel}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function ProgressBar({
  progress,
  color = colors.accent,
  height = 7,
  style,
}: {
  progress: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
}) {
  const animated = useSharedValue(0);
  useEffect(() => {
    animated.value = withTiming(clamp(progress, 0, 1), { duration: motion.slow });
  }, [progress, animated]);
  const fill = useAnimatedStyle(() => ({ width: `${animated.value * 100}%` }));
  return (
    <View style={[{ height, borderRadius: radius.full, backgroundColor: colors.surfaceHigh, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ height: '100%', borderRadius: radius.full, backgroundColor: color }, fill]} />
    </View>
  );
}
