import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Subscription } from '@/types';
import { formatAed } from '@/utils';

type Filter = 'all' | 'active' | 'attention';

export default function AdminSubscriptions() {
  const subscriptions = useData((s) => s.subscriptions);
  const users = useData((s) => s.users);
  const payments = useData((s) => s.payments);
  const setSubscriptionStatus = useData((s) => s.setSubscriptionStatus);
  const refundPayment = useData((s) => s.refundPayment);

  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Subscription | null>(null);

  const filtered = subscriptions.filter((s) =>
    filter === 'all' ? true : filter === 'active' ? s.status === 'active' : s.status !== 'active'
  );

  const current = selected ? subscriptions.find((s) => s.id === selected.id) : null;
  const lastPayment = current
    ? payments.filter((p) => p.subscriptionId === current.id && p.status === 'paid').sort((a, b) => b.paidAt - a.paidAt)[0]
    : undefined;

  const statusTone = (s: Subscription['status']) =>
    s === 'active' ? 'success' : s === 'paused' ? 'warning' : s === 'past_due' ? 'danger' : 'neutral';

  return (
    <Screen padded={false}>
      <ScreenHeader title="Subscriptions" large subtitle="Pause, cancel and refund" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Segmented<Filter>
          options={[
            { value: 'all', label: `All (${subscriptions.length})` },
            { value: 'active', label: 'Active' },
            { value: 'attention', label: 'Attention' },
          ]}
          value={filter}
          onChange={setFilter}
        />

        {filtered.length === 0 ? (
          <EmptyState icon="card-outline" title="No subscriptions" />
        ) : (
          filtered.map((s, i) => {
            const athlete = users.find((u) => u.id === s.athleteId);
            const coach = users.find((u) => u.id === s.coachId);
            return (
              <Animated.View key={s.id} entering={FadeInDown.delay(Math.min(i * 30, 200)).duration(280)}>
                <Card style={styles.row} onPress={() => setSelected(s)}>
                  <Avatar name={athlete?.name ?? ''} uri={athlete?.avatarUrl} size={42} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySemi">{athlete?.name}</AppText>
                    <AppText variant="micro" tone="tertiary">
                      Coach {coach?.name?.split(' ')[0]} · {s.months}mo · {formatAed(s.pricePerMonthAed)}/mo
                      {s.studentDiscountApplied ? ' · student' : ''}
                    </AppText>
                  </View>
                  <Badge label={s.status.replace('_', ' ')} tone={statusTone(s.status)} />
                </Card>
              </Animated.View>
            );
          })
        )}
      </View>

      {/* Manage sheet */}
      <Sheet visible={!!current} onClose={() => setSelected(null)} title="Manage subscription">
        {current ? (
          <View style={{ gap: spacing.sm }}>
            <Card raised style={{ gap: 4 }}>
              <View style={styles.kv}>
                <AppText variant="caption" tone="secondary">Athlete</AppText>
                <AppText variant="caption">{users.find((u) => u.id === current.athleteId)?.name}</AppText>
              </View>
              <View style={styles.kv}>
                <AppText variant="caption" tone="secondary">Plan</AppText>
                <AppText variant="caption">
                  {current.months} months · {formatAed(current.pricePerMonthAed)}/mo
                </AppText>
              </View>
              <View style={styles.kv}>
                <AppText variant="caption" tone="secondary">Status</AppText>
                <Badge label={current.status.replace('_', ' ')} tone={statusTone(current.status)} />
              </View>
              <View style={styles.kv}>
                <AppText variant="caption" tone="secondary">Renews</AppText>
                <AppText variant="caption">{format(current.renewsAt, 'd MMM yyyy')}</AppText>
              </View>
              <View style={styles.kv}>
                <AppText variant="caption" tone="secondary">Card</AppText>
                <AppText variant="caption">
                  {current.cardBrand} •••• {current.cardLast4}
                </AppText>
              </View>
            </Card>

            {current.status === 'active' ? (
              <Button
                label="Pause subscription"
                icon="pause-outline"
                variant="secondary"
                fullWidth
                onPress={() => {
                  setSubscriptionStatus(current.id, 'paused');
                  toast.success('Subscription paused');
                }}
              />
            ) : current.status !== 'cancelled' ? (
              <Button
                label="Resume subscription"
                icon="play-outline"
                fullWidth
                onPress={() => {
                  setSubscriptionStatus(current.id, 'active');
                  toast.success('Subscription resumed');
                }}
              />
            ) : null}

            {lastPayment ? (
              <Button
                label={`Refund last payment (${formatAed(lastPayment.amountAed)})`}
                icon="arrow-undo-outline"
                variant="secondary"
                fullWidth
                onPress={() => {
                  refundPayment(lastPayment.id);
                  toast.success('Refund issued via Stripe');
                }}
              />
            ) : null}

            {current.status !== 'cancelled' ? (
              <Button
                label="Cancel subscription"
                icon="close-circle-outline"
                variant="danger"
                fullWidth
                onPress={() => {
                  setSubscriptionStatus(current.id, 'cancelled');
                  setSelected(null);
                  toast.info('Subscription cancelled');
                }}
              />
            ) : null}
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  kv: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
