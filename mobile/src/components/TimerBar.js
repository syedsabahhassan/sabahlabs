import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function TimerBar({ timeRemaining, timeLimit, showNumber = true }) {
  const widthAnim = useRef(new Animated.Value(1)).current;

  const pct = timeLimit > 0 ? Math.max(0, timeRemaining / timeLimit) : 0;
  const isDanger  = pct <= 0.25;
  const isWarning = pct <= 0.50;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const barColor = isDanger ? colors.danger : isWarning ? colors.warning : colors.success;

  return (
    <View style={styles.wrapper}>
      <View style={styles.barBg}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: barColor,
              width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
      {showNumber && (
        <Text style={[styles.number, isDanger && styles.dangerText, isWarning && !isDanger && styles.warningText]}>
          {timeRemaining}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { width: '100%', alignItems: 'center', gap: 8 },
  barBg:      { width: '100%', height: 14, backgroundColor: '#1e2a4a', borderRadius: 7, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 7 },
  number:     { fontSize: 44, fontWeight: '900', color: colors.white },
  dangerText: { color: colors.danger },
  warningText:{ color: colors.warning },
});
