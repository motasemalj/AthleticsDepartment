import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';
import { colors } from '@/theme/tokens';

export default function CoachLayout() {
  const { userId, role } = useSession();
  const profile = useData((s) => s.coachProfiles.find((c) => c.userId === userId));

  if (!userId || role !== 'coach') return <Redirect href="/(auth)/welcome" />;
  if (profile && profile.status !== 'approved') return <Redirect href="/(auth)/pending-approval" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="invites" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
