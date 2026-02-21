import { menuEmitter } from './menuEmitter';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, FlatList, RefreshControl, Switch, Linking,
  Dimensions, Image, StatusBar, SafeAreaView, Platform, BackHandler
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from './api';
import { API_URL } from './config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================================================
// COLORS & THEME
// ============================================================================
const COLORS = {
  primary: '#1a56db',
  primaryDark: '#1e40af',
  primaryLight: '#dbeafe',
  success: '#16a34a',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#dc2626',
  dangerLight: '#fee2e2',
  dark: '#111827',
  gray: '#6b7280',
  grayLight: '#f3f4f6',
  grayMedium: '#d1d5db',
  white: '#ffffff',
  bg: '#f9fafb',
};

// ============================================================================
// API HELPER
// ============================================================================
async function apiGet(path) {
  const token = await AsyncStorage.getItem('driver_token');
  const res = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function apiPostAuth(path, body) {
  const token = await AsyncStorage.getItem('driver_token');
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

async function apiPut(path, body) {
  const token = await AsyncStorage.getItem('driver_token');
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// ============================================================================
// LOGIN SCREEN
// ============================================================================
export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost('/driver/auth/login', { email: email.trim().toLowerCase(), password });
      await AsyncStorage.setItem('driver_token', data.token);
      await AsyncStorage.setItem('driver_data', JSON.stringify(data.driver || {}));
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user || {}));
      
      const driverStatus = data.driver?.status || 'pending';
      if (driverStatus === 'pending') {
        navigation.reset({ index: 0, routes: [{ name: 'Pending' }] });
      } else if (driverStatus === 'approved' || driverStatus === 'active') {
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        Alert.alert('Account Blocked', 'Your account has been blocked. Please contact support.');
      }
    } catch (e) {
      Alert.alert('Login Failed', e.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: COLORS.primary }}>Haulkind</Text>
          <Text style={{ fontSize: 16, color: COLORS.gray, marginTop: 4 }}>Driver App</Text>
        </View>

        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 24 }}>Sign In</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@example.com"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Password</Text>
        <View style={{ position: 'relative' }}>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={{ position: 'absolute', right: 16, top: 14 }}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => navigation.navigate('Signup')}>
          <Text style={{ color: COLORS.gray }}>
            Don't have an account? <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// SIGNUP SCREEN - ALL FIELDS IN ONE FORM
