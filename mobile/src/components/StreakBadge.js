import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { STREAK_LABELS } from '../constants/theme';

export default function StreakBadge({ streak }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (streak >= 2) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [streak]);

  if (streak < 2) return null;

  const tier = Math.min(streak - 1, STREAK_LABELS.length - 1);
  const label = STREAK_LABELS[tier] || `🔥 ×${streak}`;

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.text}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#7c2d00',
    borderWidth: 2,
    borderColor: '#f97316',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  text: {
    color: '#fed7aa',
    fontWeight: '900',
    fontSize: 16,
    textAlign: 'center',
  },
});
