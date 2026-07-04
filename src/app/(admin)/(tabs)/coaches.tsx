import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { spacing } from '@/theme/tokens';
import type { CoachStatus } from '@/types';
import { formatAed } from '@/utils';

type Filter = 'pending' | 'approved' | 'other';

const STATUS_TONE: Record<CoachStatus, 'warning' | 'success' | 'danger' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  suspended: 'neutral',
};

export default function AdminCoaches() {
  const router = useRouter();
  const coachProfiles = useData((s) => s.coachProfiles);
  const users = useData((s) => s.users);
  const athleteProfiles = useData((s) => s.athleteProfiles);
  const payments = useData((s) => s.payments);

  const [filter, setFilter] = useState<Filter>('pending');

  const filtered = coachProfiles.filter((c) =>
    filter === 'pending' ? c.status === 'pending' : filter === 'approved' ? c.status === 'approved' : c.status === 'rejected' || c.status === 'suspended'
  );

  return (
    <Screen padded={false} tabbed>
      <ScreenHeader title="Coaches" large subtitle="Review applications, set commission" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Segmented<Filter>
          options={[
            { value: 'pending', label: `Pending (${coachProfiles.filter((c) => c.status === 'pending').length})` },
            { value: 'approved', label: 'Approved' },
            { value: 'other', label: 'Other' },
          ]}
          value={filter}
          onChange={setFilter}
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={filter === 'pending' ? 'No pending applications' : 'Nothing here'}
            message={filter === 'pending' ? 'New coach applications appear here for review.' : undefined}
          />
        ) : (
          filtered.map((c, i) => {
            const u = users.find((x) => x.id === c.userId);
            const clients = athleteProfiles.filter((p) => p.coachId === c.userId).length;
            const gross = payments.filter((p) => p.coachId === c.userId && p.status === 'paid').reduce((a, p) => a + p.amountAed, 0);
            return (
              <Animated.View key={c.userId} entering={FadeInDown.delay(Math.min(i * 40, 200)).duration(300)}>
                <Card style={styles.row} onPress={() => router.push(`/(admin)/coach/${c.userId}`)}>
                  <Avatar name={u?.name ?? ''} uri={u?.avatarUrl} size={46} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <AppText variant="bodySemi">{u?.name}</AppText>
                      {c.isOwner ? <Badge label="Owner" tone="violet" /> : null}
                    </View>
                    <AppText variant="captionRegular" tone="secondary" numberOfLines={1}>
                      {c.specialties.join(' · ')}
                    </AppText>
                    <AppText variant="micro" tone="tertiary" style={{ marginTop: 2 }}>
                      {c.status === 'approved'
                        ? `${clients} clients · ${formatAed(gross, { compact: true })} gross · ${c.commissionPct}% commission`
                        : `${c.certifications.length} certifications · ${c.yearsExperience} yrs experience`}
                    </AppText>
                  </View>
                  <Badge label={c.status} tone={STATUS_TONE[c.status]} />
                </Card>
              </Animated.View>
            );
          })
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
