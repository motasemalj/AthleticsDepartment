import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { ScreenHeader } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/Text';
import { sendChatMessage, useMessages } from '@/services/chat';
import { useData } from '@/services/data/store';
import { useSession } from '@/services/session';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import type { Message } from '@/types';
import { formatChatTime } from '@/utils';

function Bubble({ message, mine, showAvatar, senderName, senderAvatar }: {
  message: Message;
  mine: boolean;
  showAvatar: boolean;
  senderName: string;
  senderAvatar?: string;
}) {
  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      style={[styles.bubbleRow, mine ? styles.bubbleRowMine : null]}>
      {!mine && showAvatar ? (
        <Avatar name={senderName} uri={senderAvatar} size={28} />
      ) : !mine ? (
        <View style={{ width: 28 }} />
      ) : null}
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        {message.imageUri ? (
          <Image source={{ uri: message.imageUri }} style={styles.bubbleImage} transition={200} />
        ) : null}
        {message.videoUri ? (
          <View style={[styles.bubbleImage, styles.videoPlaceholder]}>
            <Ionicons name="play-circle" size={38} color="#fff" />
          </View>
        ) : null}
        {message.text ? (
          <AppText variant="body" color={mine ? colors.textOnAccent : colors.text}>
            {message.text}
          </AppText>
        ) : null}
        <AppText
          variant="micro"
          color={mine ? 'rgba(7,8,10,0.55)' : colors.textTertiary}
          style={{ alignSelf: 'flex-end', marginTop: 3 }}>
          {formatChatTime(message.sentAt)}
        </AppText>
      </View>
    </Animated.View>
  );
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const userId = useSession((s) => s.userId)!;

  const conversation = useData((s) => s.conversations.find((c) => c.id === id));
  const users = useData((s) => s.users);
  const markConversationRead = useData((s) => s.markConversationRead);
  const messages = useMessages(id!);

  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const otherId = conversation ? (conversation.athleteId === userId ? conversation.coachId : conversation.athleteId) : undefined;
  const other = users.find((u) => u.id === otherId);

  useEffect(() => {
    if (id) markConversationRead(id, userId);
  }, [id, userId, messages.length, markConversationRead]);

  const send = () => {
    if (!text.trim() || !id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendChatMessage(id, userId, { text: text.trim() });
    setText('');
  };

  const attach = async (kind: 'image' | 'video') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'image' ? ['images'] : ['videos'],
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0] && id) {
      sendChatMessage(id, userId, kind === 'image' ? { imageUri: result.assets[0].uri } : { videoUri: result.assets[0].uri });
    }
  };

  const reversed = [...messages].reverse();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xs }]}>
      <ScreenHeader title={other?.name ?? 'Chat'} subtitle="Usually replies within a few hours" back />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={reversed}
          inverted
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
          renderItem={({ item, index }) => {
            const mine = item.senderId === userId;
            const next = reversed[index + 1];
            const showAvatar = !next || next.senderId !== item.senderId;
            return (
              <Bubble
                message={item}
                mine={mine}
                showAvatar={showAvatar}
                senderName={other?.name ?? ''}
                senderAvatar={other?.avatarUrl}
              />
            );
          }}
          ListEmptyComponent={
            <View style={{ transform: [{ scaleY: -1 }], padding: spacing.xl, alignItems: 'center' }}>
              <AppText variant="captionRegular" tone="tertiary">
                Say hi — this is the start of your conversation.
              </AppText>
            </View>
          }
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
          <Pressable onPress={() => attach('image')} style={styles.attachBtn} accessibilityLabel="Send photo">
            <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={() => attach('video')} style={styles.attachBtn} accessibilityLabel="Send video">
            <Ionicons name="videocam-outline" size={20} color={colors.textSecondary} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            accessibilityLabel="Message input"
          />
          <Pressable
            onPress={send}
            disabled={!text.trim()}
            accessibilityLabel="Send message"
            style={[styles.sendBtn, !text.trim() && { opacity: 0.35 }]}>
            <Ionicons name="arrow-up" size={19} color={colors.textOnAccent} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginVertical: 3 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '76%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bubbleMine: { backgroundColor: colors.accent, borderBottomRightRadius: 6 },
  bubbleTheirs: { backgroundColor: colors.surfaceHigh, borderBottomLeftRadius: 6 },
  bubbleImage: { width: 210, height: 260, borderRadius: radius.md, marginBottom: 4 },
  videoPlaceholder: { backgroundColor: colors.backgroundDeep, alignItems: 'center', justifyContent: 'center' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 110,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingHorizontal: spacing.sm,
    paddingTop: 9,
    paddingBottom: 9,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
