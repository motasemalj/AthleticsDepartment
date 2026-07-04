import React from 'react';
import { Tabs } from 'expo-router';

import { TabBar, type TabConfig } from '@/components/TabBar';
import { useData } from '@/services/data/store';
import { useUnreadCounts } from '@/services/hooks';
import { useSession } from '@/services/session';

export default function CoachTabs() {
  const userId = useSession((s) => s.userId);
  const pendingCheckins = useData(
    (s) => s.checkins.filter((c) => c.coachId === userId && c.status === 'pending').length
  );
  const { unreadMessages } = useUnreadCounts(userId);

  const tabs: TabConfig[] = [
    { name: 'index', label: 'Home', icon: 'grid-outline', iconActive: 'grid' },
    { name: 'checkins', label: 'Check-ins', icon: 'file-tray-outline', iconActive: 'file-tray', badge: pendingCheckins },
    { name: 'clients', label: 'Clients', icon: 'people-outline', iconActive: 'people' },
    { name: 'schedule', label: 'Schedule', icon: 'calendar-outline', iconActive: 'calendar' },
    { name: 'messages', label: 'Messages', icon: 'chatbubble-outline', iconActive: 'chatbubble', badge: unreadMessages },
    { name: 'more', label: 'More', icon: 'menu-outline', iconActive: 'menu' },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false, lazy: false }}
      tabBar={(props) => <TabBar {...props} tabs={tabs} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="checkins" />
      <Tabs.Screen name="clients" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="more" />
      {/* plans lives in the stack of screens reachable from Home/More, not the bar */}
      <Tabs.Screen name="plans" options={{ href: null }} />
    </Tabs>
  );
}