// ============================================================================
export function SignupScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhone = (text) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 10);
    if (cleaned.length >= 7) return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
    if (cleaned.length >= 4) return `(${cleaned.slice(0,3)}) ${cleaned.slice(3)}`;
    if (cleaned.length > 0) return `(${cleaned}`;
    return '';
  };

  const handleSignup = async () => {
    if (!firstName.trim()) { Alert.alert('Error', 'First name is required'); return; }
    if (!lastName.trim()) { Alert.alert('Error', 'Last name is required'); return; }
    if (!email.trim()) { Alert.alert('Error', 'Email is required'); return; }
    if (!phone.trim()) { Alert.alert('Error', 'Phone number is required'); return; }
    if (!address.trim()) { Alert.alert('Error', 'Street address is required'); return; }
    if (!city.trim()) { Alert.alert('Error', 'City is required'); return; }
    if (!state.trim()) { Alert.alert('Error', 'State is required'); return; }
    if (!zipCode.trim()) { Alert.alert('Error', 'ZIP code is required'); return; }
    if (!password || password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }

    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const data = await apiPost('/driver/auth/signup', {
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ''),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        password,
      });
      await AsyncStorage.setItem('driver_token', data.token);
      await AsyncStorage.setItem('driver_data', JSON.stringify(data.driver || {}));
      navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
    } catch (e) {
      Alert.alert('Signup Failed', e.message || 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.white }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.primary, marginBottom: 4 }}>Create Account</Text>
        <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 24 }}>Fill in all your details to get started</Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput style={styles.input} placeholder="John" placeholderTextColor="#9ca3af" value={firstName} onChangeText={setFirstName} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput style={styles.input} placeholder="Smith" placeholderTextColor="#9ca3af" value={lastName} onChangeText={setLastName} />
          </View>
        </View>

        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} placeholder="your.email@example.com" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput style={styles.input} placeholder="(555) 123-4567" placeholderTextColor="#9ca3af" value={phone} onChangeText={(t) => setPhone(formatPhone(t))} keyboardType="phone-pad" />

        <Text style={styles.label}>Street Address *</Text>
        <TextInput style={styles.input} placeholder="123 Main Street" placeholderTextColor="#9ca3af" value={address} onChangeText={setAddress} />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 2 }}>
            <Text style={styles.label}>City *</Text>
            <TextInput style={styles.input} placeholder="Miami" placeholderTextColor="#9ca3af" value={city} onChangeText={setCity} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>State *</Text>
            <TextInput style={styles.input} placeholder="FL" placeholderTextColor="#9ca3af" value={state} onChangeText={setState} maxLength={2} autoCapitalize="characters" />
          </View>
        </View>

        <Text style={styles.label}>ZIP Code *</Text>
        <TextInput style={styles.input} placeholder="33101" placeholderTextColor="#9ca3af" value={zipCode} onChangeText={setZipCode} keyboardType="number-pad" maxLength={5} />

        <Text style={styles.label}>Password *</Text>
        <TextInput style={styles.input} placeholder="At least 6 characters" placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} secureTextEntry />

        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput style={styles.input} placeholder="Re-enter your password" placeholderTextColor="#9ca3af" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

        <TouchableOpacity
          style={[styles.btnPrimary, loading && { opacity: 0.7 }, { marginTop: 8 }]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => navigation.goBack()}>
          <Text style={{ color: COLORS.gray }}>
            Already have an account? <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// PENDING SCREEN - Waiting for admin approval
