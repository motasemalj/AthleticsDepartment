import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import type { DailyCheckin, Mood } from '@/types';
import { formatDateKey, formatRelativeTime } from '@/utils';

const MOOD_EMOJI: Record<Mood, string> = { great: '🤩', good: '😄', okay: '🙂', low: '😕', rough: '😖' };

type Filter = 'pending' | 'reviewed';

export default function CheckinQueue() {
  const { userId } = useCurrentUser();
  const checkins = useData((s) => s.checkins);
  const users = useData((s) => s.users);
  const reviewCheckin = useData((s) => s.reviewCheckin);

  const [filter, setFilter] = useState<Filter>('pending');
  const [reviewing, setReviewing] = useState<DailyCheckin | null>(null);
  const [comment, setComment] = useState('');

  const mine = checkins.filter((c) => c.coachId === userId && c.status === filter);
  // Oldest first for pending — fair queue. Newest first for reviewed history.
  const sorted = [...mine].sort((a, b) =>
    filter === 'pending' ? a.createdAt - b.createdAt : (b.reviewedAt ?? 0) - (a.reviewedAt ?? 0)
  );

  const submitReview = () => {
    if (!reviewing) return;
    if (!comment.trim()) {
      toast.error('Write a comment for your athlete');
      return;
    }
    reviewCheckin(reviewing.id, comment.trim());
    setReviewing(null);
    setComment('');
    toast.success('Review sent');
  };

  return (
    <Screen padded={false} tabbed>
      <ScreenHeader title="Check-in queue" large subtitle={filter === 'pending' ? 'Oldest first — keep the queue moving' : undefined} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Segmented<Filter>
          options={[
            { value: 'pending', label: `Pending (${checkins.filter((c) => c.coachId === userId && c.status === 'pending').length})` },
            { value: 'reviewed', label: 'Reviewed' },
          ]}
          value={filter}
          onChange={setFilter}
        />

        {sorted.length === 0 ? (
          <EmptyState
            icon={filter === 'pending' ? 'checkmark-done-circle-outline' : 'file-tray-outline'}
            title={filter === 'pending' ? 'Queue clear' : 'No reviews yet'}
            message={
              filter === 'pending'
                ? 'Every check-in has been answered. Your athletes appreciate it.'
                : 'Reviewed check-ins will appear here.'
            }
          />
        ) : (
          sorted.map((c, i) => {
            const athlete = users.find((u) => u.id === c.athleteId);
            return (
              <Animated.View key={c.id} entering={FadeInDown.delay(Math.min(i * 40, 240)).duration(300)} exiting={FadeOutUp.duration(200)}>
                <Card>
                  <View style={styles.head}>
                    <Avatar name={athlete?.name ?? ''} uri={athlete?.avatarUrl} size={38} />
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodySemi">{athlete?.name}</AppText>
                      <AppText variant="micro" tone="tertiary">
                        {formatDateKey(c.date)} · submitted {formatRelativeTime(c.createdAt)}
                      </AppText>
                    </View>
                    {filter === 'pending' && i === 0 ? <Badge label="Oldest" tone="warning" /> : null}
                  </View>

                  <View style={styles.metrics}>
                    <View style={styles.metric}>
                      <AppText style={{ fontSize: 18 }}>{MOOD_EMOJI[c.mood]}</AppText>
                      <AppText variant="micro" tone="tertiary" uppercase>
                        {c.mood}
                      </AppText>
                    </View>
                    <View style={styles.metric}>
                      <AppText variant="bodySemi">{c.energy}/10</AppText>
                      <AppText variant="micro" tone="tertiary" uppercase>
                        Energy
                      </AppText>
                    </View>
                    {c.sleepHours ? (
                      <View style={styles.metric}>
                        <AppText variant="bodySemi">{c.sleepHours}h</AppText>
                        <AppText variant="micro" tone="tertiary" uppercase>
                          Sleep
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  <AppText variant="captionRegular" tone="secondary" style={{ marginTop: spacing.xs }}>
                    “{c.journal}”
                  </AppText>

                  {c.photoUri ? <Image source={{ uri: c.photoUri }} style={styles.photo} transition={200} /> : null}

                  {c.status === 'pending' ? (
                    <Button
                      label="Review & comment"
                      icon="chatbox-ellipses-outline"
                      size="sm"
                      style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
                      onPress={() => setReviewing(c)}
                    />
                  ) : (
                    <View style={styles.commentBox}>
                      <Ionicons name="chatbubble-ellipses" size={13} color={colors.accent} style={{ marginTop: 2 }} />
                      <AppText variant="captionRegular" style={{ flex: 1 }}>
                        {c.coachComment}
                      </AppText>
                    </View>
                  )}
                </Card>
              </Animated.View>
            );
          })
        )}
      </View>

      <Sheet visible={!!reviewing} onClose={() => setReviewing(null)} title="Leave a comment">
        {reviewing ? (
          <View style={{ gap: spacing.sm }}>
            <AppText variant="captionRegular" tone="secondary">
              “{reviewing.journal}”
            </AppText>
            <Input
              placeholder="Acknowledge their effort, answer questions, adjust the plan…"
              multiline
              value={comment}
              onChangeText={setComment}
              autoFocus
            />
            <Button label="Send review" size="lg" fullWidth onPress={submitReview} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  metrics: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  metric: { alignItems: 'center', gap: 2, minWidth: 52 },
  photo: { width: 96, height: 120, borderRadius: radius.sm, marginTop: spacing.sm },
  commentBox: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: colors.accentMuted,
    padding: spacing.xs,
    borderRadius: radius.xs,
  },
});
