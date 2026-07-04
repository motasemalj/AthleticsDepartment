import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/Text';
import { colors, spacing } from '@/theme/tokens';

export function ScreenHeader({
  title,
  subtitle,
  back,
  right,
  large,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
  large?: boolean;
}) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {back ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <AppText variant={large ? 'display' : 'title'} numberOfLines={1}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 2 }}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>
      {right}
    </View>
  );
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
  contentStyle,
  refreshing,
  onRefresh,
  keyboardAware,
  bottomInset = true,
  ...scrollProps
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  keyboardAware?: boolean;
  bottomInset?: boolean;
} & ScrollViewProps) {
  const insets = useSafeAreaInsets();

  const body = scroll ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        padded && { paddingHorizontal: spacing.lg },
        { paddingBottom: (bottomInset ? insets.bottom : 0) + spacing.xxl },
        contentStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        ) : undefined
      }
      {...scrollProps}>
      {children}
    </ScrollView>
  ) : (
    <View style={[{ flex: 1 }, padded && { paddingHorizontal: spacing.lg }, contentStyle]}>{children}</View>
  );

  const content = keyboardAware ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return <View style={[styles.screen, { paddingTop: insets.top + spacing.xs }, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
