import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ScanBarcode,
  TrendingUp,
  Settings,
} from 'lucide-react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PosScreen } from '../screens/PosScreen';
import { InventoryScreen } from '../screens/InventoryScreen';
import { StockAuditScreen } from '../screens/StockAuditScreen';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useAppStore } from '../store/useAppStore';
import { INDUSTRY_PRESETS } from '../config/industryPresets';

const Tab = createBottomTabNavigator();

export const BottomTabNavigator: React.FC = () => {
  const { activeIndustry } = useAppStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#1E293B',
          height: Platform.OS === 'android' ? 62 : 60,
          paddingBottom: Platform.OS === 'android' ? 8 : 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: preset.accentColor,
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: -0.2,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="POS"
        component={PosScreen}
        options={{
          tabBarLabel: 'POS',
          tabBarIcon: ({ color, size }) => <ShoppingCart size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarLabel: 'Stock',
          tabBarIcon: ({ color, size }) => <Boxes size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Audit"
        component={StockAuditScreen}
        options={{
          tabBarLabel: 'Audit',
          tabBarIcon: ({ color, size }) => <ScanBarcode size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ color, size }) => <TrendingUp size={20} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={20} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};
