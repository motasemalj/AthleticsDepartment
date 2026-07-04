import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, Divider, SectionHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ListRow } from '@/components/ui/ListRow';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { useSession } from '@/services/session';
import { colors, spacing } from '@/theme/tokens';

export default function ProfileScreen() {
  const router = useRouter();
  const { userId, user, athleteProfile, coachProfile } = useCurrentUser();
  const signOut = useSession((s) => s.signOut);
  const updateUser = useData((s) => s.updateUser);
  const updateAthleteProfile = useData((s) => s.updateAthleteProfile);
  const updateCoachProfile = useData((s) => s.updateCoachProfile);

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [goal, setGoal] = useState(athleteProfile?.goal ?? '');
  const [isStudent, setIsStudent] = useState(athleteProfile?.isStudent ?? false);
  const [bio, setBio] = useState(coachProfile?.bio ?? '');
  const [saving, setSaving] = useState(false);

  if (!user || !userId) return null;

  const roleLabel = user.role === 'admin' ? 'Platform owner' : user.role === 'coach' ? 'Coach' : 'Athlete';

  const changePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      updateUser(userId, { avatarUrl: result.assets[0].uri });
      toast.success('Photo updated');
    }
  };

  const save = () => {
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      toast.error('Enter a valid name and email');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      updateUser(userId, { name: name.trim(), email: email.trim() });
      if (athleteProfile) updateAthleteProfile(userId, { goal: goal.trim(), isStudent });
      if (coachProfile) updateCoachProfile(userId, { bio: bio.trim() });
      setSaving(false);
      toast.success('Profile saved');
    }, 400);
  };

  return (
    <Screen padded={false} keyboardAware>
      <ScreenHeader title="Profile" back />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        {/* Identity */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.identity}>
          <Pressable onPress={changePhoto} accessibilityRole="button" accessibilityLabel="Change profile photo">
            <Avatar name={user.name} uri={user.avatarUrl} size={92} showRing />
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={13} color={colors.textOnAccent} />
            </View>
          </Pressable>
          <AppText variant="title" style={{ marginTop: spacing.sm }}>
            {user.name}
          </AppText>
          <Badge
            label={roleLabel}
            tone={user.role === 'admin' ? 'violet' : user.role === 'coach' ? 'accent' : 'info'}
            style={{ marginTop: spacing.xxs }}
          />
        </Animated.View>

        {/* Details */}
        <SectionHeader title="Your details" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card style={{ gap: spacing.sm }}>
          <Input label="Full name" icon="person-outline" value={name} onChangeText={setName} autoComplete="name" />
          <Input
            label="Email"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          {athleteProfile ? (
            <>
              <Input label="Training goal" icon="flag-outline" value={goal} onChangeText={setGoal} />
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi">Student</AppText>
                  <AppText variant="captionRegular" tone="secondary">
                    Student pricing may apply to renewals
                  </AppText>
                </View>
                <Switch
                  value={isStudent}
                  onValueChange={setIsStudent}
                  trackColor={{ true: colors.accent, false: colors.surfaceHigh }}
                  thumbColor="#fff"
                />
              </View>
            </>
          ) : null}
          {coachProfile ? (
            <Input label="Bio" multiline multilineHeight={90} value={bio} onChangeText={setBio} />
          ) : null}
          <Button label="Save changes" fullWidth loading={saving} onPress={save} />
        </Card>

        {/* Settings */}
        <SectionHeader title="Settings" style={{ marginTop: 0, marginBottom: 0 }} />
        <Card>
          {coachProfile ? (
            <>
              <ListRow
                icon="pricetags-outline"
                title="Pricing"
                subtitle="Plans and student discount"
                onPress={() => router.push('/(coach)/pricing')}
              />
              <Divider style={{ marginVertical: 0 }} />
            </>
          ) : null}
          {athleteProfile ? (
            <>
              <ListRow
                icon="card-outline"
                title="Subscription & billing"
                onPress={() => router.push('/(athlete)/billing')}
              />
              <Divider style={{ marginVertical: 0 }} />
            </>
          ) : null}
          <ListRow icon="notifications-outline" title="Notifications" onPress={() => router.push('/notifications')} />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow icon="help-circle-outline" title="Help & FAQ" onPress={() => router.push('/support')} />
          <Divider style={{ marginVertical: 0 }} />
          <ListRow icon="shield-outline" title="Privacy & data" subtitle="Including account deletion" onPress={() => router.push('/privacy')} />
        </Card>

        <Card>
          <ListRow
            icon="log-out-outline"
            title="Sign out"
            chevron={false}
            destructive
            onPress={() => {
              signOut();
              router.dismissAll?.();
              router.replace('/(auth)/welcome');
            }}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center', paddingVertical: spacing.sm },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: colors.background,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
