import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Card, SectionHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';
import { colors, radius, spacing } from '@/theme/tokens';

const SECTIONS = [
  {
    icon: 'lock-closed-outline' as const,
    title: 'What we store',
    body: 'Your profile, training and nutrition logs, check-ins, progress photos, messages with your coach, and billing records. Progress photos and messages are visible only to you and your coach.',
  },
  {
    icon: 'server-outline' as const,
    title: 'Where it lives',
    body: 'Data is stored with Google Firebase (Firestore and Cloud Storage) in encrypted form, in transit and at rest. Payments are processed by Stripe — we never see your full card number.',
  },
  {
    icon: 'eye-off-outline' as const,
    title: 'What we never do',
    body: 'We never sell your data, never share it with advertisers, and never use your photos for marketing without written consent.',
  },
  {
    icon: 'download-outline' as const,
    title: 'Your rights',
    body: 'In line with UAE Federal Decree-Law No. 45 of 2021 on personal data protection, you can request a copy of your data, corrections, or full deletion at any time.',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { userId, signOut } = useSession();
  const deleteAccount = useData((s) => s.deleteAccount);

  const [deleteSheet, setDeleteSheet] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setDeleting(true);
    setTimeout(() => {
      if (userId) deleteAccount(userId);
      signOut();
      setDeleting(false);
      setDeleteSheet(false);
      toast.info('Your account and data have been deleted');
      router.replace('/(auth)/welcome');
    }, 1200);
  };

  return (
    <Screen padded={false}>
      <ScreenHeader title="Privacy & data" back />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
        {SECTIONS.map((s) => (
          <Card key={s.title} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <View style={styles.icon}>
              <Ionicons name={s.icon} size={17} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodySemi">{s.title}</AppText>
              <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 3 }}>
                {s.body}
              </AppText>
            </View>
          </Card>
        ))}

        <SectionHeader title="Danger zone" />
        <Card style={{ borderColor: 'rgba(248,113,113,0.25)' }}>
          <AppText variant="bodySemi" tone="danger">
            Delete account
          </AppText>
          <AppText variant="captionRegular" tone="secondary" style={{ marginTop: 3 }}>
            Permanently removes your profile, logs, photos, messages and subscription. Active subscriptions
            are cancelled. This cannot be undone. Deletion completes within 30 days.
          </AppText>
          <Button
            label="Delete my account"
            variant="danger"
            size="sm"
            style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }}
            onPress={() => setDeleteSheet(true)}
          />
        </Card>
      </View>

      <Sheet visible={deleteSheet} onClose={() => setDeleteSheet(false)} title="Delete account?">
        <AppText variant="body" tone="secondary">
          This permanently deletes all your data. Type <AppText variant="bodySemi" tone="danger">DELETE</AppText> to
          confirm.
        </AppText>
        <Input
          placeholder="DELETE"
          autoCapitalize="characters"
          value={confirmText}
          onChangeText={setConfirmText}
          containerStyle={{ marginTop: spacing.md }}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <Button label="Keep my account" variant="secondary" style={{ flex: 1 }} onPress={() => setDeleteSheet(false)} />
          <Button label="Delete forever" variant="danger" style={{ flex: 1 }} loading={deleting} onPress={confirmDelete} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
