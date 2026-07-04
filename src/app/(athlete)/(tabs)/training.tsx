import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Badge } from '@/components/ui/Badge';
import { Card, SectionHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { computeStreak, dateKey } from '@/utils';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function TrainingTab() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const plans = useData((s) => s.plans);
  const workoutLogs = useData((s) => s.workoutLogs);
  const exercises = useData((s) => s.exercises);

  const plan = plans.find((p) => p.athleteId === userId && p.status === 'active');
  const myLogs = useMemo(
    () => workoutLogs.filter((l) => l.athleteId === userId && l.completedAt),
    [workoutLogs, userId]
  );
  const completedKeys = useMemo(() => new Set(myLogs.map((l) => l.date)), [myLogs]);
  const streak = useMemo(() => computeStreak(completedKeys), [completedKeys]);
  const todayWeekday = (new Date().getDay() + 6) % 7;

  // this week's date keys per weekday
  const weekKeys = useMemo(() => {
    const monday = new Date();
    monday.setDate(monday.getDate() - todayWeekday);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return dateKey(d);
    });
  }, [todayWeekday]);

  if (!plan) {
    return (
      <Screen padded={false}>
        <ScreenHeader title="Training" large />
        <EmptyState
          icon="barbell-outline"
          title="No active plan yet"
          message="Your coach is building your programme. You'll get a notification the moment it's assigned."
        />
      </Screen>
    );
  }

  const doneThisWeek = plan.days.filter((d, i) => !d.isRest && completedKeys.has(weekKeys[d.dayIndex]!)).length;
  const totalThisWeek = plan.days.filter((d) => !d.isRest).length;

  return (
    <Screen padded={false}>
      <ScreenHeader
        title="Training"
        large
        right={
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={15} color={colors.accent} />
            <AppText variant="caption" tone="accent">
              {streak}
            </AppText>
          </View>
        }
      />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Animated.View entering={FadeInDown.duration(320)}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <AppText variant="headline">{plan.title}</AppText>
                <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 4 }}>
                  {plan.description}
                </AppText>
              </View>
              <Badge label={`${plan.weeks} weeks`} tone="accent" />
            </View>
            <View style={styles.weekProgress}>
              <AppText variant="caption" tone="secondary">
                This week
              </AppText>
              <AppText variant="caption" tone="accent">
                {doneThisWeek}/{totalThisWeek} sessions
              </AppText>
            </View>
          </Card>
        </Animated.View>

        <SectionHeader title="Your week" action="Calendar" onAction={() => router.push('/(athlete)/calendar')} />

        {plan.days
          .slice()
          .sort((a, b) => a.dayIndex - b.dayIndex)
          .map((day, i) => {
            const key = weekKeys[day.dayIndex]!;
            const done = completedKeys.has(key);
            const isToday = day.dayIndex === todayWeekday;
            const isPast = day.dayIndex < todayWeekday;
            const missed = isPast && !day.isRest && !done;

            return (
              <Animated.View key={day.id} entering={FadeInDown.delay(i * 40).duration(300)}>
                <Card
                  style={[styles.dayCard, isToday && { borderColor: colors.accentBorder, borderWidth: 1.5 }]}
                  onPress={!day.isRest ? () => router.push(`/(athlete)/workout/${day.id}`) : undefined}>
                  <View
                    style={[
                      styles.dayBubble,
                      done && { backgroundColor: colors.accent },
                      missed && { backgroundColor: colors.dangerMuted },
                    ]}>
                    {done ? (
                      <Ionicons name="checkmark" size={16} color={colors.textOnAccent} />
                    ) : (
                      <AppText
                        variant="micro"
                        color={missed ? colors.danger : isToday ? colors.accent : colors.textTertiary}
                        uppercase>
                        {WEEKDAY_LABELS[day.dayIndex]}
                      </AppText>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySemi" tone={day.isRest ? 'tertiary' : 'primary'}>
                      {day.title}
                    </AppText>
                    <AppText variant="captionRegular" tone="tertiary">
                      {day.isRest
                        ? 'Recovery'
                        : `${day.exercises.length} exercises · ${day.exercises
                            .slice(0, 2)
                            .map((e) => exercises.find((x) => x.id === e.exerciseId)?.name)
                            .filter(Boolean)
                            .join(', ')}${day.exercises.length > 2 ? '…' : ''}`}
                    </AppText>
                  </View>
                  {isToday && !day.isRest && !done ? (
                    <View style={styles.startBtn}>
                      <Ionicons name="play" size={14} color={colors.textOnAccent} />
                    </View>
                  ) : !day.isRest ? (
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  ) : null}
                </Card>
              </Animated.View>
            );
          })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  weekProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  dayCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  dayBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
