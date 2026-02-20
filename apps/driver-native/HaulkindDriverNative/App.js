import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { View, Text, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LoginScreen,
  SignupScreen,
  PendingScreen,
  HomeScreen,
  OrderDetailScreen,
  ActiveOrderScreen,
  ProfileScreen,
  OrderHistoryScreen,
  EarningsScreen,
  SettingsScreen,
  DocumentsScreen,
} from './src/screens';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const COLORS = {
  primary: '#1a56db',
  primaryLight: '#dbeafe',
  dark: '#111827',
  gray: '#6b7280',
  white: '#ffffff',
  danger: '#dc2626',
};

// Custom Drawer Content
function CustomDrawerContent(props) {
  const { navigation } = props;
  const [driverName, setDriverName] = useState('Driver');
  const [driverEmail, setDriverEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setDriverName(user.name || 'Driver');
        setDriverEmail(user.email || '');
      }
    } catch (e) {}
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await AsyncStorage.multiRemove(['driver_token', 'driver_data', 'user_data']);
          props.navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      },
    ]);
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1 }}>
      {/* Header */}
      <View style={{ padding: 20, backgroundColor: COLORS.primary, marginTop: -4 }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.white }}>{(driverName || 'D')[0].toUpperCase()}</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>{driverName}</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{driverEmail}</Text>
      </View>

      {/* Menu Items */}
      <View style={{ flex: 1, paddingTop: 8 }}>
        <DrawerItemList {...props} />
      </View>

      {/* Logout */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 16 }}>
        <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.danger }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

// Drawer Navigator (Main App)
function MainDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: COLORS.primary,
        drawerInactiveTintColor: COLORS.gray,
        drawerLabelStyle: { fontSize: 15, fontWeight: '600', marginLeft: -8 },
        drawerItemStyle: { borderRadius: 8, paddingVertical: 2 },
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} options={{ drawerLabel: 'Dashboard' }} />
      <Drawer.Screen name="Profile" component={ProfileScreen} options={{ drawerLabel: 'My Profile' }} />
      <Drawer.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ drawerLabel: 'Order History' }} />
      <Drawer.Screen name="Earnings" component={EarningsScreen} options={{ drawerLabel: 'Earnings' }} />
      <Drawer.Screen name="Documents" component={DocumentsScreen} options={{ drawerLabel: 'My Documents' }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ drawerLabel: 'Settings' }} />
    </Drawer.Navigator>
  );
}

// Loading Screen
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
      <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: 16 }}>Haulkind</Text>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('driver_token');
      if (!token) {
        setInitialRoute('Login');
        return;
      }
      // Try to get driver status
      const driverData = await AsyncStorage.getItem('driver_data');
      if (driverData) {
        const driver = JSON.parse(driverData);
        if (driver.status === 'pending') {
          setInitialRoute('Pending');
        } else if (driver.status === 'approved' || driver.status === 'active') {
          setInitialRoute('Main');
        } else {
          setInitialRoute('Login');
        }
      } else {
        setInitialRoute('Main');
      }
    } catch (e) {
      setInitialRoute('Login');
    }
  };

  if (!initialRoute) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Pending" component={PendingScreen} />
        <Stack.Screen name="Main" component={MainDrawer} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="ActiveOrder" component={ActiveOrderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
