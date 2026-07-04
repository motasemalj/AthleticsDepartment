import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/Progress';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { useOfflineSync } from '@/services/useOfflineSync';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { ExerciseLog, WorkoutLog } from '@/types';
import { dateKey, formatDuration, uid } from '@/utils';

function VideoSheet({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.play();
  });
  return (
    <Sheet visible onClose={onClose} title={title}>
      <VideoView player={player} style={styles.video} contentFit="cover" nativeControls />
      <AppText variant="captionRegular" tone="tertiary" style={{ marginTop: spacing.sm }}>
        Demo video from your coach’s library
      </AppText>
    </Sheet>
  );
}

const FEELINGS = [
  { value: 1, emoji: '😖', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '🙂', label: 'Okay' },
  { value: 4, emoji: '😄', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
] as const;

export default function WorkoutPlayer() {
  const router = useRouter();
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const { userId } = useCurrentUser();
  const { isOnline } = useOfflineSync();

  const plans = useData((s) => s.plans);
  const exercises = useData((s) => s.exercises);
  const videos = useData((s) => s.videos);
  const workoutLogs = useData((s) => s.workoutLogs);
  const saveWorkoutLog = useData((s) => s.saveWorkoutLog);

  const plan = plans.find((p) => p.days.some((d) => d.id === dayId));
  const day = plan?.days.find((d) => d.id === dayId);

  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [restLeft, setRestLeft] = useState<number | null>(null);
  const restTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [videoSheet, setVideoSheet] = useState<{ url: string; title: string } | null>(null);
  const [finishSheet, setFinishSheet] = useState(false);
  const [feeling, setFeeling] = useState<1 | 2 | 3 | 4 | 5>(4);

  // Prefill weights from the most recent log of the same plan day.
  const lastLog = useMemo(
    () =>
      workoutLogs
        .filter((l) => l.athleteId === userId && l.planDayId === dayId && l.completedAt)
        .sort((a, b) => b.startedAt - a.startedAt)[0],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [logs, setLogs] = useState<ExerciseLog[]>(() =>
    (day?.exercises ?? []).map((pe) => {
      const prev = lastLog?.exercises.find((e) => e.planExerciseId === pe.id);
      return {
        planExerciseId: pe.id,
        exerciseId: pe.exerciseId,
        sets: Array.from({ length: pe.sets }, (_, i) => ({
          setNumber: i + 1,
          weightKg: prev?.sets[i]?.weightKg ?? null,
          reps: null,
          completed: false,
        })),
      };
    })
  );

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  useEffect(
    () => () => {
      if (restTimer.current) clearInterval(restTimer.current);
    },
    []
  );

  if (!plan || !day) {
    return (
      <Screen padded={false}>
        <ScreenHeader title="Workout" back />
        <AppText variant="body" tone="secondary" style={{ paddingHorizontal: spacing.lg }}>
          This workout could not be found.
        </AppText>
      </Screen>
    );
  }

  const totalSets = logs.reduce((a, l) => a + l.sets.length, 0);
  const doneSets = logs.reduce((a, l) => a + l.sets.filter((s) => s.completed).length, 0);

  const startRest = (sec: number) => {
    if (restTimer.current) clearInterval(restTimer.current);
    if (sec <= 0) return;
    setRestLeft(sec);
    restTimer.current = setInterval(() => {
      setRestLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (restTimer.current) clearInterval(restTimer.current);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const updateSet = (exIdx: number, setIdx: number, patch: Partial<ExerciseLog['sets'][number]>) => {
    setLogs((prev) =>
      prev.map((l, i) =>
        i === exIdx
          ? { ...l, sets: l.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) }
          : l
      )
    );
  };

  const toggleSet = (exIdx: number, setIdx: number) => {
    const set = logs[exIdx]!.sets[setIdx]!;
    const completing = !set.completed;
    Haptics.impactAsync(completing ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    updateSet(exIdx, setIdx, { completed: completing });
    if (completing) {
      const rest = day.exercises[exIdx]?.restSec ?? 0;
      startRest(rest);
    }
  };

  const finish = () => {
    const log: WorkoutLog = {
      id: uid('wl'),
      athleteId: userId!,
      planId: plan.id,
      planDayId: day.id,
      date: dateKey(),
      startedAt,
      completedAt: Date.now(),
      durationSec: elapsed,
      exercises: logs,
      feeling,
      synced: isOnline,
    };
    saveWorkoutLog(log);
    setFinishSheet(false);
    toast.success(isOnline ? 'Workout saved' : 'Workout saved offline — will sync automatically');
    router.back();
  };

  return (
    <Screen padded={false} scroll={false}>
      <ScreenHeader
        title={day.title}
        subtitle={`${plan.title} · ${formatDuration(elapsed)}`}
        back
        right={!isOnline ? <Badge label="Offline" tone="warning" icon="cloud-offline-outline" /> : undefined}
      />
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
        <ProgressBar progress={totalSets ? doneSets / totalSets : 0} />
        <AppText variant="micro" tone="tertiary" style={{ marginTop: 4 }}>
          {doneSets}/{totalSets} sets complete
        </AppText>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 140 }}>
        {day.exercises.map((pe, exIdx) => {
          const exercise = exercises.find((e) => e.id === pe.exerciseId);
          const video = exercise?.videoId ? videos.find((v) => v.id === exercise.videoId) : undefined;
          const log = logs[exIdx]!;
          return (
            <Animated.View key={pe.id} entering={FadeInDown.delay(exIdx * 50).duration(300)}>
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.exHeader}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="headline">{exercise?.name ?? 'Exercise'}</AppText>
                    <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 2 }}>
                      {pe.sets} × {pe.reps}
                      {pe.tempo ? ` · tempo ${pe.tempo}` : ''} · rest {Math.round(pe.restSec / 60)}m
                    </AppText>
                  </View>
                  {video ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Watch demo video"
                      onPress={() => setVideoSheet({ url: video.url, title: video.title })}
                      style={styles.videoBtn}>
                      <Ionicons name="play-circle-outline" size={18} color={colors.accent} />
                      <AppText variant="micro" tone="accent">
                        DEMO
                      </AppText>
                    </Pressable>
                  ) : null}
                </View>
                {pe.notes ? (
                  <View style={styles.noteRow}>
                    <Ionicons name="chatbox-ellipses-outline" size={13} color={colors.violet} />
                    <AppText variant="captionRegular" tone="secondary" style={{ flex: 1 }}>
                      {pe.notes}
                    </AppText>
                  </View>
                ) : null}

                <View style={styles.setHeaderRow}>
                  <AppText variant="micro" tone="tertiary" style={{ width: 32 }}>
                    SET
                  </AppText>
                  <AppText variant="micro" tone="tertiary" style={styles.setCol}>
                    KG
                  </AppText>
                  <AppText variant="micro" tone="tertiary" style={styles.setCol}>
                    REPS
                  </AppText>
                  <View style={{ width: 40 }} />
                </View>
                {log.sets.map((set, setIdx) => (
                  <View key={setIdx} style={[styles.setRow, set.completed && styles.setRowDone]}>
                    <AppText variant="caption" tone="tertiary" style={{ width: 32 }}>
                      {set.setNumber}
                    </AppText>
                    <TextInput
                      style={styles.setInput}
                      keyboardType="decimal-pad"
                      placeholder="—"
                      placeholderTextColor={colors.textTertiary}
                      value={set.weightKg !== null ? String(set.weightKg) : ''}
                      onChangeText={(t) => updateSet(exIdx, setIdx, { weightKg: t ? Number(t.replace(',', '.')) : null })}
                      accessibilityLabel={`Set ${set.setNumber} weight`}
                    />
                    <TextInput
                      style={styles.setInput}
                      keyboardType="number-pad"
                      placeholder="—"
                      placeholderTextColor={colors.textTertiary}
                      value={set.reps !== null ? String(set.reps) : ''}
                      onChangeText={(t) => updateSet(exIdx, setIdx, { reps: t ? Number(t) : null })}
                      accessibilityLabel={`Set ${set.setNumber} reps`}
                    />
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: set.completed }}
                      onPress={() => toggleSet(exIdx, setIdx)}
                      style={[styles.setCheck, set.completed && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                      {set.completed ? <Ionicons name="checkmark" size={16} color={colors.textOnAccent} /> : null}
                    </Pressable>
                  </View>
                ))}
              </Card>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        {restLeft !== null ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.restChip}>
            <Ionicons name="timer-outline" size={16} color={colors.accent} />
            <AppText variant="bodySemi" tone="accent">
              Rest {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, '0')}
            </AppText>
            <Pressable onPress={() => setRestLeft(null)} hitSlop={8}>
              <AppText variant="micro" tone="tertiary">
                SKIP
              </AppText>
            </Pressable>
          </Animated.View>
        ) : null}
        <Button
          label={doneSets === 0 ? 'Finish workout' : `Finish · ${doneSets}/${totalSets} sets`}
          size="lg"
          fullWidth
          disabled={doneSets === 0}
          onPress={() => setFinishSheet(true)}
        />
      </View>

      {videoSheet ? <VideoSheet url={videoSheet.url} title={videoSheet.title} onClose={() => setVideoSheet(null)} /> : null}

      <Sheet visible={finishSheet} onClose={() => setFinishSheet(false)} title="How did it feel?">
        <View style={styles.feelingRow}>
          {FEELINGS.map((f) => (
            <Pressable
              key={f.value}
              accessibilityRole="button"
              accessibilityLabel={f.label}
              onPress={() => {
                Haptics.selectionAsync();
                setFeeling(f.value);
              }}
              style={[styles.feelingBtn, feeling === f.value && styles.feelingActive]}>
              <AppText style={{ fontSize: 26 }}>{f.emoji}</AppText>
              <AppText variant="micro" tone={feeling === f.value ? 'accent' : 'tertiary'}>
                {f.label}
              </AppText>
            </Pressable>
          ))}
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText variant="stat">{formatDuration(elapsed)}</AppText>
            <AppText variant="micro" tone="tertiary">
              DURATION
            </AppText>
          </View>
          <View style={styles.summaryItem}>
            <AppText variant="stat">{doneSets}</AppText>
            <AppText variant="micro" tone="tertiary">
              SETS DONE
            </AppText>
          </View>
          <View style={styles.summaryItem}>
            <AppText variant="stat">{logs.filter((l) => l.sets.some((s) => s.completed)).length}</AppText>
            <AppText variant="micro" tone="tertiary">
              EXERCISES
            </AppText>
          </View>
        </View>
        {!isOnline ? (
          <View style={styles.offlineNote}>
            <Ionicons name="cloud-offline-outline" size={15} color={colors.warning} />
            <AppText variant="captionRegular" tone="warning">
              You’re offline. This workout saves to your device and syncs automatically.
            </AppText>
          </View>
        ) : null}
        <Button label="Save workout" size="lg" fullWidth onPress={finish} style={{ marginTop: spacing.md }} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  video: { width: '100%', height: 220, borderRadius: radius.md, backgroundColor: colors.backgroundDeep },
  exHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  videoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.xs,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
    backgroundColor: colors.violetMuted,
    padding: spacing.xs,
    borderRadius: radius.xs,
  },
  setHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm, marginBottom: 4 },
  setCol: { flex: 1, textAlign: 'center' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 5,
    borderRadius: radius.xs,
  },
  setRowDone: { opacity: 0.55 },
  setInput: {
    flex: 1,
    height: 40,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceHigh,
    color: colors.text,
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    textAlign: 'center',
  },
  setCheck: {
    width: 40,
    height: 40,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.surfaceOverlay,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  restChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'center',
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  feelingRow: { flexDirection: 'row', gap: spacing.xs, justifyContent: 'space-between' },
  feelingBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  feelingActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  summaryRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  offlineNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    backgroundColor: colors.warningMuted,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
});
