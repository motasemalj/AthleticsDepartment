import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { subMonths } from 'date-fns';

import { Donut } from '@/components/charts/Donut';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, Divider, SectionHeader } from '@/components/ui/Card';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { colors, palette, spacing } from '@/theme/tokens';
import { formatAed } from '@/utils';

type Range = 'month' | 'quarter' | 'all';

export default function RevenueDashboard() {
  const payments = useData((s) => s.payments);
  const coachProfiles = useData((s) => s.coachProfiles);
  const users = useData((s) => s.users);

  const [range, setRange] = useState<Range>('all');

  const cutoff =
    range === 'month'
      ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
      : range === 'quarter'
        ? subMonths(new Date(), 3).getTime()
        : 0;

  const paid = useMemo(
    () => payments.filter((p) => p.status === 'paid' && p.paidAt >= cutoff),
    [payments, cutoff]
  );

  const ownerIds = useMemo(
    () => new Set(coachProfiles.filter((c) => c.isOwner).map((c) => c.userId)),
    [coachProfiles]
  );

  const ownerCoachingIncome = paid.filter((p) => ownerIds.has(p.coachId)).reduce((a, p) => a + p.netAed, 0);
  const commissionIncome = paid.reduce((a, p) => a + p.commissionAed, 0);
  const partnerPayoutTotal = paid.filter((p) => !ownerIds.has(p.coachId)).reduce((a, p) => a + p.netAed, 0);
  const gmv = paid.reduce((a, p) => a + p.amountAed, 0);
  const platformTotal = ownerCoachingIncome + commissionIncome;

  // Per-coach drill-down
  const perCoach = useMemo(() => {
    const map = new Map<string, { gross: number; commission: number; net: number }>();
    for (const p of paid) {
      const cur = map.get(p.coachId) ?? { gross: 0, commission: 0, net: 0 };
      cur.gross += p.amountAed;
      cur.commission += p.commissionAed;
      cur.net += p.netAed;
      map.set(p.coachId, cur);
    }
    return [...map.entries()]
      .map(([coachId, v]) => ({
        coachId,
        user: users.find((u) => u.id === coachId),
        profile: coachProfiles.find((c) => c.userId === coachId),
        ...v,
      }))
      .sort((a, b) => b.gross - a.gross);
  }, [paid, users, coachProfiles]);

  return (
    <Screen padded={false}>
      <ScreenHeader title="Revenue split" large subtitle="Owner coaching vs platform commission" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Segmented<Range>
          options={[
            { value: 'month', label: 'This month' },
            { value: 'quarter', label: '3 months' },
            { value: 'all', label: 'All time' },
          ]}
          value={range}
          onChange={setRange}
        />

        <Animated.View entering={FadeInDown.duration(320)}>
          <Card style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <Donut
              size={168}
              strokeWidth={20}
              segments={[
                { value: ownerCoachingIncome, color: colors.accent },
                { value: commissionIncome, color: palette.violet400 },
                { value: partnerPayoutTotal, color: palette.ink600 },
              ]}
              centerLabel={formatAed(platformTotal, { compact: true })}
              centerSublabel="PLATFORM INCOME"
            />
            <View style={styles.legend}>
              {[
                { color: colors.accent, label: 'Owner coaching', value: ownerCoachingIncome },
                { color: palette.violet400, label: 'Commission', value: commissionIncome },
                { color: palette.ink600, label: 'Coach payouts', value: partnerPayoutTotal },
              ].map((l) => (
                <View key={l.label} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: l.color }]} />
                  <View>
                    <AppText variant="micro" tone="tertiary">
                      {l.label}
                    </AppText>
                    <AppText variant="caption">{formatAed(l.value, { compact: true })}</AppText>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Card style={styles.stat}>
            <AppText variant="stat">{formatAed(gmv, { compact: true })}</AppText>
            <AppText variant="micro" tone="tertiary" uppercase>
              Gross volume
            </AppText>
          </Card>
          <Card style={styles.stat}>
            <AppText variant="stat">{gmv ? Math.round((platformTotal / gmv) * 100) : 0}%</AppText>
            <AppText variant="micro" tone="tertiary" uppercase>
              Platform take
            </AppText>
          </Card>
        </View>

        <SectionHeader title="Per-coach drill-down" style={{ marginTop: 0, marginBottom: 0 }} />
        {perCoach.map((c, i) => (
          <Animated.View key={c.coachId} entering={FadeInDown.delay(Math.min(i * 40, 200)).duration(280)}>
            <Card>
              <View style={styles.coachHead}>
                <Avatar name={c.user?.name ?? ''} uri={c.user?.avatarUrl} size={38} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <AppText variant="bodySemi">{c.user?.name}</AppText>
                    {c.profile?.isOwner ? <Badge label="Owner" tone="violet" /> : null}
                  </View>
                  <AppText variant="micro" tone="tertiary">
                    {c.profile?.isOwner ? 'All net revenue is platform income' : `${c.profile?.commissionPct ?? 0}% commission`}
                  </AppText>
                </View>
              </View>
              <Divider />
              <View style={styles.numbersRow}>
                <View style={styles.numItem}>
                  <AppText variant="caption">{formatAed(c.gross, { compact: true })}</AppText>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    Gross
                  </AppText>
                </View>
                <View style={styles.numItem}>
                  <AppText variant="caption" color={palette.violet400}>
                    {formatAed(c.profile?.isOwner ? c.net : c.commission, { compact: true })}
                  </AppText>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    To platform
                  </AppText>
                </View>
                <View style={styles.numItem}>
                  <AppText variant="caption" tone={c.profile?.isOwner ? 'tertiary' : 'success'}>
                    {formatAed(c.profile?.isOwner ? 0 : c.net, { compact: true })}
                  </AppText>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    To coach
                  </AppText>
                </View>
              </View>
            </Card>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  coachHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  numbersRow: { flexDirection: 'row' },
  numItem: { flex: 1, alignItems: 'center', gap: 2 },
});
