import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

export default function AdminOverview() {
  const router = useRouter();
  const { userId, user } = useCurrentUser();
  const { unreadNotifications } = useUnreadCounts(userId);

  const users = useData((s) => s.users);
  const coachProfiles = useData((s) => s.coachProfiles);
  const athleteProfiles = useData((s) => s.athleteProfiles);
  const subscriptions = useData((s) => s.subscriptions);
  const payments = useData((s) => s.payments);

  const approvedCoaches = coachProfiles.filter((c) => c.status === 'approved');
  const pendingCoaches = coachProfiles.filter((c) => c.status === 'pending');
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const pastDue = subscriptions.filter((s) => s.status === 'past_due');

  const paid = useMemo(() => payments.filter((p) => p.status === 'paid'), [payments]);
  const ownerIds = useMemo(
    () => new Set(coachProfiles.filter((c) => c.isOwner).map((c) => c.userId)),
    [coachProfiles]
  );

  const platformIncomeOf = (list: typeof paid) =>
    list.reduce((a, p) => a + p.commissionAed + (ownerIds.has(p.coachId) ? p.netAed : 0), 0);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const lastMonthStart = subMonths(new Date(monthStart), 1).getTime();
  const thisMonth = platformIncomeOf(paid.filter((p) => p.paidAt >= monthStart));
  const lastMonth = platformIncomeOf(paid.filter((p) => p.paidAt >= lastMonthStart && p.paidAt < monthStart));
  const delta = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
  const allTime = platformIncomeOf(paid);
  const mrr = activeSubs.reduce((a, s) => a + s.pricePerMonthAed, 0);

  const gmvByMonth = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const m = subMonths(new Date(), 5 - i);
        const start = new Date(m.getFullYear(), m.getMonth(), 1).getTime();
        const end = new Date(m.getFullYear(), m.getMonth() + 1, 1).getTime();
        return {
          label: format(m, 'MMM'),
          value: paid.filter((p) => p.paidAt >= start && p.paidAt < end).reduce((a, p) => a + p.amountAed, 0),
        };
      }),
    [paid]
  );

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
              Platform admin
            </AppText>
            <AppText variant="title">Overview</AppText>
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
        {/* Platform income hero */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card padded={false} style={{ overflow: 'hidden' }} onPress={() => router.push('/(admin)/revenue')}>
            <LinearGradient
              colors={['rgba(139,92,246,0.18)', 'rgba(198,243,59,0.05)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: spacing.lg }}>
              <View style={styles.heroTop}>
                <AppText variant="micro" tone="tertiary" uppercase>
                  Platform income · {format(new Date(), 'MMMM')}
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
                {formatAed(thisMonth)}
              </AppText>
              <View style={styles.heroMeta}>
                <View style={styles.heroMetaItem}>
                  <AppText variant="bodySemi">{formatAed(allTime, { compact: true })}</AppText>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    All time
                  </AppText>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroMetaItem}>
                  <AppText variant="bodySemi">{formatAed(mrr, { compact: true })}</AppText>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    Gross MRR
                  </AppText>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroMetaItem}>
                  <AppText variant="bodySemi">{activeSubs.length}</AppText>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    Active subs
                  </AppText>
                </View>
              </View>
            </LinearGradient>
          </Card>
        </Animated.View>

        {/* Community */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <StatCard
            icon="people-outline"
            label="Approved coaches"
            value={`${approvedCoaches.length}`}
            onPress={() => router.push('/(admin)/coaches')}
          />
          <StatCard
            icon="fitness-outline"
            iconColor={colors.info}
            iconBg={colors.infoMuted}
            label="Active athletes"
            value={`${athleteProfiles.length}`}
            onPress={() => router.push('/(admin)/subscriptions')}
          />
        </View>

        {/* Needs attention */}
        <SectionHeader title="Needs attention" />
        {pendingCoaches.length === 0 && pastDue.length === 0 ? (
          <Card style={styles.attentionRow}>
            <View style={[styles.rowIcon, { backgroundColor: colors.successMuted }]}>
              <Ionicons name="checkmark-done-outline" size={18} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodySemi">All clear</AppText>
              <AppText variant="captionRegular" tone="secondary">
                No pending applications or failed payments
              </AppText>
            </View>
          </Card>
        ) : (
          <>
            {pendingCoaches.map((c, i) => {
              const u = users.find((x) => x.id === c.userId);
              return (
                <Animated.View key={c.userId} entering={FadeInDown.delay(60 + i * 40).duration(300)}>
                  <Card style={styles.attentionRow} onPress={() => router.push(`/(admin)/coach/${c.userId}`)}>
                    <Avatar name={u?.name ?? ''} uri={u?.avatarUrl} size={38} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodySemi" numberOfLines={1}>
                        {u?.name}
                      </AppText>
                      <AppText variant="captionRegular" tone="secondary" numberOfLines={1} style={{ marginTop: 1 }}>
                        Coach application · {c.certifications.length} cert{c.certifications.length === 1 ? '' : 's'} ·{' '}
                        {formatRelativeTime(c.appliedAt)}
                      </AppText>
                    </View>
                    <Badge label="Review" tone="warning" />
                  </Card>
                </Animated.View>
              );
            })}
            {pastDue.map((s) => {
              const u = users.find((x) => x.id === s.athleteId);
              return (
                <Card key={s.id} style={styles.attentionRow} onPress={() => router.push('/(admin)/subscriptions')}>
                  <View style={[styles.rowIcon, { backgroundColor: colors.dangerMuted }]}>
                    <Ionicons name="card-outline" size={17} color={colors.danger} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySemi" numberOfLines={1}>
                      {u?.name}
                    </AppText>
                    <AppText variant="captionRegular" tone="secondary" numberOfLines={1} style={{ marginTop: 1 }}>
                      Payment failed · {formatAed(s.pricePerMonthAed)}/mo
                    </AppText>
                  </View>
                  <Badge label="Past due" tone="danger" />
                </Card>
              );
            })}
          </>
        )}

        {/* GMV */}
        <SectionHeader title="Gross volume · 6 months" action="Revenue split" onAction={() => router.push('/(admin)/revenue')} />
        <Animated.View entering={FadeInDown.delay(140).duration(320)}>
          <Card>
            <BarChart data={gmvByMonth} highlightIndex={5} color={colors.violet} height={120} />
          </Card>
        </Animated.View>
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
  attentionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
