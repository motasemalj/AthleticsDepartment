import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatAed } from '@/utils';

const TIER_META = [
  { months: 3 as const, label: '3 months', hint: 'Entry commitment' },
  { months: 6 as const, label: '6 months', hint: 'Most popular' },
  { months: 12 as const, label: '12 months', hint: 'Best value' },
];

export default function PricingScreen() {
  const { userId, coachProfile } = useCurrentUser();
  const updateCoachPricing = useData((s) => s.updateCoachPricing);

  const [prices, setPrices] = useState<Record<3 | 6 | 12, string>>(() => ({
    3: String(coachProfile?.pricing.find((p) => p.months === 3)?.pricePerMonthAed ?? 900),
    6: String(coachProfile?.pricing.find((p) => p.months === 6)?.pricePerMonthAed ?? 800),
    12: String(coachProfile?.pricing.find((p) => p.months === 12)?.pricePerMonthAed ?? 700),
  }));
  const [studentPct, setStudentPct] = useState(coachProfile?.studentDiscountPct ?? 0);

  const commission = coachProfile?.commissionPct ?? 0;

  const save = () => {
    const tiers = TIER_META.map((t) => ({ months: t.months, pricePerMonthAed: Number(prices[t.months]) || 0 }));
    if (tiers.some((t) => t.pricePerMonthAed < 100)) {
      toast.error('Prices must be at least AED 100/month');
      return;
    }
    updateCoachPricing(userId!, tiers, studentPct);
    toast.success('Pricing updated');
  };

  return (
    <Screen padded={false} keyboardAware>
      <ScreenHeader title="Pricing" back subtitle="Monthly prices in AED, billed via Stripe" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {TIER_META.map((tier, i) => {
          const value = Number(prices[tier.months]) || 0;
          const net = Math.round(value * (1 - commission / 100));
          return (
            <Animated.View key={tier.months} entering={FadeInDown.delay(i * 60).duration(300)}>
              <Card>
                <View style={styles.tierHead}>
                  <View>
                    <AppText variant="headline">{tier.label}</AppText>
                    <AppText variant="micro" tone="tertiary">
                      {tier.hint}
                    </AppText>
                  </View>
                  {tier.months === 6 ? <Badge label="Popular" tone="accent" icon="star" /> : null}
                </View>
                <View style={styles.priceRow}>
                  <Input
                    keyboardType="number-pad"
                    value={prices[tier.months]}
                    onChangeText={(t) => setPrices((p) => ({ ...p, [tier.months]: t.replace(/\D/g, '') }))}
                    containerStyle={{ flex: 1 }}
                    icon="cash-outline"
                  />
                  <View style={styles.perMonth}>
                    <AppText variant="caption" tone="tertiary">
                      AED / month
                    </AppText>
                  </View>
                </View>
                <View style={styles.netRow}>
                  <AppText variant="micro" tone="tertiary">
                    Total {formatAed(value * tier.months)} · you keep {formatAed(net)}/mo after {commission}% commission
                  </AppText>
                </View>
              </Card>
            </Animated.View>
          );
        })}

        <SectionHeader title="Student discount" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card>
          <View style={styles.tierHead}>
            <AppText variant="bodySemi">Discount for verified students</AppText>
            <AppText variant="title" tone="accent">
              {studentPct}%
            </AppText>
          </View>
          <Slider
            minimumValue={0}
            maximumValue={50}
            step={5}
            value={studentPct}
            onValueChange={setStudentPct}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.surfaceHigh}
            thumbTintColor={colors.accent}
            accessibilityLabel="Student discount percentage"
          />
          <AppText variant="captionRegular" tone="tertiary">
            {studentPct === 0
              ? 'No student discount offered'
              : `A 6-month plan drops from ${formatAed(Number(prices[6]) || 0)} to ${formatAed(Math.round((Number(prices[6]) || 0) * (1 - studentPct / 100)))}/mo for students.`}
          </AppText>
        </Card>

        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textTertiary} />
          <AppText variant="captionRegular" tone="tertiary" style={{ flex: 1 }}>
            Price changes apply to new subscriptions only. Existing athletes keep their current rate.
          </AppText>
        </View>

        <Button label="Save pricing" size="lg" fullWidth onPress={save} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tierHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  perMonth: { width: 90 },
  netRow: {
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.xs,
    padding: spacing.xs,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
});
