import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import Leaderboard from '../components/Leaderboard';
import { colors } from '../constants/theme';

export default function LeaderboardScreen({ navigation }) {
  const { state } = useGame();

  useEffect(() => {
    if (state.gamePhase === 'question')  navigation.replace('Answer');
    if (state.gamePhase === 'finished')  navigation.replace('Final');
  }, [state.gamePhase]);

  const myEntry = state.leaderboard.find((e) => e.name === state.playerName);

  return (
    <LinearGradient colors={['#0f0f1a', '#1a1a3e']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>🏆 Leaderboard</Text>

          {myEntry && (
            <View style={styles.myRank}>
              <Text style={styles.myRankLabel}>YOUR RANK</Text>
              <Text style={styles.myRankValue}>#{myEntry.rank}</Text>
              <Text style={styles.myScore}>{myEntry.score.toLocaleString()} pts</Text>
            </View>
          )}

          <Leaderboard
            entries={state.leaderboard}
            highlightName={state.playerName}
          />

          <View style={styles.waitSection}>
            <View style={styles.spinner} />
            <Text style={styles.waitText}>Waiting for next question…</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  title:  { fontSize: 28, fontWeight: '900', color: colors.white, textAlign: 'center' },
  myRank: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 2, borderColor: colors.purple, gap: 4,
  },
  myRankLabel: { color: colors.textDim, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  myRankValue: { fontSize: 36, fontWeight: '900', color: colors.white },
  myScore:     { color: colors.purpleLight, fontWeight: '800', fontSize: 16 },
  waitSection: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center', paddingTop: 8 },
  spinner: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 3, borderColor: colors.purpleLight, borderTopColor: 'transparent',
  },
  waitText: { color: colors.textDim, fontWeight: '700', fontSize: 14 },
});
