import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { spacing } from '@/theme/tokens';
import { computeStreak } from '@/utils';

export default function ClientsRoster() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const athleteProfiles = useData((s) => s.athleteProfiles);
  const users = useData((s) => s.users);
  const checkins = useData((s) => s.checkins);
  const workoutLogs = useData((s) => s.workoutLogs);
  const subscriptions = useData((s) => s.subscriptions);

  const [query, setQuery] = useState('');

  const clients = useMemo(() => {
    const mine = athleteProfiles.filter((p) => p.coachId === userId);
    return mine
      .map((profile) => {
        const user = users.find((u) => u.id === profile.userId);
        const logs = workoutLogs.filter((l) => l.athleteId === profile.userId && l.completedAt);
        const streak = computeStreak(new Set(logs.map((l) => l.date)));
        const pendingCheckin = checkins.some((c) => c.athleteId === profile.userId && c.status === 'pending');
        const sub = subscriptions.find((s) => s.athleteId === profile.userId);
        const lastActive = Math.max(0, ...logs.map((l) => l.completedAt ?? 0));
        return { profile, user, streak, pendingCheckin, sub, lastActive };
      })
      .filter(
        (c) =>
          !query.trim() ||
          c.user?.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          c.profile.goal.toLowerCase().includes(query.trim().toLowerCase())
      )
      .sort((a, b) => Number(b.pendingCheckin) - Number(a.pendingCheckin) || b.lastActive - a.lastActive);
  }, [athleteProfiles, users, workoutLogs, checkins, subscriptions, userId, query]);

  return (
    <Screen padded={false} tabbed>
      <ScreenHeader
        title="Clients"
        large
        subtitle={`${clients.length} athlete${clients.length === 1 ? '' : 's'}`}
        right={<Button label="Invite" icon="person-add-outline" size="sm" onPress={() => router.push('/(coach)/invites')} />}
      />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        <Input icon="search-outline" placeholder="Search by name or goal" value={query} onChangeText={setQuery} />

        {clients.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={query ? 'No matches' : 'No clients yet'}
            message={query ? 'Try a different search.' : 'Invite your first athlete with a link or QR code.'}
            actionLabel={query ? undefined : 'Create invite'}
            onAction={query ? undefined : () => router.push('/(coach)/invites')}
          />
        ) : (
          clients.map((c, i) => (
            <Animated.View key={c.profile.userId} entering={FadeInDown.delay(Math.min(i * 40, 280)).duration(300)}>
              <Card style={styles.row} onPress={() => router.push(`/(coach)/client/${c.profile.userId}`)}>
                <Avatar name={c.user?.name ?? ''} uri={c.user?.avatarUrl} size={46} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <AppText variant="bodySemi">{c.user?.name}</AppText>
                    {c.profile.isStudent ? <Badge label="Student" tone="info" /> : null}
                  </View>
                  <AppText variant="captionRegular" tone="secondary" numberOfLines={1} style={{ marginTop: 1 }}>
                    {c.profile.goal}
                  </AppText>
                  <View style={styles.meta}>
                    <AppText variant="micro" tone="tertiary">
                      🔥 {c.streak} day streak
                    </AppText>
                    {c.sub ? (
                      <AppText variant="micro" tone={c.sub.status === 'active' ? 'tertiary' : 'warning'}>
                        · {c.sub.status === 'active' ? `${c.sub.months}mo plan` : c.sub.status.replace('_', ' ')}
                      </AppText>
                    ) : null}
                  </View>
                </View>
                {c.pendingCheckin ? <Badge label="Check-in" tone="warning" icon="time-outline" /> : null}
              </Card>
            </Animated.View>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 0 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
});
