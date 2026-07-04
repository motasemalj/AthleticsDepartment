import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';
import { colors } from '@/theme/tokens';

export default function Index() {
  const { userId, role, hydrated } = useSession();
  const athleteProfiles = useData((s) => s.athleteProfiles);
  const coachProfiles = useData((s) => s.coachProfiles);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!userId || !role) return <Redirect href="/(auth)/welcome" />;

  if (role === 'athlete') {
    const profile = athleteProfiles.find((p) => p.userId === userId);
    if (profile && !profile.disclaimerAcceptedAt) return <Redirect href="/(auth)/disclaimer" />;
    return <Redirect href="/(athlete)" />;
  }

  if (role === 'coach') {
    const profile = coachProfiles.find((p) => p.userId === userId);
    if (profile && profile.status !== 'approved') return <Redirect href="/(auth)/pending-approval" />;
    return <Redirect href="/(coach)" />;
  }

  return <Redirect href="/(admin)" />;
}
