import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Booking, SessionType } from '@/types';

export const SESSION_LABELS: Record<SessionType, string> = {
  'call-15': '15-min call',
  'video-review': 'Video review',
  'full-session': 'Full session',
};

const SESSION_ICONS: Record<SessionType, keyof typeof Ionicons.glyphMap> = {
  'call-15': 'call-outline',
  'video-review': 'videocam-outline',
  'full-session': 'fitness-outline',
};

const STATUS_TONES = {
  requested: 'warning',
  confirmed: 'success',
  completed: 'neutral',
  cancelled: 'danger',
} as const;

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: (id: string) => void }) {
  const isPast = booking.startsAt < Date.now();
  return (
    <Card style={{ marginBottom: spacing.xs }}>
      <View style={styles.row}>
        <View style={styles.iconTile}>
          <Ionicons name={SESSION_ICONS[booking.type]} size={18} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodySemi">{SESSION_LABELS[booking.type]}</AppText>
          <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 1 }}>
            {format(booking.startsAt, 'EEE d MMM · h:mm a')} · {booking.durationMin} min
          </AppText>
          {booking.note ? (
            <AppText variant="captionRegular" tone="tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
              “{booking.note}”
            </AppText>
          ) : null}
        </View>
        <Badge
          label={booking.status[0]!.toUpperCase() + booking.status.slice(1)}
          tone={STATUS_TONES[booking.status]}
        />
      </View>
      {!isPast && booking.status !== 'cancelled' ? (
        <View style={styles.actions}>
          {booking.meetLink ? (
            <Button
              label="Join Google Meet"
              icon="videocam-outline"
              size="sm"
              onPress={() => Linking.openURL(booking.meetLink!)}
            />
          ) : (
            <AppText variant="captionRegular" tone="tertiary" style={{ flex: 1 }}>
              {booking.status === 'requested' ? 'Waiting for coach to confirm' : 'Meet link coming soon'}
            </AppText>
          )}
          {onCancel ? (
            <Button label="Cancel" variant="ghost" size="sm" onPress={() => onCancel(booking.id)} haptic={false} />
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

export default function BookingsScreen() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const bookings = useData((s) => s.bookings);
  const updateBookingStatus = useData((s) => s.updateBookingStatus);

  const mine = useMemo(
    () => bookings.filter((b) => b.athleteId === userId).sort((a, b) => a.startsAt - b.startsAt),
    [bookings, userId]
  );
  const upcoming = mine.filter((b) => b.startsAt > Date.now() && b.status !== 'cancelled');
  const past = mine.filter((b) => b.startsAt <= Date.now() || b.status === 'cancelled').reverse();

  return (
    <Screen padded={false}>
      <ScreenHeader
        title="Video check-ins"
        back
        right={<Button label="Book" icon="add" size="sm" onPress={() => router.push('/(athlete)/bookings/new')} />}
      />
      <View style={{ paddingHorizontal: spacing.lg }}>
        {upcoming.length === 0 && past.length === 0 ? (
          <EmptyState
            icon="videocam-outline"
            title="No sessions yet"
            message="Book a call, video review or full session with your coach — calls happen over Google Meet."
            actionLabel="Book a session"
            onAction={() => router.push('/(athlete)/bookings/new')}
          />
        ) : (
          <>
            {upcoming.length > 0 ? (
              <Animated.View entering={FadeInDown.duration(300)}>
                <SectionHeader title="Upcoming" style={{ marginTop: 0 }} />
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} onCancel={(id) => updateBookingStatus(id, 'cancelled')} />
                ))}
              </Animated.View>
            ) : (
              <Card style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                <AppText variant="captionRegular" tone="secondary">
                  Nothing scheduled — book your next session
                </AppText>
              </Card>
            )}
            {past.length > 0 ? (
              <>
                <SectionHeader title="History" />
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </>
            ) : null}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
});
