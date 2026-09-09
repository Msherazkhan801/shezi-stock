import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import { IndustrySelectScreen } from '../screens/IndustrySelectScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { useAuthStore } from '../store/useAuthStore';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  IndustrySelect: undefined;
  AdminCommandCenter: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { currentUser } = useAuthStore();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      {!currentUser ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : currentUser.role === 'super_admin' ? (
        <>
          <Stack.Screen name="AdminCommandCenter" component={AdminDashboardScreen} />
          <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
          <Stack.Screen
            name="IndustrySelect"
            component={IndustrySelectScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
        </>
      ) : (
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      )}
    </Stack.Navigator>
  );
};
