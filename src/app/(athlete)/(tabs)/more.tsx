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
import { useData } from '@/services/data/store';
import { useCurrentUser, useUnreadCounts } from '@/services/hooks';
import { useSession } from '@/services/session';
import { colors, spacing } from '@/theme/tokens';

export default function MoreTab() {
  const router = useRouter();
  const { userId, user, athleteProfile, coach } = useCurrentUser();
  const { unreadMessages } = useUnreadCounts(userId);
  const conversations = useData((s) => s.conversations);
  const signOut = useSession((s) => s.signOut);

  const conversation = conversations.find((c) => c.athleteId === userId);

  return (
    <Screen padded={false}>
      <ScreenHeader title="More" large />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Avatar name={user?.name ?? ''} uri={user?.avatarUrl} size={54} />
            <View style={{ flex: 1 }}>
              <AppText variant="headline">{user?.name}</AppText>
              <AppText variant="captionRegular" tone="secondary" numberOfLines={1}>
                {athleteProfile?.goal}
              </AppText>
            </View>
            {athleteProfile?.isStudent ? <Badge label="Student" tone="info" /> : null}
          </Card>
        </Animated.View>

        <Card>
          <ListRow
            icon="chatbubble-ellipses-outline"
            iconColor={colors.accent}
            iconBg={colors.accentMuted}
            title="Messages"
            subtitle={coach ? `Chat with ${coach.name}` : undefined}
            right={unreadMessages > 0 ? <Badge label={`${unreadMessages}`} tone="accent" /> : undefined}
            onPress={() => conversation && router.push(`/chat/${conversation.id}`)}
          />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow
            icon="videocam-outline"
            title="Video check-ins"
            subtitle="Book and manage sessions"
            onPress={() => router.push('/(athlete)/bookings')}
          />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow
            icon="calendar-outline"
            title="Workout calendar"
            subtitle="History and streaks"
            onPress={() => router.push('/(athlete)/calendar')}
          />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow
            icon="card-outline"
            title="Subscription & billing"
            subtitle="Plan, payments and card"
            onPress={() => router.push('/(athlete)/billing')}
          />
        </Card>

        <SectionHeader title="Support" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card>
          <ListRow icon="help-circle-outline" title="Help & FAQ" onPress={() => router.push('/support')} />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow icon="shield-outline" title="Privacy & data" onPress={() => router.push('/privacy')} />
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
          Athletics Department v1.0.0
        </AppText>
      </View>
    </Screen>
  );
}
