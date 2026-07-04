import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';

import { LineChart } from '@/components/charts/LineChart';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, Divider, SectionHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/Progress';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { AppText } from '@/components/ui/Text';
import { Chip } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, palette, radius, spacing } from '@/theme/tokens';
import { computeStreak, daysAgoKey, formatAed, formatDateKey, formatRelativeTime } from '@/utils';

type Tab = 'overview' | 'training' | 'nutrition' | 'progress';

export default function ClientProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId: coachId } = useCurrentUser();

  const user = useData((s) => s.users.find((u) => u.id === id));
  const profile = useData((s) => s.athleteProfiles.find((p) => p.userId === id));
  const plans = useData((s) => s.plans);
  const workoutLogs = useData((s) => s.workoutLogs);
  const checkins = useData((s) => s.checkins);
  const nutritionPlans = useData((s) => s.nutritionPlans);
  const mealLogs = useData((s) => s.mealLogs);
  const progressEntries = useData((s) => s.progressEntries);
  const progressPhotos = useData((s) => s.progressPhotos);
  const healthGoals = useData((s) => s.healthGoals);
  const healthGoalLogs = useData((s) => s.healthGoalLogs);
  const subscriptions = useData((s) => s.subscriptions);
  const conversations = useData((s) => s.conversations);
  const exercises = useData((s) => s.exercises);

  const addHealthGoal = useData((s) => s.addHealthGoal);
  const removeHealthGoal = useData((s) => s.removeHealthGoal);

  const [tab, setTab] = useState<Tab>('overview');
  const [goalSheet, setGoalSheet] = useState(false);
  const [goalMetric, setGoalMetric] = useState<'water' | 'steps' | 'custom'>('water');
  const [goalLabel, setGoalLabel] = useState('');
  const [goalUnit, setGoalUnit] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const plan = plans.find((p) => p.athleteId === id && p.status === 'active');
  const nutrition = nutritionPlans.find((p) => p.athleteId === id);
  const sub = subscriptions.find((s) => s.athleteId === id);
  const conversation = conversations.find((c) => c.athleteId === id && c.coachId === coachId);

  const logs = useMemo(
    () => workoutLogs.filter((l) => l.athleteId === id && l.completedAt).sort((a, b) => b.startedAt - a.startedAt),
    [workoutLogs, id]
  );
  const streak = useMemo(() => computeStreak(new Set(logs.map((l) => l.date))), [logs]);
  const myCheckins = checkins
    .filter((c) => c.athleteId === id)
    .sort((a, b) => b.createdAt - a.createdAt);
  const entries = progressEntries
    .filter((e) => e.athleteId === id)
    .sort((a, b) => a.date.localeCompare(b.date));
  const photos = progressPhotos.filter((p) => p.athleteId === id).sort((a, b) => b.date.localeCompare(a.date));
  const goals = healthGoals.filter((g) => g.athleteId === id);

  // 7-day compliance per goal
  const last7 = Array.from({ length: 7 }, (_, i) => daysAgoKey(i));
  const compliance = (goalId: string, target: number) => {
    const hit = last7.filter((d) => {
      const log = healthGoalLogs.find((l) => l.goalId === goalId && l.date === d);
      return log && log.value >= target;
    }).length;
    return hit / 7;
  };

  // 7-day adherence: completed sessions vs planned
  const plannedPerWeek = plan?.days.filter((d) => !d.isRest).length ?? 0;
  const completedLast7 = logs.filter((l) => l.date >= daysAgoKey(6)).length;

  if (!user || !profile) {
    return (
      <Screen padded={false}>
        <ScreenHeader title="Client" back />
        <EmptyState icon="person-outline" title="Client not found" />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <ScreenHeader title={user.name} back subtitle={profile.goal} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={styles.hero}>
            <Avatar name={user.name} uri={user.avatarUrl} size={56} showRing />
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <AppText variant="stat">{streak}</AppText>
                <AppText variant="micro" tone="tertiary" uppercase>
                  Streak
                </AppText>
              </View>
              <View style={styles.heroStat}>
                <AppText variant="stat">{completedLast7}/{plannedPerWeek}</AppText>
                <AppText variant="micro" tone="tertiary" uppercase>
                  This week
                </AppText>
              </View>
              <View style={styles.heroStat}>
                <AppText variant="stat">{logs.length}</AppText>
                <AppText variant="micro" tone="tertiary" uppercase>
                  Workouts
                </AppText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <Button
            label="Message"
            icon="chatbubble-outline"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => conversation && router.push(`/chat/${conversation.id}`)}
          />
          <Button
            label="Edit plan"
            icon="barbell-outline"
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => router.push(plan ? `/(coach)/plan-builder/${plan.id}` : '/(coach)/plan-builder/new')}
          />
          <Button
            label="Nutrition"
            icon="restaurant-outline"
            variant="secondary"
            size="sm"
            style={{ flex: 1 }}
            onPress={() => router.push(`/(coach)/nutrition-builder/${id}`)}
          />
        </View>

        <Segmented<Tab>
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'training', label: 'Training' },
            { value: 'nutrition', label: 'Nutrition' },
            { value: 'progress', label: 'Progress' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {/* ---------------------------------------------------------- Overview */}
        {tab === 'overview' ? (
          <Animated.View entering={FadeInDown.duration(260)} style={{ gap: spacing.sm }}>
            <Card>
              <AppText variant="micro" tone="tertiary" uppercase>
                Profile
              </AppText>
              <View style={{ marginTop: spacing.xs, gap: 6 }}>
                <View style={styles.kv}>
                  <AppText variant="captionRegular" tone="secondary">Email</AppText>
                  <AppText variant="caption">{user.email}</AppText>
                </View>
                <View style={styles.kv}>
                  <AppText variant="captionRegular" tone="secondary">Joined</AppText>
                  <AppText variant="caption">{format(user.createdAt, 'd MMM yyyy')} · via {profile.joinedVia === 'qr' ? 'QR code' : 'invite link'}</AppText>
                </View>
                {profile.heightCm ? (
                  <View style={styles.kv}>
                    <AppText variant="captionRegular" tone="secondary">Height</AppText>
                    <AppText variant="caption">{profile.heightCm} cm</AppText>
                  </View>
                ) : null}
                <View style={styles.kv}>
                  <AppText variant="captionRegular" tone="secondary">Disclaimer</AppText>
                  <AppText variant="caption" tone={profile.disclaimerAcceptedAt ? 'success' : 'danger'}>
                    {profile.disclaimerAcceptedAt ? `Accepted ${format(profile.disclaimerAcceptedAt, 'd MMM yyyy')}` : 'Not accepted'}
                  </AppText>
                </View>
              </View>
            </Card>

            {sub ? (
              <Card>
                <View style={styles.kv}>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    Subscription
                  </AppText>
                  <Badge
                    label={sub.status.replace('_', ' ')}
                    tone={sub.status === 'active' ? 'success' : sub.status === 'paused' ? 'warning' : 'danger'}
                  />
                </View>
                <AppText variant="bodySemi" style={{ marginTop: spacing.xs }}>
                  {sub.months}-month · {formatAed(sub.pricePerMonthAed)}/mo
                  {sub.studentDiscountApplied ? '  (student)' : ''}
                </AppText>
                <AppText variant="captionRegular" tone="tertiary">
                  Renews {format(sub.renewsAt, 'd MMM yyyy')}
                </AppText>
              </Card>
            ) : null}

            {/* Health goals compliance */}
            <Card>
              <View style={styles.kv}>
                <AppText variant="micro" tone="tertiary" uppercase>
                  Health goals · 7-day compliance
                </AppText>
                <Button label="Add goal" variant="ghost" size="sm" onPress={() => setGoalSheet(true)} haptic={false} />
              </View>
              {goals.length === 0 ? (
                <AppText variant="captionRegular" tone="tertiary" style={{ marginTop: spacing.xs }}>
                  No goals set yet
                </AppText>
              ) : (
                goals.map((g) => {
                  const pct = compliance(g.id, g.target);
                  return (
                    <View key={g.id} style={{ marginTop: spacing.sm }}>
                      <View style={styles.kv}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <AppText variant="caption">{g.label}</AppText>
                          <Ionicons
                            name="close-circle-outline"
                            size={15}
                            color={colors.textTertiary}
                            onPress={() => removeHealthGoal(g.id)}
                            accessibilityLabel={`Remove ${g.label} goal`}
                          />
                        </View>
                        <AppText variant="caption" tone={pct >= 0.7 ? 'success' : pct >= 0.4 ? 'warning' : 'danger'}>
                          {Math.round(pct * 100)}%
                        </AppText>
                      </View>
                      <ProgressBar
                        progress={pct}
                        height={5}
                        color={pct >= 0.7 ? colors.success : pct >= 0.4 ? colors.warning : colors.danger}
                        style={{ marginTop: 4 }}
                      />
                      <AppText variant="micro" tone="tertiary" style={{ marginTop: 2 }}>
                        Target {g.target.toLocaleString()} {g.unit}/day
                      </AppText>
                    </View>
                  );
                })
              )}
            </Card>

            {myCheckins[0] ? (
              <Card>
                <View style={styles.kv}>
                  <AppText variant="micro" tone="tertiary" uppercase>
                    Latest check-in
                  </AppText>
                  <AppText variant="micro" tone="tertiary">
                    {formatRelativeTime(myCheckins[0].createdAt)}
                  </AppText>
                </View>
                <AppText variant="captionRegular" tone="secondary" style={{ marginTop: spacing.xs }}>
                  “{myCheckins[0].journal}”
                </AppText>
                {myCheckins[0].status === 'pending' ? (
                  <Button
                    label="Review now"
                    size="sm"
                    style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
                    onPress={() => router.push('/(coach)/checkins')}
                  />
                ) : null}
              </Card>
            ) : null}
          </Animated.View>
        ) : null}

        {/* ---------------------------------------------------------- Training */}
        {tab === 'training' ? (
          <Animated.View entering={FadeInDown.duration(260)} style={{ gap: spacing.sm }}>
            {plan ? (
              <Card onPress={() => router.push(`/(coach)/plan-builder/${plan.id}`)}>
                <View style={styles.kv}>
                  <AppText variant="headline">{plan.title}</AppText>
                  <Ionicons name="create-outline" size={17} color={colors.accent} />
                </View>
                <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 3 }}>
                  {plan.description}
                </AppText>
                <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm }}>
                  <Badge label={`${plan.weeks} weeks`} tone="accent" />
                  <Badge label={`${plan.days.filter((d) => !d.isRest).length} days/week`} tone="neutral" />
                </View>
              </Card>
            ) : (
              <Card>
                <EmptyState
                  compact
                  icon="barbell-outline"
                  title="No active plan"
                  actionLabel="Build a plan"
                  onAction={() => router.push('/(coach)/plans')}
                />
              </Card>
            )}

            <SectionHeader title="Recent workouts" style={{ marginTop: 0, marginBottom: 0 }} />
            {logs.length === 0 ? (
              <Card>
                <AppText variant="captionRegular" tone="tertiary" align="center" style={{ paddingVertical: spacing.md }}>
                  No workouts logged yet
                </AppText>
              </Card>
            ) : (
              logs.slice(0, 8).map((log) => {
                const day = plans.find((p) => p.id === log.planId)?.days.find((d) => d.id === log.planDayId);
                const volume = log.exercises.reduce(
                  (a, e) => a + e.sets.reduce((x, s) => x + (s.completed ? (s.weightKg ?? 0) * (s.reps ?? 0) : 0), 0),
                  0
                );
                return (
                  <Card key={log.id} style={styles.logRow}>
                    <View style={styles.logIcon}>
                      <Ionicons name="checkmark" size={15} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodySemi">{day?.title ?? 'Workout'}</AppText>
                      <AppText variant="micro" tone="tertiary">
                        {formatDateKey(log.date)} · {Math.round((log.durationSec ?? 0) / 60)} min
                        {volume > 0 ? ` · ${(volume / 1000).toFixed(1)}t volume` : ''}
                      </AppText>
                    </View>
                    {!log.synced ? <Badge label="Offline" tone="warning" /> : null}
                    {log.feeling ? <AppText>{['😖', '😕', '🙂', '😄', '🔥'][log.feeling - 1]}</AppText> : null}
                  </Card>
                );
              })
            )}
          </Animated.View>
        ) : null}

        {/* ---------------------------------------------------------- Nutrition */}
        {tab === 'nutrition' ? (
          <Animated.View entering={FadeInDown.duration(260)} style={{ gap: spacing.sm }}>
            {nutrition ? (
              <>
                <Card onPress={() => router.push(`/(coach)/nutrition-builder/${id}`)}>
                  <View style={styles.kv}>
                    <AppText variant="headline">{nutrition.title}</AppText>
                    <Ionicons name="create-outline" size={17} color={colors.accent} />
                  </View>
                  <View style={styles.macroGrid}>
                    {[
                      { label: 'kcal', value: nutrition.targets.calories, color: colors.accent },
                      { label: 'protein', value: `${nutrition.targets.proteinG}g`, color: palette.violet400 },
                      { label: 'carbs', value: `${nutrition.targets.carbsG}g`, color: palette.cyan400 },
                      { label: 'fat', value: `${nutrition.targets.fatG}g`, color: palette.orange400 },
                    ].map((m) => (
                      <View key={m.label} style={styles.macroItem}>
                        <AppText variant="bodySemi" color={m.color}>
                          {m.value}
                        </AppText>
                        <AppText variant="micro" tone="tertiary" uppercase>
                          {m.label}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </Card>

                <SectionHeader title="Last 7 days · calories logged" style={{ marginTop: 0, marginBottom: 0 }} />
                <Card>
                  {last7.map((d) => {
                    const cals = mealLogs
                      .filter((m) => m.athleteId === id && m.date === d)
                      .reduce((a, m) => a + m.macros.calories, 0);
                    const pct = cals / nutrition.targets.calories;
                    return (
                      <View key={d} style={{ marginBottom: spacing.xs }}>
                        <View style={styles.kv}>
                          <AppText variant="micro" tone="tertiary">
                            {formatDateKey(d, 'EEE d')}
                          </AppText>
                          <AppText variant="micro" tone={cals === 0 ? 'tertiary' : pct > 1.1 ? 'warning' : 'secondary'}>
                            {cals ? `${cals} kcal` : 'not logged'}
                          </AppText>
                        </View>
                        <ProgressBar
                          progress={pct}
                          height={4}
                          color={pct > 1.1 ? colors.warning : colors.accent}
                          style={{ marginTop: 3 }}
                        />
                      </View>
                    );
                  })}
                </Card>
              </>
            ) : (
              <Card>
                <EmptyState
                  compact
                  icon="restaurant-outline"
                  title="No nutrition plan"
                  actionLabel="Create plan"
                  onAction={() => router.push(`/(coach)/nutrition-builder/${id}`)}
                />
              </Card>
            )}
          </Animated.View>
        ) : null}

        {/* ---------------------------------------------------------- Progress */}
        {tab === 'progress' ? (
          <Animated.View entering={FadeInDown.duration(260)} style={{ gap: spacing.sm }}>
            {entries.length > 1 ? (
              <Card>
                <AppText variant="micro" tone="tertiary" uppercase style={{ marginBottom: spacing.xs }}>
                  Weight trend
                </AppText>
                <LineChart
                  data={entries.map((e) => e.weightKg).filter((v): v is number => v !== undefined)}
                  formatValue={(v) => `${v.toFixed(1)}kg`}
                />
              </Card>
            ) : (
              <Card>
                <AppText variant="captionRegular" tone="tertiary" align="center" style={{ paddingVertical: spacing.md }}>
                  No weight entries yet
                </AppText>
              </Card>
            )}

            {photos.length > 0 ? (
              <>
                <SectionHeader title="Progress photos" style={{ marginTop: 0, marginBottom: 0 }} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
                  {photos.map((p) => (
                    <View key={p.id}>
                      <Image source={{ uri: p.uri }} style={styles.photo} transition={200} />
                      <AppText variant="micro" tone="tertiary" align="center" style={{ marginTop: 3 }}>
                        {formatDateKey(p.date, 'd MMM')} · {p.pose}
                      </AppText>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <SectionHeader title="Check-in history" style={{ marginTop: 0, marginBottom: 0 }} />
            {myCheckins.slice(0, 6).map((c) => (
              <Card key={c.id}>
                <View style={styles.kv}>
                  <AppText variant="caption" tone="secondary">
                    {formatDateKey(c.date)} · energy {c.energy}/10
                  </AppText>
                  <Badge label={c.status} tone={c.status === 'reviewed' ? 'success' : 'warning'} />
                </View>
                <AppText variant="captionRegular" tone="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
                  {c.journal}
                </AppText>
              </Card>
            ))}
          </Animated.View>
        ) : null}
      </View>

      {/* Health goal sheet */}
      <Sheet visible={goalSheet} onClose={() => setGoalSheet(false)} title="New health goal">
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            {(
              [
                { value: 'water', label: 'Water' },
                { value: 'steps', label: 'Steps' },
                { value: 'custom', label: 'Custom' },
              ] as const
            ).map((m) => (
              <Chip
                key={m.value}
                label={m.label}
                selected={goalMetric === m.value}
                onPress={() => {
                  setGoalMetric(m.value);
                  if (m.value === 'water') {
                    setGoalLabel('Water');
                    setGoalUnit('L');
                    setGoalTarget('3');
                  } else if (m.value === 'steps') {
                    setGoalLabel('Steps');
                    setGoalUnit('steps');
                    setGoalTarget('10000');
                  } else {
                    setGoalLabel('');
                    setGoalUnit('');
                    setGoalTarget('');
                  }
                }}
              />
            ))}
          </View>
          {goalMetric === 'custom' ? (
            <Input label="Goal name" placeholder="e.g. Mobility work" value={goalLabel} onChangeText={setGoalLabel} />
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Input
              label="Daily target"
              placeholder="0"
              keyboardType="decimal-pad"
              value={goalTarget}
              onChangeText={setGoalTarget}
              containerStyle={{ flex: 1 }}
            />
            <Input label="Unit" placeholder="min / L / reps" value={goalUnit} onChangeText={setGoalUnit} containerStyle={{ flex: 1 }} />
          </View>
          <Button
            label="Add goal"
            size="lg"
            fullWidth
            onPress={() => {
              if (!goalLabel.trim() || !goalTarget) {
                toast.error('Name the goal and set a target');
                return;
              }
              addHealthGoal({
                athleteId: id!,
                coachId: coachId!,
                metric: goalMetric,
                label: goalLabel.trim(),
                unit: goalUnit.trim() || 'x',
                target: Number(goalTarget) || 1,
              });
              setGoalSheet(false);
              toast.success('Goal added');
            }}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroStats: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  heroStat: { alignItems: 'center', gap: 2 },
  kv: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.xs,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroGrid: { flexDirection: 'row', marginTop: spacing.sm },
  macroItem: { flex: 1, alignItems: 'center', gap: 2 },
  photo: { width: 110, height: 146, borderRadius: radius.md, backgroundColor: colors.surfaceHigh },
});
