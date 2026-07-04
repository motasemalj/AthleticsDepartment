import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';

import { AppText } from '@/components/ui/Text';
import { colors, radius, spacing } from '@/theme/tokens';
import { dateKey } from '@/utils';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export type DayStatus = 'completed' | 'missed' | 'rest' | 'future' | 'none';

export function CalendarMonth({
  month,
  onChangeMonth,
  statusFor,
  onPressDay,
}: {
  month: Date;
  onChangeMonth: (next: Date) => void;
  statusFor: (key: string) => DayStatus;
  onPressDay?: (key: string) => void;
}) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const leading = (start.getDay() + 6) % 7; // Monday-first
  const daysInMonth = end.getDate();
  const todayKey = dateKey();

  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(start);
      d.setDate(i + 1);
      return dateKey(d);
    }),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View>
      <View style={styles.headerRow}>
        <Pressable
          hitSlop={10}
          accessibilityLabel="Previous month"
          onPress={() => {
            Haptics.selectionAsync();
            onChangeMonth(addMonths(month, -1));
          }}
          style={styles.navBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
        </Pressable>
        <AppText variant="headline">{format(month, 'MMMM yyyy')}</AppText>
        <Pressable
          hitSlop={10}
          accessibilityLabel="Next month"
          onPress={() => {
            Haptics.selectionAsync();
            onChangeMonth(addMonths(month, 1));
          }}
          style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <AppText key={i} variant="micro" tone="tertiary" style={styles.weekday} align="center">
            {w}
          </AppText>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((key, i) => {
          if (!key) return <View key={`e-${i}`} style={styles.cell} />;
          const status = statusFor(key);
          const isToday = key === todayKey;
          const dayNum = Number(key.slice(-2));
          return (
            <Pressable
              key={key}
              onPress={onPressDay ? () => onPressDay(key) : undefined}
              style={styles.cell}
              accessibilityLabel={`${key}, ${status}`}>
              <View
                style={[
                  styles.dayDot,
                  status === 'completed' && { backgroundColor: colors.accent },
                  status === 'missed' && { backgroundColor: colors.dangerMuted },
                  status === 'rest' && { backgroundColor: colors.surfaceHigh },
                  isToday && styles.today,
                ]}>
                <AppText
                  variant="caption"
                  color={
                    status === 'completed'
                      ? colors.textOnAccent
                      : status === 'missed'
                        ? colors.danger
                        : status === 'future' || status === 'none'
                          ? colors.textTertiary
                          : colors.textSecondary
                  }>
                  {dayNum}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  dayDot: {
    width: '86%',
    height: '86%',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: { borderWidth: 1.5, borderColor: colors.accent },
});
