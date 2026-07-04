import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { addDays, format, setHours, setMinutes, startOfDay } from 'date-fns';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import type { SessionType } from '@/types';

const TYPES: { value: SessionType; label: string; duration: number; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  { value: 'call-15', label: '15-min call', duration: 15, icon: 'call-outline', desc: 'Quick chat about training, nutrition or plateaus' },
  { value: 'video-review', label: 'Video review', duration: 30, icon: 'videocam-outline', desc: 'Coach reviews your lift technique live' },
  { value: 'full-session', label: 'Full session', duration: 60, icon: 'fitness-outline', desc: 'Guided 1-on-1 training session over video' },
];

const SLOT_HOURS = [8, 9, 10, 12, 14, 16, 17, 18, 19];

export default function NewBooking() {
  const router = useRouter();
  const { userId, athleteProfile, coach } = useCurrentUser();
  const createBooking = useData((s) => s.createBooking);
  const bookings = useData((s) => s.bookings);

  const [type, setType] = useState<SessionType>('call-15');
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const days = useMemo(() => Array.from({ length: 10 }, (_, i) => addDays(startOfDay(new Date()), i + 1)), []);
  const selectedDay = days[dayOffset - 1] ?? days[0]!;

  const takenHours = useMemo(() => {
    const dayStart = selectedDay.getTime();
    const dayEnd = dayStart + 86_400_000;
    return new Set(
      bookings
        .filter((b) => b.coachId === athleteProfile?.coachId && b.status !== 'cancelled' && b.startsAt >= dayStart && b.startsAt < dayEnd)
        .map((b) => new Date(b.startsAt).getHours())
    );
  }, [bookings, selectedDay, athleteProfile?.coachId]);

  const submit = () => {
    if (hour === null) {
      toast.error('Pick a time slot');
      return;
    }
    const cfg = TYPES.find((t) => t.value === type)!;
    createBooking({
      athleteId: userId!,
      coachId: athleteProfile!.coachId,
      type,
      startsAt: setMinutes(setHours(selectedDay, hour), 0).getTime(),
      durationMin: cfg.duration,
      note: note.trim() || undefined,
    });
    toast.success('Session requested — your coach will confirm');
    router.back();
  };

  return (
    <Screen keyboardAware padded={false}>
      <ScreenHeader title="Book a session" back subtitle={coach ? `with ${coach.name}` : undefined} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
        {/* Type */}
        <Animated.View entering={FadeInDown.duration(280)} style={{ gap: spacing.xs }}>
          {TYPES.map((t) => (
            <Pressable
              key={t.value}
              accessibilityRole="radio"
              accessibilityState={{ selected: type === t.value }}
              onPress={() => {
                Haptics.selectionAsync();
                setType(t.value);
              }}>
              <Card style={[styles.typeCard, type === t.value && { borderColor: colors.accent, borderWidth: 1.5 }]}>
                <View style={[styles.typeIcon, type === t.value && { backgroundColor: colors.accent }]}>
                  <Ionicons name={t.icon} size={18} color={type === t.value ? colors.textOnAccent : colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi">{t.label}</AppText>
                  <AppText variant="captionRegular" tone="secondary">
                    {t.desc}
                  </AppText>
                </View>
                <AppText variant="caption" tone="tertiary">
                  {t.duration}m
                </AppText>
              </Card>
            </Pressable>
          ))}
        </Animated.View>

        {/* Day picker */}
        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" tone="secondary">
            Pick a day
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
            {days.map((d, i) => {
              const selected = i + 1 === dayOffset;
              return (
                <Pressable
                  key={d.toISOString()}
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDayOffset(i + 1);
                    setHour(null);
                  }}
                  style={[styles.dayChip, selected && { backgroundColor: colors.accent }]}>
                  <AppText variant="micro" color={selected ? colors.textOnAccent : colors.textTertiary} uppercase>
                    {format(d, 'EEE')}
                  </AppText>
                  <AppText variant="bodySemi" color={selected ? colors.textOnAccent : colors.text}>
                    {format(d, 'd')}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Time slots */}
        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" tone="secondary">
            Available times · {format(selectedDay, 'EEEE d MMM')}
          </AppText>
          <View style={styles.slotGrid}>
            {SLOT_HOURS.map((h) => {
              const taken = takenHours.has(h);
              const selected = hour === h;
              return (
                <Pressable
                  key={h}
                  disabled={taken}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: taken }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setHour(h);
                  }}
                  style={[
                    styles.slot,
                    selected && { backgroundColor: colors.accent, borderColor: colors.accent },
                    taken && { opacity: 0.35 },
                  ]}>
                  <AppText variant="caption" color={selected ? colors.textOnAccent : colors.text}>
                    {format(setHours(selectedDay, h), 'h:mm a')}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input
          label="Note for your coach (optional)"
          placeholder="What would you like to cover?"
          value={note}
          onChangeText={setNote}
        />

        <View style={styles.meetNote}>
          <Ionicons name="logo-google" size={14} color={colors.textTertiary} />
          <AppText variant="captionRegular" tone="tertiary" style={{ flex: 1 }}>
            Sessions happen over Google Meet. Your coach attaches the link when they confirm.
          </AppText>
        </View>

        <Button label="Request session" size="lg" fullWidth onPress={submit} disabled={hour === null} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  typeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChip: {
    width: 54,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 2,
  },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  slot: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  meetNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
