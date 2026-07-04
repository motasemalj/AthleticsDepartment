import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';

/** Current signed-in user with role-specific profiles resolved. */
export function useCurrentUser() {
  const userId = useSession((s) => s.userId);
  const user = useData((s) => s.users.find((u) => u.id === userId));
  const athleteProfile = useData((s) => s.athleteProfiles.find((p) => p.userId === userId));
  const coachProfile = useData((s) => s.coachProfiles.find((p) => p.userId === userId));
  const coach = useData((s) =>
    athleteProfile ? s.users.find((u) => u.id === athleteProfile.coachId) : undefined
  );
  return { userId, user, athleteProfile, coachProfile, coach };
}

export function useUnreadCounts(userId: string | null) {
  const conversations = useData((s) => s.conversations);
  const notifications = useData((s) => s.notifications);
  if (!userId) return { unreadMessages: 0, unreadNotifications: 0 };
  const unreadMessages = conversations.reduce((acc, c) => acc + (c.unread[userId] ?? 0), 0);
  const unreadNotifications = notifications.filter((n) => n.userId === userId && !n.read).length;
  return { unreadMessages, unreadNotifications };
}
