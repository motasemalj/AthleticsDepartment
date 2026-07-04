import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { AppText } from '@/components/ui/Text';
import { colors } from '@/theme/tokens';
import { avatarColor, initials } from '@/utils';

export function Avatar({
  name,
  uri,
  size = 44,
  showRing,
}: {
  name: string;
  uri?: string;
  size?: number;
  showRing?: boolean;
}) {
  const r = size / 2;
  return (
    <View
      style={[
        { width: size, height: size, borderRadius: r },
        showRing && { borderWidth: 2, borderColor: colors.accent, padding: 2 },
      ]}
      accessibilityLabel={`${name} avatar`}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%', borderRadius: r }}
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { borderRadius: r, backgroundColor: avatarColor(name) },
          ]}>
          <AppText
            variant={size >= 56 ? 'headline' : 'caption'}
            color="#fff"
            style={{ fontSize: size * 0.36 }}>
            {initials(name)}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
