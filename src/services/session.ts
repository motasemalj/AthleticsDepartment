import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ID, Role } from '@/types';

interface SessionState {
  userId: ID | null;
  role: Role | null;
  hydrated: boolean;
  signIn: (userId: ID, role: Role) => void;
  signOut: () => void;
  setHydrated: () => void;
}

export const DEMO_ACCOUNTS: Record<Role, ID> = {
  athlete: 'u-ath-1',
  coach: 'u-coach-1',
  admin: 'u-admin',
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      userId: null,
      role: null,
      hydrated: false,
      signIn: (userId, role) => set({ userId, role }),
      signOut: () => set({ userId: null, role: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'athletics-dept-session-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ userId: s.userId, role: s.role }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);
