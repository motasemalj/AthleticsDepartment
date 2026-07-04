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
import { useCurrentUser } from '@/services/hooks';
import { useSession } from '@/services/session';
import { spacing } from '@/theme/tokens';

export default function CoachMore() {
  const router = useRouter();
  const { user, coachProfile } = useCurrentUser();
  const signOut = useSession((s) => s.signOut);

  return (
    <Screen padded={false} tabbed>
      <ScreenHeader title="More" large />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
            onPress={() => router.push('/profile')}>
            <Avatar name={user?.name ?? ''} uri={user?.avatarUrl} size={54} showRing />
            <View style={{ flex: 1 }}>
              <AppText variant="headline">{user?.name}</AppText>
              <AppText variant="captionRegular" tone="secondary" numberOfLines={1}>
                View & edit profile
              </AppText>
            </View>
            {coachProfile?.isOwner ? <Badge label="Owner" tone="violet" icon="star" /> : <Badge label="Coach" tone="accent" />}
          </Card>
        </Animated.View>

        <SectionHeader title="Business" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card>
          <ListRow icon="wallet-outline" title="Earnings" subtitle="Gross, commission, net & payouts" onPress={() => router.push('/(coach)/earnings')} />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow icon="pricetags-outline" title="Pricing" subtitle="3/6/12-month plans & student discount" onPress={() => router.push('/(coach)/pricing')} />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow icon="person-add-outline" title="Invite athletes" subtitle="Links & QR codes" onPress={() => router.push('/(coach)/invites')} />
        </Card>

        <SectionHeader title="Content" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card>
          <ListRow icon="film-outline" title="Video library" subtitle="Upload & assign demo videos" onPress={() => router.push('/(coach)/library')} />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow icon="barbell-outline" title="Training plans" onPress={() => router.push('/(coach)/plans')} />
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
