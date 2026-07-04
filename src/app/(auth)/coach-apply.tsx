import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Badge, Chip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';
import { colors, radius, spacing } from '@/theme/tokens';

const SPECIALTIES = [
  'Strength', 'Hypertrophy', 'Fat Loss', 'Powerlifting', 'CrossFit',
  'Endurance', 'Mobility', 'Nutrition', 'Women’s Training', 'Athletic Performance',
];

export default function CoachApply() {
  const router = useRouter();
  const submitCoachApplication = useData((s) => s.submitCoachApplication);
  const signIn = useSession((s) => s.signIn);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [years, setYears] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [certs, setCerts] = useState<{ name: string; fileName: string }[]>([]);
  const [certName, setCertName] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const toggleSpecialty = (s: string) =>
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 3 ? [...prev, s] : prev));

  const attachCert = async () => {
    if (!certName.trim()) {
      setError('Name the certification first (e.g. NASM CPT), then attach the file.');
      return;
    }
    setError(undefined);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return;
    const fileName = result.assets[0]?.fileName ?? `${certName.trim().toLowerCase().replace(/\s+/g, '-')}.jpg`;
    setCerts((prev) => [...prev, { name: certName.trim(), fileName }]);
    setCertName('');
    toast.success('Certification attached');
  };

  const submit = () => {
    setError(undefined);
    if (!name.trim() || !email.trim() || !bio.trim() || selected.length === 0) {
      setError('Complete your name, email, bio and at least one specialty.');
      return;
    }
    if (certs.length === 0) {
      setError('Upload at least one certification — our admin team reviews every application.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const user = submitCoachApplication({
        name: name.trim(),
        email: email.trim(),
        bio: bio.trim(),
        specialties: selected,
        yearsExperience: Number(years) || 0,
        certifications: certs,
      });
      setLoading(false);
      signIn(user.id, 'coach');
      router.replace('/(auth)/pending-approval');
    }, 700);
  };

  return (
    <Screen keyboardAware padded={false}>
      <ScreenHeader title="Coach application" back subtitle="Reviewed by our team within 48 hours" />
      <Animated.View entering={FadeInDown.duration(320)} style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Input label="Full name" icon="person-outline" placeholder="Your name" value={name} onChangeText={setName} />
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
          label="Bio"
          placeholder="Tell athletes who you are, how you coach, and what results you deliver."
          multiline
          value={bio}
          onChangeText={setBio}
        />
        <Input
          label="Years of experience"
          icon="time-outline"
          placeholder="e.g. 5"
          keyboardType="number-pad"
          value={years}
          onChangeText={setYears}
        />

        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" tone="secondary">
            Specialties (pick up to 3)
          </AppText>
          <View style={styles.chipWrap}>
            {SPECIALTIES.map((s) => (
              <Chip key={s} label={s} selected={selected.includes(s)} onPress={() => toggleSpecialty(s)} />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.xs }}>
          <AppText variant="caption" tone="secondary">
            Certifications
          </AppText>
          {certs.map((c, i) => (
            <Animated.View key={`${c.fileName}-${i}`} entering={FadeInUp.duration(240)}>
              <Card style={styles.certRow}>
                <Ionicons name="document-attach-outline" size={18} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi">{c.name}</AppText>
                  <AppText variant="captionRegular" tone="tertiary">
                    {c.fileName}
                  </AppText>
                </View>
                <Badge label="Pending review" tone="warning" />
              </Card>
            </Animated.View>
          ))}
          <View style={{ flexDirection: 'row', gap: spacing.xs }}>
            <Input
              placeholder="Certification name (e.g. NASM CPT)"
              value={certName}
              onChangeText={setCertName}
              containerStyle={{ flex: 1 }}
            />
            <Button label="Attach" icon="cloud-upload-outline" variant="secondary" onPress={attachCert} />
          </View>
        </View>

        {error ? (
          <AppText variant="captionRegular" tone="danger">
            {error}
          </AppText>
        ) : null}
        <Button label="Submit application" size="lg" fullWidth loading={loading} onPress={submit} />
        <AppText variant="captionRegular" tone="tertiary" align="center">
          By applying you agree to a platform commission on subscription revenue, set during approval.
        </AppText>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
