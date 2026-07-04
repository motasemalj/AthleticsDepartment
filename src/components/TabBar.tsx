import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/ui/Text';
import { colors, spacing } from '@/theme/tokens';

export interface TabConfig {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

function TabItem({
  config,
  focused,
  onPress,
}: {
  config: TabConfig;
  focused: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={config.label}
      accessibilityState={{ selected: focused }}
      onPress={() => {
        Haptics.selectionAsync();
        // withSequence instead of a completion callback: on web the callback
        // fires synchronously, and re-assigning the shared value inside it
        // recurses until the call stack overflows.
        scale.value = withSequence(
          withSpring(0.85, { damping: 15 }),
          withSpring(1, { damping: 12 })
        );
        onPress();
      }}
      style={styles.tab}>
      <Animated.View style={[styles.tabInner, anim]}>
        <View>
          <Ionicons
            name={focused ? config.iconActive : config.icon}
            size={22}
            color={focused ? colors.accent : colors.textTertiary}
          />
          {config.badge ? (
            <View style={styles.badge}>
              <AppText variant="micro" color={colors.textOnAccent} style={{ fontSize: 9, lineHeight: 11 }}>
                {config.badge > 9 ? '9+' : config.badge}
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText variant="micro" color={focused ? colors.accent : colors.textTertiary}>
          {config.label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

interface TabBarNavProps {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (opts: { type: 'tabPress'; target?: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
}

export function TabBar({ state, navigation, tabs }: TabBarNavProps & { tabs: TabConfig[] }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const config = tabs.find((t) => t.name === route.name);
          if (!config) return null;
          const focused = state.index === index;
          return (
            <TabItem
              key={route.key}
              config={config}
              focused={focused}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Platform.OS === 'ios' ? colors.tabBar : colors.backgroundDeep,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', paddingTop: spacing.xs },
  tab: { flex: 1, alignItems: 'center' },
  tabInner: { alignItems: 'center', gap: 3, paddingVertical: 4 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
});
