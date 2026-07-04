import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, subMonths } from 'date-fns';

import { BarChart } from '@/components/charts/BarChart';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser, useUnreadCounts } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatAed, formatRelativeTime } from '@/utils';

const QUICK_ACTIONS = [
  { icon: 'person-add-outline' as const, label: 'Invite athlete', caption: 'Link & QR code', route: '/(coach)/invites' },
  { icon: 'barbell-outline' as const, label: 'Training plans', caption: 'Build & assign', route: '/(coach)/plans' },
  { icon: 'film-outline' as const, label: 'Video library', caption: 'Demo videos', route: '/(coach)/library' },
  { icon: 'wallet-outline' as const, label: 'Earnings', caption: 'Payouts & fees', route: '/(coach)/earnings' },
];

export default function CoachDashboard() {
  const router = useRouter();
  const { userId, user, coachProfile } = useCurrentUser();
  const { unreadNotifications } = useUnreadCounts(userId);

  const athleteProfiles = useData((s) => s.athleteProfiles);
  const users = useData((s) => s.users);
  const checkins = useData((s) => s.checkins);
  const bookings = useData((s) => s.bookings);
  const payments = useData((s) => s.payments);
  const subscriptions = useData((s) => s.subscriptions);

  const clients = athleteProfiles.filter((p) => p.coachId === userId);
  const activeSubs = subscriptions.filter((x) => x.coachId === userId && x.status === 'active');
  const mrr = activeSubs.reduce((a, x) => a + x.pricePerMonthAed, 0);

  const pending = useMemo(
    () =>
      checkins
        .filter((c) => c.coachId === userId && c.status === 'pending')
        .sort((a, b) => a.createdAt - b.createdAt),
    [checkins, userId]
  );
  const requests = bookings.filter((b) => b.coachId === userId && b.status === 'requested');

  const myPayments = useMemo(
    () => payments.filter((p) => p.coachId === userId && p.status === 'paid'),
    [payments, userId]
  );
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const lastMonthStart = subMonths(new Date(monthStart), 1).getTime();
  const thisMonthNet = myPayments.filter((p) => p.paidAt >= monthStart).reduce((a, p) => a + p.netAed, 0);
  const lastMonthNet = myPayments
    .filter((p) => p.paidAt >= lastMonthStart && p.paidAt < monthStart)
    .reduce((a, p) => a + p.netAed, 0);
  const delta = lastMonthNet > 0 ? Math.round(((thisMonthNet - lastMonthNet) / lastMonthNet) * 100) : 0;

  const revenueByMonth = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const m = subMonths(new Date(), 5 - i);
        const start = new Date(m.getFullYear(), m.getMonth(), 1).getTime();
        const end = new Date(m.getFullYear(), m.getMonth() + 1, 1).getTime();
        return {
          label: format(m, 'MMM'),
          value: myPayments.filter((p) => p.paidAt >= start && p.paidAt < end).reduce((a, p) => a + p.netAed, 0),
        };
      }),
    [myPayments]
  );

  const oldestPending = pending[0];
  const oldestAthlete = oldestPending ? users.find((u) => u.id === oldestPending.athleteId) : undefined;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const attentionItems = [
    ...(pending.length > 0
      ? [
          {
            key: 'checkins',
            icon: 'file-tray-outline' as const,
            color: colors.warning,
            bg: colors.warningMuted,
            title: `${pending.length} check-in${pending.length > 1 ? 's' : ''} to review`,
            subtitle: oldestPending
              ? `Oldest from ${oldestAthlete?.name?.split(' ')[0] ?? 'an athlete'} · ${formatRelativeTime(oldestPending.createdAt)}`
              : '',
            route: '/(coach)/checkins',
          },
        ]
      : []),
    ...requests.slice(0, 3).map((r) => {
      const athlete = users.find((u) => u.id === r.athleteId);
      return {
        key: r.id,
        icon: 'videocam-outline' as const,
        color: colors.info,
        bg: colors.infoMuted,
        title: `Session request · ${athlete?.name?.split(' ')[0] ?? 'Athlete'}`,
        subtitle: `${format(r.startsAt, 'EEE d MMM, h:mm a')} · confirm & add Meet link`,
        route: '/(coach)/schedule',
      };
    }),
  ];

  return (
    <Screen padded={false} tabbed>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={styles.headerLeft}>
          <Avatar name={user?.name ?? ''} uri={user?.avatarUrl} size={44} showRing />
          <View>
            <AppText variant="captionRegular" tone="secondary">
              {greeting}
            </AppText>
            <AppText variant="title">Coach {user?.name.split(' ')[0]}</AppText>
          </View>
        </Pressable>
        <Pressable
          style={styles.bell}
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={20} color={colors.text} />
          {unreadNotifications > 0 ? (
            <View style={styles.bellBadge}>
              <AppText variant="micro" color={colors.textOnAccent} style={{ fontSize: 9, lineHeight: 11 }}>
                {unreadNotifications > 9 ? '9+' : unreadNotifications}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        {/* Revenue hero */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card padded={false} style={{ overflow: 'hidden' }} onPress={() => router.push('/(coach)/earnings')}>
            <LinearGradient
              colors={['rgba(198,243,59,0.14)', 'rgba(139,92,246,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: spacing.lg }}>
              <View style={styles.heroTop}>
                <AppText variant="micro" tone="tertiary" uppercase>
                  Net revenue · {format(new Date(), 'MMMM')}
                </AppText>
                {delta !== 0 ? (
                  <Badge
                    label={`${delta > 0 ? '+' : ''}${delta}% vs last month`}
                    tone={delta >= 0 ? 'success' : 'danger'}
                    icon={delta >= 0 ? 'trending-up' : 'trending-down'}
                  />
                ) : null}
              </View>
              <AppText variant="hero" style={{ marginTop: spacing.xs }}>
                {formatAed(thisMonthNet)}
              </AppText>
              <View style={styles.heroMeta}>
                <View style={styles.heroMetaItem}>
                  <AppText variant="bodySemi">{formatAed(mrr, { compact: true })}</AppText>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    Recurring / mo
                  </AppText>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroMetaItem}>
                  <AppText variant="bodySemi">{activeSubs.length}</AppText>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    Active subs
                  </AppText>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroMetaItem}>
                  <AppText variant="bodySemi">{clients.length}</AppText>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    Clients
                  </AppText>
                </View>
              </View>
            </LinearGradient>
          </Card>
        </Animated.View>

        {/* Needs attention */}
        <SectionHeader title="Needs attention" />
        {attentionItems.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(60).duration(320)}>
            <Card style={styles.clearCard}>
              <View style={[styles.rowIcon, { backgroundColor: colors.successMuted }]}>
                <Ionicons name="checkmark-done-outline" size={18} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodySemi">All clear</AppText>
                <AppText variant="captionRegular" tone="secondary">
                  No pending check-ins or session requests
                </AppText>
              </View>
            </Card>
          </Animated.View>
        ) : (
          attentionItems.map((item, i) => (
            <Animated.View key={item.key} entering={FadeInDown.delay(60 + i * 40).duration(320)}>
              <Card style={styles.attentionRow} onPress={() => router.push(item.route as never)}>
                <View style={[styles.rowIcon, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi" numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <AppText variant="captionRegular" tone="secondary" numberOfLines={1} style={{ marginTop: 1 }}>
                    {item.subtitle}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </Card>
            </Animated.View>
          ))
        )}

        {/* Revenue trend */}
        <SectionHeader title="Last 6 months" action="Earnings" onAction={() => router.push('/(coach)/earnings')} />
        <Animated.View entering={FadeInDown.delay(140).duration(320)}>
          <Card>
            <BarChart data={revenueByMonth} highlightIndex={5} height={120} />
          </Card>
        </Animated.View>

        {/* Quick actions */}
        <SectionHeader title="Manage" />
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a, i) => (
            <Animated.View key={a.label} entering={FadeInDown.delay(180 + i * 40).duration(300)} style={styles.actionCell}>
              <Card style={styles.actionCard} onPress={() => router.push(a.route as never)}>
                <View style={styles.actionIcon}>
                  <Ionicons name={a.icon} size={19} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi" numberOfLines={1}>
                    {a.label}
                  </AppText>
                  <AppText variant="micro" tone="tertiary" numberOfLines={1}>
                    {a.caption}
                  </AppText>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>

        {coachProfile?.isOwner ? (
          <Animated.View entering={FadeInDown.delay(320).duration(300)}>
            <View style={styles.ownerNote}>
              <Ionicons name="star" size={13} color={colors.violet} />
              <AppText variant="captionRegular" tone="secondary" style={{ flex: 1 }}>
                Owner account — your coaching revenue counts as platform income
              </AppText>
            </View>
          </Animated.View>
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
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
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    backgroundColor: 'rgba(11,13,16,0.35)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  heroMetaItem: { flex: 1, alignItems: 'center', gap: 2 },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 30, backgroundColor: colors.border },
  clearCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  attentionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  actionCell: { width: '48.4%', flexGrow: 1 },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    justifyContent: 'center',
  },
});
