import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0B1120',
    card: '#0F172A',
    text: '#F8FAFC',
    border: '#1E293B',
    primary: '#38BDF8',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={customDarkTheme}>
        <StatusBar style="light" backgroundColor="#0F172A" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
