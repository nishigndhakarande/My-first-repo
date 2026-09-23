import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { MoreScreen } from '../screens/MoreScreen';
import { BudgetScreen } from '../screens/BudgetScreen';
import { QualityScreen } from '../screens/QualityScreen';
import { DrawingsScreen } from '../screens/DrawingsScreen';
import { ApprovalsScreen } from '../screens/ApprovalsScreen';
import { VendorsScreen } from '../screens/VendorsScreen';
import { ClientPortalScreen } from '../screens/ClientPortalScreen';
import { AdminScreen } from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brandOrange,
        tabBarInactiveTintColor: '#7E86A8',
        tabBarStyle: {
          backgroundColor: colors.navy900,
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'ellipse';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'grid' : 'grid-outline';
          }

          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandOrange} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="Budget"
              component={BudgetScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Quality"
              component={QualityScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Drawings"
              component={DrawingsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Approvals"
              component={ApprovalsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Vendors"
              component={VendorsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ClientPortal"
              component={ClientPortalScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Admin"
              component={AdminScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.navy950,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
