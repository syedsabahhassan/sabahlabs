import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { colors, TEAM_PALETTE, TILE_SHAPES } from '../constants/theme';

export default function WaitingScreen({ navigation }) {
  const { state } = useGame();
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // Navigate when game starts
    if (state.gamePhase === 'question') navigation.replace('Answer');
    if (state.gamePhase === 'finished') navigation.replace('Final');
  }, [state.gamePhase]);

  useEffect(() => {
    // Pulsing animation
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const teamColor = state.teamName ? TEAM_PALETTE[state.teamName] : colors.purple;

  return (
    <LinearGradient colors={['#0f0f1a', '#1a1a3e']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>✓ Joined</Text>
          </View>

          <Text style={styles.waveEmoji}>👋</Text>
          <Text style={styles.title}>You're in!</Text>

          {/* Player name chip */}
          <View style={[styles.nameChip, { backgroundColor: teamColor }]}>
            <Text style={styles.nameText}>{state.playerName}</Text>
          </View>

          {/* Team badge */}
          {state.teamName && (
            <View style={[styles.teamChip, { backgroundColor: teamColor + '33', borderColor: teamColor }]}>
              <Text style={[styles.teamText, { color: teamColor }]}>Team {state.teamName}</Text>
            </View>
          )}

          {/* Room code */}
          <Text style={styles.roomCode}>
            PIN: <Text style={{ color: colors.white, fontWeight: '900' }}>{state.roomCode}</Text>
          </Text>

          {/* Waiting spinner */}
          <View style={styles.waitSection}>
            <Animated.View style={[styles.spinnerOuter, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.spinnerInner} />
            </Animated.View>
            <Text style={styles.waitText}>Waiting for the host to start…</Text>
          </View>

          {/* Preview tiles */}
          <View style={styles.previewTiles}>
            {TILE_SHAPES.map((shape, i) => (
              <View key={i} style={[styles.previewTile, { backgroundColor: ['#e74c3c','#2980b9','#e67e22','#27ae60'][i] }]}>
                <Text style={styles.previewShape}>{shape}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.previewHint}>Get ready to tap your answer!</Text>

          {/* Players joined count */}
          {state.playerList.length > 0 && (
            <Text style={styles.playerCount}>
              👥 {state.playerList.length} player{state.playerList.length !== 1 ? 's' : ''} joined
            </Text>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 18 },
  badge:     { backgroundColor: 'rgba(34,197,94,0.2)', borderWidth: 1, borderColor: colors.success, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6 },
  badgeText: { color: colors.success, fontWeight: '800', fontSize: 13 },
  waveEmoji: { fontSize: 48 },
  title:     { fontSize: 32, fontWeight: '900', color: colors.white },
  nameChip:  { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 999 },
  nameText:  { color: colors.white, fontWeight: '900', fontSize: 20 },
  teamChip:  { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, borderWidth: 2 },
  teamText:  { fontWeight: '800', fontSize: 14 },
  roomCode:  { color: colors.textDim, fontWeight: '700', fontSize: 14 },
  waitSection:  { alignItems: 'center', gap: 16 },
  spinnerOuter: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 4, borderColor: colors.purpleLight, borderTopColor: 'transparent',
  },
  spinnerInner: { flex: 1 },
  waitText:  { color: colors.textDim, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  previewTiles: { flexDirection: 'row', gap: 10, opacity: 0.35 },
  previewTile:  { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  previewShape: { fontSize: 24, color: colors.white },
  previewHint:  { color: colors.textDim, fontWeight: '600', fontSize: 13 },
  playerCount:  { color: colors.textDim, fontWeight: '700', fontSize: 14 },
});
