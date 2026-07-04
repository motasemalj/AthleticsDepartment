import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Chip } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import type { ProgressPhoto } from '@/types';
import { formatDateKey } from '@/utils';

type Pose = 'front' | 'side' | 'back';

function PhotoRail({
  photos,
  selectedId,
  onSelect,
  label,
}: {
  photos: ProgressPhoto[];
  selectedId?: string;
  onSelect: (p: ProgressPhoto) => void;
  label: string;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="micro" tone="tertiary" uppercase>
        {label}
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
        {photos.map((p) => (
          <Pressable key={p.id} onPress={() => onSelect(p)} accessibilityRole="imagebutton">
            <Image
              source={{ uri: p.uri }}
              style={[styles.thumb, selectedId === p.id && styles.thumbActive]}
              transition={150}
            />
            <AppText variant="micro" tone={selectedId === p.id ? 'accent' : 'tertiary'} align="center" style={{ marginTop: 3 }}>
              {formatDateKey(p.date, 'd MMM')}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function CompareScreen() {
  const { userId } = useCurrentUser();
  const progressPhotos = useData((s) => s.progressPhotos);
  const progressEntries = useData((s) => s.progressEntries);

  const [pose, setPose] = useState<Pose>('front');

  const photos = useMemo(
    () =>
      progressPhotos
        .filter((p) => p.athleteId === userId && p.pose === pose)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [progressPhotos, userId, pose]
  );

  const [beforeId, setBeforeId] = useState<string | undefined>();
  const [afterId, setAfterId] = useState<string | undefined>();

  const before = photos.find((p) => p.id === beforeId) ?? photos[0];
  const after = photos.find((p) => p.id === afterId) ?? photos[photos.length - 1];

  const weightFor = (date: string) =>
    progressEntries
      .filter((e) => e.athleteId === userId && e.weightKg && e.date <= date)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.weightKg;

  if (photos.length < 2) {
    return (
      <Screen padded={false}>
        <ScreenHeader title="Before / after" back />
        <View style={{ paddingHorizontal: spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md }}>
            {(['front', 'side', 'back'] as Pose[]).map((p) => (
              <Chip key={p} label={p[0]!.toUpperCase() + p.slice(1)} selected={pose === p} onPress={() => setPose(p)} />
            ))}
          </View>
          <EmptyState
            icon="git-compare-outline"
            title="Need at least 2 photos"
            message={`Add two or more ${pose} photos to compare your transformation side by side.`}
          />
        </View>
      </Screen>
    );
  }

  const beforeWeight = before ? weightFor(before.date) : undefined;
  const afterWeight = after ? weightFor(after.date) : undefined;
  const delta = beforeWeight && afterWeight ? afterWeight - beforeWeight : undefined;

  return (
    <Screen padded={false}>
      <ScreenHeader title="Before / after" back />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {(['front', 'side', 'back'] as Pose[]).map((p) => (
            <Chip key={p} label={p[0]!.toUpperCase() + p.slice(1)} selected={pose === p} onPress={() => setPose(p)} />
          ))}
        </View>

        <Animated.View entering={FadeInDown.duration(320)} style={styles.compareRow}>
          {[
            { photo: before, tag: 'BEFORE', weight: beforeWeight },
            { photo: after, tag: 'AFTER', weight: afterWeight },
          ].map(({ photo, tag, weight }) => (
            <View key={tag} style={{ flex: 1 }}>
              {photo ? (
                <>
                  <Image source={{ uri: photo.uri }} style={styles.compareImg} transition={200} />
                  <View style={styles.compareTag}>
                    <AppText variant="micro" color="#fff">
                      {tag}
                    </AppText>
                  </View>
                  <View style={{ alignItems: 'center', marginTop: spacing.xs, gap: 1 }}>
                    <AppText variant="caption">{formatDateKey(photo.date, 'd MMM yyyy')}</AppText>
                    {weight ? (
                      <AppText variant="micro" tone="tertiary">
                        {weight} kg
                      </AppText>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>
          ))}
        </Animated.View>

        {delta !== undefined ? (
          <Card style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
            <AppText variant="bodySemi" tone={delta <= 0 ? 'success' : 'warning'}>
              {delta > 0 ? '+' : ''}
              {delta.toFixed(1)} kg between photos
            </AppText>
          </Card>
        ) : null}

        <PhotoRail photos={photos} selectedId={before?.id} onSelect={(p) => setBeforeId(p.id)} label="Choose before" />
        <PhotoRail photos={photos} selectedId={after?.id} onSelect={(p) => setAfterId(p.id)} label="Choose after" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  compareRow: { flexDirection: 'row', gap: spacing.sm },
  compareImg: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.lg, backgroundColor: colors.surfaceHigh },
  compareTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  thumb: { width: 64, height: 84, borderRadius: radius.sm, backgroundColor: colors.surfaceHigh },
  thumbActive: { borderWidth: 2, borderColor: colors.accent },
});
