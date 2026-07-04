import React from 'react';
import { Tabs } from 'expo-router';

import { TabBar, type TabConfig } from '@/components/TabBar';
import { useData } from '@/services/data/store';

export default function AdminTabs() {
  const pendingCoaches = useData((s) => s.coachProfiles.filter((c) => c.status === 'pending').length);

  const tabs: TabConfig[] = [
    { name: 'index', label: 'Overview', icon: 'grid-outline', iconActive: 'grid' },
    { name: 'coaches', label: 'Coaches', icon: 'people-outline', iconActive: 'people', badge: pendingCoaches },
    { name: 'subscriptions', label: 'Subs', icon: 'card-outline', iconActive: 'card' },
    { name: 'revenue', label: 'Revenue', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
    { name: 'more', label: 'More', icon: 'menu-outline', iconActive: 'menu' },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false, lazy: false }}
      tabBar={(props) => <TabBar {...props} tabs={tabs} />}
    />
  );
}
