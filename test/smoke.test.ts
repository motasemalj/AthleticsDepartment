/**
 * Feature smoke test.
 *
 * Exercises the full data layer (the same store every screen renders from)
 * across all roles, verifies seed integrity, and includes a static regression
 * check for unstable Zustand selectors (the "getSnapshot should be cached"
 * infinite-loop bug).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

import { useData } from '@/services/data/store';
import { DEMO_ACCOUNTS } from '@/services/session';
import { computeStreak, dateKey, formatAed, initials } from '@/utils';

const s = () => useData.getState();

beforeEach(() => {
  s().resetDemoData();
});

// ---------------------------------------------------------------------------
// Regression guard: selectors must return stable snapshots
// ---------------------------------------------------------------------------

describe('zustand selector stability', () => {
  const collectFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry);
      return statSync(full).isDirectory() ? collectFiles(full) : full.endsWith('.tsx') || full.endsWith('.ts') ? [full] : [];
    });

  it('no useData selector returns a fresh array/object per call', () => {
    const offenders: string[] = [];
    for (const file of collectFiles(path.resolve(__dirname, '../src'))) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        // Array-producing methods inside a selector create a new reference on
        // every getSnapshot -> infinite re-render. Primitives (.length, .some)
        // and .find (stable element reference) are safe.
        if (/useData\(\(s\) =>.*\.(filter|map|slice|sort|reduce)\(/.test(line) && !/\.length\)?;?\s*$/.test(line.trim())) {
          offenders.push(`${path.basename(file)}:${i + 1}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });

  it('repeated state reads return identical references', () => {
    expect(s().plans).toBe(s().plans);
    expect(s().users).toBe(s().users);
  });
});

// ---------------------------------------------------------------------------
// Seed integrity
// ---------------------------------------------------------------------------

describe('seed data integrity', () => {
  it('demo accounts exist with the right roles', () => {
    for (const [role, id] of Object.entries(DEMO_ACCOUNTS)) {
      const user = s().users.find((u) => u.id === id);
      expect(user, `missing demo account for ${role}`).toBeTruthy();
      expect(user!.role).toBe(role);
    }
  });

  it('every athlete profile points at a real coach and user', () => {
    for (const p of s().athleteProfiles) {
      expect(s().users.some((u) => u.id === p.userId)).toBe(true);
      expect(s().users.some((u) => u.id === p.coachId && u.role === 'coach')).toBe(true);
    }
  });

  it('plan exercises reference real library exercises; video refs are valid', () => {
    const exerciseIds = new Set(s().exercises.map((e) => e.id));
    const videoIds = new Set(s().videos.map((v) => v.id));
    for (const plan of s().plans) {
      for (const day of plan.days) {
        for (const pe of day.exercises) expect(exerciseIds.has(pe.exerciseId)).toBe(true);
      }
    }
    for (const e of s().exercises) {
      if (e.videoId) expect(videoIds.has(e.videoId)).toBe(true);
    }
  });

  it('conversations and messages reference real participants', () => {
    const userIds = new Set(s().users.map((u) => u.id));
    for (const c of s().conversations) {
      expect(userIds.has(c.athleteId)).toBe(true);
      expect(userIds.has(c.coachId)).toBe(true);
    }
    const convIds = new Set(s().conversations.map((c) => c.id));
    for (const m of s().messages) expect(convIds.has(m.conversationId)).toBe(true);
  });

  it('payments always split cleanly into commission + net', () => {
    for (const p of s().payments) {
      expect(p.commissionAed + p.netAed).toBe(p.amountAed);
      expect(p.commissionAed).toBeGreaterThanOrEqual(0);
    }
  });

  it('athlete demo account has an active plan, nutrition plan and subscription', () => {
    const id = DEMO_ACCOUNTS.athlete;
    expect(s().plans.some((p) => p.athleteId === id && p.status === 'active')).toBe(true);
    expect(s().nutritionPlans.some((p) => p.athleteId === id)).toBe(true);
    expect(s().subscriptions.some((x) => x.athleteId === id && x.status === 'active')).toBe(true);
    expect(s().progressEntries.filter((e) => e.athleteId === id).length).toBeGreaterThan(5);
    expect(s().progressPhotos.filter((p) => p.athleteId === id).length).toBeGreaterThanOrEqual(4);
  });
});

// ---------------------------------------------------------------------------
// Athlete features
// ---------------------------------------------------------------------------

describe('athlete features', () => {
  const athleteId = DEMO_ACCOUNTS.athlete;
  const coachId = DEMO_ACCOUNTS.coach;

  it('daily check-in: submits as pending and notifies the coach', () => {
    const before = s().notifications.filter((n) => n.userId === coachId).length;
    s().submitCheckin({
      athleteId,
      coachId,
      date: dateKey(),
      mood: 'good',
      energy: 8,
      sleepHours: 7,
      journal: 'Felt strong today.',
    });
    const checkin = s().checkins[0]!;
    expect(checkin.status).toBe('pending');
    expect(s().notifications.filter((n) => n.userId === coachId).length).toBe(before + 1);
  });

  it('offline workout logging: saves unsynced, then syncs', () => {
    const plan = s().plans.find((p) => p.athleteId === athleteId && p.status === 'active')!;
    const day = plan.days.find((d) => !d.isRest)!;
    s().saveWorkoutLog({
      id: 'wl-test',
      athleteId,
      planId: plan.id,
      planDayId: day.id,
      date: dateKey(),
      startedAt: Date.now(),
      completedAt: Date.now(),
      durationSec: 3000,
      exercises: [],
      feeling: 4,
      synced: false, // logged offline
    });
    expect(s().workoutLogs.find((l) => l.id === 'wl-test')!.synced).toBe(false);
    s().markWorkoutLogsSynced(athleteId);
    expect(s().workoutLogs.find((l) => l.id === 'wl-test')!.synced).toBe(true);
  });

  it('streak: computed from completed workout dates', () => {
    const keys = new Set(
      s().workoutLogs.filter((l) => l.athleteId === athleteId && l.completedAt).map((l) => l.date)
    );
    expect(computeStreak(keys)).toBeGreaterThan(0);
  });

  it('nutrition: logs and removes meals', () => {
    const before = s().mealLogs.length;
    s().logMeal({
      athleteId,
      date: dateKey(),
      name: 'Test smoothie',
      macros: { calories: 300, proteinG: 30, carbsG: 30, fatG: 6 },
    });
    expect(s().mealLogs.length).toBe(before + 1);
    s().removeMealLog(s().mealLogs[0]!.id);
    expect(s().mealLogs.length).toBe(before);
  });

  it('progress: same-day entry replaces, photos append', () => {
    s().addProgressEntry({ athleteId, date: dateKey(), weightKg: 63.1 });
    s().addProgressEntry({ athleteId, date: dateKey(), weightKg: 63.4 });
    const todays = s().progressEntries.filter((e) => e.athleteId === athleteId && e.date === dateKey());
    expect(todays.length).toBe(1);
    expect(todays[0]!.weightKg).toBe(63.4);

    const before = s().progressPhotos.length;
    s().addProgressPhoto({ athleteId, date: dateKey(), uri: 'file://test.jpg', pose: 'front' });
    expect(s().progressPhotos.length).toBe(before + 1);
  });

  it('health goals: same-day log upserts', () => {
    const goal = s().healthGoals.find((g) => g.athleteId === athleteId)!;
    s().logGoalValue(goal.id, athleteId, dateKey(), 2);
    s().logGoalValue(goal.id, athleteId, dateKey(), 3);
    const logs = s().healthGoalLogs.filter((l) => l.goalId === goal.id && l.date === dateKey());
    expect(logs.length).toBe(1);
    expect(logs[0]!.value).toBe(3);
  });

  it('bookings: request notifies coach; cancel notifies nobody extra', () => {
    const before = s().notifications.filter((n) => n.userId === coachId).length;
    s().createBooking({
      athleteId,
      coachId,
      type: 'call-15',
      startsAt: Date.now() + 86_400_000,
      durationMin: 15,
    });
    const booking = s().bookings[0]!;
    expect(booking.status).toBe('requested');
    expect(s().notifications.filter((n) => n.userId === coachId).length).toBe(before + 1);
  });

  it('chat: sending updates preview, unread count and notifies recipient', () => {
    const conv = s().conversations.find((c) => c.athleteId === athleteId)!;
    s().sendMessage(conv.id, athleteId, { text: 'Hello coach!' });
    const updated = s().conversations.find((c) => c.id === conv.id)!;
    expect(updated.lastMessagePreview).toBe('Hello coach!');
    expect(updated.unread[coachId]).toBeGreaterThan(0);
    s().markConversationRead(conv.id, coachId);
    expect(s().conversations.find((c) => c.id === conv.id)!.unread[coachId]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Coach features
// ---------------------------------------------------------------------------

describe('coach features', () => {
  const coachId = DEMO_ACCOUNTS.coach;

  it('review queue: pending check-ins sort oldest-first and review notifies athlete', () => {
    const pending = s()
      .checkins.filter((c) => c.coachId === coachId && c.status === 'pending')
      .sort((a, b) => a.createdAt - b.createdAt);
    expect(pending.length).toBeGreaterThan(0);
    const oldest = pending[0]!;
    const before = s().notifications.filter((n) => n.userId === oldest.athleteId).length;
    s().reviewCheckin(oldest.id, 'Great work, keep it up.');
    const reviewed = s().checkins.find((c) => c.id === oldest.id)!;
    expect(reviewed.status).toBe('reviewed');
    expect(reviewed.coachComment).toContain('Great work');
    expect(s().notifications.filter((n) => n.userId === oldest.athleteId).length).toBe(before + 1);
  });

  it('plan builder: publishing an assigned plan notifies the athlete; delete removes it', () => {
    const athleteId = DEMO_ACCOUNTS.athlete;
    const before = s().notifications.filter((n) => n.userId === athleteId).length;
    s().savePlan({
      id: 'plan-test',
      coachId,
      athleteId,
      title: 'Test Block',
      description: '',
      weeks: 4,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      days: [],
    });
    expect(s().plans.some((p) => p.id === 'plan-test')).toBe(true);
    expect(s().notifications.filter((n) => n.userId === athleteId).length).toBe(before + 1);
    s().deletePlan('plan-test');
    expect(s().plans.some((p) => p.id === 'plan-test')).toBe(false);
  });

  it('nutrition builder: publishing notifies the athlete', () => {
    const athleteId = DEMO_ACCOUNTS.athlete;
    const existing = s().nutritionPlans.find((p) => p.athleteId === athleteId)!;
    s().saveNutritionPlan({ ...existing, targets: { ...existing.targets, calories: 2300 } });
    expect(s().nutritionPlans.find((p) => p.athleteId === athleteId)!.targets.calories).toBe(2300);
  });

  it('video library: add, assign, delete (delete unlinks exercises)', () => {
    s().addVideo({
      coachId,
      title: 'Test video',
      category: 'core',
      url: 'file://demo.mp4',
      thumbnailColor: '#fff',
      durationSec: 30,
      assignedExerciseIds: [],
    });
    const video = s().videos[0]!;
    expect(video.title).toBe('Test video');

    // deleting a seeded video clears exercise.videoId references
    const linked = s().exercises.find((e) => e.videoId)!;
    s().deleteVideo(linked.videoId!);
    expect(s().exercises.find((e) => e.id === linked.id)!.videoId).toBeUndefined();
  });

  it('scheduling: meet link + confirm notifies athlete', () => {
    const request = s().bookings.find((b) => b.coachId === coachId && b.status === 'requested')!;
    const before = s().notifications.filter((n) => n.userId === request.athleteId).length;
    s().setBookingMeetLink(request.id, 'https://meet.google.com/test-link-abc');
    s().updateBookingStatus(request.id, 'confirmed');
    const updated = s().bookings.find((b) => b.id === request.id)!;
    expect(updated.meetLink).toContain('meet.google.com');
    expect(updated.status).toBe('confirmed');
    expect(s().notifications.filter((n) => n.userId === request.athleteId).length).toBe(before + 2);
  });

  it('pricing: updates tiers and student discount', () => {
    s().updateCoachPricing(coachId, [
      { months: 3, pricePerMonthAed: 1300 },
      { months: 6, pricePerMonthAed: 1100 },
      { months: 12, pricePerMonthAed: 900 },
    ], 25);
    const profile = s().coachProfiles.find((c) => c.userId === coachId)!;
    expect(profile.pricing.find((t) => t.months === 3)!.pricePerMonthAed).toBe(1300);
    expect(profile.studentDiscountPct).toBe(25);
  });

  it('invites: create → redeem creates athlete + conversation; reuse is rejected; revoke works', () => {
    const invite = s().createInvite(coachId);
    expect(invite.token.length).toBeGreaterThan(5);

    const result = s().redeemInvite(invite.token, {
      name: 'New Athlete',
      email: 'new@test.com',
      goal: 'Get strong',
      isStudent: true,
      joinedVia: 'qr',
    });
    expect('user' in result).toBe(true);
    const user = 'user' in result ? result.user : null;
    expect(s().athleteProfiles.some((p) => p.userId === user!.id && p.coachId === coachId)).toBe(true);
    expect(s().conversations.some((c) => c.athleteId === user!.id)).toBe(true);

    const again = s().redeemInvite(invite.token, {
      name: 'Sneaky', email: 'x@x.com', goal: 'x', isStudent: false, joinedVia: 'invite-link',
    });
    expect('error' in again).toBe(true);

    const invite2 = s().createInvite(coachId);
    s().revokeInvite(invite2.id);
    const revoked = s().redeemInvite(invite2.token, {
      name: 'Late', email: 'l@l.com', goal: 'x', isStudent: false, joinedVia: 'invite-link',
    });
    expect('error' in revoked).toBe(true);
  });

  it('earnings: coach net = sum of payment nets', () => {
    const paid = s().payments.filter((p) => p.coachId === coachId && p.status === 'paid');
    const net = paid.reduce((a, p) => a + p.netAed, 0);
    expect(net).toBeGreaterThan(0);
    expect(formatAed(net)).toContain('AED');
  });
});

// ---------------------------------------------------------------------------
// Admin & platform
// ---------------------------------------------------------------------------

describe('admin & platform features', () => {
  it('coach application: submit → pending, admin notified, then approve with commission', () => {
    const before = s().notifications.filter((n) => n.userId === 'u-admin').length;
    const user = s().submitCoachApplication({
      name: 'Test Coach',
      email: 'coach@test.com',
      bio: 'Testing',
      specialties: ['Strength'],
      yearsExperience: 3,
      certifications: [{ name: 'NASM CPT', fileName: 'cert.pdf' }],
    });
    let profile = s().coachProfiles.find((c) => c.userId === user.id)!;
    expect(profile.status).toBe('pending');
    expect(s().notifications.filter((n) => n.userId === 'u-admin').length).toBe(before + 1);

    s().approveCoach(user.id, 30);
    profile = s().coachProfiles.find((c) => c.userId === user.id)!;
    expect(profile.status).toBe('approved');
    expect(profile.commissionPct).toBe(30);
    expect(profile.certifications.every((c) => c.verified)).toBe(true);
  });

  it('coach rejection and suspension', () => {
    s().rejectCoach('u-coach-3');
    expect(s().coachProfiles.find((c) => c.userId === 'u-coach-3')!.status).toBe('rejected');
    s().suspendCoach('u-coach-2');
    expect(s().coachProfiles.find((c) => c.userId === 'u-coach-2')!.status).toBe('suspended');
  });

  it('subscription oversight: pause, resume, cancel, refund — athlete notified each time', () => {
    const sub = s().subscriptions.find((x) => x.status === 'active')!;
    s().setSubscriptionStatus(sub.id, 'paused');
    expect(s().subscriptions.find((x) => x.id === sub.id)!.status).toBe('paused');
    s().setSubscriptionStatus(sub.id, 'active');
    s().setSubscriptionStatus(sub.id, 'cancelled');
    expect(s().subscriptions.find((x) => x.id === sub.id)!.status).toBe('cancelled');

    const payment = s().payments.find((p) => p.status === 'paid')!;
    s().refundPayment(payment.id);
    expect(s().payments.find((p) => p.id === payment.id)!.status).toBe('refunded');
  });

  it('split revenue: platform income = commission + owner-coach net', () => {
    const ownerIds = new Set(s().coachProfiles.filter((c) => c.isOwner).map((c) => c.userId));
    const paid = s().payments.filter((p) => p.status === 'paid');
    const commission = paid.reduce((a, p) => a + p.commissionAed, 0);
    const ownerNet = paid.filter((p) => ownerIds.has(p.coachId)).reduce((a, p) => a + p.netAed, 0);
    const partnerNet = paid.filter((p) => !ownerIds.has(p.coachId)).reduce((a, p) => a + p.netAed, 0);
    const gmv = paid.reduce((a, p) => a + p.amountAed, 0);
    expect(commission + ownerNet + partnerNet).toBe(gmv);
    expect(ownerNet).toBeGreaterThan(0); // owner coaching income exists
    expect(commission).toBeGreaterThan(0); // partner commission exists
  });

  it('account deletion purges every collection', () => {
    const athleteId = DEMO_ACCOUNTS.athlete;
    s().deleteAccount(athleteId);
    expect(s().users.some((u) => u.id === athleteId)).toBe(false);
    expect(s().checkins.some((c) => c.athleteId === athleteId)).toBe(false);
    expect(s().workoutLogs.some((l) => l.athleteId === athleteId)).toBe(false);
    expect(s().progressPhotos.some((p) => p.athleteId === athleteId)).toBe(false);
    expect(s().subscriptions.some((x) => x.athleteId === athleteId)).toBe(false);
    expect(s().conversations.some((c) => c.athleteId === athleteId)).toBe(false);
  });

  it('notifications: mark one / mark all read', () => {
    const userId = DEMO_ACCOUNTS.coach;
    const unread = s().notifications.filter((n) => n.userId === userId && !n.read);
    expect(unread.length).toBeGreaterThan(0);
    s().markNotificationRead(unread[0]!.id);
    expect(s().notifications.find((n) => n.id === unread[0]!.id)!.read).toBe(true);
    s().markAllNotificationsRead(userId);
    expect(s().notifications.some((n) => n.userId === userId && !n.read)).toBe(false);
  });

  it('reset restores the seeded dataset', () => {
    s().deleteAccount(DEMO_ACCOUNTS.athlete);
    s().resetDemoData();
    expect(s().users.some((u) => u.id === DEMO_ACCOUNTS.athlete)).toBe(true);
  });

  it('FAQ covers all categories and utils behave', () => {
    const cats = new Set(s().faq.map((f) => f.category));
    expect(cats).toEqual(new Set(['account', 'training', 'billing', 'coaching']));
    expect(initials('Maya Khalil')).toBe('MK');
    expect(formatAed(1500)).toBe('AED 1,500');
    expect(formatAed(12000, { compact: true })).toBe('AED 12k');
  });
});
