import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format } from 'date-fns';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { colors, radius, spacing } from '@/theme/tokens';
import { formatAed } from '@/utils';

export default function AdminCoachDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const profile = useData((s) => s.coachProfiles.find((c) => c.userId === id));
  const user = useData((s) => s.users.find((u) => u.id === id));
  const athleteProfiles = useData((s) => s.athleteProfiles);
  const payments = useData((s) => s.payments);
  const approveCoach = useData((s) => s.approveCoach);
  const rejectCoach = useData((s) => s.rejectCoach);
  const suspendCoach = useData((s) => s.suspendCoach);
  const updateCoachProfile = useData((s) => s.updateCoachProfile);

  const [approveSheet, setApproveSheet] = useState(false);
  const [commission, setCommission] = useState(profile?.commissionPct || 25);

  if (!profile || !user) {
    return (
      <Screen padded={false}>
        <ScreenHeader title="Coach" back />
        <EmptyState icon="person-outline" title="Coach not found" />
      </Screen>
    );
  }

  const clients = athleteProfiles.filter((p) => p.coachId === id).length;
  const paid = payments.filter((p) => p.coachId === id && p.status === 'paid');
  const gross = paid.reduce((a, p) => a + p.amountAed, 0);
  const commissionEarned = paid.reduce((a, p) => a + p.commissionAed, 0);

  return (
    <Screen padded={false}>
      <ScreenHeader title={user.name} back subtitle={`Applied ${format(profile.appliedAt, 'd MMM yyyy')}`} />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={styles.hero}>
            <Avatar name={user.name} uri={user.avatarUrl} size={56} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <AppText variant="headline">{user.name}</AppText>
                {profile.isOwner ? <Badge label="Owner" tone="violet" /> : null}
              </View>
              <AppText variant="captionRegular" tone="secondary">
                {profile.yearsExperience} yrs experience · {user.email}
              </AppText>
              <View style={{ flexDirection: 'row', gap: spacing.xxs, marginTop: spacing.xs, flexWrap: 'wrap' }}>
                {profile.specialties.map((s) => (
                  <Badge key={s} label={s} tone="neutral" />
                ))}
              </View>
            </View>
          </Card>
        </Animated.View>

        <Card>
          <AppText variant="micro" tone="tertiary" uppercase>
            Bio
          </AppText>
          <AppText variant="captionRegular" tone="secondary" style={{ marginTop: spacing.xs }}>
            {profile.bio}
          </AppText>
        </Card>

        {profile.status === 'approved' ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Card style={styles.stat}>
              <AppText variant="stat">{clients}</AppText>
              <AppText variant="micro" tone="tertiary" uppercase>
                Clients
              </AppText>
            </Card>
            <Card style={styles.stat}>
              <AppText variant="stat">{formatAed(gross, { compact: true })}</AppText>
              <AppText variant="micro" tone="tertiary" uppercase>
                Gross
              </AppText>
            </Card>
            <Card style={styles.stat}>
              <AppText variant="stat">{profile.commissionPct}%</AppText>
              <AppText variant="micro" tone="tertiary" uppercase>
                Commission
              </AppText>
            </Card>
          </View>
        ) : null}

        <SectionHeader title="Certifications" style={{ marginTop: 0, marginBottom: 0 }} />
        {profile.certifications.map((cert) => (
          <Card key={cert.id} style={styles.certRow}>
            <View style={styles.certIcon}>
              <Ionicons name="document-text-outline" size={18} color={colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodySemi">{cert.name}</AppText>
              <AppText variant="micro" tone="tertiary">
                {cert.fileName} · uploaded {format(cert.uploadedAt, 'd MMM yyyy')}
              </AppText>
            </View>
            <Badge
              label={cert.verified ? 'Verified' : 'Unverified'}
              tone={cert.verified ? 'success' : 'warning'}
              icon={cert.verified ? 'checkmark-circle' : 'time-outline'}
            />
          </Card>
        ))}

        <SectionHeader title="Pricing" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card>
          {profile.pricing.map((t, i) => (
            <View key={t.months} style={[styles.priceRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <AppText variant="caption" tone="secondary">
                {t.months} months
              </AppText>
              <AppText variant="caption">{formatAed(t.pricePerMonthAed)}/mo</AppText>
            </View>
          ))}
          <View style={[styles.priceRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
            <AppText variant="caption" tone="secondary">
              Student discount
            </AppText>
            <AppText variant="caption">{profile.studentDiscountPct}%</AppText>
          </View>
        </Card>

        {/* Actions */}
        {profile.status === 'pending' ? (
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              label="Reject"
              variant="danger"
              style={{ flex: 1 }}
              onPress={() => {
                rejectCoach(id!);
                toast.info('Application rejected');
                router.back();
              }}
            />
            <Button label="Approve…" style={{ flex: 1.5 }} icon="shield-checkmark-outline" onPress={() => setApproveSheet(true)} />
          </View>
        ) : profile.status === 'approved' && !profile.isOwner ? (
          <View style={{ gap: spacing.sm }}>
            <Button label="Adjust commission" variant="secondary" fullWidth onPress={() => setApproveSheet(true)} />
            <Button
              label="Suspend coach"
              variant="danger"
              fullWidth
              onPress={() => {
                suspendCoach(id!);
                toast.info('Coach suspended');
              }}
            />
          </View>
        ) : profile.status === 'suspended' ? (
          <Button
            label="Reinstate coach"
            fullWidth
            onPress={() => {
              updateCoachProfile(id!, { status: 'approved' });
              toast.success('Coach reinstated');
            }}
          />
        ) : null}
      </View>

      {/* Approve / commission sheet */}
      <Sheet
        visible={approveSheet}
        onClose={() => setApproveSheet(false)}
        title={profile.status === 'pending' ? 'Approve coach' : 'Adjust commission'}>
        <View style={{ gap: spacing.md }}>
          <View style={styles.commissionHead}>
            <AppText variant="body" tone="secondary">
              Platform commission
            </AppText>
            <AppText variant="display" tone="accent">
              {commission}%
            </AppText>
          </View>
          <Slider
            minimumValue={0}
            maximumValue={50}
            step={5}
            value={commission}
            onValueChange={setCommission}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.surfaceHigh}
            thumbTintColor={colors.accent}
            accessibilityLabel="Commission percentage"
          />
          <AppText variant="captionRegular" tone="tertiary">
            On a {formatAed(1000)} subscription, the platform keeps {formatAed((1000 * commission) / 100)} and the
            coach receives {formatAed(1000 - (1000 * commission) / 100)} per month.
          </AppText>
          <Button
            label={profile.status === 'pending' ? 'Approve & verify certifications' : 'Save commission'}
            size="lg"
            fullWidth
            onPress={() => {
              if (profile.status === 'pending') {
                approveCoach(id!, commission);
                toast.success(`${user.name} approved`);
              } else {
                updateCoachProfile(id!, { commissionPct: commission });
                toast.success('Commission updated');
              }
              setApproveSheet(false);
            }}
          />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  certIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.infoMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  commissionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
