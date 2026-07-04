import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';
import { colors, radius, spacing } from '@/theme/tokens';

type Mode = 'code' | 'scan';

export default function InviteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const { redeemInvite, invites, users } = useData();
  const signIn = useSession((s) => s.signIn);
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<Mode>('code');
  const [token, setToken] = useState('');
  const [validCoach, setValidCoach] = useState<string | null>(null);
  const [joinedVia, setJoinedVia] = useState<'invite-link' | 'qr'>('invite-link');
  const [scanned, setScanned] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState('');
  const [isStudent, setIsStudent] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) setAvatarUri(result.assets[0].uri);
  };

  const checkToken = (value: string, via: 'invite-link' | 'qr') => {
    const invite = invites.find(
      (i) => i.token.toUpperCase() === value.trim().toUpperCase() && !i.revoked && !i.usedBy
    );
    if (!invite) {
      setError('This invite code is invalid or has already been used.');
      setValidCoach(null);
      return;
    }
    const coach = users.find((u) => u.id === invite.coachId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setError(undefined);
    setToken(value.trim().toUpperCase());
    setJoinedVia(via);
    setValidCoach(coach?.name ?? 'your coach');
  };

  // Deep-link entry: athleticsdept://join/TOKEN pre-verifies the invite.
  // Syncing the URL param into local state is intentional here.
  React.useEffect(() => {
    if (params.token) checkToken(String(params.token), 'invite-link');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.token]);

  const handleScan = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    // QR payload: athleticsdept://join/TOKEN or raw token
    const raw = data.split('/').pop() ?? data;
    checkToken(raw, 'qr');
    setTimeout(() => setScanned(false), 1500);
  };

  const createAccount = () => {
    setError(undefined);
    if (!name.trim() || !email.trim() || !goal.trim()) {
      setError('Fill in your name, email and goal to continue.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('That email doesn’t look right.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const result = redeemInvite(token, {
        name: name.trim(),
        email: email.trim(),
        goal: goal.trim(),
        isStudent,
        joinedVia,
        avatarUrl: avatarUri,
      });
      setLoading(false);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      signIn(result.user.id, 'athlete');
      toast.success('Account created');
      router.replace('/(auth)/disclaimer');
    }, 700);
  };

  return (
    <Screen keyboardAware padded={false}>
      <ScreenHeader title="Join your coach" back subtitle="Athletics Department is invite-only" />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {!validCoach ? (
          <Animated.View entering={FadeInDown.duration(320)} style={{ gap: spacing.md }}>
            <Segmented<Mode>
              options={[
                { value: 'code', label: 'Enter code' },
                { value: 'scan', label: 'Scan QR' },
              ]}
              value={mode}
              onChange={setMode}
            />

            {mode === 'code' ? (
              <View style={{ gap: spacing.md }}>
                <Input
                  label="Invite code"
                  icon="ticket-outline"
                  placeholder="e.g. OMAR-TRAIN-24"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  value={token}
                  onChangeText={setToken}
                  error={error}
                  hint="Your coach shares this code or a join link with you."
                />
                <Button
                  label="Verify invite"
                  size="lg"
                  fullWidth
                  disabled={token.trim().length < 4}
                  onPress={() => checkToken(token, 'invite-link')}
                />
                <Card>
                  <AppText variant="captionRegular" tone="tertiary">
                    Demo tip: try the code OMAR-TRAIN-24
                  </AppText>
                </Card>
              </View>
            ) : permission?.granted ? (
              <View style={styles.cameraWrap}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={handleScan}
                />
                <View style={styles.scanFrame} />
                <AppText variant="caption" color="#fff" style={styles.scanHint}>
                  Point at your coach’s QR code
                </AppText>
                {error ? (
                  <AppText variant="caption" tone="danger" style={styles.scanError}>
                    {error}
                  </AppText>
                ) : null}
              </View>
            ) : (
              <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
                <Ionicons name="camera-outline" size={28} color={colors.accent} />
                <AppText variant="bodySemi">Camera access needed</AppText>
                <AppText variant="captionRegular" tone="secondary" align="center">
                  We use the camera only to scan your coach’s invite QR code.
                </AppText>
                <Button label="Allow camera" size="sm" onPress={requestPermission} />
              </Card>
            )}
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(320)} style={{ gap: spacing.md }}>
            <Card style={styles.coachConfirm}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodySemi">Invite verified</AppText>
                <AppText variant="captionRegular" tone="secondary">
                  You’re joining {validCoach}’s roster
                </AppText>
              </View>
            </Card>
            <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Add profile photo" style={styles.avatarPick}>
              {avatarUri ? (
                <Avatar name={name || '?'} uri={avatarUri} size={84} showRing />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera-outline" size={22} color={colors.accent} />
                </View>
              )}
              <AppText variant="caption" tone={avatarUri ? 'success' : 'secondary'} style={{ marginTop: spacing.xs }}>
                {avatarUri ? 'Photo added — tap to change' : 'Add a profile photo (optional)'}
              </AppText>
            </Pressable>
            <Input label="Full name" icon="person-outline" placeholder="Your name" value={name} onChangeText={setName} autoComplete="name" />
            <Input
              label="Email"
              icon="mail-outline"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Your main goal"
              icon="flag-outline"
              placeholder="e.g. Build muscle, lose 5kg, first pull-up"
              value={goal}
              onChangeText={setGoal}
              error={error}
            />
            <Card style={styles.studentRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodySemi">I’m a student</AppText>
                <AppText variant="captionRegular" tone="secondary">
                  Student pricing may apply at checkout
                </AppText>
              </View>
              <Switch
                value={isStudent}
                onValueChange={setIsStudent}
                trackColor={{ true: colors.accent, false: colors.surfaceHigh }}
                thumbColor="#fff"
              />
            </Card>
            <Button label="Create my account" size="lg" fullWidth loading={loading} onPress={createAccount} />
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cameraWrap: {
    height: 340,
    borderRadius: radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scanFrame: {
    width: 190,
    height: 190,
    borderRadius: radius.lg,
    borderWidth: 2.5,
    borderColor: colors.accent,
  },
  scanHint: { position: 'absolute', bottom: 48 },
  scanError: { position: 'absolute', bottom: 20 },
  coachConfirm: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarPick: { alignItems: 'center', paddingVertical: spacing.xs },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
