import React from 'react';
import { Tabs } from 'expo-router';

import { TabBar, type TabConfig } from '@/components/TabBar';
import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';

export default function CoachTabs() {
  const userId = useSession((s) => s.userId);
  const pendingCheckins = useData(
    (s) => s.checkins.filter((c) => c.coachId === userId && c.status === 'pending').length
  );

  const tabs: TabConfig[] = [
    { name: 'index', label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid' },
    { name: 'checkins', label: 'Check-ins', icon: 'file-tray-outline', iconActive: 'file-tray', badge: pendingCheckins },
    { name: 'clients', label: 'Clients', icon: 'people-outline', iconActive: 'people' },
    { name: 'schedule', label: 'Schedule', icon: 'calendar-outline', iconActive: 'calendar' },
    { name: 'more', label: 'More', icon: 'menu-outline', iconActive: 'menu' },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false, lazy: false }}
      tabBar={(props) => <TabBar {...props} tabs={tabs} />}
    />
  );
}
