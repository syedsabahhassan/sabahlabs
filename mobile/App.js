import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Nunito_400Regular, Nunito_700Bold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GameProvider } from './src/context/GameContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f1a', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#7c3aed', fontSize: 32 }}>🎮</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <GameProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </GameProvider>
    </SafeAreaProvider>
  );
}
