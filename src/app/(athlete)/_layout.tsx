import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/services/session';
import { colors } from '@/theme/tokens';

export default function AthleteLayout() {
  const { userId, role } = useSession();
  if (!userId || role !== 'athlete') return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="checkin" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="add-progress" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="bookings/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
