import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { LineChart } from '@/components/charts/LineChart';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, palette, radius, spacing } from '@/theme/tokens';
import { formatDateKey } from '@/utils';

type Range = '4w' | '12w' | 'all';

export default function ProgressTab() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const progressEntries = useData((s) => s.progressEntries);
  const progressPhotos = useData((s) => s.progressPhotos);

  const [range, setRange] = useState<Range>('12w');

  const entries = useMemo(
    () =>
      progressEntries
        .filter((e) => e.athleteId === userId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [progressEntries, userId]
  );
  const photos = useMemo(
    () => progressPhotos.filter((p) => p.athleteId === userId).sort((a, b) => b.date.localeCompare(a.date)),
    [progressPhotos, userId]
  );

  const cutoff = range === '4w' ? 4 : range === '12w' ? 12 : 0;
  const visible = cutoff ? entries.slice(-cutoff) : entries;

  const weights = visible.map((e) => e.weightKg).filter((v): v is number => v !== undefined);
  const bodyFats = visible.map((e) => e.bodyFatPct).filter((v): v is number => v !== undefined);
  const latest = entries[entries.length - 1];
  const first = entries[0];
  const weightDelta = latest?.weightKg && first?.weightKg ? latest.weightKg - first.weightKg : 0;
  const bfDelta = latest?.bodyFatPct && first?.bodyFatPct ? latest.bodyFatPct - first.bodyFatPct : 0;
  const latestMeasure = [...entries].reverse().find((e) => e.measurements)?.measurements;

  if (entries.length === 0 && photos.length === 0) {
    return (
      <Screen padded={false} tabbed>
        <ScreenHeader title="Progress" large />
        <EmptyState
          icon="trending-up-outline"
          title="Start tracking"
          message="Log your first weigh-in or progress photo to see your transformation over time."
          actionLabel="Add entry"
          onAction={() => router.push('/(athlete)/add-progress')}
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false} tabbed>
      <ScreenHeader
        title="Progress"
        large
        right={
          <Button label="Add" icon="add" size="sm" onPress={() => router.push('/(athlete)/add-progress')} />
        }
      />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Animated.View entering={FadeInDown.duration(320)} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <StatCard
            icon="scale-outline"
            label="Weight"
            value={latest?.weightKg ? `${latest.weightKg} kg` : '—'}
            delta={weightDelta ? `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} kg` : undefined}
            deltaPositive={weightDelta <= 0}
          />
          <StatCard
            icon="body-outline"
            iconColor={colors.violet}
            iconBg={colors.violetMuted}
            label="Body fat"
            value={latest?.bodyFatPct ? `${latest.bodyFatPct}%` : '—'}
            delta={bfDelta ? `${bfDelta > 0 ? '+' : ''}${bfDelta.toFixed(1)}%` : undefined}
            deltaPositive={bfDelta <= 0}
          />
        </Animated.View>

        <SectionHeader title="Weight trend" />
        <Animated.View entering={FadeInDown.delay(60).duration(320)}>
          <Card>
            <Segmented<Range>
              options={[
                { value: '4w', label: '4 weeks' },
                { value: '12w', label: '12 weeks' },
                { value: 'all', label: 'All time' },
              ]}
              value={range}
              onChange={setRange}
            />
            <View style={{ marginTop: spacing.md }}>
              <LineChart
                data={weights}
                formatValue={(v) => `${v.toFixed(1)}kg`}
                labels={
                  visible.length > 1
                    ? [formatDateKey(visible[0]!.date, 'd MMM'), formatDateKey(visible[visible.length - 1]!.date, 'd MMM')]
                    : undefined
                }
              />
            </View>
          </Card>
        </Animated.View>

        {bodyFats.length > 1 ? (
          <>
            <SectionHeader title="Body fat trend" />
            <Card>
              <LineChart data={bodyFats} color={palette.violet400} formatValue={(v) => `${v.toFixed(1)}%`} height={110} />
            </Card>
          </>
        ) : null}

        {latestMeasure ? (
          <>
            <SectionHeader title="Measurements" />
            <Card>
              <View style={styles.measureGrid}>
                {Object.entries(latestMeasure).map(([k, v]) => (
                  <View key={k} style={styles.measureItem}>
                    <AppText variant="bodySemi">{v} cm</AppText>
                    <AppText variant="micro" tone="tertiary" uppercase>
                      {k}
                    </AppText>
                  </View>
                ))}
              </View>
            </Card>
          </>
        ) : null}

        <SectionHeader
          title="Progress photos"
          action={photos.length >= 2 ? 'Compare' : undefined}
          onAction={() => router.push('/(athlete)/compare')}
        />
        {photos.length === 0 ? (
          <Card>
            <EmptyState
              compact
              icon="images-outline"
              title="No photos yet"
              message="Photos are private — only you and your coach can see them."
              actionLabel="Add photo"
              onAction={() => router.push('/(athlete)/add-progress')}
            />
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
            {photos.map((p) => (
              <Pressable key={p.id} onPress={() => router.push('/(athlete)/compare')} accessibilityRole="imagebutton">
                <Image source={{ uri: p.uri }} style={styles.photo} transition={200} />
                <View style={styles.photoLabel}>
                  <AppText variant="micro" color="#fff">
                    {formatDateKey(p.date, 'd MMM')} · {p.pose}
                  </AppText>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {photos.length >= 2 ? (
          <Button
            label="Before / after comparison"
            icon="git-compare-outline"
            variant="secondary"
            fullWidth
            style={{ marginTop: spacing.md }}
            onPress={() => router.push('/(athlete)/compare')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  measureItem: { width: '33.33%', alignItems: 'center', paddingVertical: spacing.xs, gap: 2 },
  photo: { width: 118, height: 158, borderRadius: radius.md, backgroundColor: colors.surfaceHigh },
  photoLabel: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
});
