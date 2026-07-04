import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, Divider, SectionHeader } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { useSession } from '@/services/session';
import { colors, spacing } from '@/theme/tokens';

export default function AdminMore() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const signOut = useSession((s) => s.signOut);
  const resetDemoData = useData((s) => s.resetDemoData);

  return (
    <Screen padded={false} tabbed>
      <ScreenHeader title="More" large />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            onPress={() => router.push('/profile')}>
            <Avatar name={user?.name ?? ''} uri={user?.avatarUrl} size={54} />
            <View style={{ flex: 1 }}>
              <AppText variant="headline">{user?.name}</AppText>
              <AppText variant="captionRegular" tone="secondary">
                View & edit profile
              </AppText>
            </View>
            <Badge label="Owner" tone="violet" icon="star" />
          </Card>
        </Animated.View>

        <SectionHeader title="Platform" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card>
          <ListRow
            icon="people-outline"
            iconColor={colors.accent}
            iconBg={colors.accentMuted}
            title="Coach approvals"
            subtitle="Review applications & commissions"
            onPress={() => router.push('/(admin)/coaches')}
          />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow icon="card-outline" title="Subscription oversight" onPress={() => router.push('/(admin)/subscriptions')} />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow icon="stats-chart-outline" title="Revenue split" onPress={() => router.push('/(admin)/revenue')} />
        </Card>

        <SectionHeader title="Support & legal" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card>
          <ListRow icon="help-circle-outline" title="Help & FAQ" onPress={() => router.push('/support')} />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow icon="shield-outline" title="Privacy & data" onPress={() => router.push('/privacy')} />
        </Card>

        <SectionHeader title="Demo" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card>
          <ListRow
            icon="refresh-outline"
            title="Reset demo data"
            subtitle="Restore the original seeded dataset"
            chevron={false}
            onPress={() => {
              resetDemoData();
              toast.success('Demo data reset');
            }}
          />
        </Card>

        <Card>
          <ListRow
            icon="log-out-outline"
            title="Sign out"
            chevron={false}
            onPress={() => {
              signOut();
              router.replace('/(auth)/welcome');
            }}
          />
        </Card>

        <AppText variant="captionRegular" tone="tertiary" align="center">
          Athletics Department v1.0.0 · Admin
        </AppText>
      </View>
    </Screen>
  );
}
