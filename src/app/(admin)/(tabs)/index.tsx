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
  // Platform income = commission from partner coaches + full net of owner coaches
  const ownerIds = new Set(coachProfiles.filter((c) => c.isOwner).map((c) => c.userId));
  const platformIncome = paid.reduce(
    (a, p) => a + p.commissionAed + (ownerIds.has(p.coachId) ? p.netAed : 0),
    0
  );
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const platformThisMonth = paid
    .filter((p) => p.paidAt >= monthStart)
    .reduce((a, p) => a + p.commissionAed + (ownerIds.has(p.coachId) ? p.netAed : 0), 0);

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
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
          <Avatar name={user?.name ?? ''} uri={user?.avatarUrl} size={44} />
          <View>
            <AppText variant="captionRegular" tone="secondary">
              Platform admin
            </AppText>
            <AppText variant="title">Athletics Department</AppText>
          </View>
        </View>
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

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Animated.View entering={FadeInDown.duration(320)} style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <StatCard
              icon="trending-up-outline"
              label="Platform income (month)"
              value={formatAed(platformThisMonth, { compact: true })}
              onPress={() => router.push('/(admin)/revenue')}
            />
            <StatCard
              icon="cash-outline"
              iconColor={colors.violet}
              iconBg={colors.violetMuted}
              label="All-time income"
              value={formatAed(platformIncome, { compact: true })}
              onPress={() => router.push('/(admin)/revenue')}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <StatCard
              icon="people-outline"
              iconColor={colors.info}
              iconBg={colors.infoMuted}
              label="Coaches / athletes"
              value={`${approvedCoaches.length} / ${athleteProfiles.length}`}
              onPress={() => router.push('/(admin)/coaches')}
            />
            <StatCard
              icon="repeat-outline"
              iconColor={colors.success}
              iconBg={colors.successMuted}
              label="Active subscriptions"
              value={`${activeSubs.length}`}
              onPress={() => router.push('/(admin)/subscriptions')}
            />
          </View>
        </Animated.View>

        {/* Action needed */}
        {(pendingCoaches.length > 0 || pastDue.length > 0) ? (
          <>
            <SectionHeader title="Needs attention" />
            {pendingCoaches.map((c) => {
              const u = users.find((x) => x.id === c.userId);
              return (
                <Animated.View key={c.userId} entering={FadeInDown.delay(60).duration(300)}>
                  <Card style={styles.alertRow} onPress={() => router.push(`/(admin)/coach/${c.userId}`)}>
                    <Avatar name={u?.name ?? ''} uri={u?.avatarUrl} size={40} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodySemi">{u?.name}</AppText>
                      <AppText variant="captionRegular" tone="secondary">
                        Coach application · {c.certifications.length} certification{c.certifications.length === 1 ? '' : 's'} · {formatRelativeTime(c.appliedAt)}
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
                <Card key={s.id} style={styles.alertRow} onPress={() => router.push('/(admin)/subscriptions')}>
                  <View style={styles.alertIcon}>
                    <Ionicons name="card-outline" size={17} color={colors.danger} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySemi">{u?.name}</AppText>
                    <AppText variant="captionRegular" tone="secondary">
                      Payment failed · {formatAed(s.pricePerMonthAed)}/mo
                    </AppText>
                  </View>
                  <Badge label="Past due" tone="danger" />
                </Card>
              );
            })}
          </>
        ) : null}

        <SectionHeader title="Gross volume (GMV)" action="Revenue" onAction={() => router.push('/(admin)/revenue')} />
        <Animated.View entering={FadeInDown.delay(120).duration(320)}>
          <Card>
            <BarChart data={gmvByMonth} highlightIndex={5} color={colors.violet} />
          </Card>
        </Animated.View>

        <SectionHeader title="Platform pulse" />
        <Card>
          {[
            { icon: 'shield-checkmark-outline' as const, label: 'Coach approval rate', value: `${approvedCoaches.length}/${coachProfiles.length}` },
            { icon: 'sync-outline' as const, label: 'Real-time channels', value: '9 live' },
            { icon: 'notifications-outline' as const, label: 'Push notifications', value: 'Operational' },
            { icon: 'card-outline' as const, label: 'Stripe payments', value: 'Operational' },
          ].map((r, i) => (
            <View key={r.label} style={[styles.pulseRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <Ionicons name={r.icon} size={16} color={colors.textSecondary} />
              <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
                {r.label}
              </AppText>
              <AppText variant="caption" tone="success">
                {r.value}
              </AppText>
            </View>
          ))}
        </Card>
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
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
});
