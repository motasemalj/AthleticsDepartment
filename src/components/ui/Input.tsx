import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/Text';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  containerStyle?: ViewStyle;
  multilineHeight?: number;
}

export function Input({
  label,
  error,
  hint,
  icon,
  containerStyle,
  multiline,
  multilineHeight = 110,
  style,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <AppText variant="caption" tone="secondary">
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          multiline && { height: multilineHeight, alignItems: 'flex-start', paddingVertical: spacing.sm },
          focused && { borderColor: colors.accentBorder, backgroundColor: colors.surfaceRaised },
          !!error && { borderColor: colors.danger },
        ]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={focused ? colors.accent : colors.textTertiary} style={multiline && { marginTop: 2 }} />
        ) : null}
        <TextInput
          {...rest}
          multiline={multiline}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.accent}
          accessibilityLabel={label}
          style={[styles.input, multiline && { height: '100%', textAlignVertical: 'top' }, style]}
        />
      </View>
      {error ? (
        <AppText variant="captionRegular" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="captionRegular" tone="tertiary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingVertical: 0,
  },
});
