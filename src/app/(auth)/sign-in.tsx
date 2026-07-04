import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';
import { spacing } from '@/theme/tokens';

export default function SignIn() {
  const router = useRouter();
  const users = useData((s) => s.users);
  const signIn = useSession((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const submit = () => {
    setError(undefined);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    // Demo auth: matches any seeded account email. Firebase Auth replaces this in production.
    setTimeout(() => {
      const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      setLoading(false);
      if (!user) {
        setError('No account found with that email. Athletics Department is invite-only — ask your coach for an invite.');
        return;
      }
      signIn(user.id, user.role);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      router.replace('/');
    }, 600);
  };

  return (
    <Screen keyboardAware padded={false}>
      <ScreenHeader title="Sign in" back />
      <Animated.View entering={FadeInDown.duration(360)} style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <AppText variant="body" tone="secondary">
          Welcome back. Sign in with the email you joined with.
        </AppText>
        <Input
          label="Email"
          icon="mail-outline"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          icon="lock-closed-outline"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={error}
        />
        <Button label="Sign in" size="lg" fullWidth loading={loading} onPress={submit} />

        <Card style={{ marginTop: spacing.md }}>
          <AppText variant="caption" tone="secondary">
            Demo accounts (any password works):
          </AppText>
          <View style={{ marginTop: spacing.xs, gap: 4 }}>
            <AppText variant="captionRegular" tone="tertiary">maya.k@gmail.com — Athlete</AppText>
            <AppText variant="captionRegular" tone="tertiary">omar@athleticsdept.ae — Coach</AppText>
            <AppText variant="captionRegular" tone="tertiary">owner@athleticsdept.ae — Admin</AppText>
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}
