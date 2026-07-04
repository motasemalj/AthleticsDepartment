import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  AppNotification,
  AthleteProfile,
  Booking,
  CoachProfile,
  Conversation,
  DailyCheckin,
  DemoVideo,
  Exercise,
  FaqItem,
  HealthGoal,
  HealthGoalLog,
  ID,
  Invite,
  MealLog,
  Message,
  NotificationKind,
  NutritionPlan,
  Payment,
  Payout,
  PricingTier,
  ProgressEntry,
  ProgressPhoto,
  Subscription,
  TrainingPlan,
  User,
  WorkoutLog,
} from '@/types';
import { uid } from '@/utils';
import {
  seedAthleteProfiles,
  seedBookings,
  seedCheckins,
  seedCoachProfiles,
  seedConversations,
  seedExercises,
  seedFaq,
  seedHealthGoalLogs,
  seedHealthGoals,
  seedInvites,
  seedMealLogs,
  seedMessages,
  seedNotifications,
  seedNutritionPlans,
  seedPayments,
  seedPayouts,
  seedPlans,
  seedProgressEntries,
  seedProgressPhotos,
  seedSubscriptions,
  seedUsers,
  seedVideos,
  seedWorkoutLogs,
} from './seed';

export interface DataState {
  users: User[];
  athleteProfiles: AthleteProfile[];
  coachProfiles: CoachProfile[];
  invites: Invite[];
  exercises: Exercise[];
  videos: DemoVideo[];
  plans: TrainingPlan[];
  workoutLogs: WorkoutLog[];
  checkins: DailyCheckin[];
  nutritionPlans: NutritionPlan[];
  mealLogs: MealLog[];
  progressEntries: ProgressEntry[];
  progressPhotos: ProgressPhoto[];
  healthGoals: HealthGoal[];
  healthGoalLogs: HealthGoalLog[];
  bookings: Booking[];
  conversations: Conversation[];
  messages: Message[];
  subscriptions: Subscription[];
  payments: Payment[];
  payouts: Payout[];
  notifications: AppNotification[];
  faq: FaqItem[];

  // -- notifications
  pushNotification: (userId: ID, kind: NotificationKind, title: string, body: string, route?: string) => void;
  markNotificationRead: (id: ID) => void;
  markAllNotificationsRead: (userId: ID) => void;

  // -- check-ins
  submitCheckin: (checkin: Omit<DailyCheckin, 'id' | 'createdAt' | 'status'>) => void;
  reviewCheckin: (id: ID, comment: string) => void;

  // -- workouts
  saveWorkoutLog: (log: WorkoutLog) => void;
  markWorkoutLogsSynced: (athleteId: ID) => void;

  // -- nutrition
  logMeal: (meal: Omit<MealLog, 'id' | 'loggedAt'>) => void;
  removeMealLog: (id: ID) => void;
  saveNutritionPlan: (plan: NutritionPlan) => void;

  // -- progress
  addProgressEntry: (entry: Omit<ProgressEntry, 'id' | 'createdAt'>) => void;
  addProgressPhoto: (photo: Omit<ProgressPhoto, 'id' | 'createdAt'>) => void;

  // -- health goals
  logGoalValue: (goalId: ID, athleteId: ID, date: string, value: number) => void;
  addHealthGoal: (goal: Omit<HealthGoal, 'id' | 'createdAt'>) => void;
  removeHealthGoal: (id: ID) => void;

  // -- bookings
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
  updateBookingStatus: (id: ID, status: Booking['status']) => void;
  setBookingMeetLink: (id: ID, link: string) => void;

  // -- chat
  sendMessage: (conversationId: ID, senderId: ID, content: { text?: string; imageUri?: string; videoUri?: string }) => void;
  markConversationRead: (conversationId: ID, userId: ID) => void;

  // -- plans
  savePlan: (plan: TrainingPlan) => void;
  deletePlan: (id: ID) => void;

  // -- video library
  addVideo: (video: Omit<DemoVideo, 'id' | 'uploadedAt'>) => void;
  deleteVideo: (id: ID) => void;
  updateVideo: (id: ID, patch: Partial<DemoVideo>) => void;

  // -- invites & onboarding
  createInvite: (coachId: ID) => Invite;
  revokeInvite: (id: ID) => void;
  redeemInvite: (token: string, details: { name: string; email: string; goal: string; isStudent: boolean; joinedVia: 'invite-link' | 'qr' }) => { user: User } | { error: string };
  submitCoachApplication: (details: { name: string; email: string; bio: string; specialties: string[]; yearsExperience: number; certifications: { name: string; fileName: string }[] }) => User;
  acceptDisclaimer: (userId: ID) => void;

