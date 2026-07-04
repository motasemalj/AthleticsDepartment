import React from 'react';
import { View } from 'react-native';

import { ConversationList } from '@/components/ConversationList';
import { Screen, ScreenHeader } from '@/components/ui/Screen';
import { useSession } from '@/services/session';
import { spacing } from '@/theme/tokens';

export default function CoachMessages() {
  const userId = useSession((s) => s.userId)!;
  return (
    <Screen padded={false} tabbed>
      <ScreenHeader title="Messages" large />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <ConversationList userId={userId} />
      </View>
    </Screen>
  );
}
