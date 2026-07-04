import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Chip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import { dateKey } from '@/utils';

type Mode = 'stats' | 'photo';
type Pose = 'front' | 'side' | 'back';

export default function AddProgress() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const addProgressEntry = useData((s) => s.addProgressEntry);
  const addProgressPhoto = useData((s) => s.addProgressPhoto);

  const [mode, setMode] = useState<Mode>('stats');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [hips, setHips] = useState('');
  const [arms, setArms] = useState('');
  const [thighs, setThighs] = useState('');

  const [pose, setPose] = useState<Pose>('front');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const pickPhoto = async (camera: boolean) => {
    const fn = camera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const result = await fn({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) setPhotoUri(result.assets[0].uri);
  };

  const saveStats = () => {
    if (!weight && !bodyFat && !waist && !chest && !hips && !arms && !thighs) {
      toast.error('Enter at least one measurement');
      return;
    }
    const measurements: Record<string, number> = {};
    if (waist) measurements.waist = Number(waist);
    if (chest) measurements.chest = Number(chest);
    if (hips) measurements.hips = Number(hips);
    if (arms) measurements.arms = Number(arms);
    if (thighs) measurements.thighs = Number(thighs);
    addProgressEntry({
      athleteId: userId!,
      date: dateKey(),
      weightKg: weight ? Number(weight.replace(',', '.')) : undefined,
      bodyFatPct: bodyFat ? Number(bodyFat.replace(',', '.')) : undefined,
      measurements: Object.keys(measurements).length ? measurements : undefined,
    });
    toast.success('Progress saved');
    router.back();
  };

  const savePhoto = () => {
    if (!photoUri) {
      toast.error('Add a photo first');
      return;
    }
    addProgressPhoto({ athleteId: userId!, date: dateKey(), uri: photoUri, pose });
    toast.success('Photo saved');
    router.back();
  };

  return (
    <Screen keyboardAware padded={false}>
      <ScreenHeader title="Add progress" back />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <Segmented<Mode>
          options={[
            { value: 'stats', label: 'Measurements' },
            { value: 'photo', label: 'Photo' },
          ]}
          value={mode}
          onChange={setMode}
        />

        {mode === 'stats' ? (
          <Animated.View entering={FadeInDown.duration(280)} style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <Input label="Weight (kg)" placeholder="0.0" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} containerStyle={{ flex: 1 }} />
              <Input label="Body fat (%)" placeholder="0.0" keyboardType="decimal-pad" value={bodyFat} onChangeText={setBodyFat} containerStyle={{ flex: 1 }} />
            </View>
            <AppText variant="caption" tone="secondary" style={{ marginTop: spacing.xs }}>
              Measurements (cm) — optional
            </AppText>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <Input label="Chest" placeholder="—" keyboardType="decimal-pad" value={chest} onChangeText={setChest} containerStyle={{ flex: 1 }} />
              <Input label="Waist" placeholder="—" keyboardType="decimal-pad" value={waist} onChangeText={setWaist} containerStyle={{ flex: 1 }} />
              <Input label="Hips" placeholder="—" keyboardType="decimal-pad" value={hips} onChangeText={setHips} containerStyle={{ flex: 1 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              <Input label="Arms" placeholder="—" keyboardType="decimal-pad" value={arms} onChangeText={setArms} containerStyle={{ flex: 1 }} />
              <Input label="Thighs" placeholder="—" keyboardType="decimal-pad" value={thighs} onChangeText={setThighs} containerStyle={{ flex: 1 }} />
            </View>
            <Button label="Save entry" size="lg" fullWidth onPress={saveStats} style={{ marginTop: spacing.sm }} />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.duration(280)} style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.xs }}>
              {(['front', 'side', 'back'] as Pose[]).map((p) => (
                <Chip key={p} label={p[0]!.toUpperCase() + p.slice(1)} selected={pose === p} onPress={() => setPose(p)} />
              ))}
            </View>
            {photoUri ? (
              <View>
                <Image source={{ uri: photoUri }} style={styles.preview} transition={200} />
                <Pressable style={styles.removePhoto} onPress={() => setPhotoUri(undefined)} hitSlop={8} accessibilityLabel="Remove photo">
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Card style={styles.photoActions}>
                <Pressable style={styles.photoAction} onPress={() => pickPhoto(true)} accessibilityRole="button">
                  <Ionicons name="camera-outline" size={24} color={colors.accent} />
                  <AppText variant="caption">Take photo</AppText>
                </Pressable>
                <View style={styles.photoDivider} />
                <Pressable style={styles.photoAction} onPress={() => pickPhoto(false)} accessibilityRole="button">
                  <Ionicons name="images-outline" size={24} color={colors.accent} />
                  <AppText variant="caption">From library</AppText>
                </Pressable>
              </Card>
            )}
            <View style={styles.privacyNote}>
              <Ionicons name="lock-closed-outline" size={14} color={colors.textTertiary} />
              <AppText variant="captionRegular" tone="tertiary" style={{ flex: 1 }}>
                Progress photos are private. Only you and your coach can view them.
              </AppText>
            </View>
            <Button label="Save photo" size="lg" fullWidth onPress={savePhoto} disabled={!photoUri} />
          </Animated.View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', height: 340, borderRadius: radius.lg, backgroundColor: colors.surfaceHigh },
  removePhoto: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: { flexDirection: 'row', paddingVertical: spacing.xl },
  photoAction: { flex: 1, alignItems: 'center', gap: spacing.xs },
  photoDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  privacyNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
