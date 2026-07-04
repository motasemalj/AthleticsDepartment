import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';
import { colors, radius, spacing } from '@/theme/tokens';
import type { AppNotification, NotificationKind } from '@/types';
import { formatRelativeTime } from '@/utils';

const KIND_META: Record<NotificationKind, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  checkin: { icon: 'journal-outline', color: colors.accent, bg: colors.accentMuted },
  message: { icon: 'chatbubble-ellipses-outline', color: colors.info, bg: colors.infoMuted },
  booking: { icon: 'videocam-outline', color: colors.violet, bg: colors.violetMuted },
  plan: { icon: 'barbell-outline', color: colors.accent, bg: colors.accentMuted },
  payment: { icon: 'card-outline', color: colors.success, bg: colors.successMuted },
  approval: { icon: 'shield-checkmark-outline', color: colors.warning, bg: colors.warningMuted },
  system: { icon: 'sparkles-outline', color: colors.textSecondary, bg: colors.surfaceHigh },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const userId = useSession((s) => s.userId);
  const notifications = useData((s) => s.notifications);
  const markNotificationRead = useData((s) => s.markNotificationRead);
  const markAllNotificationsRead = useData((s) => s.markAllNotificationsRead);

  const mine = notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  const unread = mine.filter((n) => !n.read).length;

  const open = (n: AppNotification) => {
    markNotificationRead(n.id);
    if (n.route) {
      router.back();
      setTimeout(() => router.push(n.route as never), 150);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Notifications"
        back
        right={
          unread > 0 ? (
            <Button label="Mark all read" variant="ghost" size="sm" onPress={() => markAllNotificationsRead(userId!)} />
          ) : undefined
        }
      />
      {mine.length === 0 ? (
        <EmptyState icon="notifications-outline" title="All caught up" message="You'll see check-ins, messages, bookings and payment updates here." />
      ) : (
        <FlatList
          data={mine}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
          renderItem={({ item, index }) => {
            const meta = KIND_META[item.kind];
            return (
              <Animated.View entering={FadeInDown.delay(Math.min(index * 30, 300)).duration(280)}>
                <View
                  onTouchEnd={() => open(item)}
                  style={[styles.row, !item.read && styles.rowUnread]}
                  accessibilityRole="button">
                  <View style={[styles.icon, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={17} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySemi" numberOfLines={1}>
                      {item.title}
                    </AppText>
                    <AppText variant="captionRegular" tone="secondary" numberOfLines={2} style={{ marginTop: 1 }}>
                      {item.body}
                    </AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <AppText variant="micro" tone="tertiary">
                      {formatRelativeTime(item.createdAt)}
                    </AppText>
                    {!item.read ? <View style={styles.dot} /> : null}
                  </View>
                </View>
              </Animated.View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: 2,
  },
  rowUnread: { backgroundColor: colors.surface },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
});