  // -- coach settings
  updateCoachPricing: (coachId: ID, pricing: PricingTier[], studentDiscountPct: number) => void;
  updateCoachProfile: (coachId: ID, patch: Partial<CoachProfile>) => void;
  updateUser: (userId: ID, patch: Partial<User>) => void;

  // -- admin
  approveCoach: (coachId: ID, commissionPct: number) => void;
  rejectCoach: (coachId: ID) => void;
  suspendCoach: (coachId: ID) => void;
  setSubscriptionStatus: (id: ID, status: Subscription['status']) => void;
  refundPayment: (id: ID) => void;

  // -- account
  deleteAccount: (userId: ID) => void;
  resetDemoData: () => void;
}

const seedState = {
  users: seedUsers,
  athleteProfiles: seedAthleteProfiles,
  coachProfiles: seedCoachProfiles,
  invites: seedInvites,
  exercises: seedExercises,
  videos: seedVideos,
  plans: seedPlans,
  workoutLogs: seedWorkoutLogs,
  checkins: seedCheckins,
  nutritionPlans: seedNutritionPlans,
  mealLogs: seedMealLogs,
  progressEntries: seedProgressEntries,
  progressPhotos: seedProgressPhotos,
  healthGoals: seedHealthGoals,
  healthGoalLogs: seedHealthGoalLogs,
  bookings: seedBookings,
  conversations: seedConversations,
  messages: seedMessages,
  subscriptions: seedSubscriptions,
  payments: seedPayments,
  payouts: seedPayouts,
  notifications: seedNotifications,
  faq: seedFaq,
};

