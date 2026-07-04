import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Button } from '@/components/ui/Button';
import { AppText } from '@/components/ui/Text';
import { DEMO_ACCOUNTS, useSession } from '@/services/session';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Role } from '@/types';

const DEMO_ROLES: { role: Role; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { role: 'athlete', label: 'Athlete', icon: 'barbell-outline' },
  { role: 'coach', label: 'Coach', icon: 'clipboard-outline' },
  { role: 'admin', label: 'Admin', icon: 'shield-checkmark-outline' },
];

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const signIn = useSession((s) => s.signIn);

  const enterDemo = (role: Role) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    signIn(DEMO_ACCOUNTS[role], role);
    router.replace('/');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(198,243,59,0.14)', 'rgba(139,92,246,0.06)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.7 }}
      />
      <View style={[styles.content, { paddingTop: insets.top + spacing.huge, paddingBottom: insets.bottom + spacing.xl }]}>
        <Animated.View entering={FadeInDown.duration(500)} style={{ gap: spacing.md }}>
          <View style={styles.logoMark}>
            <Ionicons name="flash" size={26} color={colors.textOnAccent} />
          </View>
          <AppText variant="hero">
            Athletics{'\n'}Department
          </AppText>
          <AppText variant="body" tone="secondary" style={{ maxWidth: 300 }}>
            Personal coaching, training and nutrition — built around you, wherever you train.
          </AppText>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={{ gap: spacing.sm }}>
          <Button
            label="I have a coach invite"
            icon="qr-code-outline"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/invite')}
          />
          <Button
            label="Sign in"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => router.push('/(auth)/sign-in')}
          />
          <Pressable
            onPress={() => router.push('/(auth)/coach-apply')}
            hitSlop={8}
            accessibilityRole="button"
            style={{ alignSelf: 'center', paddingVertical: spacing.sm }}>
            <AppText variant="caption" tone="secondary">
              Are you a coach? <AppText variant="caption" tone="accent">Apply to join</AppText>
            </AppText>
          </Pressable>

          <View style={styles.demoCard}>
            <AppText variant="micro" tone="tertiary" uppercase style={{ marginBottom: spacing.xs }}>
              Explore the demo
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {DEMO_ROLES.map((d) => (
                <Pressable
                  key={d.role}
                  accessibilityRole="button"
                  accessibilityLabel={`Enter demo as ${d.label}`}
                  onPress={() => enterDemo(d.role)}
                  style={({ pressed }) => [styles.demoBtn, pressed && { opacity: 0.7 }]}>
                  <Ionicons name={d.icon} size={18} color={colors.accent} />
                  <AppText variant="caption">{d.label}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, paddingHorizontal: spacing.xl },
  logoMark: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderFaint,
    padding: spacing.md,
  },
  demoBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
  },
});
