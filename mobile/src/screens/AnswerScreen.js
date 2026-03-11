import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import AnswerTile from '../components/AnswerTile';
import TimerBar from '../components/TimerBar';
import StreakBadge from '../components/StreakBadge';
import useSound from '../hooks/useSound';
import { colors } from '../constants/theme';

export default function AnswerScreen({ navigation }) {
  const { state, submitAnswer } = useGame();
  const { play } = useSound();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Route changes based on game phase
  useEffect(() => {
    if (state.gamePhase === 'reveal')   navigation.replace('Result');
    if (state.gamePhase === 'finished') navigation.replace('Final');
  }, [state.gamePhase]);

  // Fade in on mount
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  // Sound when question starts
  useEffect(() => {
    if (state.questionData) play('reveal');
  }, [state.questionData?.questionIndex]);

  const { questionData, timeRemaining, myAnswer, answerLocked, currentStreak } = state;
  if (!questionData) return null;

  const handleTap = (index) => {
    if (answerLocked) return;
    play('correct'); // Play tap sound; server will say if right/wrong
    submitAnswer(index);
  };

  const hasAnswered = myAnswer !== null;

  return (
    <LinearGradient colors={['#0f0f1a', '#1a1a3e']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Text style={styles.qCounter}>
              Q{questionData.questionIndex + 1}/{questionData.totalQuestions}
            </Text>
            {state.teamName && (
              <Text style={styles.teamLabel}>Team {state.teamName}</Text>
            )}
          </View>

          {/* Timer */}
          <View style={styles.timerSection}>
            <TimerBar timeRemaining={timeRemaining} timeLimit={questionData.timeLimit} />
          </View>

          {/* Streak badge */}
          <StreakBadge streak={currentStreak} />

          {/* Main content */}
          <View style={styles.content}>
            {!hasAnswered ? (
              <>
                <Text style={styles.instruction}>🎯 Choose your answer!</Text>
                <View style={styles.grid}>
                  <View style={styles.row}>
                    <AnswerTile index={0} onPress={handleTap} disabled={answerLocked} />
                    <AnswerTile index={1} onPress={handleTap} disabled={answerLocked} />
                  </View>
                  <View style={styles.row}>
                    <AnswerTile index={2} onPress={handleTap} disabled={answerLocked} />
                    <AnswerTile index={3} onPress={handleTap} disabled={answerLocked} />
                  </View>
                </View>
              </>
            ) : (
              /* Submitted state */
              <View style={styles.submittedState}>
                <Text style={styles.submittedShape}>
                  {['▲', '◆', '●', '■'][myAnswer]}
                </Text>
                <View style={[styles.submittedChip, { backgroundColor: ['#e74c3c','#2980b9','#e67e22','#27ae60'][myAnswer] }]}>
                  <Text style={styles.submittedChipText}>
                    {['Triangle', 'Diamond', 'Circle', 'Square'][myAnswer]} selected
                  </Text>
                </View>
                <View style={styles.spinnerRow}>
                  <View style={styles.spinner} />
                  <Text style={styles.waitText}>Answer locked! Waiting for results…</Text>
                </View>
              </View>
            )}
          </View>

          {/* Score display */}
          <View style={styles.scoreBar}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.scoreValue}>{state.currentScore.toLocaleString()}</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  qCounter:    { color: colors.textDim, fontWeight: '800', fontSize: 15 },
  teamLabel:   { color: colors.purpleLight, fontWeight: '800', fontSize: 13 },
  timerSection:{ paddingHorizontal: 20, marginBottom: 8 },
  content:     { flex: 1, padding: 16, justifyContent: 'center', gap: 16 },
  instruction: { textAlign: 'center', color: colors.textDim, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  grid:        { gap: 12 },
  row:         { flexDirection: 'row', gap: 12 },
  submittedState: { alignItems: 'center', gap: 20 },
  submittedShape: { fontSize: 80 },
  submittedChip:  { borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  submittedChipText: { color: colors.white, fontWeight: '900', fontSize: 16 },
  spinnerRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  spinner: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 3, borderColor: colors.purpleLight, borderTopColor: 'transparent',
  },
  waitText:    { color: colors.textDim, fontWeight: '700', fontSize: 14 },
  scoreBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  scoreLabel: { color: colors.textDim, fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  scoreValue: { color: colors.purpleLight, fontWeight: '900', fontSize: 20 },
});
