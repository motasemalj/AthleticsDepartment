import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { SortableList } from '@/components/SortableList';
import { Badge, Chip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import type { MuscleGroup, PlanDay, PlanExercise, TrainingPlan } from '@/types';
import { uid } from '@/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MUSCLE_GROUPS: (MuscleGroup | 'all')[] = ['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core', 'full-body', 'cardio'];

function emptyPlan(coachId: string): TrainingPlan {
  return {
    id: uid('plan'),
    coachId,
    title: '',
    description: '',
    weeks: 4,
    status: 'draft',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    days: Array.from({ length: 7 }, (_, i) => ({
      id: uid('pd'),
      title: i === 5 || i === 6 ? 'Rest' : `Day ${i + 1}`,
      dayIndex: i,
      isRest: i === 5 || i === 6,
      exercises: [] as PlanExercise[],
    })),
  };
}

export default function PlanBuilder() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useCurrentUser();

  const plans = useData((s) => s.plans);
  const exercises = useData((s) => s.exercises);
  const athleteProfiles = useData((s) => s.athleteProfiles);
  const users = useData((s) => s.users);
  const savePlan = useData((s) => s.savePlan);
  const deletePlan = useData((s) => s.deletePlan);

  const existing = plans.find((p) => p.id === id);
  const [plan, setPlan] = useState<TrainingPlan>(() => existing ?? emptyPlan(userId!));
  const [dayIndex, setDayIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingEx, setEditingEx] = useState<PlanExercise | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all');

  const day = plan.days.find((d) => d.dayIndex === dayIndex)!;
  const myClients = athleteProfiles.filter((p) => p.coachId === userId);
  const assignee = plan.athleteId ? users.find((u) => u.id === plan.athleteId) : undefined;

  const filteredExercises = useMemo(
    () =>
      exercises.filter(
        (e) =>
          (muscle === 'all' || e.muscleGroup === muscle) &&
          (!search.trim() || e.name.toLowerCase().includes(search.trim().toLowerCase()))
      ),
    [exercises, muscle, search]
  );

  const updateDay = (patch: Partial<PlanDay>) =>
    setPlan((p) => ({
      ...p,
      days: p.days.map((d) => (d.dayIndex === dayIndex ? { ...d, ...patch } : d)),
    }));

  const addExercise = (exerciseId: string) => {
    const pe: PlanExercise = { id: uid('pe'), exerciseId, sets: 3, reps: '8-10', restSec: 90 };
    updateDay({ exercises: [...day.exercises, pe], isRest: false });
    setPickerOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const updateExercise = (peId: string, patch: Partial<PlanExercise>) =>
    updateDay({ exercises: day.exercises.map((e) => (e.id === peId ? { ...e, ...patch } : e)) });

  const removeExercise = (peId: string) =>
    updateDay({ exercises: day.exercises.filter((e) => e.id !== peId) });

  const save = (status?: TrainingPlan['status']) => {
    if (!plan.title.trim()) {
      toast.error('Give the plan a title');
      return;
    }
    const next = { ...plan, status: status ?? plan.status };
    savePlan(next);
    setPlan(next);
    toast.success(status === 'active' ? 'Plan published to athlete' : 'Plan saved');
    if (status === 'active') router.back();
  };

  return (
    <Screen padded={false} keyboardAware>
      <ScreenHeader
        title={existing ? 'Edit plan' : 'New plan'}
        back
        right={
          existing ? (
            <Pressable
              onPress={() => {
                deletePlan(plan.id);
                toast.info('Plan deleted');
                router.back();
              }}
              hitSlop={8}
              accessibilityLabel="Delete plan">
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          ) : undefined
        }
      />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Input label="Plan title" placeholder="e.g. Lean Build — Phase 1" value={plan.title} onChangeText={(t) => setPlan((p) => ({ ...p, title: t }))} />
        <Input
          label="Description"
          placeholder="What's the focus of this block?"
          multiline
          multilineHeight={70}
          value={plan.description}
          onChangeText={(t) => setPlan((p) => ({ ...p, description: t }))}
        />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Card style={{ flex: 1 }} onPress={() => setAssignOpen(true)}>
            <AppText variant="micro" tone="tertiary" uppercase>
              Assigned to
            </AppText>
            <AppText variant="bodySemi" style={{ marginTop: 3 }} numberOfLines={1}>
              {assignee?.name ?? 'Template (nobody)'}
            </AppText>
          </Card>
          <Card style={{ width: 110 }}>
            <AppText variant="micro" tone="tertiary" uppercase>
              Weeks
            </AppText>
            <View style={styles.weeksRow}>
              <Pressable onPress={() => setPlan((p) => ({ ...p, weeks: Math.max(1, p.weeks - 1) }))} hitSlop={8} accessibilityLabel="Fewer weeks">
                <Ionicons name="remove-circle-outline" size={20} color={colors.textSecondary} />
              </Pressable>
              <AppText variant="bodySemi">{plan.weeks}</AppText>
              <Pressable onPress={() => setPlan((p) => ({ ...p, weeks: Math.min(24, p.weeks + 1) }))} hitSlop={8} accessibilityLabel="More weeks">
                <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              </Pressable>
            </View>
          </Card>
        </View>

        {/* Day selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {plan.days
            .slice()
            .sort((a, b) => a.dayIndex - b.dayIndex)
            .map((d) => {
              const selected = d.dayIndex === dayIndex;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDayIndex(d.dayIndex);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  style={[styles.dayChip, selected && { backgroundColor: colors.accent }]}>
                  <AppText variant="micro" color={selected ? colors.textOnAccent : colors.textTertiary} uppercase>
                    {WEEKDAYS[d.dayIndex]}
                  </AppText>
                  {d.isRest ? (
                    <Ionicons name="moon-outline" size={13} color={selected ? colors.textOnAccent : colors.textTertiary} />
                  ) : (
                    <AppText variant="caption" color={selected ? colors.textOnAccent : colors.text}>
                      {d.exercises.length}
                    </AppText>
                  )}
                </Pressable>
              );
            })}
        </ScrollView>

        {/* Day editor */}
        <Card>
          <View style={styles.dayHeader}>
            <Input
              placeholder="Day title (e.g. Push A)"
              value={day.title}
              onChangeText={(t) => updateDay({ title: t })}
              containerStyle={{ flex: 1 }}
            />
            <Chip
              label={day.isRest ? 'Rest day' : 'Training'}
              icon={day.isRest ? 'moon-outline' : 'barbell-outline'}
              selected={!day.isRest}
              onPress={() => updateDay({ isRest: !day.isRest })}
            />
          </View>

          {!day.isRest ? (
            <>
              {day.exercises.length === 0 ? (
                <View style={styles.emptyDay}>
                  <AppText variant="captionRegular" tone="tertiary">
                    No exercises yet — add from your library
                  </AppText>
                </View>
              ) : (
                <>
                  <AppText variant="micro" tone="tertiary" style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
                    HOLD THE HANDLE TO DRAG & REORDER
                  </AppText>
                  <SortableList
                    data={day.exercises}
                    keyExtractor={(e) => e.id}
                    rowHeight={74}
                    onReorder={(next) => updateDay({ exercises: next })}
                    renderItem={(pe) => {
                      const ex = exercises.find((e) => e.id === pe.exerciseId);
                      return (
                        <Pressable onPress={() => setEditingEx(pe)} style={styles.exRow} accessibilityRole="button">
                          <View style={styles.exIcon}>
                            <Ionicons name="barbell-outline" size={15} color={colors.accent} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <AppText variant="bodySemi" numberOfLines={1}>
                              {ex?.name ?? 'Exercise'}
                            </AppText>
                            <AppText variant="micro" tone="tertiary">
                              {pe.sets} × {pe.reps} · rest {Math.round(pe.restSec / 60 * 10) / 10}m
                              {ex?.videoId ? ' · 🎬 demo' : ''}
                            </AppText>
                          </View>
                          <Pressable onPress={() => removeExercise(pe.id)} hitSlop={8} accessibilityLabel="Remove exercise">
                            <Ionicons name="close-circle" size={19} color={colors.textTertiary} />
                          </Pressable>
                        </Pressable>
                      );
                    }}
                  />
                </>
              )}
              <Button
                label="Add exercise"
                icon="add"
                variant="secondary"
                size="sm"
                style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
                onPress={() => setPickerOpen(true)}
              />
            </>
          ) : (
            <AppText variant="captionRegular" tone="tertiary" style={{ marginTop: spacing.sm }}>
              Rest day — athletes see a recovery card instead of a workout.
            </AppText>
          )}
        </Card>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button label="Save draft" variant="secondary" style={{ flex: 1 }} onPress={() => save()} />
          <Button
            label={plan.athleteId ? 'Publish to athlete' : 'Save template'}
            style={{ flex: 1.4 }}
            onPress={() => save(plan.athleteId ? 'active' : 'draft')}
          />
        </View>
      </View>

      {/* Exercise picker */}
      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)} title="Exercise library">
        <Input icon="search-outline" placeholder="Search exercises" value={search} onChangeText={setSearch} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingVertical: spacing.sm }}>
          {MUSCLE_GROUPS.map((m) => (
            <Chip key={m} label={m === 'all' ? 'All' : m} selected={muscle === m} onPress={() => setMuscle(m)} />
          ))}
        </ScrollView>
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {filteredExercises.map((e) => (
            <Pressable key={e.id} onPress={() => addExercise(e.id)} style={styles.pickerRow} accessibilityRole="button">
              <View style={{ flex: 1 }}>
                <AppText variant="bodySemi">{e.name}</AppText>
                <AppText variant="micro" tone="tertiary">
                  {e.muscleGroup} · {e.equipment}
                  {e.videoId ? ' · 🎬 demo attached' : ''}
                </AppText>
              </View>
              <Ionicons name="add-circle" size={22} color={colors.accent} />
            </Pressable>
          ))}
          {filteredExercises.length === 0 ? (
            <AppText variant="captionRegular" tone="tertiary" align="center" style={{ paddingVertical: spacing.lg }}>
              No exercises match
            </AppText>
          ) : null}
        </ScrollView>
      </Sheet>

      {/* Exercise editor */}
      <Sheet visible={!!editingEx} onClose={() => setEditingEx(null)} title={exercises.find((e) => e.id === editingEx?.exerciseId)?.name}>
        {editingEx ? (
          <EditExercise
            key={editingEx.id}
            initial={day.exercises.find((e) => e.id === editingEx.id) ?? editingEx}
            onSave={(patch) => {
              updateExercise(editingEx.id, patch);
              setEditingEx(null);
            }}
          />
        ) : null}
      </Sheet>

      {/* Assignee picker */}
      <Sheet visible={assignOpen} onClose={() => setAssignOpen(false)} title="Assign plan">
        <ScrollView style={{ maxHeight: 400 }}>
          <Pressable
            style={styles.pickerRow}
            onPress={() => {
              setPlan((p) => ({ ...p, athleteId: undefined }));
              setAssignOpen(false);
            }}>
            <View style={{ flex: 1 }}>
              <AppText variant="bodySemi">Template</AppText>
              <AppText variant="micro" tone="tertiary">
                Keep unassigned for reuse
              </AppText>
            </View>
            {!plan.athleteId ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}
          </Pressable>
          {myClients.map((c) => {
            const u = users.find((x) => x.id === c.userId);
            return (
              <Pressable
                key={c.userId}
                style={styles.pickerRow}
                onPress={() => {
                  setPlan((p) => ({ ...p, athleteId: c.userId }));
                  setAssignOpen(false);
                }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi">{u?.name}</AppText>
                  <AppText variant="micro" tone="tertiary" numberOfLines={1}>
                    {c.goal}
                  </AppText>
                </View>
                {plan.athleteId === c.userId ? <Ionicons name="checkmark-circle" size={20} color={colors.accent} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}

function EditExercise({
  initial,
  onSave,
}: {
  initial: PlanExercise;
  onSave: (patch: Partial<PlanExercise>) => void;
}) {
  const [sets, setSets] = useState(initial.sets);
  const [reps, setReps] = useState(initial.reps);
  const [rest, setRest] = useState(String(initial.restSec));
  const [notes, setNotes] = useState(initial.notes ?? '');
  const [tempo, setTempo] = useState(initial.tempo ?? '');

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <AppText variant="caption" tone="secondary">
          Sets
        </AppText>
        <View style={styles.weeksRow}>
          <Pressable onPress={() => setSets((s) => Math.max(1, s - 1))} hitSlop={8} accessibilityLabel="Fewer sets">
            <Ionicons name="remove-circle-outline" size={24} color={colors.textSecondary} />
          </Pressable>
          <AppText variant="title" style={{ minWidth: 34, textAlign: 'center' }}>
            {sets}
          </AppText>
          <Pressable onPress={() => setSets((s) => Math.min(10, s + 1))} hitSlop={8} accessibilityLabel="More sets">
            <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
          </Pressable>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <Input label="Reps" placeholder="8-10 / AMRAP" value={reps} onChangeText={setReps} containerStyle={{ flex: 1 }} />
        <Input label="Rest (sec)" placeholder="90" keyboardType="number-pad" value={rest} onChangeText={setRest} containerStyle={{ flex: 1 }} />
        <Input label="Tempo" placeholder="31X1" value={tempo} onChangeText={setTempo} containerStyle={{ flex: 1 }} />
      </View>
      <Input label="Coach note" placeholder="Cue or instruction for the athlete" value={notes} onChangeText={setNotes} />
      <Button
        label="Save exercise"
        size="lg"
        fullWidth
        onPress={() =>
          onSave({
            sets,
            reps: reps || '8-10',
            restSec: Number(rest) || 90,
            notes: notes.trim() || undefined,
            tempo: tempo.trim() || undefined,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  weeksRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 3 },
  dayChip: {
    width: 56,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 2,
  },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  emptyDay: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    padding: spacing.sm,
    height: 66,
  },
  exIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.xs,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
