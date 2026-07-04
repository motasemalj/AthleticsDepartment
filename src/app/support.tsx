import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Chip } from '@/components/ui/Badge';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { colors, radius, spacing } from '@/theme/tokens';

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'account', label: 'Account' },
  { value: 'training', label: 'Training' },
  { value: 'billing', label: 'Billing' },
  { value: 'coaching', label: 'Coaching' },
] as const;

export default function SupportScreen() {
  const faq = useData((s) => s.faq);
  const [category, setCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const items = category === 'all' ? faq : faq.filter((f) => f.category === category);

  return (
    <Screen padded={false}>
      <ScreenHeader title="Help & FAQ" back />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <Chip key={c.value} label={c.label} selected={category === c.value} onPress={() => setCategory(c.value)} />
          ))}
        </View>

        {items.map((item, i) => {
          const open = openId === item.id;
          return (
            <Animated.View key={item.id} entering={FadeInDown.delay(Math.min(i * 30, 240)).duration(280)} style={{ marginBottom: -spacing.xs }}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setOpenId(open ? null : item.id);
                }}>
                <Card style={{ marginBottom: spacing.xs }}>
                  <View style={styles.qRow}>
                    <AppText variant="bodySemi" style={{ flex: 1 }}>
                      {item.question}
                    </AppText>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textTertiary} />
                  </View>
                  {open ? (
                    <AppText variant="captionRegular" tone="secondary" style={{ marginTop: spacing.xs }}>
                      {item.answer}
                    </AppText>
                  ) : null}
                </Card>
              </Pressable>
            </Animated.View>
          );
        })}

        <SectionHeader title="Still need help?" />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Card
            style={styles.contactCard}
            onPress={() => Linking.openURL('mailto:support@athleticsdept.ae?subject=Support%20request')}>
            <View style={[styles.contactIcon, { backgroundColor: colors.infoMuted }]}>
              <Ionicons name="mail-outline" size={20} color={colors.info} />
            </View>
            <AppText variant="bodySemi">Email</AppText>
            <AppText variant="micro" tone="tertiary">
              support@athleticsdept.ae
            </AppText>
          </Card>
          <Card style={styles.contactCard} onPress={() => Linking.openURL('https://wa.me/971501234567')}>
            <View style={[styles.contactIcon, { backgroundColor: colors.successMuted }]}>
              <Ionicons name="logo-whatsapp" size={20} color={colors.success} />
            </View>
            <AppText variant="bodySemi">WhatsApp</AppText>
            <AppText variant="micro" tone="tertiary">
              +971 50 123 4567
            </AppText>
          </Card>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  contactCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.lg },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