// ============================================================================
export function PendingScreen({ navigation }) {
  const [checking, setChecking] = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const data = await apiGet('/driver/profile');
      if (data.driver?.status === 'approved' || data.driver?.status === 'active') {
        Alert.alert('Approved!', 'Your account has been approved. Welcome!');
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        Alert.alert('Still Pending', 'Your account is still under review. Please check back later.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not check status. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['driver_token', 'driver_data', 'user_data']);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.warningLight, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 36 }}>...</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 8, textAlign: 'center' }}>Account Under Review</Text>
        <Text style={{ fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          We are verifying your documents and information. You will be notified when your account is approved. This usually takes 24-48 hours.
        </Text>

        <TouchableOpacity
          style={[styles.btnPrimary, { width: '100%' }, checking && { opacity: 0.7 }]}
          onPress={checkStatus}
          disabled={checking}
        >
          {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Check Status</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 20 }} onPress={handleLogout}>
          <Text style={{ color: COLORS.danger, fontWeight: '600' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// HOME SCREEN - Main dashboard with online toggle and available orders
// ============================================================================
export function HomeScreen({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [driverName, setDriverName] = useState('Driver');
  const [stats, setStats] = useState({ todayEarnings: 0, completedToday: 0, totalCompleted: 0 });

  useEffect(() => {
    loadDriverData();
    loadOrders();
  }, []);

  const loadDriverData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        setDriverName(user.name || 'Driver');
      }
    } catch (e) {}
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/driver/orders/available');
      setOrders(data.orders || []);
    } catch (e) {
      // Silently fail - orders may not be available yet
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleOnline = async () => {
    try {
      await apiPostAuth('/driver/online', { online: !isOnline });
      setIsOnline(!isOnline);
      if (!isOnline) {
        loadOrders();
      }
    } catch (e) {
      // Toggle locally even if API fails
      setIsOnline(!isOnline);
    }
  };

  const getServiceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'junk_removal': return 'JR';
      case 'moving_help': return 'MH';
      case 'haul_away': return 'HA';
      default: return 'SV';
    }
  };

  const getServiceName = (type) => {
    switch (type?.toLowerCase()) {
      case 'junk_removal': return 'Junk Removal';
      case 'moving_help': return 'Moving Help';
      case 'haul_away': return 'Haul Away';
      default: return type || 'Service';
    }
  };

  const renderOrder = ({ item }) => {
    const pricing = typeof item.pricing_json === 'string' ? JSON.parse(item.pricing_json) : (item.pricing_json || {});
    const items = typeof item.items_json === 'string' ? JSON.parse(item.items_json) : (item.items_json || []);
    const totalPrice = pricing.total || pricing.estimatedTotal || 0;
    const itemsList = Array.isArray(items) ? items.map(i => i.name || i.item || i).join(', ') : '';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { order: item })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.primary }}>{getServiceIcon(item.service_type)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.dark }}>{getServiceName(item.service_type)}</Text>
            <Text style={{ fontSize: 13, color: COLORS.gray }}>{item.pickup_date} - {item.pickup_time_window}</Text>
          </View>
          {totalPrice > 0 && (
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.success }}>${totalPrice}</Text>
          )}
        </View>

        <View style={{ backgroundColor: COLORS.grayLight, borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.dark }}>{item.street}</Text>
          <Text style={{ fontSize: 13, color: COLORS.gray }}>{item.city}, {item.state} {item.zip}</Text>
        </View>

        {itemsList ? (
          <Text style={{ fontSize: 13, color: COLORS.gray }} numberOfLines={2}>Items: {itemsList}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.grayMedium }}>
        <TouchableOpacity onPress={() => menuEmitter.open()}>
          <View style={{ width: 32, height: 24, justifyContent: 'space-between' }}>
            <View style={{ height: 3, backgroundColor: COLORS.dark, borderRadius: 2 }} />
            <View style={{ height: 3, backgroundColor: COLORS.dark, borderRadius: 2 }} />
            <View style={{ height: 3, backgroundColor: COLORS.dark, borderRadius: 2 }} />
          </View>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark }}>Haulkind Driver</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: isOnline ? COLORS.success : COLORS.gray, marginRight: 8 }}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: COLORS.grayMedium, true: COLORS.successLight }}
            thumbColor={isOnline ? COLORS.success : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Welcome */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.dark }}>Hello, {driverName.split(' ')[0]}!</Text>
        <Text style={{ fontSize: 14, color: COLORS.gray, marginTop: 2 }}>
          {isOnline ? 'You are online and ready to receive orders' : 'Go online to start receiving orders'}
        </Text>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16, gap: 12 }}>
        <View style={[styles.statCard, { backgroundColor: COLORS.successLight }]}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.success }}>${stats.todayEarnings}</Text>
          <Text style={{ fontSize: 12, color: COLORS.success }}>Today's Earnings</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.primaryLight }]}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.primary }}>{stats.completedToday}</Text>
          <Text style={{ fontSize: 12, color: COLORS.primary }}>Jobs Today</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.warningLight }]}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.warning }}>{stats.totalCompleted}</Text>
          <Text style={{ fontSize: 12, color: COLORS.warning }}>Total Jobs</Text>
        </View>
      </View>

      {/* Available Orders */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark, marginBottom: 12 }}>
          {isOnline ? 'Available Orders' : 'Go Online to See Orders'}
        </Text>

        {!isOnline ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>...</Text>
            <Text style={{ fontSize: 16, color: COLORS.gray, textAlign: 'center' }}>Toggle the switch above to go online and start receiving orders</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: COLORS.gray, textAlign: 'center' }}>No orders available right now.{'\n'}Pull down to refresh.</Text>
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={renderOrder}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// ORDER DETAIL SCREEN
// ============================================================================
export function OrderDetailScreen({ route, navigation }) {
  const { order } = route.params;
  const [loading, setLoading] = useState(false);
  const pricing = typeof order.pricing_json === 'string' ? JSON.parse(order.pricing_json) : (order.pricing_json || {});
  const items = typeof order.items_json === 'string' ? JSON.parse(order.items_json) : (order.items_json || []);
  const totalPrice = pricing.total || pricing.estimatedTotal || 0;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await apiPostAuth(`/driver/orders/${order.id}/accept`, {});
      Alert.alert('Order Accepted!', 'You have accepted this order. Navigate to the pickup location.', [
        { text: 'OK', onPress: () => navigation.navigate('ActiveOrder', { order }) }
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not accept order');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    Alert.alert('Decline Order', 'Are you sure you want to decline this order?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const openMaps = () => {
    const address = `${order.street}, ${order.city}, ${order.state} ${order.zip}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Header */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, color: COLORS.primary, fontWeight: '600' }}>{'< Back'}</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 4 }}>Order Details</Text>
        <Text style={{ fontSize: 14, color: COLORS.gray, marginBottom: 20 }}>Review the order before accepting</Text>

        {/* Service Type & Price */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>SERVICE TYPE</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark }}>{order.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
          {totalPrice > 0 && (
            <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.success, marginTop: 8 }}>${totalPrice}</Text>
          )}
        </View>

        {/* Pickup Location */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>PICKUP LOCATION</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.dark }}>{order.street}</Text>
          <Text style={{ fontSize: 14, color: COLORS.gray }}>{order.city}, {order.state} {order.zip}</Text>
          <TouchableOpacity style={{ marginTop: 12, backgroundColor: COLORS.primaryLight, borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={openMaps}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Open in Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>SCHEDULE</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.dark }}>{order.pickup_date}</Text>
          <Text style={{ fontSize: 14, color: COLORS.gray }}>{order.pickup_time_window}</Text>
        </View>

        {/* Customer */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>CUSTOMER</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.dark }}>{order.customer_name}</Text>
          <Text style={{ fontSize: 14, color: COLORS.gray }}>{order.phone}</Text>
        </View>

        {/* Items */}
        {Array.isArray(items) && items.length > 0 && (
          <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 8 }}>ITEMS TO REMOVE</Text>
            {items.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: idx < items.length - 1 ? 1 : 0, borderBottomColor: COLORS.grayLight }}>
                <Text style={{ fontSize: 14, color: COLORS.dark }}>{item.name || item.item || item}</Text>
                {item.quantity && <Text style={{ fontSize: 14, color: COLORS.gray }}>x{item.quantity}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 16, flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.grayMedium }}>
        <TouchableOpacity style={[styles.btnOutline, { flex: 1 }]} onPress={handleDecline}>
          <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 16 }}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, { flex: 2 }, loading && { opacity: 0.7 }]}
          onPress={handleAccept}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Accept Order</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// ACTIVE ORDER SCREEN
// ============================================================================
export function ActiveOrderScreen({ route, navigation }) {
  const { order } = route.params;
  const [status, setStatus] = useState('accepted');
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    Alert.alert('Complete Order', 'Are you sure you want to mark this order as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete', onPress: async () => {
          setLoading(true);
          try {
            await apiPostAuth(`/driver/orders/${order.id}/complete`, {});
            Alert.alert('Order Completed!', 'Great job! The order has been marked as completed.', [
              { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]);
          } catch (e) {
            Alert.alert('Error', e.message || 'Could not complete order');
          } finally {
            setLoading(false);
          }
        }
      },
    ]);
  };

  const callCustomer = () => {
    if (order.phone) {
      Linking.openURL(`tel:${order.phone}`);
    }
  };

  const openMaps = () => {
    const address = `${order.street}, ${order.city}, ${order.state} ${order.zip}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
    });
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={{ backgroundColor: COLORS.successLight, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.success }}>Active Order</Text>
          <Text style={{ fontSize: 14, color: COLORS.success }}>Navigate to the pickup location</Text>
        </View>

        {/* Customer Info */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>CUSTOMER</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.dark }}>{order.customer_name}</Text>
          <TouchableOpacity style={{ marginTop: 8, backgroundColor: COLORS.primaryLight, borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={callCustomer}>
            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Call Customer: {order.phone}</Text>
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>PICKUP LOCATION</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.dark }}>{order.street}</Text>
          <Text style={{ fontSize: 14, color: COLORS.gray }}>{order.city}, {order.state} {order.zip}</Text>
          <TouchableOpacity style={{ marginTop: 12, backgroundColor: COLORS.primary, borderRadius: 8, padding: 12, alignItems: 'center' }} onPress={openMaps}>
            <Text style={{ color: COLORS.white, fontWeight: '700' }}>Navigate to Location</Text>
          </TouchableOpacity>
        </View>

        {/* Service Details */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 4 }}>SERVICE</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.dark }}>{order.service_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
          <Text style={{ fontSize: 14, color: COLORS.gray, marginTop: 4 }}>{order.pickup_date} - {order.pickup_time_window}</Text>
        </View>
      </ScrollView>

      {/* Complete Button */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.grayMedium }}>
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: COLORS.success }, loading && { opacity: 0.7 }]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnPrimaryText}>Mark as Completed</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// PROFILE SCREEN
// ============================================================================
export function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await apiGet('/driver/profile');
      setProfile(data.driver || data);
    } catch (e) {
      // Load from local storage
      const userData = await AsyncStorage.getItem('user_data');
      const driverData = await AsyncStorage.getItem('driver_data');
      if (userData) setProfile({ ...JSON.parse(userData), ...JSON.parse(driverData || '{}') });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 20 }}>My Profile</Text>

        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: COLORS.primary }}>{(profile.name || 'D')[0].toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.dark, textAlign: 'center' }}>{profile.name || 'Driver'}</Text>
          <Text style={{ fontSize: 14, color: COLORS.gray, textAlign: 'center' }}>{profile.email || ''}</Text>
          <View style={{ marginTop: 8, alignItems: 'center' }}>
            <View style={{ backgroundColor: profile.status === 'approved' ? COLORS.successLight : COLORS.warningLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: profile.status === 'approved' ? COLORS.success : COLORS.warning, fontWeight: '600', fontSize: 13 }}>
                {(profile.status || 'pending').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 12 }}>Personal Information</Text>
          <InfoRow label="Phone" value={profile.phone || 'Not set'} />
          <InfoRow label="Email" value={profile.email || 'Not set'} />
          <InfoRow label="Address" value={profile.address || 'Not set'} />
          <InfoRow label="City" value={profile.city || 'Not set'} />
          <InfoRow label="State" value={profile.state || 'Not set'} />
          <InfoRow label="ZIP Code" value={profile.zipCode || profile.zip_code || 'Not set'} />
        </View>

        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 12 }}>Vehicle Information</Text>
          <InfoRow label="Vehicle Type" value={profile.vehicleType || profile.vehicle_type || 'Not set'} />
          <InfoRow label="Capacity" value={profile.vehicleCapacity || profile.vehicle_capacity || 'Not set'} />
          <InfoRow label="License Plate" value={profile.licensePlate || profile.license_plate || 'Not set'} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight }}>
      <Text style={{ fontSize: 14, color: COLORS.gray }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.dark }}>{value}</Text>
    </View>
  );
}

