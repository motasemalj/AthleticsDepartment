import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/theme/tokens';

/**
 * Lightweight drag-to-reorder list for small collections (plan exercises).
 * Rows are fixed-height; dragging the handle reorders items with springy
 * displacement of neighbours.
 */

function clampWorklet(v: number, min: number, max: number): number {
  'worklet';
  return Math.min(max, Math.max(min, v));
}

function SortableRow({
  index,
  count,
  rowHeight,
  positions,
  onReorder,
  children,
}: {
  index: number;
  count: number;
  rowHeight: number;
  positions: SharedValue<number[]>;
  onReorder: (from: number, to: number) => void;
  children: React.ReactNode;
}) {
  const dragging = useSharedValue(false);
  const dragY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .activateAfterLongPress(180)
    .onStart(() => {
      dragging.value = true;
      dragY.value = positions.value[index]! * rowHeight;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((e) => {
      const base = positions.value[index]! * rowHeight;
      dragY.value = clampWorklet(base + e.translationY, 0, (count - 1) * rowHeight);
      const newOrder = clampWorklet(Math.round(dragY.value / rowHeight), 0, count - 1);
      const currentOrder = positions.value[index]!;
      if (newOrder !== currentOrder) {
        // Swap: find the row currently occupying newOrder and give it our slot.
        const next = [...positions.value];
        const other = next.findIndex((p, i) => i !== index && p === newOrder);
        if (other >= 0) {
          next[other] = currentOrder;
          next[index] = newOrder;
          positions.value = next;
          runOnJS(Haptics.selectionAsync)();
        }
      }
    })
    .onFinalize(() => {
      dragging.value = false;
      const from = index;
      const to = positions.value[index]!;
      runOnJS(onReorder)(from, to);
    });

  const style = useAnimatedStyle(() => {
    const targetY = positions.value[index]! * rowHeight;
    return {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: rowHeight,
      zIndex: dragging.value ? 10 : 0,
      transform: [
        { translateY: dragging.value ? dragY.value : withSpring(targetY, { damping: 18, stiffness: 180 }) },
        { scale: withTiming(dragging.value ? 1.03 : 1, { duration: 150 }) },
      ],
      shadowOpacity: dragging.value ? 0.35 : 0,
      shadowRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
    };
  });

  return (
    <Animated.View style={style}>
      <View style={styles.rowInner}>
        <View style={{ flex: 1 }}>{children}</View>
        <GestureDetector gesture={gesture}>
          <Animated.View style={styles.handle} accessibilityLabel="Drag to reorder" accessibilityRole="button">
            <Ionicons name="reorder-three-outline" size={22} color={colors.textTertiary} />
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

export function SortableList<T>({
  data,
  keyExtractor,
  rowHeight,
  renderItem,
  onReorder,
}: {
  data: T[];
  keyExtractor: (item: T) => string;
  rowHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  onReorder: (nextData: T[]) => void;
}) {
  const positions = useSharedValue<number[]>(data.map((_, i) => i));

  useEffect(() => {
    positions.value = data.map((_, i) => i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.length]);

  const commit = () => {
    const order = positions.value;
    const next: T[] = new Array(data.length);
    data.forEach((item, i) => {
      next[order[i]!] = item;
    });
    if (next.some((item, i) => keyExtractor(item) !== keyExtractor(data[i]!))) {
      onReorder(next);
    }
  };

  return (
    <View style={{ height: data.length * rowHeight }}>
      {data.map((item, i) => (
        <SortableRow
          key={keyExtractor(item)}
          index={i}
          count={data.length}
          rowHeight={rowHeight}
          positions={positions}
          onReorder={commit}
        >
          {renderItem(item, i)}
        </SortableRow>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rowInner: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  handle: {
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
