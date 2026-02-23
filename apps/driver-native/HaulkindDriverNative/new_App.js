import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, SafeAreaView,
  StatusBar, ActivityIndicator, Alert, Animated, Dimensions,
  ScrollView, Pressable,
} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { menuEmitter } from './src/menuEmitter';
import {
  LoginScreen, SignupScreen, HomeScreen,
  PendingScreen, ProfileScreen, OrderHistoryScreen,
  EarningsScreen, DocumentsScreen, SettingsScreen,
  OrderDetailScreen, ActiveOrderScreen, MyOrdersScreen,
} from './src/new_screens';
import { OnboardingScreen } from './src/screens/new_OnboardingScreen';

const COLORS = {
  primary: '#1a3a4a',
  primaryLight: '#2d5f73',
  accent: '#e8b84b',
  white: '#ffffff',
  gray: '#6b7280',
  grayLight: '#f3f4f6',
  danger: '#ef4444',
  dark: '#111827',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;
const Stack = createNativeStackNavigator();

// Side Menu (Modal-based drawer)
function SideMenu({ visible, onClose, navigation }) {
  const [driverName, setDriverName] = useState('Driver');
  const [driverEmail, setDriverEmail] = useState('');
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    loadDriverInfo();
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(-DRAWER_WIDTH);
    }
  }, [visible]);

  const loadDriverInfo = async () => {
    try {
      const driverData = await AsyncStorage.getItem('driver_data');
      if (driverData) {
        const d = JSON.parse(driverData);
        setDriverName(d.name || d.firstName || 'Driver');
        setDriverEmail(d.email || '');
      }
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const u = JSON.parse(userData);
        if (!driverName || driverName === 'Driver') setDriverName(u.name || 'Driver');
        if (!driverEmail) setDriverEmail(u.email || '');
      }
    } catch (e) {}
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -DRAWER_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const navigateTo = (screen) => {
    handleClose();
    setTimeout(() => {
      navigation.navigate(screen);
    }, 100);
  };

  const handleLogout = () => {
    handleClose();
    setTimeout(() => {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out', style: 'destructive', onPress: async () => {
            await AsyncStorage.multiRemove(['driver_token', 'driver_data', 'user_data']);
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          }
        },
      ]);
    }, 300);
  };

  const menuItems = [
    { label: 'Dashboard', screen: 'Home', icon: 'H' },
    { label: 'My Profile', screen: 'Profile', icon: 'P' },
    { label: 'My Orders', screen: 'MyOrders', icon: 'M' },
    { label: 'Order History', screen: 'OrderHistory', icon: 'O' },
    { label: 'Earnings', screen: 'Earnings', icon: 'E' },
    { label: 'My Documents', screen: 'Documents', icon: 'D' },
    { label: 'Settings', screen: 'Settings', icon: 'S' },
  ];

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Animated.View
          style={{
            width: DRAWER_WIDTH,
            backgroundColor: COLORS.white,
            transform: [{ translateX: slideAnim }],
            elevation: 20,
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
          }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{
              backgroundColor: COLORS.primary,
              paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 48,
              paddingBottom: 20,
              paddingHorizontal: 20,
            }}>
              <TouchableOpacity onPress={handleClose} style={{ position: 'absolute', top: StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 40, left: 16, zIndex: 10 }}>
                <Text style={{ fontSize: 22, color: COLORS.white }}>{'<'}</Text>
              </TouchableOpacity>
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: 'rgba(255,255,255,0.2)',
                justifyContent: 'center', alignItems: 'center',
                marginBottom: 10, marginTop: 8,
              }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.white }}>
                  {(driverName || 'D')[0].toUpperCase()}
                </Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>{driverName}</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{driverEmail}</Text>
            </View>
            <ScrollView style={{ flex: 1, paddingTop: 8 }}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => navigateTo(item.screen)}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 14, paddingHorizontal: 20,
                    marginHorizontal: 8, borderRadius: 8,
                  }}
                  activeOpacity={0.7}
                >
                  <View style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: COLORS.grayLight,
                    justifyContent: 'center', alignItems: 'center', marginRight: 14,
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>{item.icon}</Text>
                  </View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: COLORS.dark }}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{ borderTopWidth: 1, borderTopColor: '#e5e7eb', padding: 16 }}>
              <TouchableOpacity
                onPress={handleLogout}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}
              >
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.danger }}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={handleClose}
        />
      </View>
    </Modal>
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

// Main App with Menu
function MainApp({ initialRoute }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const navigationRef = React.useRef(null);

  useEffect(() => {
    const unsub = menuEmitter.subscribe(() => setMenuVisible(true));
    return unsub;
  }, []);

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Pending" component={PendingScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
          <Stack.Screen name="Earnings" component={EarningsScreen} />
          <Stack.Screen name="Documents" component={DocumentsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="ActiveOrder" component={ActiveOrderScreen} />
          <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
        </Stack.Navigator>
        <SideMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          navigation={navigationRef.current}
        />
      </NavigationContainer>
    </>
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
      const driverData = await AsyncStorage.getItem('driver_data');
      if (driverData) {
        const driver = JSON.parse(driverData);
        if (driver.status === 'pending') {
          setInitialRoute('Pending');
        } else if (driver.status === 'approved' || driver.status === 'active') {
          setInitialRoute('Home');
        } else {
          setInitialRoute('Login');
        }
      } else {
        setInitialRoute('Home');
      }
    } catch (e) {
      setInitialRoute('Login');
    }
  };

  if (!initialRoute) return <LoadingScreen />;
  return <MainApp initialRoute={initialRoute} />;
}