// ============================================================================
// ORDER HISTORY SCREEN
// ============================================================================
export function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await apiGet('/driver/orders/history');
      setOrders(data.orders || []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 16 }}>Order History</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: COLORS.gray }}>No orders yet</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id?.toString()}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const pricing = typeof item.pricing_json === 'string' ? JSON.parse(item.pricing_json) : (item.pricing_json || {});
            return (
              <View style={styles.orderCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.dark }}>{item.service_type?.replace(/_/g, ' ')}</Text>
                  <View style={{ backgroundColor: item.status === 'completed' ? COLORS.successLight : COLORS.warningLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: item.status === 'completed' ? COLORS.success : COLORS.warning }}>{item.status?.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 14, color: COLORS.gray }}>{item.street}, {item.city}</Text>
                <Text style={{ fontSize: 13, color: COLORS.gray }}>{item.pickup_date}</Text>
                {pricing.total && <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.success, marginTop: 4 }}>${pricing.total}</Text>}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ============================================================================
// EARNINGS SCREEN
// ============================================================================
export function EarningsScreen({ navigation }) {
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const data = await apiGet('/driver/earnings');
      setEarnings(data.earnings || { today: 0, week: 0, month: 0, total: 0 });
    } catch (e) {
      // Default
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 20 }}>Earnings</Text>

        <View style={{ backgroundColor: COLORS.success, borderRadius: 16, padding: 24, marginBottom: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Total Earnings</Text>
          <Text style={{ fontSize: 40, fontWeight: '800', color: COLORS.white }}>${earnings.total}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <View style={[styles.earningCard, { flex: 1 }]}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.primary }}>${earnings.today}</Text>
            <Text style={{ fontSize: 13, color: COLORS.gray }}>Today</Text>
          </View>
          <View style={[styles.earningCard, { flex: 1 }]}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.primary }}>${earnings.week}</Text>
            <Text style={{ fontSize: 13, color: COLORS.gray }}>This Week</Text>
          </View>
          <View style={[styles.earningCard, { flex: 1 }]}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.primary }}>${earnings.month}</Text>
            <Text style={{ fontSize: 13, color: COLORS.gray }}>This Month</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// SETTINGS SCREEN
