import React from 'react';
import { Redirect, Stack } from 'expo-router';

import { useSession } from '@/services/session';
import { colors } from '@/theme/tokens';

export default function AdminLayout() {
  const { userId, role } = useSession();
  if (!userId || role !== 'admin') return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}
