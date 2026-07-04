import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Mood } from '@/types';
import { dateKey, formatDateKey } from '@/utils';

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great', emoji: '🤩', label: 'Great' },
  { value: 'good', emoji: '😄', label: 'Good' },
  { value: 'okay', emoji: '🙂', label: 'Okay' },
  { value: 'low', emoji: '😕', label: 'Low' },
  { value: 'rough', emoji: '😖', label: 'Rough' },
];

export default function CheckinScreen() {
  const router = useRouter();
  const { userId, athleteProfile } = useCurrentUser();
  const checkins = useData((s) => s.checkins);
  const submitCheckin = useData((s) => s.submitCheckin);

  const todayKey = dateKey();
  const todayCheckin = checkins.find((c) => c.athleteId === userId && c.date === todayKey);
  const history = checkins
    .filter((c) => c.athleteId === userId && c.date !== todayKey)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 14);

  const [mood, setMood] = useState<Mood>('good');
  const [energy, setEnergy] = useState(7);
  const [sleep, setSleep] = useState(7);
  const [journal, setJournal] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const submit = () => {
    if (!journal.trim()) {
      setError('Write a short journal entry — your coach reads every one.');
      return;
    }
    submitCheckin({
      athleteId: userId!,
      coachId: athleteProfile!.coachId,
      date: todayKey,
      mood,
      energy,
      sleepHours: sleep,
      journal: journal.trim(),
      photoUri,
    });
    toast.success('Check-in sent to your coach');
    router.back();
  };

  return (
    <Screen keyboardAware padded={false}>
      <ScreenHeader title="Daily check-in" back subtitle={formatDateKey(todayKey, 'EEEE, d MMMM')} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {todayCheckin ? (
          <Animated.View entering={FadeInDown.duration(320)} style={{ gap: spacing.md }}>
            <Card style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xl }}>
              <Ionicons name="checkmark-circle" size={36} color={colors.success} />
              <AppText variant="headline">Checked in for today</AppText>
              <AppText variant="captionRegular" tone="secondary" align="center">
                {todayCheckin.status === 'reviewed'
                  ? 'Your coach has reviewed it — see their comment below.'
                  : 'Your coach will review it soon.'}
              </AppText>
            </Card>
            {todayCheckin.coachComment ? (
              <Card style={{ backgroundColor: colors.accentMuted, borderColor: colors.accentBorder }}>
                <AppText variant="micro" tone="accent" uppercase>
                  Coach comment
                </AppText>
                <AppText variant="body" style={{ marginTop: 4 }}>
                  {todayCheckin.coachComment}
                </AppText>
              </Card>
            ) : null}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(320)} style={{ gap: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              <AppText variant="caption" tone="secondary">
                Mood
              </AppText>
              <View style={styles.moodRow}>
                {MOODS.map((m) => (
                  <Pressable
                    key={m.value}
                    accessibilityRole="button"
                    accessibilityLabel={m.label}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMood(m.value);
                    }}
                    style={[styles.moodBtn, mood === m.value && styles.moodActive]}>
                    <AppText style={{ fontSize: 24 }}>{m.emoji}</AppText>
                    <AppText variant="micro" tone={mood === m.value ? 'accent' : 'tertiary'}>
                      {m.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            <Card>
              <View style={styles.sliderHeader}>
                <AppText variant="caption" tone="secondary">
                  Energy
                </AppText>
                <AppText variant="bodySemi" tone="accent">
                  {energy}/10
                </AppText>
              </View>
              <Slider
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={energy}
                onValueChange={setEnergy}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.surfaceHigh}
                thumbTintColor={colors.accent}
                accessibilityLabel="Energy rating"
              />
            </Card>

            <Card>
              <View style={styles.sliderHeader}>
                <AppText variant="caption" tone="secondary">
                  Sleep last night
                </AppText>
                <AppText variant="bodySemi" tone="accent">
                  {sleep}h
                </AppText>
              </View>
              <Slider
                minimumValue={3}
                maximumValue={12}
                step={0.5}
                value={sleep}
                onValueChange={setSleep}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.surfaceHigh}
                thumbTintColor={colors.accent}
                accessibilityLabel="Sleep hours"
              />
            </Card>

            <Input
              label="Journal"
              placeholder="How did training go? Appetite, stress, anything your coach should know…"
              multiline
              value={journal}
              onChangeText={(t) => {
                setJournal(t);
                if (error) setError(undefined);
              }}
              error={error}
            />

            <Pressable onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Add photo">
              {photoUri ? (
                <View>
                  <Image source={{ uri: photoUri }} style={styles.photo} transition={200} />
                  <Pressable style={styles.removePhoto} onPress={() => setPhotoUri(undefined)} hitSlop={8}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <Card style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
                  <AppText variant="caption" tone="secondary">
                    Add an optional photo
                  </AppText>
                </Card>
              )}
            </Pressable>

            <Button label="Send to coach" size="lg" fullWidth onPress={submit} />
          </Animated.View>
        )}

        {history.length > 0 ? (
          <View>
            <SectionHeader title="Previous check-ins" />
            {history.map((c) => (
              <Card key={c.id} style={{ marginBottom: spacing.xs }}>
                <View style={styles.historyHeader}>
                  <AppText variant="caption" tone="secondary">
                    {formatDateKey(c.date)} · {MOODS.find((m) => m.value === c.mood)?.emoji} · energy {c.energy}/10
                  </AppText>
                  <Badge
                    label={c.status === 'reviewed' ? 'Reviewed' : 'Pending'}
                    tone={c.status === 'reviewed' ? 'success' : 'warning'}
                  />
                </View>
                <AppText variant="captionRegular" tone="secondary" numberOfLines={2} style={{ marginTop: 4 }}>
                  {c.journal}
                </AppText>
                {c.coachComment ? (
                  <View style={styles.commentBox}>
                    <Ionicons name="chatbubble-ellipses" size={12} color={colors.accent} />
                    <AppText variant="captionRegular" style={{ flex: 1 }}>
                      {c.coachComment}
                    </AppText>
                  </View>
                ) : null}
              </Card>
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  moodRow: { flexDirection: 'row', gap: spacing.xs },
  moodBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  moodActive: { borderColor: colors.accent, backgroundColor: colors.accentMuted },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  photo: { width: '100%', height: 200, borderRadius: radius.md },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  commentBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.xs,
    backgroundColor: colors.accentMuted,
    padding: spacing.xs,
    borderRadius: radius.xs,
  },
});
