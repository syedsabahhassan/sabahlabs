import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import Leaderboard from '../components/Leaderboard';
import useSound from '../hooks/useSound';
import { colors } from '../constants/theme';

const PODIUM_EMOJI = ['🥇', '🥈', '🥉'];

export default function FinalScreen({ navigation }) {
  const { state, reset } = useGame();
  const { play } = useSound();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  const { finalLeaderboard, playerName, currentScore } = state;

  useEffect(() => {
    play('podium');
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(bounceAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const myRank   = finalLeaderboard.findIndex((e) => e.name === playerName) + 1;
  const podium   = finalLeaderboard.slice(0, 3);
  const ordered  = [podium[1], podium[0], podium[2]]; // 2nd-1st-3rd visual layout

  const handlePlayAgain = () => {
    reset();
    navigation.replace('Landing');
  };

  return (
    <LinearGradient colors={['#0f0f1a', '#1a0a3e']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Animated.ScrollView
          style={{ opacity: fadeAnim }}
          contentContainerStyle={styles.scroll}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.trophyEmoji}>🏆</Text>
            <Text style={styles.title}>Game Over!</Text>
          </View>

          {/* My result card */}
          <Animated.View
            style={[styles.myCard, { transform: [{ scale: bounceAnim }] }]}
          >
            <Text style={styles.myCardLabel}>YOUR RESULT</Text>
            <Text style={styles.myName}>{playerName}</Text>
            <View style={styles.myStats}>
              <View style={styles.myStat}>
                <Text style={styles.myStatLabel}>RANK</Text>
                <Text style={styles.myStatValue}>
                  {myRank <= 3 ? PODIUM_EMOJI[myRank - 1] : `#${myRank}`}
                </Text>
              </View>
              <View style={styles.myStatDivider} />
              <View style={styles.myStat}>
                <Text style={styles.myStatLabel}>SCORE</Text>
                <Text style={[styles.myStatValue, { color: colors.purpleLight }]}>
                  {currentScore.toLocaleString()}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Mini podium */}
          {podium.length >= 1 && (
            <View style={styles.podiumSection}>
              <Text style={styles.podiumTitle}>Top Players</Text>
              <View style={styles.podium}>
                {ordered.map((entry, i) => {
                  if (!entry) return <View key={i} style={{ flex: 1 }} />;
                  const heights = [100, 130, 80];
                  const bgColors = ['#4b5563', '#d97706', '#7c2d12'];
                  return (
                    <View key={entry.name} style={styles.podiumPlace}>
                      <Text style={styles.podiumEmoji}>{PODIUM_EMOJI[i]}</Text>
                      <Text style={styles.podiumName} numberOfLines={1}>{entry.name}</Text>
                      <View style={[styles.podiumBlock, { height: heights[i], backgroundColor: bgColors[i] }]}>
                        <Text style={styles.podiumBlockEmoji}>{PODIUM_EMOJI[i]}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Full leaderboard */}
          <View>
            <Text style={styles.sectionTitle}>All Scores</Text>
            <Leaderboard entries={finalLeaderboard} highlightName={playerName} maxRows={15} />
          </View>

          {/* Play again */}
          <TouchableOpacity style={styles.playAgainBtn} onPress={handlePlayAgain}>
            <Text style={styles.playAgainText}>🎮 Play Again</Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 20, gap: 24, paddingBottom: 50 },
  header: { alignItems: 'center', gap: 4 },
  trophyEmoji: { fontSize: 52 },
  title:       { fontSize: 32, fontWeight: '900', color: '#fbbf24' },
  myCard: {
    backgroundColor: colors.surface, borderRadius: 20, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 10,
  },
  myCardLabel: { color: colors.textDim, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  myName:      { fontSize: 20, fontWeight: '900', color: colors.white },
  myStats:     { flexDirection: 'row', alignItems: 'center', gap: 0 },
  myStat:      { flex: 1, alignItems: 'center', gap: 4 },
  myStatDivider:{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  myStatLabel: { color: colors.textDim, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  myStatValue: { fontSize: 32, fontWeight: '900', color: colors.white },
  podiumSection:{ gap: 12 },
  podiumTitle: { fontSize: 16, fontWeight: '800', color: colors.textDim, textAlign: 'center' },
  podium:      { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  podiumPlace: { flex: 1, alignItems: 'center', gap: 6 },
  podiumEmoji: { fontSize: 24 },
  podiumName:  { fontSize: 11, fontWeight: '800', color: colors.white, textAlign: 'center' },
  podiumBlock: {
    width: '100%', borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  podiumBlockEmoji: { fontSize: 22 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textDim, marginBottom: 10, textAlign: 'center' },
  playAgainBtn: {
    backgroundColor: colors.purple, borderRadius: 18, padding: 20, alignItems: 'center',
    shadowColor: colors.purple, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  playAgainText: { fontSize: 18, fontWeight: '900', color: colors.white },
});
