import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TILE_COLORS, TILE_SHAPES } from '../constants/theme';

export default function AnswerTile({ index, onPress, disabled, selected, isCorrect, isWrong, showLabel = false, label = '' }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { width } = useWindowDimensions();

  // Responsive tile height: scales for iPhone, iPad, and all sizes in between
  const isTablet = width >= 768;
  const tileHeight = isTablet ? 200 : Math.max(120, width * 0.28);
  const shapeSize = isTablet ? 64 : 40;
  const labelSize = isTablet ? 20 : 15;

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    onPress(index);
  };

  let tileStyle = [styles.tile, { backgroundColor: TILE_COLORS[index], minHeight: tileHeight }];
  if (selected)  tileStyle.push(styles.selected);
  if (isCorrect) tileStyle.push(styles.correct);
  if (isWrong)   tileStyle.push(styles.wrong);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={disabled}
        style={tileStyle}
      >
        <Text style={[styles.shape, { fontSize: shapeSize }]}>{TILE_SHAPES[index]}</Text>
        {showLabel && label ? (
          <Text style={[styles.label, { fontSize: labelSize }]} numberOfLines={3}>{label}</Text>
        ) : null}
        {isCorrect && <Text style={styles.checkmark}>✓</Text>}
        {isWrong   && <Text style={styles.checkmark}>✗</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  shape:    { color: 'white' },
  label: {
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
  },
  selected: { borderWidth: 4, borderColor: 'white' },
  correct:  { backgroundColor: '#22c55e', borderWidth: 4, borderColor: 'white' },
  wrong:    { opacity: 0.35 },
  checkmark: { fontSize: 24, fontWeight: '900', color: 'white' },
});
