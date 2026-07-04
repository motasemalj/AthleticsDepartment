import { useEffect } from 'react';
import * as Network from 'expo-network';

import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';

/**
 * Watches connectivity and flushes any workout logs recorded offline.
 * In production this pushes the queued logs to Firestore; in demo mode it
 * marks them synced so the UI reflects the same lifecycle.
 */
export function useOfflineSync() {
  const networkState = Network.useNetworkState();
  const userId = useSession((s) => s.userId);
  const isOnline = networkState.isConnected !== false && networkState.isInternetReachable !== false;

  useEffect(() => {
    if (!isOnline || !userId) return;
    const { workoutLogs, markWorkoutLogsSynced } = useData.getState();
    const hasPending = workoutLogs.some((l) => l.athleteId === userId && !l.synced);
    if (hasPending) {
      const timer = setTimeout(() => markWorkoutLogsSynced(userId), 1200);
      return () => clearTimeout(timer);
    }
  }, [isOnline, userId]);

  return { isOnline };
}
