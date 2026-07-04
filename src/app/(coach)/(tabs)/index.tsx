import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, subMonths } from 'date-fns';

import { BarChart } from '@/components/charts/BarChart';
import { StatCard } from '@/components/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser, useUnreadCounts } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatAed, formatRelativeTime } from '@/utils';

export default function CoachDashboard() {
  const router = useRouter();
  const { userId, user, coachProfile } = useCurrentUser();
  const { unreadMessages, unreadNotifications } = useUnreadCounts(userId);

  const athleteProfiles = useData((s) => s.athleteProfiles);
  const users = useData((s) => s.users);
  const checkins = useData((s) => s.checkins);
  const bookings = useData((s) => s.bookings);
  const payments = useData((s) => s.payments);

  const clients = athleteProfiles.filter((p) => p.coachId === userId);
  const pending = checkins
    .filter((c) => c.coachId === userId && c.status === 'pending')
    .sort((a, b) => a.createdAt - b.createdAt);
  const requests = bookings.filter((b) => b.coachId === userId && b.status === 'requested');

  const myPayments = useMemo(() => payments.filter((p) => p.coachId === userId && p.status === 'paid'), [payments, userId]);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const thisMonthNet = myPayments.filter((p) => p.paidAt >= monthStart).reduce((a, p) => a + p.netAed, 0);

  const revenueByMonth = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(new Date(), 5 - i);
      const start = new Date(m.getFullYear(), m.getMonth(), 1).getTime();
      const end = new Date(m.getFullYear(), m.getMonth() + 1, 1).getTime();
      return {
        label: format(m, 'MMM'),
        value: myPayments.filter((p) => p.paidAt >= start && p.paidAt < end).reduce((a, p) => a + p.netAed, 0),
      };
    });
  }, [myPayments]);

  const oldestPending = pending[0];
  const oldestAthlete = oldestPending ? users.find((u) => u.id === oldestPending.athleteId) : undefined;

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
          <Avatar name={user?.name ?? ''} uri={user?.avatarUrl} size={44} />
          <View>
            <AppText variant="captionRegular" tone="secondary">
              Coach dashboard
            </AppText>
            <AppText variant="title">{user?.name.split(' ')[0]}</AppText>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Pressable style={styles.bell} onPress={() => router.push('/(coach)/chats')} accessibilityLabel="Messages">
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text} />
            {unreadMessages > 0 ? (
              <View style={styles.bellBadge}>
                <AppText variant="micro" color={colors.textOnAccent} style={{ fontSize: 9, lineHeight: 11 }}>
                  {unreadMessages}
                </AppText>
              </View>
            ) : null}
          </Pressable>
          <Pressable style={styles.bell} onPress={() => router.push('/notifications')} accessibilityLabel="Notifications">
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {unreadNotifications > 0 ? (
              <View style={styles.bellBadge}>
                <AppText variant="micro" color={colors.textOnAccent} style={{ fontSize: 9, lineHeight: 11 }}>
                  {unreadNotifications}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        {/* Stats */}
        <Animated.View entering={FadeInDown.duration(320)} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <StatCard icon="people-outline" label="Active clients" value={`${clients.length}`} onPress={() => router.push('/(coach)/clients')} />
          <StatCard
            icon="wallet-outline"
            iconColor={colors.violet}
            iconBg={colors.violetMuted}
            label="Net this month"
            value={formatAed(thisMonthNet, { compact: true })}
            onPress={() => router.push('/(coach)/earnings')}
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(50).duration(320)} style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <StatCard
            icon="file-tray-outline"
            iconColor={colors.warning}
            iconBg={colors.warningMuted}
            label="Pending check-ins"
            value={`${pending.length}`}
            onPress={() => router.push('/(coach)/checkins')}
          />
          <StatCard
            icon="videocam-outline"
            iconColor={colors.info}
            iconBg={colors.infoMuted}
            label="Session requests"
            value={`${requests.length}`}
            onPress={() => router.push('/(coach)/schedule')}
          />
        </Animated.View>

        {/* Review queue callout */}
        {oldestPending ? (
          <Animated.View entering={FadeInDown.delay(100).duration(320)}>
            <Card style={styles.queueCard} onPress={() => router.push('/(coach)/checkins')}>
              <View style={styles.queueIcon}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodySemi">
                  {pending.length} check-in{pending.length > 1 ? 's' : ''} waiting for review
                </AppText>
                <AppText variant="captionRegular" tone="secondary">
                  Oldest from {oldestAthlete?.name ?? 'an athlete'} · {formatRelativeTime(oldestPending.createdAt)}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(100).duration(320)}>
            <Card style={[styles.queueCard, { borderColor: 'rgba(74,222,128,0.2)' }]}>
              <Ionicons name="checkmark-done-circle-outline" size={20} color={colors.success} />
              <AppText variant="caption" tone="success">
                Review queue clear — every check-in answered
              </AppText>
            </Card>
          </Animated.View>
        )}

        {/* Revenue chart */}
        <SectionHeader title="Net revenue" action="Earnings" onAction={() => router.push('/(coach)/earnings')} />
        <Animated.View entering={FadeInDown.delay(140).duration(320)}>
          <Card>
            <BarChart data={revenueByMonth} highlightIndex={5} />
          </Card>
        </Animated.View>

        {/* Quick actions */}
        <SectionHeader title="Quick actions" />
        <View style={styles.actionsGrid}>
          {[
            { icon: 'person-add-outline' as const, label: 'Invite athlete', route: '/(coach)/invites' },
            { icon: 'barbell-outline' as const, label: 'Plan builder', route: '/(coach)/plans' },
            { icon: 'film-outline' as const, label: 'Video library', route: '/(coach)/library' },
            { icon: 'pricetags-outline' as const, label: 'Pricing', route: '/(coach)/pricing' },
          ].map((a, i) => (
            <Animated.View key={a.label} entering={FadeInDown.delay(180 + i * 40).duration(300)} style={{ width: '48.5%' }}>
              <Card style={styles.actionCard} onPress={() => router.push(a.route as never)}>
                <Ionicons name={a.icon} size={20} color={colors.accent} />
                <AppText variant="caption">{a.label}</AppText>
              </Card>
            </Animated.View>
          ))}
        </View>

        {coachProfile?.isOwner ? (
          <Card style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Badge label="Owner" tone="violet" icon="star" />
            <AppText variant="captionRegular" tone="secondary" style={{ flex: 1 }}>
              Your coaching revenue counts as platform income
            </AppText>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -5,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    borderColor: 'rgba(251,191,36,0.25)',
  },
  queueIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.warningMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionCard: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
});
