import React from 'react';
import { Tabs } from 'expo-router';

import { TabBar, type TabConfig } from '@/components/TabBar';
import { useOfflineSync } from '@/services/useOfflineSync';

const tabs: TabConfig[] = [
  { name: 'index', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'training', label: 'Training', icon: 'barbell-outline', iconActive: 'barbell' },
  { name: 'nutrition', label: 'Nutrition', icon: 'restaurant-outline', iconActive: 'restaurant' },
  { name: 'progress', label: 'Progress', icon: 'trending-up-outline', iconActive: 'trending-up' },
  { name: 'more', label: 'More', icon: 'menu-outline', iconActive: 'menu' },
];

export default function AthleteTabs() {
  // Flushes offline workout logs whenever connectivity returns.
  useOfflineSync();

  return (
    <Tabs
      screenOptions={{ headerShown: false, lazy: false }}
      tabBar={(props) => <TabBar {...props} tabs={tabs} />}
    />
  );
}
