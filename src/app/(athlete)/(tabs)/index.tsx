import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { ProgressBar, ProgressRing } from '@/components/ui/Progress';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser, useNow, useUnreadCounts } from '@/services/hooks';
import { useOfflineSync } from '@/services/useOfflineSync';
import { colors, radius, spacing } from '@/theme/tokens';
import { computeStreak, dateKey, formatDuration } from '@/utils';

function HeaderBell({ count, onPress, icon }: { count: number; onPress: () => void; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.bell} hitSlop={6}>
      <Ionicons name={icon} size={20} color={colors.text} />
      {count > 0 ? (
        <View style={styles.bellBadge}>
          <AppText variant="micro" color={colors.textOnAccent} style={{ fontSize: 9, lineHeight: 11 }}>
            {count > 9 ? '9+' : count}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function AthleteHome() {
  const router = useRouter();
  const { userId, user, coach } = useCurrentUser();
  const { unreadMessages, unreadNotifications } = useUnreadCounts(userId);
  const { isOnline } = useOfflineSync();
  const now = useNow();

  const plans = useData((s) => s.plans);
  const workoutLogs = useData((s) => s.workoutLogs);
  const checkins = useData((s) => s.checkins);
  const bookings = useData((s) => s.bookings);
  const nutritionPlans = useData((s) => s.nutritionPlans);
  const mealLogs = useData((s) => s.mealLogs);
  const healthGoals = useData((s) => s.healthGoals);
  const healthGoalLogs = useData((s) => s.healthGoalLogs);
  const conversations = useData((s) => s.conversations);

  const todayKey = dateKey();
  const plan = plans.find((p) => p.athleteId === userId && p.status === 'active');
  const weekday = (new Date().getDay() + 6) % 7;
  const todayDay = plan?.days.find((d) => d.dayIndex === weekday);
  const todayLog = workoutLogs.find((l) => l.athleteId === userId && l.date === todayKey && l.completedAt);
  const myLogs = useMemo(
    () => workoutLogs.filter((l) => l.athleteId === userId && l.completedAt),
    [workoutLogs, userId]
  );
  const streak = useMemo(() => computeStreak(new Set(myLogs.map((l) => l.date))), [myLogs]);
  const pendingSync = workoutLogs.filter((l) => l.athleteId === userId && !l.synced).length;

  const todayCheckin = checkins.find((c) => c.athleteId === userId && c.date === todayKey);
  const nextBooking = useMemo(
    () =>
      bookings
        .filter((b) => b.athleteId === userId && b.startsAt > now && b.status !== 'cancelled')
        .sort((a, b) => a.startsAt - b.startsAt)[0],
    [bookings, userId, now]
  );

  const nutritionPlan = nutritionPlans.find((p) => p.athleteId === userId);
  const todayCals = mealLogs
    .filter((m) => m.athleteId === userId && m.date === todayKey)
    .reduce((a, m) => a + m.macros.calories, 0);

  const myGoals = healthGoals.filter((g) => g.athleteId === userId);
  const goalValue = (goalId: string) =>
    healthGoalLogs.find((l) => l.goalId === goalId && l.date === todayKey)?.value ?? 0;

  const conversation = conversations.find((c) => c.athleteId === userId);

  const firstName = user?.name.split(' ')[0] ?? 'Athlete';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <Screen padded={false} tabbed>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
          <Avatar name={user?.name ?? ''} uri={user?.avatarUrl} size={44} />
          <View>
            <AppText variant="captionRegular" tone="secondary">
              {greeting}
            </AppText>
            <AppText variant="title">{firstName}</AppText>
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <HeaderBell
            icon="chatbubble-ellipses-outline"
            count={unreadMessages}
            onPress={() => conversation && router.push(`/chat/${conversation.id}`)}
          />
          <HeaderBell icon="notifications-outline" count={unreadNotifications} onPress={() => router.push('/notifications')} />
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        {!isOnline ? (
          <Animated.View entering={FadeInDown.duration(240)}>
            <Card style={styles.offlineBanner}>
              <Ionicons name="cloud-offline-outline" size={16} color={colors.warning} />
              <AppText variant="caption" tone="warning">
                You’re offline — workouts still log and will sync automatically
              </AppText>
            </Card>
          </Animated.View>
        ) : pendingSync > 0 ? (
          <Card style={styles.offlineBanner}>
            <Ionicons name="sync-outline" size={16} color={colors.info} />
            <AppText variant="caption" tone="secondary">
              Syncing {pendingSync} workout{pendingSync > 1 ? 's' : ''}…
            </AppText>
          </Card>
        ) : null}

        {/* Today hero */}
        <Animated.View entering={FadeInDown.duration(360)}>
          <Card padded={false} style={{ overflow: 'hidden' }}>
            <LinearGradient
              colors={['rgba(198,243,59,0.16)', 'rgba(198,243,59,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: spacing.md }}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    Today · {format(new Date(), 'EEEE d MMM')}
                  </AppText>
                  <AppText variant="title" style={{ marginTop: 4 }}>
                    {todayDay ? (todayDay.isRest ? 'Rest day' : todayDay.title) : 'No plan yet'}
                  </AppText>
                  {todayDay?.focus ? (
                    <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 2 }}>
                      {todayDay.focus}
                    </AppText>
                  ) : null}
                </View>
                <View style={styles.streakPill}>
                  <Ionicons name="flame" size={16} color={colors.accent} />
                  <AppText variant="bodySemi" tone="accent">
                    {streak}
                  </AppText>
                  <AppText variant="micro" tone="tertiary">
                    day streak
                  </AppText>
                </View>
              </View>

              {todayDay && !todayDay.isRest ? (
                todayLog ? (
                  <View style={styles.doneRow}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <AppText variant="bodySemi" tone="success">
                      Completed in {formatDuration(todayLog.durationSec ?? 0)}
                    </AppText>
                    {!todayLog.synced ? <Badge label="Sync pending" tone="warning" /> : null}
                  </View>
                ) : (
                  <Button
                    label={`Start workout · ${todayDay.exercises.length} exercises`}
                    icon="play"
                    size="lg"
                    fullWidth
                    style={{ marginTop: spacing.md }}
                    onPress={() => router.push(`/(athlete)/workout/${todayDay.id}`)}
                  />
                )
              ) : todayDay?.isRest ? (
                <AppText variant="captionRegular" tone="secondary" style={{ marginTop: spacing.sm }}>
                  Recovery matters. A walk or light stretching keeps the streak spirit alive.
                </AppText>
              ) : null}
            </LinearGradient>
          </Card>
        </Animated.View>

        {/* Daily check-in */}
        <Animated.View entering={FadeInDown.delay(60).duration(360)}>
          <Card style={{ marginTop: spacing.sm }} onPress={() => router.push('/(athlete)/checkin')}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                <View style={[styles.iconTile, todayCheckin && { backgroundColor: colors.successMuted }]}>
                  <Ionicons
                    name={todayCheckin ? 'checkmark-done' : 'journal-outline'}
                    size={18}
                    color={todayCheckin ? colors.success : colors.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi">Daily check-in</AppText>
                  <AppText variant="captionRegular" tone="secondary">
                    {todayCheckin
                      ? todayCheckin.status === 'reviewed'
                        ? 'Submitted · reviewed by your coach'
                        : 'Submitted · awaiting coach review'
                      : 'How are you feeling today?'}
                  </AppText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </View>
          </Card>
        </Animated.View>

        {/* Health goals */}
        {myGoals.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(120).duration(360)}>
            <SectionHeader title="Today's targets" />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {myGoals.slice(0, 3).map((g) => {
                const v = goalValue(g.id);
                const pct = Math.min(1, v / g.target);
                return (
                  <Card key={g.id} style={{ flex: 1, alignItems: 'center', gap: spacing.xs }}>
                    <ProgressRing
                      progress={pct}
                      size={62}
                      strokeWidth={6}
                      color={pct >= 1 ? colors.success : colors.accent}
                      label={g.metric === 'steps' ? `${Math.round(v / 100) / 10}k` : `${v}`}
                    />
                    <AppText variant="micro" tone="secondary" uppercase>
                      {g.label}
                    </AppText>
                    <AppText variant="micro" tone="tertiary">
                      of {g.metric === 'steps' ? `${g.target / 1000}k` : `${g.target}${g.unit === 'L' ? 'L' : ''}`}
                    </AppText>
                  </Card>
                );
              })}
            </View>
          </Animated.View>
        ) : null}

        {/* Upcoming session */}
        {nextBooking ? (
          <Animated.View entering={FadeInDown.delay(160).duration(360)}>
            <SectionHeader title="Next session" action="All bookings" onAction={() => router.push('/(athlete)/bookings')} />
            <Card>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi">
                    {nextBooking.type === 'call-15'
                      ? '15-min call'
                      : nextBooking.type === 'video-review'
                        ? 'Video review'
                        : 'Full session'}{' '}
                    with {coach?.name?.split(' ')[0] ?? 'Coach'}
                  </AppText>
                  <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 2 }}>
                    {format(nextBooking.startsAt, 'EEE d MMM · h:mm a')} · {nextBooking.durationMin} min
                  </AppText>
                </View>
                <Badge
                  label={nextBooking.status === 'confirmed' ? 'Confirmed' : 'Requested'}
                  tone={nextBooking.status === 'confirmed' ? 'success' : 'warning'}
                />
              </View>
              {nextBooking.meetLink ? (
                <Button
                  label="Join Google Meet"
                  icon="videocam-outline"
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
                  onPress={() => Linking.openURL(nextBooking.meetLink!)}
                />
              ) : null}
            </Card>
          </Animated.View>
        ) : null}

        {/* Nutrition snapshot */}
        {nutritionPlan ? (
          <Animated.View entering={FadeInDown.delay(200).duration(360)}>
            <SectionHeader title="Nutrition today" action="Log meal" onAction={() => router.push('/(athlete)/nutrition')} />
            <Card onPress={() => router.push('/(athlete)/nutrition')}>
              <View style={styles.rowBetween}>
                <AppText variant="bodySemi">{todayCals.toLocaleString()} kcal</AppText>
                <AppText variant="captionRegular" tone="tertiary">
                  target {nutritionPlan.targets.calories.toLocaleString()}
                </AppText>
              </View>
              <ProgressBar
                progress={todayCals / nutritionPlan.targets.calories}
                style={{ marginTop: spacing.xs }}
                color={todayCals > nutritionPlan.targets.calories * 1.05 ? colors.warning : colors.accent}
              />
            </Card>
          </Animated.View>
        ) : null}

        {/* Coach card */}
        {coach ? (
          <Animated.View entering={FadeInDown.delay(240).duration(360)}>
            <SectionHeader title="Your coach" />
            <Card onPress={() => conversation && router.push(`/chat/${conversation.id}`)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Avatar name={coach.name} uri={coach.avatarUrl} size={48} showRing />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi">{coach.name}</AppText>
                  <AppText variant="captionRegular" tone="secondary">
                    Message your coach anytime
                  </AppText>
                </View>
                <View style={styles.chatCta}>
                  <Ionicons name="chatbubble-outline" size={16} color={colors.textOnAccent} />
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -5,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceRaised,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCta: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
