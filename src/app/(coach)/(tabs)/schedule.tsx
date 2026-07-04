import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, isToday, isTomorrow } from 'date-fns';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser, useNow } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Booking, SessionType } from '@/types';

const SESSION_LABELS: Record<SessionType, string> = {
  'call-15': '15-min call',
  'video-review': 'Video review',
  'full-session': 'Full session',
};

function dayLabel(ts: number) {
  if (isToday(ts)) return 'Today';
  if (isTomorrow(ts)) return 'Tomorrow';
  return format(ts, 'EEE d MMM');
}

export default function ScheduleTab() {
  const { userId } = useCurrentUser();
  const now = useNow();
  const bookings = useData((s) => s.bookings);
  const users = useData((s) => s.users);
  const updateBookingStatus = useData((s) => s.updateBookingStatus);
  const setBookingMeetLink = useData((s) => s.setBookingMeetLink);

  const [linkFor, setLinkFor] = useState<Booking | null>(null);
  const [link, setLink] = useState('');

  const mine = useMemo(
    () => bookings.filter((b) => b.coachId === userId).sort((a, b) => a.startsAt - b.startsAt),
    [bookings, userId]
  );
  const requests = mine.filter((b) => b.status === 'requested');
  const upcoming = mine.filter((b) => b.status === 'confirmed' && b.startsAt > now);
  const past = mine.filter((b) => b.status === 'completed' || (b.startsAt <= now && b.status === 'confirmed')).reverse();

  const athleteFor = (b: Booking) => users.find((u) => u.id === b.athleteId);

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setLink(text.trim());
  };

  const saveLink = () => {
    if (!linkFor) return;
    if (!/^https?:\/\/(meet\.google\.com|.+)/.test(link.trim())) {
      toast.error('Paste a valid meeting link');
      return;
    }
    setBookingMeetLink(linkFor.id, link.trim());
    if (linkFor.status === 'requested') updateBookingStatus(linkFor.id, 'confirmed');
    setLinkFor(null);
    setLink('');
    toast.success('Link saved & session confirmed');
  };

  return (
    <Screen padded={false} tabbed>
      <ScreenHeader title="Schedule" large subtitle="Sessions run over Google Meet" />
      <View style={{ paddingHorizontal: spacing.lg }}>
        {/* Requests */}
        {requests.length > 0 ? (
          <>
            <SectionHeader title={`Requests (${requests.length})`} style={{ marginTop: 0 }} />
            {requests.map((b, i) => {
              const athlete = athleteFor(b);
              return (
                <Animated.View key={b.id} entering={FadeInDown.delay(i * 40).duration(300)}>
                  <Card style={{ marginBottom: spacing.xs, borderColor: 'rgba(251,191,36,0.25)' }}>
                    <View style={styles.row}>
                      <Avatar name={athlete?.name ?? ''} uri={athlete?.avatarUrl} size={40} />
                      <View style={{ flex: 1 }}>
                        <AppText variant="bodySemi">{athlete?.name}</AppText>
                        <AppText variant="captionRegular" tone="secondary">
                          {SESSION_LABELS[b.type]} · {dayLabel(b.startsAt)} {format(b.startsAt, 'h:mm a')}
                        </AppText>
                        {b.note ? (
                          <AppText variant="captionRegular" tone="tertiary" numberOfLines={1}>
                            “{b.note}”
                          </AppText>
                        ) : null}
                      </View>
                    </View>
                    <View style={styles.actions}>
                      <Button
                        label="Confirm + add link"
                        icon="link-outline"
                        size="sm"
                        style={{ flex: 1 }}
                        onPress={() => {
                          setLinkFor(b);
                          setLink(b.meetLink ?? '');
                        }}
                      />
                      <Button
                        label="Decline"
                        variant="ghost"
                        size="sm"
                        onPress={() => {
                          updateBookingStatus(b.id, 'cancelled');
                          toast.info('Request declined');
                        }}
                      />
                    </View>
                  </Card>
                </Animated.View>
              );
            })}
          </>
        ) : null}

        {/* Upcoming */}
        <SectionHeader title="Upcoming" style={requests.length === 0 ? { marginTop: 0 } : undefined} />
        {upcoming.length === 0 ? (
          <EmptyState compact icon="calendar-outline" title="Nothing scheduled" message="Confirmed sessions appear here with their Meet links." />
        ) : (
          upcoming.map((b) => {
            const athlete = athleteFor(b);
            return (
              <Card key={b.id} style={{ marginBottom: spacing.xs }}>
                <View style={styles.row}>
                  <View style={styles.timeBlock}>
                    <AppText variant="micro" tone="tertiary" uppercase>
                      {dayLabel(b.startsAt)}
                    </AppText>
                    <AppText variant="bodySemi">{format(b.startsAt, 'h:mm a')}</AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySemi">{athlete?.name}</AppText>
                    <AppText variant="captionRegular" tone="secondary">
                      {SESSION_LABELS[b.type]} · {b.durationMin} min
                    </AppText>
                  </View>
                  <Badge label="Confirmed" tone="success" />
                </View>
                <View style={styles.actions}>
                  {b.meetLink ? (
                    <>
                      <Button label="Join" icon="videocam-outline" size="sm" onPress={() => Linking.openURL(b.meetLink!)} />
                      <Button
                        label="Edit link"
                        variant="secondary"
                        size="sm"
                        onPress={() => {
                          setLinkFor(b);
                          setLink(b.meetLink ?? '');
                        }}
                      />
                    </>
                  ) : (
                    <Button
                      label="Paste Meet link"
                      icon="link-outline"
                      variant="secondary"
                      size="sm"
                      onPress={() => {
                        setLinkFor(b);
                        setLink('');
                      }}
                    />
                  )}
                  <Button
                    label="Done"
                    variant="ghost"
                    size="sm"
                    onPress={() => updateBookingStatus(b.id, 'completed')}
                  />
                </View>
              </Card>
            );
          })
        )}

        {/* Past */}
        {past.length > 0 ? (
          <>
            <SectionHeader title="Past" />
            {past.slice(0, 8).map((b) => {
              const athlete = athleteFor(b);
              return (
                <Card key={b.id} style={[styles.row, { marginBottom: spacing.xs, opacity: 0.75 }]}>
                  <Avatar name={athlete?.name ?? ''} uri={athlete?.avatarUrl} size={34} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="caption">{athlete?.name}</AppText>
                    <AppText variant="micro" tone="tertiary">
                      {SESSION_LABELS[b.type]} · {format(b.startsAt, 'd MMM, h:mm a')}
                    </AppText>
                  </View>
                  <Ionicons name="checkmark-done-outline" size={16} color={colors.textTertiary} />
                </Card>
              );
            })}
          </>
        ) : null}
      </View>

      {/* Link sheet */}
      <Sheet visible={!!linkFor} onClose={() => setLinkFor(null)} title="Google Meet link">
        <AppText variant="captionRegular" tone="secondary">
          Create a meeting at meet.google.com, copy the link, and paste it here. Your athlete gets a
          notification with a Join button.
        </AppText>
        <Input
          icon="link-outline"
          placeholder="https://meet.google.com/xxx-xxxx-xxx"
          autoCapitalize="none"
          value={link}
          onChangeText={setLink}
          containerStyle={{ marginTop: spacing.md }}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <Button label="Paste" icon="clipboard-outline" variant="secondary" onPress={pasteFromClipboard} />
          <Button label="Save & confirm" style={{ flex: 1 }} onPress={saveLink} />
        </View>
        <Button
          label="Open Google Meet"
          variant="ghost"
          size="sm"
          style={{ marginTop: spacing.xs }}
          onPress={() => Linking.openURL('https://meet.google.com/new')}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  timeBlock: {
    width: 76,
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    gap: 1,
  },
});
