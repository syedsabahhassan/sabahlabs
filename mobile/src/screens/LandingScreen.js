import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { colors } from '../constants/theme';

export default function LandingScreen({ navigation }) {
  const { state } = useGame();

  return (
    <LinearGradient colors={['#0f0f1a', '#1a1a3e']} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <Text style={styles.emoji}>🎮</Text>
            <Text style={styles.title}>SabahLabs</Text>
            <Text style={styles.subtitle}>Real-time multiplayer trivia</Text>
          </View>

          {/* Connection status */}
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: state.isConnected ? colors.success : colors.danger }]} />
            <Text style={styles.statusText}>
              {state.isConnected ? 'Connected to server' : 'Connecting…'}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, !state.isConnected && styles.btnDisabled]}
              onPress={() => navigation.navigate('Join')}
              disabled={!state.isConnected}
            >
              <Text style={styles.btnIcon}>🙋</Text>
              <Text style={styles.btnText}>Join a Game</Text>
            </TouchableOpacity>
          </View>

          {/* How to play */}
          <View style={styles.howTo}>
            <Text style={styles.howToTitle}>⚡ How to play</Text>
            {[
              ['📱', 'Enter the Game PIN from the host'],
              ['🎨', 'Tap a colored answer tile'],
              ['⚡', 'Faster correct answers = more points'],
              ['🔥', 'Keep a streak for bonus points!'],
            ].map(([icon, text]) => (
              <View key={text} style={styles.howToRow}>
                <Text style={styles.howToIcon}>{icon}</Text>
                <Text style={styles.howToText}>{text}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  container:  { flex: 1, padding: 24, justifyContent: 'center', gap: 28 },
  logoSection:{ alignItems: 'center', gap: 8 },
  emoji:      { fontSize: 60 },
  title: {
    fontSize: 42, fontWeight: '900', color: colors.white,
    textShadowColor: colors.purple, textShadowRadius: 20,
  },
  subtitle:   { fontSize: 16, color: colors.textDim, fontWeight: '600' },
  statusRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  dot:        { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: colors.textDim, fontWeight: '700', fontSize: 13 },
  buttons:    { gap: 14 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 20, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnPrimary:  { backgroundColor: colors.purple },
  btnDisabled: { opacity: 0.5 },
  btnIcon:     { fontSize: 24 },
  btnText:     { fontSize: 18, fontWeight: '800', color: colors.white },
  howTo: {
    backgroundColor: colors.surface,
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  howToTitle: { fontSize: 14, fontWeight: '800', color: colors.purpleLight, marginBottom: 4 },
  howToRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  howToIcon:  { fontSize: 18, width: 28 },
  howToText:  { fontSize: 13, color: colors.textDim, fontWeight: '600', flex: 1 },
});
