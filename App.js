import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { getDatabase } from './database/db';
import { registerForPushNotifications } from './utils/notifications';
import { syncProducts } from './utils/api';
import { getAllProducts } from './database/productQueries';

import DashboardScreen from './screens/DashboardScreen';
import BillingScreen from './screens/BillingScreen';
import ProductsScreen from './screens/ProductsScreen';
import CustomersScreen from './screens/CustomersScreen';
import BillsScreen from './screens/BillsScreen';
import AddProductScreen from './screens/AddProductScreen';
import AddCustomerScreen from './screens/AddCustomerScreen';
import SettingsScreen from './screens/SettingsScreen';
import OnlineOrdersScreen from './screens/OnlineOrdersScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductsList" component={ProductsScreen} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
    </Stack.Navigator>
  );
}

function CustomersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CustomersList" component={CustomersScreen} />
      <Stack.Screen name="AddCustomer" component={AddCustomerScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState(null);

  // ⚠️ ALL hooks must be here — before any conditional returns!
  const notificationListener = useRef();
  const responseListener = useRef();

  // DB init
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

  // Push notifications + product sync
  useEffect(() => {
    if (!dbReady) return;

    const setup = async () => {
      const token = await registerForPushNotifications();
      const products = await getAllProducts();
      await syncProducts(products, token);
      global.pushToken = token;
    };

    setup();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [dbReady]);

  // Conditional returns AFTER all hooks
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
            tabBarHideOnKeyboard: true,
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
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              } else if (route.name === 'Online') {
                iconName = focused ? 'globe' : 'globe-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
          <Tab.Screen name="NewBill" component={BillingScreen} options={{ tabBarLabel: 'New Bill' }} />
          <Tab.Screen name="Products" component={ProductsStack} options={{ tabBarLabel: 'Products' }} />
          <Tab.Screen name="Customers" component={CustomersStack} options={{ tabBarLabel: 'Customers' }} />
          <Tab.Screen name="Bills" component={BillsScreen} options={{ tabBarLabel: 'Bills' }} />
          <Tab.Screen name="Online" component={OnlineOrdersScreen} options={{ tabBarLabel: 'Online' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
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