import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { colors, type as typeScale } from '@/theme/tokens';

type Variant = keyof typeof typeScale;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'danger' | 'success' | 'warning' | 'inverse' | 'onAccent';

const toneColor: Record<Tone, string> = {
  primary: colors.text,
  secondary: colors.textSecondary,
  tertiary: colors.textTertiary,
  accent: colors.accent,
  danger: colors.danger,
  success: colors.success,
  warning: colors.warning,
  inverse: colors.textInverse,
  onAccent: colors.textOnAccent,
};

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  color?: string;
  align?: TextStyle['textAlign'];
  uppercase?: boolean;
}

export function AppText({
  variant = 'body',
  tone = 'primary',
  color,
  align,
  uppercase,
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        typeScale[variant],
        { color: color ?? toneColor[tone], textAlign: align },
        uppercase && { textTransform: 'uppercase' },
        style,
      ]}>
      {children}
    </Text>
  );
}
