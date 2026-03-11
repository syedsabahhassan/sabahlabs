import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useGame } from '../context/GameContext';
import { colors, TEAM_PALETTE } from '../constants/theme';

const TEAMS = ['Red', 'Blue', 'Green', 'Yellow'];

export default function JoinScreen({ navigation, route }) {
  const { joinRoom, state } = useGame();
  const [roomCode, setRoomCode]   = useState(route.params?.roomCode || '');
  const [playerName, setName]     = useState('');
  const [teamName, setTeamName]   = useState(null);
  const [showTeams, setShowTeams] = useState(false);

  // Navigate when join succeeds
  useEffect(() => {
    if (state.gamePhase === 'lobby') {
      navigation.replace('Waiting');
    }
  }, [state.gamePhase]);

  const handleJoin = () => {
    if (roomCode.trim().length < 4 || !playerName.trim()) return;
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim(), teamName);
  };

  return (
    <LinearGradient colors={['#0f0f1a', '#1a1a3e']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.emoji}>🙋</Text>
              <Text style={styles.title}>Join a Game</Text>
              <Text style={styles.subtitle}>Enter the PIN from the host screen</Text>
            </View>

            {/* Error */}
            {state.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {state.error}</Text>
              </View>
            )}

            {/* Game PIN */}
            <View style={styles.field}>
              <Text style={styles.label}>GAME PIN</Text>
              <TextInput
                style={styles.pinInput}
                value={roomCode}
                onChangeText={(t) => setRoomCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="ENTER PIN"
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                returnKeyType="next"
              />
            </View>

            {/* Display name */}
            <View style={styles.field}>
              <Text style={styles.label}>YOUR NAME</Text>
              <TextInput
                style={styles.input}
                value={playerName}
                onChangeText={(t) => setName(t.slice(0, 20))}
                placeholder="Enter display name"
                placeholderTextColor={colors.textDim}
                autoCorrect={false}
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={handleJoin}
              />
            </View>

            {/* Team mode toggle */}
            <TouchableOpacity onPress={() => setShowTeams(!showTeams)} style={styles.teamToggle}>
              <Text style={styles.teamToggleText}>
                {showTeams ? '🔼 Hide team selection' : '🔽 Join a team (optional)'}
              </Text>
            </TouchableOpacity>

            {showTeams && (
              <View>
                <Text style={[styles.label, { marginBottom: 10 }]}>SELECT TEAM</Text>
                <View style={styles.teamGrid}>
                  {TEAMS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[
                        styles.teamBtn,
                        { backgroundColor: TEAM_PALETTE[t] },
                        teamName === t && styles.teamSelected,
                      ]}
                      onPress={() => setTeamName(teamName === t ? null : t)}
                    >
                      <Text style={styles.teamBtnText}>{teamName === t ? '✓ ' : ''}{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Join button */}
            <TouchableOpacity
              style={[
                styles.joinBtn,
                (!roomCode.trim() || !playerName.trim()) && styles.joinBtnDisabled,
              ]}
              onPress={handleJoin}
              disabled={!roomCode.trim() || !playerName.trim()}
            >
              <Text style={styles.joinBtnText}>Let's Play! 🎮</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, gap: 20 },
  header: { alignItems: 'center', gap: 6, marginBottom: 8 },
  backBtn:{ alignSelf: 'flex-start', marginBottom: 8 },
  backText: { color: colors.textDim, fontWeight: '700', fontSize: 15 },
  emoji:  { fontSize: 40 },
  title:  { fontSize: 28, fontWeight: '900', color: colors.white },
  subtitle: { fontSize: 14, color: colors.textDim, fontWeight: '600', textAlign: 'center' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1, borderColor: colors.danger,
    borderRadius: 12, padding: 14,
  },
  errorText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  field:   { gap: 8 },
  label:   { fontSize: 12, fontWeight: '800', color: colors.textDim, letterSpacing: 1, textTransform: 'uppercase' },
  pinInput: {
    backgroundColor: colors.darker,
    borderWidth: 2, borderColor: colors.purple,
    borderRadius: 16, padding: 18,
    fontSize: 28, fontWeight: '900', color: colors.white,
    textAlign: 'center', letterSpacing: 8,
  },
  input: {
    backgroundColor: colors.darker,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, padding: 16,
    fontSize: 16, fontWeight: '700', color: colors.white,
  },
  teamToggle: { alignSelf: 'flex-start' },
  teamToggleText: { color: colors.purpleLight, fontWeight: '700', fontSize: 14 },
  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  teamBtn: {
    flex: 1, minWidth: '40%', padding: 14,
    borderRadius: 14, alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  teamSelected: { borderColor: colors.white },
  teamBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  joinBtn: {
    backgroundColor: colors.purple,
    borderRadius: 18, padding: 20,
    alignItems: 'center', marginTop: 8,
    shadowColor: colors.purple, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  joinBtnDisabled: { opacity: 0.5 },
  joinBtnText: { fontSize: 18, fontWeight: '900', color: colors.white },
});