// ============================================================================
export function SettingsScreen({ navigation }) {
  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await AsyncStorage.multiRemove(['driver_token', 'driver_data', 'user_data']);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 20 }}>Settings</Text>

        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.settingsText}>My Profile</Text>
          <Text style={{ color: COLORS.gray }}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('OrderHistory')}>
          <Text style={styles.settingsText}>Order History</Text>
          <Text style={{ color: COLORS.gray }}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem} onPress={() => navigation.navigate('Earnings')}>
          <Text style={styles.settingsText}>Earnings</Text>
          <Text style={{ color: COLORS.gray }}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <Text style={styles.settingsText}>Notifications</Text>
          <Text style={{ color: COLORS.gray }}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <Text style={styles.settingsText}>Help & Support</Text>
          <Text style={{ color: COLORS.gray }}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsItem}>
          <Text style={styles.settingsText}>About</Text>
          <Text style={{ color: COLORS.gray }}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingsItem, { borderBottomWidth: 0, marginTop: 20 }]} onPress={handleLogout}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.danger }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================================
// DOCUMENTS SCREEN
// ============================================================================
export function DocumentsScreen({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.dark, marginBottom: 20 }}>My Documents</Text>

        <View style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 12 }}>Uploaded Documents</Text>
          <DocumentRow label="Driver's License" status="Uploaded" />
          <DocumentRow label="Vehicle Insurance" status="Uploaded" />
          <DocumentRow label="Vehicle Registration" status="Uploaded" />
        </View>

        <Text style={{ fontSize: 13, color: COLORS.gray, textAlign: 'center', marginTop: 8 }}>
          Contact support to update your documents
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DocumentRow({ label, status }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight }}>
      <Text style={{ fontSize: 14, color: COLORS.dark }}>{label}</Text>
      <View style={{ backgroundColor: COLORS.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.success }}>{status}</Text>
      </View>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnOutline: {
    borderWidth: 2,
    borderColor: COLORS.danger,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  earningCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  settingsItem: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  settingsText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
  },
});
