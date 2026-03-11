import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LandingScreen     from '../screens/LandingScreen';
import JoinScreen        from '../screens/JoinScreen';
import WaitingScreen     from '../screens/WaitingScreen';
import AnswerScreen      from '../screens/AnswerScreen';
import ResultScreen      from '../screens/ResultScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import FinalScreen       from '../screens/FinalScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{ headerShown: false, animation: 'fade' }}
      >
        <Stack.Screen name="Landing"     component={LandingScreen} />
        <Stack.Screen name="Join"        component={JoinScreen} />
        <Stack.Screen name="Waiting"     component={WaitingScreen} />
        <Stack.Screen name="Answer"      component={AnswerScreen} />
        <Stack.Screen name="Result"      component={ResultScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="Final"       component={FinalScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
