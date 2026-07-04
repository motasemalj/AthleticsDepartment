import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';

import { AppText } from '@/components/ui/Text';
import { colors, radius, shadows, spacing } from '@/theme/tokens';

type ToastKind = 'success' | 'error' | 'info';

interface ToastState {
  message: string | null;
  kind: ToastKind;
  show: (message: string, kind?: ToastKind) => void;
  hide: () => void;
}

export const useToast = create<ToastState>((set) => ({
  message: null,
  kind: 'success',
  show: (message, kind = 'success') => {
    Haptics.notificationAsync(
      kind === 'error'
        ? Haptics.NotificationFeedbackType.Error
        : Haptics.NotificationFeedbackType.Success
    );
    set({ message, kind });
  },
  hide: () => set({ message: null }),
}));

export const toast = {
  success: (m: string) => useToast.getState().show(m, 'success'),
  error: (m: string) => useToast.getState().show(m, 'error'),
  info: (m: string) => useToast.getState().show(m, 'info'),
};

const icons: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};
const toneColors: Record<ToastKind, string> = {
  success: colors.success,
  error: colors.danger,
  info: colors.info,
};

export function ToastHost() {
  const { message, kind, hide } = useToast();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(hide, 2600);
    return () => clearTimeout(t);
  }, [message, hide]);

  if (!message) return null;
  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 8 }]}>
      <Animated.View entering={FadeInUp.duration(240)} exiting={FadeOutUp.duration(200)} style={styles.toast}>
        <Ionicons name={icons[kind]} size={18} color={toneColors[kind]} />
        <AppText variant="caption" style={{ flexShrink: 1 }}>
          {message}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: '86%',
    borderWidth: 1,
    borderColor: colors.borderFaint,
    ...shadows.card,
  },
});
