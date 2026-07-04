import React from 'react';
import { Tabs } from 'expo-router';

import { TabBar, type TabConfig } from '@/components/TabBar';
import { useUnreadCounts } from '@/services/hooks';
import { useOfflineSync } from '@/services/useOfflineSync';
import { useSession } from '@/services/session';

export default function AthleteTabs() {
  // Flushes offline workout logs whenever connectivity returns.
  useOfflineSync();
  const userId = useSession((s) => s.userId);
  const { unreadMessages } = useUnreadCounts(userId);

  const tabs: TabConfig[] = [
    { name: 'index', label: 'Home', icon: 'home-outline', iconActive: 'home' },
    { name: 'training', label: 'Training', icon: 'barbell-outline', iconActive: 'barbell' },
    { name: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline', iconActive: 'restaurant' },
    { name: 'progress', label: 'Progress', icon: 'trending-up-outline', iconActive: 'trending-up' },
    { name: 'messages', label: 'Messages', icon: 'chatbubble-outline', iconActive: 'chatbubble', badge: unreadMessages },
    { name: 'more', label: 'More', icon: 'menu-outline', iconActive: 'menu' },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false, lazy: false }}
      tabBar={(props) => <TabBar {...props} tabs={tabs} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="training" />
      <Tabs.Screen name="nutrition" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
