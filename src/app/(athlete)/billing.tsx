import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, Divider, SectionHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatAed } from '@/utils';

export default function BillingScreen() {
  const { userId, coach } = useCurrentUser();
  const subscriptions = useData((s) => s.subscriptions);
  const payments = useData((s) => s.payments);

  const [cardSheet, setCardSheet] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [saving, setSaving] = useState(false);

  const sub = subscriptions.find((s) => s.athleteId === userId);
  const history = payments.filter((p) => p.athleteId === userId).sort((a, b) => b.paidAt - a.paidAt);

  const updateCard = () => {
    if (cardNumber.replace(/\s/g, '').length < 16 || !cardExpiry || cardCvc.length < 3) {
      toast.error('Check your card details');
      return;
    }
    setSaving(true);
    // In production this creates a Stripe SetupIntent via Cloud Functions.
    setTimeout(() => {
      setSaving(false);
      setCardSheet(false);
      setCardNumber('');
      setCardExpiry('');
      setCardCvc('');
      toast.success('Card updated');
    }, 900);
  };

  if (!sub) {
    return (
      <Screen padded={false}>
        <ScreenHeader title="Subscription" back />
        <EmptyState
          icon="card-outline"
          title="No active subscription"
          message="Your coach will send you a subscription offer once your plan is ready."
        />
      </Screen>
    );
  }

  const statusTone =
    sub.status === 'active' ? 'success' : sub.status === 'paused' ? 'warning' : sub.status === 'past_due' ? 'danger' : 'neutral';

  return (
    <Screen padded={false}>
      <ScreenHeader title="Subscription & billing" back />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Animated.View entering={FadeInDown.duration(320)}>
          <Card>
            <View style={styles.rowBetween}>
              <View>
                <AppText variant="micro" tone="tertiary" uppercase>
                  Coaching plan
                </AppText>
                <AppText variant="title" style={{ marginTop: 2 }}>
                  {sub.months}-month plan
                </AppText>
                <AppText variant="captionRegular" tone="secondary">
                  with {coach?.name ?? 'your coach'}
                </AppText>
              </View>
              <Badge label={sub.status.replace('_', ' ')} tone={statusTone} />
            </View>
            <Divider />
            <View style={styles.rowBetween}>
              <AppText variant="body" tone="secondary">
                Monthly price
              </AppText>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="bodySemi">{formatAed(sub.pricePerMonthAed)}</AppText>
                {sub.studentDiscountApplied ? (
                  <AppText variant="micro" tone="accent">
                    student discount applied
                  </AppText>
                ) : null}
              </View>
            </View>
            <View style={[styles.rowBetween, { marginTop: spacing.xs }]}>
              <AppText variant="body" tone="secondary">
                {sub.status === 'active' ? 'Renews' : 'Next charge'}
              </AppText>
              <AppText variant="bodySemi">{format(sub.renewsAt, 'd MMM yyyy')}</AppText>
            </View>
          </Card>
        </Animated.View>

        <SectionHeader title="Payment method" />
        <Animated.View entering={FadeInDown.delay(60).duration(320)}>
          <Card style={styles.cardRow}>
            <View style={styles.cardBrand}>
              <Ionicons name="card" size={18} color={colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodySemi">
                {sub.cardBrand} •••• {sub.cardLast4}
              </AppText>
              <AppText variant="captionRegular" tone="tertiary">
                Charged automatically via Stripe
              </AppText>
            </View>
            <Button label="Update" variant="secondary" size="sm" onPress={() => setCardSheet(true)} />
          </Card>
        </Animated.View>

        <SectionHeader title="Payment history" />
        {history.length === 0 ? (
          <Card>
            <AppText variant="captionRegular" tone="tertiary" align="center" style={{ paddingVertical: spacing.md }}>
              No payments yet
            </AppText>
          </Card>
        ) : (
          history.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(i * 30).duration(280)}>
              <Card style={[styles.cardRow, { marginBottom: spacing.xs }]}>
                <View style={[styles.cardBrand, { backgroundColor: p.status === 'refunded' ? colors.dangerMuted : colors.successMuted }]}>
                  <Ionicons
                    name={p.status === 'refunded' ? 'arrow-undo-outline' : 'checkmark'}
                    size={16}
                    color={p.status === 'refunded' ? colors.danger : colors.success}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi">{formatAed(p.amountAed)}</AppText>
                  <AppText variant="captionRegular" tone="tertiary">
                    {format(p.paidAt, 'd MMM yyyy')} · {p.invoiceNumber}
                  </AppText>
                </View>
                {p.status === 'refunded' ? <Badge label="Refunded" tone="danger" /> : null}
              </Card>
            </Animated.View>
          ))
        )}

        <AppText variant="captionRegular" tone="tertiary" align="center" style={{ marginTop: spacing.md }}>
          Need to pause or cancel? Message your coach or contact support — see Help & FAQ.
        </AppText>
      </View>

      <Sheet visible={cardSheet} onClose={() => setCardSheet(false)} title="Update card">
        <View style={{ gap: spacing.sm }}>
          <Input
            label="Card number"
            icon="card-outline"
            placeholder="4242 4242 4242 4242"
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={(t) =>
              setCardNumber(
                t
                  .replace(/\D/g, '')
                  .slice(0, 16)
                  .replace(/(.{4})/g, '$1 ')
                  .trim()
              )
            }
          />
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Input
              label="Expiry"
              placeholder="MM/YY"
              keyboardType="number-pad"
              value={cardExpiry}
              onChangeText={(t) => {
                const d = t.replace(/\D/g, '').slice(0, 4);
                setCardExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
              }}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="CVC"
              placeholder="123"
              keyboardType="number-pad"
              secureTextEntry
              value={cardCvc}
              onChangeText={(t) => setCardCvc(t.replace(/\D/g, '').slice(0, 4))}
              containerStyle={{ flex: 1 }}
            />
          </View>
          <View style={styles.secureNote}>
            <Ionicons name="lock-closed" size={13} color={colors.textTertiary} />
            <AppText variant="captionRegular" tone="tertiary">
              Processed securely by Stripe. Card details never touch our servers.
            </AppText>
          </View>
          <Button label="Save card" size="lg" fullWidth loading={saving} onPress={updateCard} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardBrand: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.infoMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secureNote: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
