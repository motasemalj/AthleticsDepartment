import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatRelativeTime } from '@/utils';

export default function PlansTab() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const plans = useData((s) => s.plans.filter((p) => p.coachId === userId));
  const users = useData((s) => s.users);
  const videos = useData((s) => s.videos.filter((v) => v.coachId === userId));
  const exercises = useData((s) => s.exercises);

  const assigned = plans.filter((p) => p.athleteId);
  const templates = plans.filter((p) => !p.athleteId);

  return (
    <Screen padded={false}>
      <ScreenHeader
        title="Plans"
        large
        right={<Button label="New plan" icon="add" size="sm" onPress={() => router.push('/(coach)/plan-builder/new')} />}
      />
      <View style={{ paddingHorizontal: spacing.lg }}>
        {/* Library shortcuts */}
        <Animated.View entering={FadeInDown.duration(300)} style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Card style={styles.shortcut} onPress={() => router.push('/(coach)/library')}>
            <View style={[styles.shortcutIcon, { backgroundColor: colors.violetMuted }]}>
              <Ionicons name="film-outline" size={18} color={colors.violet} />
            </View>
            <AppText variant="bodySemi">{videos.length}</AppText>
            <AppText variant="micro" tone="tertiary" uppercase>
              Demo videos
            </AppText>
          </Card>
          <Card style={styles.shortcut}>
            <View style={[styles.shortcutIcon, { backgroundColor: colors.accentMuted }]}>
              <Ionicons name="barbell-outline" size={18} color={colors.accent} />
            </View>
            <AppText variant="bodySemi">{exercises.length}</AppText>
            <AppText variant="micro" tone="tertiary" uppercase>
              Exercises
            </AppText>
          </Card>
        </Animated.View>

        <SectionHeader title="Assigned plans" />
        {assigned.length === 0 ? (
          <Card>
            <EmptyState compact icon="barbell-outline" title="No assigned plans" message="Build a plan and assign it to a client." />
          </Card>
        ) : (
          assigned.map((p, i) => {
            const athlete = users.find((u) => u.id === p.athleteId);
            return (
              <Animated.View key={p.id} entering={FadeInDown.delay(Math.min(i * 40, 200)).duration(300)}>
                <Card style={styles.planRow} onPress={() => router.push(`/(coach)/plan-builder/${p.id}`)}>
                  <Avatar name={athlete?.name ?? '?'} uri={athlete?.avatarUrl} size={40} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySemi">{p.title}</AppText>
                    <AppText variant="micro" tone="tertiary">
                      {athlete?.name} · {p.days.filter((d) => !d.isRest).length} days/week · updated {formatRelativeTime(p.updatedAt)}
                    </AppText>
                  </View>
                  <Badge label={p.status} tone={p.status === 'active' ? 'success' : 'neutral'} />
                </Card>
              </Animated.View>
            );
          })
        )}

        <SectionHeader title="Templates" />
        {templates.length === 0 ? (
          <Card>
            <AppText variant="captionRegular" tone="tertiary" align="center" style={{ paddingVertical: spacing.md }}>
              Save unassigned plans as reusable templates
            </AppText>
          </Card>
        ) : (
          templates.map((p) => (
            <Card key={p.id} style={styles.planRow} onPress={() => router.push(`/(coach)/plan-builder/${p.id}`)}>
              <View style={styles.templateIcon}>
                <Ionicons name="copy-outline" size={17} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodySemi">{p.title}</AppText>
                <AppText variant="micro" tone="tertiary">
                  {p.days.filter((d) => !d.isRest).length} days/week · {p.weeks} weeks
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  shortcut: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: spacing.md },
  shortcutIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
