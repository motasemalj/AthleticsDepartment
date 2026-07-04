import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';
import { colors, radius, spacing } from '@/theme/tokens';

function CheckRow({
  checked,
  onToggle,
  title,
  body,
}: {
  checked: boolean;
  onToggle: () => void;
  title: string;
  body: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => {
        Haptics.selectionAsync();
        onToggle();
      }}>
      <Card style={[styles.checkRow, checked && { borderColor: colors.accentBorder }]}>
        <View style={[styles.checkbox, checked && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
          {checked ? <Ionicons name="checkmark" size={15} color={colors.textOnAccent} /> : null}
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodySemi">{title}</AppText>
          <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 2 }}>
            {body}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

export default function Disclaimer() {
  const router = useRouter();
  const userId = useSession((s) => s.userId);
  const acceptDisclaimer = useData((s) => s.acceptDisclaimer);
  const [isAdult, setIsAdult] = useState(false);
  const [acceptsRisk, setAcceptsRisk] = useState(false);
  const [consultsDoctor, setConsultsDoctor] = useState(false);

  const canContinue = isAdult && acceptsRisk && consultsDoctor;

  const accept = () => {
    if (!userId) return;
    acceptDisclaimer(userId);
    router.replace('/(athlete)');
  };

  return (
    <Screen padded={false}>
      <ScreenHeader title="Before you start" subtitle="One-time health & safety confirmation" />
      <Animated.View entering={FadeInDown.duration(360)} style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Card style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="fitness-outline" size={18} color={colors.accent} />
            <AppText variant="headline">Fitness disclaimer</AppText>
          </View>
          <AppText variant="captionRegular" tone="secondary">
            Athletics Department provides fitness and nutrition guidance created by your coach. It is not
            medical advice. Training carries inherent risk of injury — always warm up, use appropriate
            loads, and stop if you feel pain, dizziness or unusual discomfort. Consult a physician before
            beginning any new training or nutrition programme, especially if you have a pre-existing
            condition, are pregnant, or take medication.
          </AppText>
        </Card>

        <CheckRow
          checked={isAdult}
          onToggle={() => setIsAdult((v) => !v)}
          title="I am 18 years or older"
          body="Athletics Department is only available to adults."
        />
        <CheckRow
          checked={acceptsRisk}
          onToggle={() => setAcceptsRisk((v) => !v)}
          title="I understand and accept the risks"
          body="I take part in training voluntarily and am responsible for exercising within my limits."
        />
        <CheckRow
          checked={consultsDoctor}
          onToggle={() => setConsultsDoctor((v) => !v)}
          title="I have consulted a doctor if needed"
          body="I confirm I have no medical condition preventing safe participation, or I have medical clearance."
        />

        <Button label="Agree & continue" size="lg" fullWidth disabled={!canContinue} onPress={accept} />
        <AppText variant="captionRegular" tone="tertiary" align="center">
          Your confirmation is stored with your profile with a timestamp.
        </AppText>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
