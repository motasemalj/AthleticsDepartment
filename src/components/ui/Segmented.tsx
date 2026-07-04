import React from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/ui/Text';
import { colors, motion, radius, spacing } from '@/theme/tokens';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const width = useSharedValue(0);
  const index = options.findIndex((o) => o.value === value);
  const translate = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = (e.nativeEvent.layout.width - 8) / options.length;
    width.value = w;
    translate.value = withTiming(index * w, { duration: 0 });
  };

  React.useEffect(() => {
    if (width.value > 0) translate.value = withTiming(index * width.value, { duration: motion.base });
  }, [index, translate, width]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ translateX: translate.value }],
  }));

  return (
    <View style={styles.track} onLayout={onLayout} accessibilityRole="tablist">
      <Animated.View style={[styles.thumb, thumbStyle]} />
      {options.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.value === value }}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(o.value);
          }}
          style={styles.option}>
          <AppText
            variant="caption"
            color={o.value === value ? colors.text : colors.textTertiary}
            numberOfLines={1}>
            {o.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
  },
  option: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
  },
});
