import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.neutral.medium,
        tabBarStyle: {
          backgroundColor: colors.backgroundPrimary,
          borderTopWidth: 1,
          borderTopColor: colors.neutral.light,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.backgroundPrimary,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
          color: colors.textPrimary,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          headerShown: false, // Custom header implemented in dashboard component
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'grid' : 'grid-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          headerShown: false, // Remove the top "Cards" header area
          title: 'Cards',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'card' : 'card-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="education"
        options={{
          headerShown: false, // Custom header in education component
          title: 'Learn',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'school' : 'school-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* Insights moved to Dashboard as per PRD Feature 5.3 */}
      <Tabs.Screen
        name="insights"
        options={{
          href: null, // Hidden from tab bar - accessible from Dashboard
        }}
      />
      {/* Achievements moved to Profile section as per PRD */}
      <Tabs.Screen
        name="achievements"
        options={{
          href: null, // Hidden from tab bar - accessible from Profile
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* Hide categories from tab bar but keep it accessible */}
      <Tabs.Screen
        name="categories"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
  );
}
