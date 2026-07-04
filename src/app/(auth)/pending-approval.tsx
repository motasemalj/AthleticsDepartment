import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';
import { colors, radius, spacing } from '@/theme/tokens';

export default function PendingApproval() {
  const router = useRouter();
  const { userId, signOut } = useSession();
  const profile = useData((s) => s.coachProfiles.find((c) => c.userId === userId));

  const rejected = profile?.status === 'rejected';
  const approved = profile?.status === 'approved';

  return (
    <Screen scroll={false}>
      <View style={styles.center}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', gap: spacing.md }}>
          <View style={[styles.iconWrap, rejected && { backgroundColor: colors.dangerMuted }]}>
            <Ionicons
              name={approved ? 'checkmark-circle-outline' : rejected ? 'close-circle-outline' : 'hourglass-outline'}
              size={34}
              color={approved ? colors.success : rejected ? colors.danger : colors.accent}
            />
          </View>
          <AppText variant="display" align="center">
            {approved ? 'You’re approved!' : rejected ? 'Application declined' : 'Application received'}
          </AppText>
          <AppText variant="body" tone="secondary" align="center" style={{ maxWidth: 300 }}>
            {approved
              ? 'Your coach dashboard is ready. Set your pricing and invite your first athletes.'
              : rejected
                ? 'This application wasn’t approved. You can reach out to support for details and reapply.'
                : 'Our team is reviewing your certifications. Most applications are reviewed within 48 hours — we’ll notify you the moment you’re approved.'}
          </AppText>

          {!approved && !rejected ? (
            <Card style={{ width: '100%', gap: spacing.sm }}>
              <View style={styles.stepRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <AppText variant="caption" tone="secondary">Application submitted</AppText>
              </View>
              <View style={styles.stepRow}>
                <Ionicons name="ellipse-outline" size={18} color={colors.warning} />
                <AppText variant="caption" tone="secondary">Certification review in progress</AppText>
              </View>
              <View style={styles.stepRow}>
                <Ionicons name="ellipse-outline" size={18} color={colors.textTertiary} />
                <AppText variant="caption" tone="tertiary">Commission & pricing setup</AppText>
              </View>
            </Card>
          ) : null}

          {approved ? (
            <Button label="Open coach dashboard" size="lg" fullWidth onPress={() => router.replace('/(coach)')} />
          ) : null}
          <Button
            label="Sign out"
            variant="ghost"
            onPress={() => {
              signOut();
              router.replace('/(auth)/welcome');
            }}
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', paddingBottom: spacing.huge },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
