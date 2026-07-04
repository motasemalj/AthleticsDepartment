import 'react-native-reanimated';

import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '@/components/ui/Toast';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'slide_from_right',
            }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(athlete)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(coach)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(admin)" options={{ animation: 'fade' }} />
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="notifications" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="profile" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
          <ToastHost />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
