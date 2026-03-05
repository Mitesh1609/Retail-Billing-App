import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase } from './database/db';

import DashboardScreen from './screens/DashboardScreen';
import BillingScreen from './screens/BillingScreen';
import ProductsScreen from './screens/ProductsScreen';
import CustomersScreen from './screens/CustomersScreen';
import BillsScreen from './screens/BillsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDatabase()
      .then(() => {
        console.log('✅ Database ready!');
        setDbReady(true);
      })
      .catch((err) => {
        console.log('❌ DB Error:', err);
        setError(err.message);
      });
  }, []);

  // Show error screen if DB fails
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>❌ App Error</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#2563EB',
            tabBarInactiveTintColor: '#9CA3AF',
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
              paddingBottom: 6,
              paddingTop: 6,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Dashboard') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'NewBill') {
                iconName = focused ? 'add-circle' : 'add-circle-outline';
              } else if (route.name === 'Products') {
                iconName = focused ? 'cube' : 'cube-outline';
              } else if (route.name === 'Customers') {
                iconName = focused ? 'people' : 'people-outline';
              } else if (route.name === 'Bills') {
                iconName = focused ? 'receipt' : 'receipt-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
          <Tab.Screen name="NewBill" component={BillingScreen} options={{ tabBarLabel: 'New Bill' }} />
          <Tab.Screen name="Products" component={ProductsScreen} options={{ tabBarLabel: 'Products' }} />
          <Tab.Screen name="Customers" component={CustomersScreen} options={{ tabBarLabel: 'Customers' }} />
          <Tab.Screen name="Bills" component={BillsScreen} options={{ tabBarLabel: 'Bills' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});