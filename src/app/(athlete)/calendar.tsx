import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { parseISO } from 'date-fns';

import { CalendarMonth, type DayStatus } from '@/components/CalendarMonth';
import { Card } from '@/components/ui/Card';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { computeStreak, dateKey } from '@/utils';

export default function CalendarScreen() {
  const { userId } = useCurrentUser();
  const [month, setMonth] = useState(new Date());
  const workoutLogs = useData((s) => s.workoutLogs);
  const plans = useData((s) => s.plans);

  const plan = plans.find((p) => p.athleteId === userId && p.status === 'active');
  const myLogs = useMemo(
    () => workoutLogs.filter((l) => l.athleteId === userId && l.completedAt),
    [workoutLogs, userId]
  );
  const completedKeys = useMemo(() => new Set(myLogs.map((l) => l.date)), [myLogs]);
  const streak = useMemo(() => computeStreak(completedKeys), [completedKeys]);
  const todayKey = dateKey();

  const bestStreak = useMemo(() => {
    const keys = [...completedKeys].sort();
    let best = 0;
    let run = 0;
    let prev: Date | null = null;
    for (const k of keys) {
      const d = parseISO(k);
      if (prev && d.getTime() - prev.getTime() === 86_400_000) run += 1;
      else run = 1;
      best = Math.max(best, run);
      prev = d;
    }
    return best;
  }, [completedKeys]);

  const monthCompleted = myLogs.filter((l) => l.date.startsWith(dateKey(month).slice(0, 7))).length;

  const statusFor = (key: string): DayStatus => {
    if (completedKeys.has(key)) return 'completed';
    if (key > todayKey) return 'future';
    const weekday = (parseISO(key).getDay() + 6) % 7;
    const dayPlan = plan?.days.find((d) => d.dayIndex === weekday);
    if (!dayPlan || dayPlan.isRest) return 'rest';
    return key === todayKey ? 'none' : 'missed';
  };

  return (
    <Screen padded={false}>
      <ScreenHeader title="Workout calendar" back />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Animated.View entering={FadeInDown.duration(320)} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Card style={styles.stat}>
            <Ionicons name="flame" size={18} color={colors.accent} />
            <AppText variant="stat">{streak}</AppText>
            <AppText variant="micro" tone="tertiary" uppercase>
              Current streak
            </AppText>
          </Card>
          <Card style={styles.stat}>
            <Ionicons name="trophy-outline" size={18} color={colors.violet} />
            <AppText variant="stat">{bestStreak}</AppText>
            <AppText variant="micro" tone="tertiary" uppercase>
              Best streak
            </AppText>
          </Card>
          <Card style={styles.stat}>
            <Ionicons name="checkmark-done-outline" size={18} color={colors.success} />
            <AppText variant="stat">{monthCompleted}</AppText>
            <AppText variant="micro" tone="tertiary" uppercase>
              This month
            </AppText>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(320)}>
          <Card>
            <CalendarMonth month={month} onChangeMonth={setMonth} statusFor={statusFor} />
          </Card>
        </Animated.View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
            <AppText variant="micro" tone="tertiary">
              Completed
            </AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.dangerMuted }]} />
            <AppText variant="micro" tone="tertiary">
              Missed
            </AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.surfaceHigh }]} />
            <AppText variant="micro" tone="tertiary">
              Rest
            </AppText>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: radius.full },
});
