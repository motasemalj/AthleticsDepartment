import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppText } from '@/components/ui/Text';
import { useData } from '@/services/data/store';
import { colors, spacing } from '@/theme/tokens';
import { formatChatTime } from '@/utils';

export function ConversationList({ userId }: { userId: string }) {
  const router = useRouter();
  const conversations = useData((s) => s.conversations);
  const users = useData((s) => s.users);

  const mine = conversations
    .filter((c) => c.coachId === userId || c.athleteId === userId)
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);

  if (mine.length === 0) {
    return (
      <EmptyState
        icon="chatbubbles-outline"
        title="No conversations yet"
        message="Chats open automatically when you're connected with a coach or athlete."
      />
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      {mine.map((c, i) => {
        const otherId = c.coachId === userId ? c.athleteId : c.coachId;
        const other = users.find((u) => u.id === otherId);
        const unread = c.unread[userId] ?? 0;
        return (
          <Animated.View key={c.id} entering={FadeInDown.delay(Math.min(i * 40, 240)).duration(280)}>
            <Card style={styles.row} onPress={() => router.push(`/chat/${c.id}`)}>
              <Avatar name={other?.name ?? ''} uri={other?.avatarUrl} size={46} />
              <View style={{ flex: 1 }}>
                <View style={styles.top}>
                  <AppText variant="bodySemi" numberOfLines={1} style={{ flex: 1 }}>
                    {other?.name}
                  </AppText>
                  <AppText variant="micro" tone="tertiary">
                    {formatChatTime(c.lastMessageAt)}
                  </AppText>
                </View>
                <AppText
                  variant="captionRegular"
                  tone={unread > 0 ? 'primary' : 'secondary'}
                  numberOfLines={1}
                  style={{ marginTop: 2 }}>
                  {c.lastMessagePreview}
                </AppText>
              </View>
              {unread > 0 ? (
                <View style={styles.unread}>
                  <AppText variant="micro" color={colors.textOnAccent}>
                    {unread}
                  </AppText>
                </View>
              ) : null}
            </Card>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  unread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
});
