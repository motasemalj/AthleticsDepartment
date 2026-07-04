import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Badge, Chip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { AppText } from '@/components/ui/Text';
import { toast } from '@/components/ui/Toast';
import { useData } from '@/services/data/store';
import { useCurrentUser } from '@/services/hooks';
import { colors, radius, spacing } from '@/theme/tokens';
import type { DemoVideo, MuscleGroup } from '@/types';
import { formatDuration, formatRelativeTime } from '@/utils';

const CATEGORIES: (MuscleGroup | 'all')[] = ['all', 'chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core', 'full-body', 'cardio'];
const THUMB_COLORS = ['#8B5CF6', '#3B82F6', '#22D3EE', '#F59E0B', '#F472B6', '#22C55E'];

function PlayerSheet({ video, onClose }: { video: DemoVideo; onClose: () => void }) {
  const player = useVideoPlayer(video.url, (p) => p.play());
  return (
    <Sheet visible onClose={onClose} title={video.title}>
      <VideoView player={player} style={styles.player} contentFit="cover" nativeControls />
    </Sheet>
  );
}

export default function VideoLibrary() {
  const { userId } = useCurrentUser();
  const allVideos = useData((s) => s.videos);
  const videos = useMemo(() => allVideos.filter((v) => v.coachId === userId), [allVideos, userId]);
  const exercises = useData((s) => s.exercises);
  const addVideo = useData((s) => s.addVideo);
  const deleteVideo = useData((s) => s.deleteVideo);
  const updateVideo = useData((s) => s.updateVideo);

  const [category, setCategory] = useState<MuscleGroup | 'all'>('all');
  const [playing, setPlaying] = useState<DemoVideo | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [assigning, setAssigning] = useState<DemoVideo | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<MuscleGroup>('chest');
  const [newUri, setNewUri] = useState<string | null>(null);

  const filtered = category === 'all' ? videos : videos.filter((v) => v.category === category);

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'] });
    if (!result.canceled && result.assets[0]) setNewUri(result.assets[0].uri);
  };

  const upload = () => {
    if (!newTitle.trim() || !newUri) {
      toast.error('Add a title and pick a video');
      return;
    }
    addVideo({
      coachId: userId!,
      title: newTitle.trim(),
      category: newCategory,
      url: newUri,
      thumbnailColor: THUMB_COLORS[videos.length % THUMB_COLORS.length]!,
      durationSec: 0,
      assignedExerciseIds: [],
    });
    setUploadOpen(false);
    setNewTitle('');
    setNewUri(null);
    toast.success('Video added to library');
  };

  const toggleAssign = (video: DemoVideo, exerciseId: string) => {
    const assigned = video.assignedExerciseIds.includes(exerciseId);
    updateVideo(video.id, {
      assignedExerciseIds: assigned
        ? video.assignedExerciseIds.filter((x) => x !== exerciseId)
        : [...video.assignedExerciseIds, exerciseId],
    });
    // keep the sheet's video reference fresh
    setAssigning((v) =>
      v && v.id === video.id
        ? {
            ...v,
            assignedExerciseIds: assigned
              ? v.assignedExerciseIds.filter((x) => x !== exerciseId)
              : [...v.assignedExerciseIds, exerciseId],
          }
        : v
    );
  };

  return (
    <Screen padded={false}>
      <ScreenHeader
        title="Video library"
        back
        right={<Button label="Upload" icon="cloud-upload-outline" size="sm" onPress={() => setUploadOpen(true)} />}
      />
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {CATEGORIES.map((c) => (
            <Chip key={c} label={c === 'all' ? 'All' : c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <EmptyState
            icon="film-outline"
            title="No videos here"
            message="Upload exercise demos so athletes see perfect form inside their plan."
            actionLabel="Upload video"
            onAction={() => setUploadOpen(true)}
          />
        ) : (
          filtered.map((v, i) => (
            <Animated.View key={v.id} entering={FadeInDown.delay(Math.min(i * 40, 240)).duration(300)}>
              <Card padded={false} style={{ overflow: 'hidden' }}>
                <Pressable onPress={() => setPlaying(v)} accessibilityRole="button" accessibilityLabel={`Play ${v.title}`}>
                  <View style={[styles.thumb, { backgroundColor: `${v.thumbnailColor}26` }]}>
                    <View style={[styles.playBtn, { backgroundColor: v.thumbnailColor }]}>
                      <Ionicons name="play" size={20} color="#fff" />
                    </View>
                    {v.durationSec > 0 ? (
                      <View style={styles.duration}>
                        <AppText variant="micro" color="#fff">
                          {formatDuration(v.durationSec)}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
                <View style={{ padding: spacing.md }}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodySemi">{v.title}</AppText>
                      <AppText variant="micro" tone="tertiary" style={{ marginTop: 2 }}>
                        {v.category} · uploaded {formatRelativeTime(v.uploadedAt)}
                      </AppText>
                    </View>
                    <Pressable
                      onPress={() => {
                        deleteVideo(v.id);
                        toast.info('Video deleted');
                      }}
                      hitSlop={8}
                      accessibilityLabel="Delete video">
                      <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                  <View style={styles.assignRow}>
                    <Badge
                      label={`${v.assignedExerciseIds.length} exercise${v.assignedExerciseIds.length === 1 ? '' : 's'}`}
                      tone={v.assignedExerciseIds.length ? 'accent' : 'neutral'}
                    />
                    <Button label="Assign" variant="secondary" size="sm" onPress={() => setAssigning(v)} />
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))
        )}
      </View>

      {playing ? <PlayerSheet video={playing} onClose={() => setPlaying(null)} /> : null}

      {/* Upload sheet */}
      <Sheet visible={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload demo video">
        <View style={{ gap: spacing.sm }}>
          <Input label="Title" placeholder="e.g. Squat depth cues" value={newTitle} onChangeText={setNewTitle} />
          <AppText variant="caption" tone="secondary">
            Category
          </AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
            {CATEGORIES.filter((c) => c !== 'all').map((c) => (
              <Chip key={c} label={c} selected={newCategory === c} onPress={() => setNewCategory(c as MuscleGroup)} />
            ))}
          </ScrollView>
          <Pressable onPress={pickVideo} accessibilityRole="button">
            <View style={[styles.dropzone, newUri ? { borderColor: colors.accentBorder } : null]}>
              <Ionicons name={newUri ? 'checkmark-circle' : 'videocam-outline'} size={22} color={newUri ? colors.success : colors.accent} />
              <AppText variant="caption" tone={newUri ? 'success' : 'secondary'}>
                {newUri ? 'Video selected' : 'Pick a video from your device'}
              </AppText>
            </View>
          </Pressable>
          <Button label="Add to library" size="lg" fullWidth onPress={upload} />
        </View>
      </Sheet>

      {/* Assign sheet */}
      <Sheet visible={!!assigning} onClose={() => setAssigning(null)} title="Assign to exercises">
        {assigning ? (
          <ScrollView style={{ maxHeight: 420 }}>
            {exercises
              .filter((e) => assigning.category === 'cardio' || e.muscleGroup === assigning.category || assigning.assignedExerciseIds.includes(e.id))
              .map((e) => {
                const on = assigning.assignedExerciseIds.includes(e.id);
                return (
                  <Pressable key={e.id} style={styles.assignExRow} onPress={() => toggleAssign(assigning, e.id)}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodySemi">{e.name}</AppText>
                      <AppText variant="micro" tone="tertiary">
                        {e.muscleGroup} · {e.equipment}
                      </AppText>
                    </View>
                    <Ionicons
                      name={on ? 'checkmark-circle' : 'ellipse-outline'}
                      size={22}
                      color={on ? colors.accent : colors.textTertiary}
                    />
                  </Pressable>
                );
              })}
          </ScrollView>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  player: { width: '100%', height: 230, borderRadius: radius.md, backgroundColor: colors.backgroundDeep },
  thumb: { height: 130, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  duration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  dropzone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  assignExRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
