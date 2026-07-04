import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, subMonths } from 'date-fns';

import { BarChart } from '@/components/charts/BarChart';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Card, Divider, SectionHeader } from '@/components/ui/Card';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatAed } from '@/utils';

export default function EarningsScreen() {
  const { userId, coachProfile } = useCurrentUser();
  const payments = useData((s) => s.payments);
  const payouts = useData((s) => s.payouts);
  const users = useData((s) => s.users);
  const subscriptions = useData((s) => s.subscriptions);

  const mine = useMemo(() => payments.filter((p) => p.coachId === userId && p.status === 'paid'), [payments, userId]);
  const gross = mine.reduce((a, p) => a + p.amountAed, 0);
  const commission = mine.reduce((a, p) => a + p.commissionAed, 0);
  const net = mine.reduce((a, p) => a + p.netAed, 0);
  const myPayouts = payouts.filter((p) => p.coachId === userId);
  const activeSubs = subscriptions.filter((s) => s.coachId === userId && s.status === 'active');
  const mrr = activeSubs.reduce((a, s) => a + s.pricePerMonthAed, 0);

  const monthly = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const m = subMonths(new Date(), 5 - i);
        const start = new Date(m.getFullYear(), m.getMonth(), 1).getTime();
        const end = new Date(m.getFullYear(), m.getMonth() + 1, 1).getTime();
        return {
          label: format(m, 'MMM'),
          value: mine.filter((p) => p.paidAt >= start && p.paidAt < end).reduce((a, p) => a + p.netAed, 0),
        };
      }),
    [mine]
  );

  const recent = [...mine].sort((a, b) => b.paidAt - a.paidAt).slice(0, 10);

  return (
    <Screen padded={false}>
      <ScreenHeader title="Earnings" back subtitle={coachProfile?.isOwner ? 'Owner account — 0% commission' : `Platform commission ${coachProfile?.commissionPct}%`} />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Animated.View entering={FadeInDown.duration(320)} style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <StatCard icon="cash-outline" label="Gross (all time)" value={formatAed(gross, { compact: true })} />
            <StatCard
              icon="pie-chart-outline"
              iconColor={colors.warning}
              iconBg={colors.warningMuted}
              label="Commission"
              value={formatAed(commission, { compact: true })}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <StatCard
              icon="wallet-outline"
              iconColor={colors.success}
              iconBg={colors.successMuted}
              label="Net earned"
              value={formatAed(net, { compact: true })}
            />
            <StatCard
              icon="repeat-outline"
              iconColor={colors.violet}
              iconBg={colors.violetMuted}
              label="Monthly recurring"
              value={formatAed(mrr, { compact: true })}
            />
          </View>
        </Animated.View>

        <SectionHeader title="Net by month" />
        <Animated.View entering={FadeInDown.delay(80).duration(320)}>
          <Card>
            <BarChart data={monthly} highlightIndex={5} />
          </Card>
        </Animated.View>

        <SectionHeader title="Payouts" />
        {myPayouts.map((p) => (
          <Card key={p.id} style={styles.payoutRow}>
            <View style={[styles.payoutIcon, p.status === 'paid' ? { backgroundColor: colors.successMuted } : { backgroundColor: colors.warningMuted }]}>
              <Ionicons
                name={p.status === 'paid' ? 'checkmark-done-outline' : 'hourglass-outline'}
                size={17}
                color={p.status === 'paid' ? colors.success : colors.warning}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodySemi">{formatAed(p.amountAed)}</AppText>
              <AppText variant="micro" tone="tertiary">
                {p.periodLabel}
                {p.paidAt ? ` · paid ${format(p.paidAt, 'd MMM')}` : ''}
              </AppText>
            </View>
            <Badge label={p.status} tone={p.status === 'paid' ? 'success' : 'warning'} />
          </Card>
        ))}

        <SectionHeader title="Recent payments" />
        <Card>
          {recent.map((p, i) => {
            const athlete = users.find((u) => u.id === p.athleteId);
            return (
              <View key={p.id}>
                {i > 0 ? <Divider style={{ marginVertical: spacing.xs }} /> : null}
                <View style={styles.paymentRow}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="caption">{athlete?.name}</AppText>
                    <AppText variant="micro" tone="tertiary">
                      {format(p.paidAt, 'd MMM yyyy')} · {p.invoiceNumber}
                    </AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText variant="caption" tone="success">
                      +{formatAed(p.netAed)}
                    </AppText>
                    {p.commissionAed > 0 ? (
                      <AppText variant="micro" tone="tertiary">
                        −{formatAed(p.commissionAed)} fee
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  payoutRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  payoutIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
