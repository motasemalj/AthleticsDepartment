import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ProgressBar, ProgressRing } from '@/components/ui/Progress';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, palette, radius, spacing } from '@/theme/tokens';
import { dateKey } from '@/utils';

const MACROS = [
  { key: 'proteinG', label: 'Protein', color: palette.violet400, unit: 'g' },
  { key: 'carbsG', label: 'Carbs', color: palette.cyan400, unit: 'g' },
  { key: 'fatG', label: 'Fat', color: palette.orange400, unit: 'g' },
] as const;

export default function NutritionTab() {
  const { userId } = useCurrentUser();
  const nutritionPlans = useData((s) => s.nutritionPlans);
  const mealLogs = useData((s) => s.mealLogs);
  const logMeal = useData((s) => s.logMeal);
  const removeMealLog = useData((s) => s.removeMealLog);

  const [customSheet, setCustomSheet] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCals, setCustomCals] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');

  const plan = nutritionPlans.find((p) => p.athleteId === userId);
  const todayKey = dateKey();
  const todayLogs = mealLogs.filter((m) => m.athleteId === userId && m.date === todayKey);

  if (!plan) {
    return (
      <Screen padded={false}>
        <ScreenHeader title="Nutrition" large />
        <EmptyState
          icon="restaurant-outline"
          title="No nutrition plan yet"
          message="Your coach hasn't assigned macro targets yet. You'll be notified when your plan is ready."
        />
      </Screen>
    );
  }

  const totals = todayLogs.reduce(
    (acc, m) => ({
      calories: acc.calories + m.macros.calories,
      proteinG: acc.proteinG + m.macros.proteinG,
      carbsG: acc.carbsG + m.macros.carbsG,
      fatG: acc.fatG + m.macros.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  const loggedTemplateIds = new Set(todayLogs.map((m) => m.mealTemplateId).filter(Boolean));

  const logCustom = () => {
    if (!customName.trim() || !customCals) {
      toast.error('Give the meal a name and calories');
      return;
    }
    logMeal({
      athleteId: userId!,
      date: todayKey,
      name: customName.trim(),
      macros: {
        calories: Number(customCals) || 0,
        proteinG: Number(customProtein) || 0,
        carbsG: Number(customCarbs) || 0,
        fatG: Number(customFat) || 0,
      },
    });
    setCustomSheet(false);
    setCustomName('');
    setCustomCals('');
    setCustomProtein('');
    setCustomCarbs('');
    setCustomFat('');
    toast.success('Meal logged');
  };

  return (
    <Screen padded={false}>
      <ScreenHeader title="Nutrition" large subtitle={plan.title} />
      <View style={{ paddingHorizontal: spacing.lg }}>
        {/* Macro summary */}
        <Animated.View entering={FadeInDown.duration(320)}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <ProgressRing
                progress={totals.calories / plan.targets.calories}
                size={104}
                strokeWidth={10}
                color={totals.calories > plan.targets.calories * 1.05 ? colors.warning : colors.accent}
                label={`${totals.calories}`}
                sublabel={`of ${plan.targets.calories}`}
              />
              <View style={{ flex: 1, gap: spacing.sm }}>
                {MACROS.map((m) => (
                  <View key={m.key}>
                    <View style={styles.macroRow}>
                      <AppText variant="caption" tone="secondary">
                        {m.label}
                      </AppText>
                      <AppText variant="caption">
                        {totals[m.key]}
                        <AppText variant="caption" tone="tertiary">
                          {' '}
                          / {plan.targets[m.key]}
                          {m.unit}
                        </AppText>
                      </AppText>
                    </View>
                    <ProgressBar progress={totals[m.key] / plan.targets[m.key]} color={m.color} height={5} style={{ marginTop: 3 }} />
                  </View>
                ))}
              </View>
            </View>
          </Card>
        </Animated.View>

        {plan.notes ? (
          <Animated.View entering={FadeInDown.delay(60).duration(320)}>
            <Card style={{ marginTop: spacing.sm, flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
              <Ionicons name="bulb-outline" size={16} color={colors.warning} style={{ marginTop: 1 }} />
              <AppText variant="captionRegular" tone="secondary" style={{ flex: 1 }}>
                {plan.notes}
              </AppText>
            </Card>
          </Animated.View>
        ) : null}

        {/* Plan meals */}
        <SectionHeader title="Today's meals" action="Custom meal" onAction={() => setCustomSheet(true)} />
        {plan.meals.map((meal, i) => {
          const logged = loggedTemplateIds.has(meal.id);
          const logEntry = todayLogs.find((m) => m.mealTemplateId === meal.id);
          return (
            <Animated.View key={meal.id} entering={FadeInDown.delay(i * 40).duration(300)}>
              <Card style={[styles.mealCard, logged && { borderColor: colors.accentBorder }]}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi">{meal.name}</AppText>
                  <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 2 }}>
                    {meal.description}
                  </AppText>
                  <AppText variant="micro" tone="tertiary" style={{ marginTop: 4 }}>
                    {meal.macros.calories} kcal · P{meal.macros.proteinG} · C{meal.macros.carbsG} · F{meal.macros.fatG}
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={logged ? `Unlog ${meal.name}` : `Log ${meal.name}`}
                  onPress={() => {
                    if (logged && logEntry) {
                      removeMealLog(logEntry.id);
                    } else {
                      logMeal({
                        athleteId: userId!,
                        date: todayKey,
                        mealTemplateId: meal.id,
                        name: meal.name,
                        macros: meal.macros,
                      });
                      toast.success(`${meal.name} logged`);
                    }
                  }}
                  style={[styles.logBtn, logged && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                  <Ionicons
                    name={logged ? 'checkmark' : 'add'}
                    size={18}
                    color={logged ? colors.textOnAccent : colors.accent}
                  />
                </Pressable>
              </Card>
            </Animated.View>
          );
        })}

        {/* Extra logged meals */}
        {todayLogs.filter((m) => !m.mealTemplateId).length > 0 ? (
          <>
            <SectionHeader title="Extras" />
            {todayLogs
              .filter((m) => !m.mealTemplateId)
              .map((m) => (
                <Card key={m.id} style={styles.mealCard}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySemi">{m.name}</AppText>
                    <AppText variant="micro" tone="tertiary" style={{ marginTop: 2 }}>
                      {m.macros.calories} kcal · P{m.macros.proteinG} · C{m.macros.carbsG} · F{m.macros.fatG}
                    </AppText>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${m.name}`}
                    onPress={() => removeMealLog(m.id)}
                    style={styles.logBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                </Card>
              ))}
          </>
        ) : null}
      </View>

      {/* Custom meal sheet */}
      <Sheet visible={customSheet} onClose={() => setCustomSheet(false)} title="Log a custom meal">
        <View style={{ gap: spacing.sm }}>
          <Input label="Meal name" placeholder="e.g. Protein smoothie" value={customName} onChangeText={setCustomName} />
          <Input label="Calories" placeholder="kcal" keyboardType="number-pad" value={customCals} onChangeText={setCustomCals} />
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Input label="Protein (g)" placeholder="0" keyboardType="number-pad" value={customProtein} onChangeText={setCustomProtein} containerStyle={{ flex: 1 }} />
            <Input label="Carbs (g)" placeholder="0" keyboardType="number-pad" value={customCarbs} onChangeText={setCustomCarbs} containerStyle={{ flex: 1 }} />
            <Input label="Fat (g)" placeholder="0" keyboardType="number-pad" value={customFat} onChangeText={setCustomFat} containerStyle={{ flex: 1 }} />
          </View>
          <Button label="Log meal" size="lg" fullWidth onPress={logCustom} style={{ marginTop: spacing.xs }} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  logBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