export const useData = create<DataState>()(
  persist(
    (set, get) => ({
      ...seedState,

      // ------------------------------------------------------------ notifications
      pushNotification: (userId, kind, title, body, route) =>
        set((s) => ({
          notifications: [
            { id: uid('nt'), userId, kind, title, body, createdAt: Date.now(), read: false, route },
            ...s.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllNotificationsRead: (userId) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
        })),

      // ------------------------------------------------------------ check-ins
      submitCheckin: (checkin) => {
        const athlete = get().users.find((u) => u.id === checkin.athleteId);
        set((s) => ({
          checkins: [
            { ...checkin, id: uid('ci'), createdAt: Date.now(), status: 'pending' as const },
            ...s.checkins,
          ],
        }));
        get().pushNotification(
          checkin.coachId,
          'checkin',
          'New daily check-in',
          `${athlete?.name ?? 'An athlete'} submitted a check-in`,
          '/(coach)/checkins'
        );
      },

      reviewCheckin: (id, comment) => {
        const checkin = get().checkins.find((c) => c.id === id);
        set((s) => ({
          checkins: s.checkins.map((c) =>
            c.id === id ? { ...c, status: 'reviewed' as const, coachComment: comment, reviewedAt: Date.now() } : c
          ),
        }));
        if (checkin) {
          get().pushNotification(
            checkin.athleteId,
            'checkin',
            'Check-in reviewed',
            'Your coach left a comment on your check-in',
            '/(athlete)/checkin'
          );
        }
      },

      // ------------------------------------------------------------ workouts
      saveWorkoutLog: (log) =>
        set((s) => {
          const existing = s.workoutLogs.findIndex((l) => l.id === log.id);
          if (existing >= 0) {
            const next = [...s.workoutLogs];
            next[existing] = log;
            return { workoutLogs: next };
          }
          return { workoutLogs: [log, ...s.workoutLogs] };
        }),

      markWorkoutLogsSynced: (athleteId) =>
        set((s) => ({
          workoutLogs: s.workoutLogs.map((l) =>
            l.athleteId === athleteId && !l.synced ? { ...l, synced: true } : l
          ),
        })),

      // ------------------------------------------------------------ nutrition
      logMeal: (meal) =>
        set((s) => ({ mealLogs: [{ ...meal, id: uid('ml'), loggedAt: Date.now() }, ...s.mealLogs] })),

      removeMealLog: (id) => set((s) => ({ mealLogs: s.mealLogs.filter((m) => m.id !== id) })),

      saveNutritionPlan: (plan) => {
        const exists = get().nutritionPlans.some((p) => p.id === plan.id);
        set((s) => ({
          nutritionPlans: exists
            ? s.nutritionPlans.map((p) => (p.id === plan.id ? { ...plan, updatedAt: Date.now() } : p))
            : [{ ...plan, updatedAt: Date.now() }, ...s.nutritionPlans],
        }));
        get().pushNotification(
          plan.athleteId,
          'plan',
          'Nutrition plan updated',
          `${plan.title} was updated by your coach`,
          '/(athlete)/nutrition'
        );
      },

      // ------------------------------------------------------------ progress
      addProgressEntry: (entry) =>
        set((s) => ({
          progressEntries: [
            { ...entry, id: uid('pr'), createdAt: Date.now() },
            ...s.progressEntries.filter((e) => !(e.athleteId === entry.athleteId && e.date === entry.date)),
          ],
        })),

      addProgressPhoto: (p) =>
        set((s) => ({ progressPhotos: [{ ...p, id: uid('pp'), createdAt: Date.now() }, ...s.progressPhotos] })),

      // ------------------------------------------------------------ health goals
      logGoalValue: (goalId, athleteId, date, value) =>
        set((s) => {
          const others = s.healthGoalLogs.filter((l) => !(l.goalId === goalId && l.date === date));
          return { healthGoalLogs: [...others, { id: uid('hgl'), goalId, athleteId, date, value }] };
        }),

      addHealthGoal: (goal) =>
        set((s) => ({ healthGoals: [...s.healthGoals, { ...goal, id: uid('hg'), createdAt: Date.now() }] })),

      removeHealthGoal: (id) =>
        set((s) => ({
          healthGoals: s.healthGoals.filter((g) => g.id !== id),
          healthGoalLogs: s.healthGoalLogs.filter((l) => l.goalId !== id),
        })),

      // ------------------------------------------------------------ bookings
      createBooking: (booking) => {
        const athlete = get().users.find((u) => u.id === booking.athleteId);
        set((s) => ({
          bookings: [{ ...booking, id: uid('bk'), createdAt: Date.now(), status: 'requested' as const }, ...s.bookings],
        }));
        get().pushNotification(
          booking.coachId,
          'booking',
          'New session request',
          `${athlete?.name ?? 'An athlete'} requested a session`,
          '/(coach)/schedule'
        );
      },

      updateBookingStatus: (id, status) => {
        const booking = get().bookings.find((b) => b.id === id);
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)) }));
        if (booking && (status === 'confirmed' || status === 'cancelled')) {
          get().pushNotification(
            booking.athleteId,
            'booking',
            status === 'confirmed' ? 'Session confirmed' : 'Session cancelled',
            status === 'confirmed' ? 'Your coach confirmed your session' : 'Your session was cancelled',
            '/(athlete)/bookings'
          );
        }
      },

      setBookingMeetLink: (id, link) => {
        const booking = get().bookings.find((b) => b.id === id);
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, meetLink: link } : b)) }));
        if (booking) {
          get().pushNotification(
            booking.athleteId,
            'booking',
            'Meeting link added',
            'Your coach added a Google Meet link to your session',
            '/(athlete)/bookings'
          );
        }
      },

      // ------------------------------------------------------------ chat
      sendMessage: (conversationId, senderId, content) => {
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv) return;
        const recipientId = senderId === conv.athleteId ? conv.coachId : conv.athleteId;
        const sender = get().users.find((u) => u.id === senderId);
        const preview = content.text ?? (content.imageUri ? '\uD83D\uDCF7 Photo' : '\uD83C\uDFA5 Video');
        set((s) => ({
          messages: [
            ...s.messages,
            { id: uid('m'), conversationId, senderId, ...content, sentAt: Date.now(), readBy: [senderId] },
          ],
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  lastMessageAt: Date.now(),
                  lastMessagePreview: preview,
                  unread: { ...c.unread, [recipientId]: (c.unread[recipientId] ?? 0) + 1 },
                }
              : c
          ),
        }));
        get().pushNotification(
          recipientId,
          'message',
          `New message from ${sender?.name ?? 'your coach'}`,
          preview,
          `/chat/${conversationId}`
        );
      },

      markConversationRead: (conversationId, userId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, unread: { ...c.unread, [userId]: 0 } } : c
          ),
          messages: s.messages.map((m) =>
            m.conversationId === conversationId && !m.readBy.includes(userId)
              ? { ...m, readBy: [...m.readBy, userId] }
              : m
          ),
        })),

      // ------------------------------------------------------------ plans
      savePlan: (plan) => {
        const exists = get().plans.some((p) => p.id === plan.id);
        set((s) => ({
          plans: exists
            ? s.plans.map((p) => (p.id === plan.id ? { ...plan, updatedAt: Date.now() } : p))
            : [{ ...plan, updatedAt: Date.now() }, ...s.plans],
        }));
        if (plan.athleteId && plan.status === 'active') {
          get().pushNotification(
            plan.athleteId,
            'plan',
            'Training plan updated',
            `${plan.title} was updated by your coach`,
            '/(athlete)/training'
          );
        }
      },

      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),

      // ------------------------------------------------------------ video library
      addVideo: (video) =>
        set((s) => ({ videos: [{ ...video, id: uid('vid'), uploadedAt: Date.now() }, ...s.videos] })),

      deleteVideo: (id) =>
        set((s) => ({
          videos: s.videos.filter((v) => v.id !== id),
          exercises: s.exercises.map((e) => (e.videoId === id ? { ...e, videoId: undefined } : e)),
        })),

      updateVideo: (id, patch) =>
        set((s) => ({ videos: s.videos.map((v) => (v.id === id ? { ...v, ...patch } : v)) })),

      // ------------------------------------------------------------ invites & onboarding
      createInvite: (coachId) => {
        const token = `${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
        const invite: Invite = { id: uid('inv'), coachId, token, createdAt: Date.now() };
        set((s) => ({ invites: [invite, ...s.invites] }));
        return invite;
      },

      revokeInvite: (id) =>
        set((s) => ({ invites: s.invites.map((i) => (i.id === id ? { ...i, revoked: true } : i)) })),

      redeemInvite: (token, details) => {
        const invite = get().invites.find(
          (i) => i.token.toUpperCase() === token.trim().toUpperCase() && !i.revoked && !i.usedBy
        );
        if (!invite) return { error: 'This invite code is invalid or has already been used.' };
        const user: User = {
          id: uid('u-ath'),
          role: 'athlete',
          name: details.name,
          email: details.email,
          createdAt: Date.now(),
        };
        const profile: AthleteProfile = {
          userId: user.id,
          coachId: invite.coachId,
          goal: details.goal,
          isStudent: details.isStudent,
          joinedVia: details.joinedVia,
          tags: [],
        };
        const conversation: Conversation = {
          id: uid('cv'),
          athleteId: user.id,
          coachId: invite.coachId,
          lastMessageAt: Date.now(),
          lastMessagePreview: 'Say hi to your new coach \uD83D\uDC4B',
          unread: { [user.id]: 0, [invite.coachId]: 0 },
        };
        set((s) => ({
          users: [...s.users, user],
          athleteProfiles: [...s.athleteProfiles, profile],
          conversations: [conversation, ...s.conversations],
          invites: s.invites.map((i) =>
            i.id === invite.id ? { ...i, usedBy: user.id, usedAt: Date.now() } : i
          ),
        }));
        get().pushNotification(
          invite.coachId,
          'system',
          'New athlete joined',
          `${details.name} accepted your invite`,
          '/(coach)/clients'
        );
        return { user };
      },

      submitCoachApplication: (details) => {
        const user: User = {
          id: uid('u-coach'),
          role: 'coach',
          name: details.name,
          email: details.email,
          createdAt: Date.now(),
        };
        const profile: CoachProfile = {
          userId: user.id,
          bio: details.bio,
          specialties: details.specialties,
          certifications: details.certifications.map((c) => ({
            id: uid('cert'),
            name: c.name,
            fileName: c.fileName,
            uploadedAt: Date.now(),
            verified: false,
          })),
          status: 'pending',
          commissionPct: 25,
          isOwner: false,
          yearsExperience: details.yearsExperience,
          pricing: [
            { months: 3, pricePerMonthAed: 900 },
            { months: 6, pricePerMonthAed: 800 },
            { months: 12, pricePerMonthAed: 700 },
          ],
          studentDiscountPct: 0,
          appliedAt: Date.now(),
        };
        set((s) => ({ users: [...s.users, user], coachProfiles: [...s.coachProfiles, profile] }));
        get().pushNotification(
          'u-admin',
          'approval',
          'New coach application',
          `${details.name} applied with ${details.certifications.length} certification${details.certifications.length === 1 ? '' : 's'}`,
          '/(admin)/coaches'
        );
        return user;
      },

      acceptDisclaimer: (userId) =>
        set((s) => ({
          athleteProfiles: s.athleteProfiles.map((p) =>
            p.userId === userId ? { ...p, disclaimerAcceptedAt: Date.now() } : p
          ),
        })),

      // ------------------------------------------------------------ coach settings
      updateCoachPricing: (coachId, pricing, studentDiscountPct) =>
        set((s) => ({
          coachProfiles: s.coachProfiles.map((c) =>
            c.userId === coachId ? { ...c, pricing, studentDiscountPct } : c
          ),
        })),

      updateCoachProfile: (coachId, patch) =>
        set((s) => ({
          coachProfiles: s.coachProfiles.map((c) => (c.userId === coachId ? { ...c, ...patch } : c)),
        })),

      updateUser: (userId, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)) })),

      // ------------------------------------------------------------ admin
      approveCoach: (coachId, commissionPct) => {
        set((s) => ({
          coachProfiles: s.coachProfiles.map((c) =>
            c.userId === coachId
              ? {
                  ...c,
                  status: 'approved' as const,
                  commissionPct,
                  approvedAt: Date.now(),
                  certifications: c.certifications.map((cert) => ({ ...cert, verified: true })),
                }
              : c
          ),
        }));
        get().pushNotification(
          coachId,
          'approval',
          'Application approved \uD83C\uDF89',
          'Welcome to Athletics Department — your coach dashboard is live',
          '/(coach)'
        );
      },

      rejectCoach: (coachId) => {
        set((s) => ({
          coachProfiles: s.coachProfiles.map((c) =>
            c.userId === coachId ? { ...c, status: 'rejected' as const } : c
          ),
        }));
        get().pushNotification(coachId, 'approval', 'Application update', 'Your coach application was not approved this time');
      },

      suspendCoach: (coachId) =>
        set((s) => ({
          coachProfiles: s.coachProfiles.map((c) =>
            c.userId === coachId ? { ...c, status: 'suspended' as const } : c
          ),
        })),

      setSubscriptionStatus: (id, status) => {
        const sub = get().subscriptions.find((x) => x.id === id);
        set((s) => ({ subscriptions: s.subscriptions.map((x) => (x.id === id ? { ...x, status } : x)) }));
        if (sub) {
          const label =
            status === 'paused' ? 'paused' : status === 'cancelled' ? 'cancelled' : status === 'active' ? 'resumed' : 'updated';
          get().pushNotification(sub.athleteId, 'payment', 'Subscription update', `Your subscription was ${label}`, '/(athlete)/billing');
        }
      },

      refundPayment: (id) => {
        const payment = get().payments.find((p) => p.id === id);
        set((s) => ({
          payments: s.payments.map((p) => (p.id === id ? { ...p, status: 'refunded' as const } : p)),
        }));
        if (payment) {
          get().pushNotification(
            payment.athleteId,
            'payment',
            'Refund issued',
            `AED ${payment.amountAed.toLocaleString()} has been refunded to your card`,
            '/(athlete)/billing'
          );
        }
      },

      // ------------------------------------------------------------ account
      deleteAccount: (userId) =>
        set((s) => ({
          users: s.users.filter((u) => u.id !== userId),
          athleteProfiles: s.athleteProfiles.filter((p) => p.userId !== userId),
          coachProfiles: s.coachProfiles.filter((p) => p.userId !== userId),
          checkins: s.checkins.filter((c) => c.athleteId !== userId),
          workoutLogs: s.workoutLogs.filter((l) => l.athleteId !== userId),
          mealLogs: s.mealLogs.filter((m) => m.athleteId !== userId),
          progressEntries: s.progressEntries.filter((e) => e.athleteId !== userId),
          progressPhotos: s.progressPhotos.filter((p) => p.athleteId !== userId),
          bookings: s.bookings.filter((b) => b.athleteId !== userId && b.coachId !== userId),
          conversations: s.conversations.filter((c) => c.athleteId !== userId && c.coachId !== userId),
          messages: s.messages.filter((m) => m.senderId !== userId),
          subscriptions: s.subscriptions.filter((x) => x.athleteId !== userId),
          notifications: s.notifications.filter((n) => n.userId !== userId),
        })),

      resetDemoData: () => set(() => ({ ...seedState })),
    }),
    {
      name: 'athletics-dept-db-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    }
  )
);
