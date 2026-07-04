import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, palette, radius, spacing } from '@/theme/tokens';
import type { MealTemplate, NutritionPlan } from '@/types';
import { uid } from '@/utils';

export default function NutritionBuilder() {
  const router = useRouter();
  const { athleteId } = useLocalSearchParams<{ athleteId: string }>();
  const { userId } = useCurrentUser();

  const athlete = useData((s) => s.users.find((u) => u.id === athleteId));
  const existing = useData((s) => s.nutritionPlans.find((p) => p.athleteId === athleteId));
  const saveNutritionPlan = useData((s) => s.saveNutritionPlan);

  const [plan, setPlan] = useState<NutritionPlan>(
    () =>
      existing ?? {
        id: uid('np'),
        coachId: userId!,
        athleteId: athleteId!,
        title: 'Nutrition plan',
        targets: { calories: 2200, proteinG: 160, carbsG: 220, fatG: 65 },
        meals: [],
        updatedAt: Date.now(),
      }
  );
  const [editingMeal, setEditingMeal] = useState<MealTemplate | 'new' | null>(null);

  const setTarget = (key: keyof NutritionPlan['targets'], value: string) =>
    setPlan((p) => ({ ...p, targets: { ...p.targets, [key]: Number(value) || 0 } }));

  const mealsTotal = plan.meals.reduce((a, m) => a + m.macros.calories, 0);

  const save = () => {
    if (!plan.title.trim()) {
      toast.error('Give the plan a title');
      return;
    }
    saveNutritionPlan(plan);
    toast.success(`Plan published to ${athlete?.name?.split(' ')[0] ?? 'athlete'}`);
    router.back();
  };

  return (
    <Screen padded={false} keyboardAware>
      <ScreenHeader title="Nutrition builder" back subtitle={athlete ? `for ${athlete.name}` : undefined} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Input label="Plan title" value={plan.title} onChangeText={(t) => setPlan((p) => ({ ...p, title: t }))} />

        <SectionHeader title="Daily targets" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Input
              label="Calories"
              keyboardType="number-pad"
              value={String(plan.targets.calories)}
              onChangeText={(t) => setTarget('calories', t)}
              containerStyle={{ flex: 1.2 }}
            />
            <Input
              label="Protein g"
              keyboardType="number-pad"
              value={String(plan.targets.proteinG)}
              onChangeText={(t) => setTarget('proteinG', t)}
              containerStyle={{ flex: 1 }}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }}>
            <Input
              label="Carbs g"
              keyboardType="number-pad"
              value={String(plan.targets.carbsG)}
              onChangeText={(t) => setTarget('carbsG', t)}
              containerStyle={{ flex: 1 }}
            />
            <Input
              label="Fat g"
              keyboardType="number-pad"
              value={String(plan.targets.fatG)}
              onChangeText={(t) => setTarget('fatG', t)}
              containerStyle={{ flex: 1 }}
            />
          </View>
          <View style={styles.calcRow}>
            <AppText variant="micro" tone="tertiary">
              From macros: {plan.targets.proteinG * 4 + plan.targets.carbsG * 4 + plan.targets.fatG * 9} kcal
            </AppText>
            <AppText variant="micro" tone={Math.abs(mealsTotal - plan.targets.calories) < 150 ? 'success' : 'warning'}>
              Meals total: {mealsTotal} kcal
            </AppText>
          </View>
        </Card>

        <SectionHeader
          title={`Meal plan (${plan.meals.length})`}
          action="Add meal"
          onAction={() => setEditingMeal('new')}
          style={{ marginTop: 0, marginBottom: 0 }}
        />
        {plan.meals.length === 0 ? (
          <Card style={styles.emptyMeals}>
            <AppText variant="captionRegular" tone="tertiary">
              Add meals your athlete can log with one tap
            </AppText>
          </Card>
        ) : (
          plan.meals.map((m) => (
            <Card key={m.id} style={styles.mealRow} onPress={() => setEditingMeal(m)}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodySemi">{m.name}</AppText>
                <AppText variant="captionRegular" tone="secondary" numberOfLines={1}>
                  {m.description}
                </AppText>
                <AppText variant="micro" tone="tertiary" style={{ marginTop: 2 }}>
                  {m.macros.calories} kcal · P{m.macros.proteinG} · C{m.macros.carbsG} · F{m.macros.fatG}
                </AppText>
              </View>
              <Pressable
                onPress={() => setPlan((p) => ({ ...p, meals: p.meals.filter((x) => x.id !== m.id) }))}
                hitSlop={8}
                accessibilityLabel={`Remove ${m.name}`}>
                <Ionicons name="close-circle" size={19} color={colors.textTertiary} />
              </Pressable>
            </Card>
          ))
        )}

        <Input
          label="Notes for athlete"
          placeholder="Guidance, flexible eating rules, free meals…"
          multiline
          multilineHeight={80}
          value={plan.notes ?? ''}
          onChangeText={(t) => setPlan((p) => ({ ...p, notes: t }))}
        />

        <Button label="Publish nutrition plan" size="lg" fullWidth onPress={save} />
      </View>

      <Sheet
        visible={!!editingMeal}
        onClose={() => setEditingMeal(null)}
        title={editingMeal === 'new' ? 'Add meal' : 'Edit meal'}>
        {editingMeal ? (
          <MealEditor
            key={editingMeal === 'new' ? 'new' : editingMeal.id}
            initial={editingMeal === 'new' ? undefined : editingMeal}
            onSave={(meal) => {
              setPlan((p) => ({
                ...p,
                meals:
                  editingMeal === 'new'
                    ? [...p.meals, meal]
                    : p.meals.map((m) => (m.id === meal.id ? meal : m)),
              }));
              setEditingMeal(null);
            }}
          />
        ) : null}
      </Sheet>
    </Screen>
  );
}

function MealEditor({ initial, onSave }: { initial?: MealTemplate; onSave: (m: MealTemplate) => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [cals, setCals] = useState(initial ? String(initial.macros.calories) : '');
  const [protein, setProtein] = useState(initial ? String(initial.macros.proteinG) : '');
  const [carbs, setCarbs] = useState(initial ? String(initial.macros.carbsG) : '');
  const [fat, setFat] = useState(initial ? String(initial.macros.fatG) : '');

  return (
    <View style={{ gap: spacing.sm }}>
      <Input label="Meal name" placeholder="Meal 1 — Breakfast" value={name} onChangeText={setName} />
      <Input label="Description" placeholder="What's in it?" multiline multilineHeight={70} value={description} onChangeText={setDescription} />
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <Input label="kcal" keyboardType="number-pad" value={cals} onChangeText={setCals} containerStyle={{ flex: 1 }} />
        <Input label="P (g)" keyboardType="number-pad" value={protein} onChangeText={setProtein} containerStyle={{ flex: 1 }} />
        <Input label="C (g)" keyboardType="number-pad" value={carbs} onChangeText={setCarbs} containerStyle={{ flex: 1 }} />
        <Input label="F (g)" keyboardType="number-pad" value={fat} onChangeText={setFat} containerStyle={{ flex: 1 }} />
      </View>
      <Button
        label="Save meal"
        size="lg"
        fullWidth
        onPress={() => {
          if (!name.trim() || !cals) {
            toast.error('Add a name and calories');
            return;
          }
          onSave({
            id: initial?.id ?? uid('mt'),
            name: name.trim(),
            description: description.trim(),
            macros: {
              calories: Number(cals) || 0,
              proteinG: Number(protein) || 0,
              carbsG: Number(carbs) || 0,
              fatG: Number(fat) || 0,
            },
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  emptyMeals: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
  },
  mealRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
});
