import React, { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeInDown } from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, palette, radius, spacing } from '@/theme/tokens';
import type { Invite } from '@/types';
import { formatRelativeTime } from '@/utils';

const inviteLink = (token: string) => `https://join.athleticsdept.ae/join/${token}`;

export default function InvitesScreen() {
  const { userId, user } = useCurrentUser();
  const invites = useData((s) => s.invites.filter((i) => i.coachId === userId));
  const users = useData((s) => s.users);
  const createInvite = useData((s) => s.createInvite);
  const revokeInvite = useData((s) => s.revokeInvite);

  const active = invites.filter((i) => !i.usedBy && !i.revoked);
  const used = invites.filter((i) => i.usedBy);
  const [featured, setFeatured] = useState<Invite | undefined>(active[0]);

  const current = featured && active.some((i) => i.id === featured.id) ? featured : active[0];

  const copy = async (token: string) => {
    await Clipboard.setStringAsync(inviteLink(token));
    toast.success('Invite link copied');
  };

  const share = async (token: string) => {
    await Share.share({
      message: `${user?.name ?? 'Your coach'} invited you to train on Athletics Department. Join here: ${inviteLink(token)}`,
    });
  };

  return (
    <Screen padded={false}>
      <ScreenHeader
        title="Invite athletes"
        back
        subtitle="Invite-only keeps your roster private"
        right={
          <Button
            label="New invite"
            icon="add"
            size="sm"
            onPress={() => {
              const invite = createInvite(userId!);
              setFeatured(invite);
              toast.success('Invite created');
            }}
          />
        }
      />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {current ? (
          <Animated.View entering={FadeInDown.duration(320)}>
            <Card style={styles.qrCard}>
              <View style={styles.qrWrap}>
                <QRCode
                  value={`athleticsdept://join/${current.token}`}
                  size={168}
                  backgroundColor="transparent"
                  color={palette.ink50}
                />
              </View>
              <AppText variant="title" style={{ letterSpacing: 2, marginTop: spacing.md }}>
                {current.token}
              </AppText>
              <AppText variant="captionRegular" tone="tertiary" align="center" style={{ marginTop: 2 }}>
                Athletes scan this QR or open your link to join your roster instantly.
              </AppText>
              <View style={styles.qrActions}>
                <Button label="Copy link" icon="copy-outline" variant="secondary" size="sm" style={{ flex: 1 }} onPress={() => copy(current.token)} />
                <Button label="Share" icon="share-outline" size="sm" style={{ flex: 1 }} onPress={() => share(current.token)} />
              </View>
            </Card>
          </Animated.View>
        ) : (
          <Card style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm }}>
            <Ionicons name="qr-code-outline" size={28} color={colors.accent} />
            <AppText variant="bodySemi">No active invites</AppText>
            <Button
              label="Create invite"
              size="sm"
              onPress={() => {
                const invite = createInvite(userId!);
                setFeatured(invite);
              }}
            />
          </Card>
        )}

        {active.length > 1 ? (
          <>
            <SectionHeader title="Other active invites" style={{ marginBottom: 0, marginTop: 0 }} />
            {active
              .filter((i) => i.id !== current?.id)
              .map((i) => (
                <Card key={i.id} style={styles.inviteRow}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySemi" style={{ letterSpacing: 1 }}>
                      {i.token}
                    </AppText>
                    <AppText variant="micro" tone="tertiary">
                      Created {formatRelativeTime(i.createdAt)}
                    </AppText>
                  </View>
                  <Button label="Show QR" variant="secondary" size="sm" onPress={() => setFeatured(i)} />
                  <Button
                    label="Revoke"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      revokeInvite(i.id);
                      toast.info('Invite revoked');
                    }}
                  />
                </Card>
              ))}
          </>
        ) : null}

        {used.length > 0 ? (
          <>
            <SectionHeader title="Accepted" style={{ marginBottom: 0, marginTop: 0 }} />
            {used.map((i) => {
              const athlete = users.find((u) => u.id === i.usedBy);
              return (
                <Card key={i.id} style={styles.inviteRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <AppText variant="bodySemi">{athlete?.name ?? 'Athlete'}</AppText>
                    <AppText variant="micro" tone="tertiary">
                      Joined with {i.token}
                      {i.usedAt ? ` · ${formatRelativeTime(i.usedAt)}` : ''}
                    </AppText>
                  </View>
                  <Badge label="Joined" tone="success" />
                </Card>
              );
            })}
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrCard: { alignItems: 'center', paddingVertical: spacing.xl },
  qrWrap: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  qrActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignSelf: 'stretch' },
  inviteRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
