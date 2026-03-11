import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import AnswerTile from '../components/AnswerTile';
import StreakBadge from '../components/StreakBadge';
import useSound from '../hooks/useSound';
import { colors } from '../constants/theme';

export default function ResultScreen({ navigation }) {
  const { state } = useGame();
  const { play } = useSound();
  const scaleAnim  = useRef(new Animated.Value(0.7)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  const { roundResult, currentScore, currentStreak } = state;

  // Navigate when next question starts
  useEffect(() => {
    if (state.gamePhase === 'question')  navigation.replace('Answer');
    if (state.gamePhase === 'finished')  navigation.replace('Final');
  }, [state.gamePhase]);

  // Entry animations + sound
  useEffect(() => {
    if (!roundResult) return;
    play(roundResult.isCorrect ? 'correct' : 'wrong');
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [roundResult]);

  if (!roundResult) return null;

  const { isCorrect, points, speedBonus, streakBonus, streakTier, totalScore, correctAnswerIndex, yourAnswerIndex } = roundResult;
  const noAnswer = yourAnswerIndex === null || yourAnswerIndex === undefined;

  const bannerColor  = noAnswer ? colors.surface2 : isCorrect ? '#14532d' : '#450a0a';
  const bannerBorder = noAnswer ? colors.textDim  : isCorrect ? colors.success : colors.danger;
  const resultEmoji  = noAnswer ? '⏰' : isCorrect ? '✅' : '❌';
  const resultText   = noAnswer ? "Time's Up!" : isCorrect ? 'Correct!' : 'Wrong!';

  return (
    <LinearGradient colors={['#0f0f1a', '#1a1a3e']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Result banner */}
          <Animated.View
            style={[
              styles.banner,
              { backgroundColor: bannerColor, borderColor: bannerBorder },
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.bannerEmoji}>{resultEmoji}</Text>
            <Text style={[styles.bannerText, { color: bannerBorder }]}>{resultText}</Text>
            {!noAnswer && (
              <Text style={styles.pointsText}>+{points.toLocaleString()} pts</Text>
            )}
          </Animated.View>

          {/* Streak */}
          <StreakBadge streak={currentStreak} />

          {/* Score breakdown */}
          {isCorrect && !noAnswer && (
            <View style={styles.breakdown}>
              <BreakdownRow label="Base points"  value={`+${(points - speedBonus - streakBonus).toLocaleString()}`} />
              <BreakdownRow label="Speed bonus"  value={`+${speedBonus.toLocaleString()}`} />
              {streakBonus > 0 && (
                <BreakdownRow label={`🔥 Streak ×${currentStreak}`} value={`+${streakBonus}`} highlight />
              )}
            </View>
          )}

          {/* Answer tiles */}
          <View style={styles.tilesSection}>
            <View style={styles.row}>
              {[0, 1].map((i) => (
                <AnswerTile
                  key={i} index={i}
                  onPress={() => {}}
                  disabled={true}
                  isCorrect={i === correctAnswerIndex}
                  isWrong={i !== correctAnswerIndex}
                  selected={i === yourAnswerIndex}
                />
              ))}
            </View>
            <View style={styles.row}>
              {[2, 3].map((i) => (
                <AnswerTile
                  key={i} index={i}
                  onPress={() => {}}
                  disabled={true}
                  isCorrect={i === correctAnswerIndex}
                  isWrong={i !== correctAnswerIndex}
                  selected={i === yourAnswerIndex}
                />
              ))}
            </View>
          </View>

          {/* Total score */}
          <View style={styles.totalScore}>
            <Text style={styles.totalLabel}>TOTAL SCORE</Text>
            <Text style={styles.totalValue}>{totalScore.toLocaleString()}</Text>
          </View>

          {/* Waiting message */}
          <View style={styles.waitSection}>
            <View style={styles.spinner} />
            <Text style={styles.waitText}>Waiting for next question…</Text>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function BreakdownRow({ label, value, highlight }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, highlight && { color: colors.warning }]}>{label}</Text>
      <Text style={[styles.breakdownValue, highlight && { color: colors.warning }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  banner: {
    borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 2, gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  bannerEmoji: { fontSize: 48 },
  bannerText:  { fontSize: 28, fontWeight: '900' },
  pointsText:  { fontSize: 36, fontWeight: '900', color: colors.success },
  breakdown: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', gap: 10,
  },
  breakdownRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownLabel:{ color: colors.textDim, fontWeight: '700', fontSize: 14 },
  breakdownValue:{ color: colors.white, fontWeight: '900', fontSize: 16 },
  tilesSection: { gap: 10 },
  row:          { flexDirection: 'row', gap: 10 },
  totalScore: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  totalLabel: { color: colors.textDim, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  totalValue: { color: colors.purpleLight, fontWeight: '900', fontSize: 40 },
  waitSection:{ flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
  spinner: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 3, borderColor: colors.purpleLight, borderTopColor: 'transparent',
  },
  waitText: { color: colors.textDim, fontWeight: '700', fontSize: 14 },
});
