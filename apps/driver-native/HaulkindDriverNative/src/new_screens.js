import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert,
  Dimensions, FlatList, Modal, Vibration, Switch, PermissionsAndroid,
  Linking, PanResponder, Image,
} from "react-native";
import Sound from "react-native-sound";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import Geolocation from "@react-native-community/geolocation";
import { useFocusEffect } from "@react-navigation/native";
import { apiPost } from "./api";
import { API_URL } from "./config";
import { menuEmitter } from "./menuEmitter";
import { launchCamera } from "react-native-image-picker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RADIUS_MILES = 70;
const REFRESH_INTERVAL = 15000;
const ACCEPT_TIMER_SECONDS = 60;

// ============================================================================
// COLORS
// ============================================================================
const C = {
  primary: "#1a56db",
  primaryDark: "#1e40af",
  primaryLight: "#dbeafe",
  success: "#16a34a",
  successLight: "#dcfce7",
  warning: "#f59e0b",
  danger: "#dc2626",
  dark: "#111827",
  text: "#1f2937",
  textSecondary: "#6b7280",
  gray: "#9ca3af",
  grayLight: "#f3f4f6",
  border: "#e5e7eb",
  white: "#ffffff",
  bg: "#f8f9fa",
  newBadge: "#ef4444",
};

// ============================================================================
// API HELPERS
// ============================================================================
async function apiGet(path) {
  const token = await AsyncStorage.getItem("driver_token");
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

async function apiPut(path, body) {
  const token = await AsyncStorage.getItem("driver_token");
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

async function apiPostAuth(path, body) {
  const token = await AsyncStorage.getItem("driver_token");
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
  return data;
}

// ============================================================================
// GEOCODING & DISTANCE
// ============================================================================
const geocodeCache = {};

async function geocodeAddress(address) {
  if (!address) return null;
  if (geocodeCache[address]) return geocodeCache[address];
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      { headers: { "User-Agent": "HaulkindDriverApp/1.0" } }
    );
    const data = await res.json();
    if (data && data.length > 0) {
      const coords = { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
      geocodeCache[address] = coords;
      return coords;
    }
  } catch (e) { console.log("Geocode error:", e); }
  return null;
}

function getDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDate(dateStr) {
  if (!dateStr) return "Flexible";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(dateStr) {
  if (!dateStr) return "Any time";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function isToday(dateStr) {
  if (!dateStr) return true;
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isFutureDate(dateStr) {
  if (!dateStr) return false;
  const orderDate = new Date(dateStr);
  const now = new Date();
  orderDate.setHours(0,0,0,0);
  const todayStart = new Date(now);
  todayStart.setHours(0,0,0,0);
  return orderDate > todayStart;
}

function isThisWeek(dateStr) {
  if (!dateStr) return true;
  const orderDate = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0,0,0,0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return orderDate >= startOfWeek && orderDate < endOfWeek;
}

function isNew(dateStr, hours = 4) {
  if (!dateStr) return true;
  return (new Date() - new Date(dateStr)) / 3600000 < hours;
}

// ============================================================================
// LEAFLET MAP HTML
// ============================================================================
function buildMapHtml(driverLat, driverLng, orders, radiusMiles) {
  const radiusMeters = radiusMiles * 1609.34;
  const markers = orders
    .filter((o) => o.coords)
    .map((o) => {
      const price = parseFloat(o.estimated_price || o.final_price || 0).toFixed(0);
      const dist = o.distance != null ? o.distance.toFixed(1) + "mi" : "";
      const color = o.isNew ? "#ef4444" : "#1a56db";
      return `L.marker([${o.coords.latitude}, ${o.coords.longitude}], {
        icon: L.divIcon({
          className: 'custom-pin',
          html: '<div style="background:${color};color:#fff;padding:4px 8px;border-radius:8px;font-weight:bold;font-size:12px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">$${price} <span style=\\"font-size:10px;font-weight:normal;\\">${dist}</span></div>',
          iconSize: [80, 30],
          iconAnchor: [40, 30]
        })
      }).addTo(map).on('click', function() { window.ReactNativeWebView.postMessage(JSON.stringify({type:'orderClick',id:'${o.id}'})); });`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin: 0; padding: 0; }
  #map { width: 100%; height: 100vh; }
  .custom-pin { background: none !important; border: none !important; }
  .leaflet-control-attribution { display: none !important; }
</style>
</head><body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false }).setView([${driverLat}, ${driverLng}], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

  // Driver location
  L.circleMarker([${driverLat}, ${driverLng}], {
    radius: 8, fillColor: '#1a56db', color: '#fff', weight: 3, fillOpacity: 1
  }).addTo(map);

  // 70 mile radius circle
  L.circle([${driverLat}, ${driverLng}], {
    radius: ${radiusMeters}, color: '#1a56db', fillColor: '#1a56db', fillOpacity: 0.05, weight: 1, dashArray: '5,5'
  }).addTo(map);

  // Order markers
  ${markers}

  // Fit bounds
  var bounds = [[${driverLat}, ${driverLng}]];
  ${orders.filter((o) => o.coords).map((o) => `bounds.push([${o.coords.latitude}, ${o.coords.longitude}]);`).join("\n  ")}
  if (bounds.length > 1) { map.fitBounds(bounds, { padding: [40, 40] }); }
</script>
</body></html>`;
}

function buildDetailMapHtml(lat, lng) {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>* { margin: 0; padding: 0; } #map { width: 100%; height: 100vh; } .leaflet-control-attribution { display: none !important; }</style>
</head><body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false, dragging: false, scrollWheelZoom: false }).setView([${lat}, ${lng}], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
  L.marker([${lat}, ${lng}]).addTo(map);
</script>
</body></html>`;
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================
function InputField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, required }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}{required ? " *" : ""}</Text>
      <TextInput style={styles.fieldInput} value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor="#9ca3af" secureTextEntry={secureTextEntry} keyboardType={keyboardType} autoCapitalize={autoCapitalize || "sentences"} />
    </View>
  );
}

function PrimaryButton({ title, onPress, disabled, loading }) {
  return (
    <TouchableOpacity style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]} onPress={onPress} disabled={disabled || loading} activeOpacity={0.8}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{title}</Text>}
    </TouchableOpacity>
  );
}

// ============================================================================
// LOGIN SCREEN
// ============================================================================
export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("driver_token");
      if (t) navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    })();
  }, [navigation]);

  async function onLogin() {
    setErr(""); setLoading(true);
    try {
      const data = await apiPost("/driver/auth/login", { email, password });
      const token = data?.token || data?.accessToken;
      if (token) await AsyncStorage.setItem("driver_token", token);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) { setErr(String(e.message || e)); } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainerSmall}>
          <View style={styles.logoCircle}><Text style={styles.logoText}>H</Text></View>
          <Text style={styles.appName}>Haulkind Driver</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign In</Text>
          <InputField label="Email" value={email} onChangeText={setEmail} placeholder="your.email@example.com" keyboardType="email-address" autoCapitalize="none" required />
          <InputField label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry required />
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <PrimaryButton title="Sign In" onPress={onLogin} disabled={!email || !password} loading={loading} />
        </View>
        <View style={styles.bottomLink}>
          <Text style={styles.bottomText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}><Text style={styles.linkText}>Sign Up</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// SIGNUP SCREEN
// ============================================================================
export function SignupScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function formatPhone(text) {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  async function onSignup() {
    setErr("");
    if (!firstName.trim() || !lastName.trim()) { setErr("First and last name required."); return; }
    if (!email.trim()) { setErr("Email is required."); return; }
    if (!phone.trim()) { setErr("Phone number is required."); return; }
    if (!address.trim() || !city.trim() || !state.trim() || !zipCode.trim()) { setErr("Complete address required."); return; }
    if (password.length < 6) { setErr("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setErr("Passwords do not match."); return; }
    setLoading(true);
    try {
      const data = await apiPost("/driver/auth/signup", {
        name: `${firstName.trim()} ${lastName.trim()}`, firstName: firstName.trim(), lastName: lastName.trim(),
        email: email.trim(), phone: phone.trim(), address: address.trim(),
        city: city.trim(), state: state.trim(), zipCode: zipCode.trim(), password,
      });
      const token = data?.token || data?.accessToken;
      if (token) await AsyncStorage.setItem("driver_token", token);
      navigation.reset({ index: 0, routes: [{ name: "Onboarding" }] });
    } catch (e) { setErr(String(e.message || e)); } finally { setLoading(false); }
  }

  const allFilled = firstName && lastName && email && phone && address && city && state && zipCode && password && confirmPassword;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainerSmall}>
          <View style={styles.logoCircle}><Text style={styles.logoText}>H</Text></View>
          <Text style={styles.appName}>Haulkind Driver</Text>
          <Text style={styles.subtitle}>Create your driver account</Text>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign Up</Text>
          <View style={styles.row}>
            <View style={styles.halfField}><InputField label="First Name" value={firstName} onChangeText={setFirstName} placeholder="John" required /></View>
            <View style={styles.halfField}><InputField label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Smith" required /></View>
          </View>
          <InputField label="Email" value={email} onChangeText={setEmail} placeholder="your.email@example.com" keyboardType="email-address" autoCapitalize="none" required />
          <InputField label="Phone" value={phone} onChangeText={(t) => setPhone(formatPhone(t))} placeholder="(555) 123-4567" keyboardType="phone-pad" required />
          <InputField label="Street Address" value={address} onChangeText={setAddress} placeholder="123 Main St" required />
          <View style={styles.row}>
            <View style={styles.halfField}><InputField label="City" value={city} onChangeText={setCity} placeholder="New York" required /></View>
            <View style={styles.halfField}><InputField label="State" value={state} onChangeText={setState} placeholder="NY" autoCapitalize="characters" required /></View>
          </View>
          <InputField label="ZIP Code" value={zipCode} onChangeText={setZipCode} placeholder="10001" keyboardType="number-pad" required />
          <InputField label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry required />
          <InputField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" secureTextEntry required />
          {err ? <Text style={styles.err}>{err}</Text> : null}
          <PrimaryButton title="Create Account" onPress={onSignup} disabled={!allFilled} loading={loading} />
        </View>
        <View style={styles.bottomLink}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.linkText}>Sign In</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// HOME SCREEN - UBER/DOORDASH STYLE
// ============================================================================
export function HomeScreen({ navigation }) {
  const [isOnline, setIsOnline] = useState(false);
  const [orders, setOrders] = useState([]);
  const [myTodayOrders, setMyTodayOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [acceptTimer, setAcceptTimer] = useState(ACCEPT_TIMER_SECONDS);
  const [accepting, setAccepting] = useState(false);
  const [previousOrderIds, setPreviousOrderIds] = useState(new Set());
  const [mapKey, setMapKey] = useState(0);

  const timerRef = useRef(null);
  const refreshRef = useRef(null);
  const watchIdRef = useRef(null);

  // Request location + start real-time tracking
  useEffect(() => {
    async function requestLoc() {
      if (Platform.OS === "android") {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            { title: "Location Permission", message: "Haulkind needs your location to show nearby orders.", buttonPositive: "Allow" }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) startTracking();
          else setDriverLocation({ latitude: 39.9526, longitude: -75.1652 });
        } catch { setDriverLocation({ latitude: 39.9526, longitude: -75.1652 }); }
      } else startTracking();
    }
    function startTracking() {
      // Get initial position fast
      Geolocation.getCurrentPosition(
        (pos) => setDriverLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => setDriverLocation({ latitude: 39.9526, longitude: -75.1652 }),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
      // Watch position for real-time tracking (updates when driver moves 50+ meters)
      watchIdRef.current = Geolocation.watchPosition(
        (pos) => setDriverLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.log("Watch position error:", err),
        { enableHighAccuracy: true, distanceFilter: 50, maximumAge: 5000, timeout: 15000 }
      );
    }
    requestLoc();
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Load profile
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet("/driver/profile");
        const driver = data?.driver || data;
        setIsOnline(!!driver?.isOnline);
      } catch (e) { console.log("Profile error:", e); }
    })();
  }, []);

  // Enrich orders with coords and distance
  async function enrichOrders(rawOrders) {
    return Promise.all(rawOrders.map(async (order) => {
      let coords = null;
      if (order.pickup_lat && order.pickup_lng) {
        coords = { latitude: parseFloat(order.pickup_lat), longitude: parseFloat(order.pickup_lng) };
      } else if (order.pickup_address) {
        coords = await geocodeAddress(order.pickup_address);
      }
      let distance = null;
      if (coords && driverLocation) {
        distance = getDistanceMiles(driverLocation.latitude, driverLocation.longitude, coords.latitude, coords.longitude);
      }
      return { ...order, coords, distance, isNew: isNew(order.created_at) };
    }));
  }

  // Fetch orders (available + my orders for Today)
  const fetchOrders = useCallback(async () => {
    if (!isOnline) { setOrders([]); setMyTodayOrders([]); setFilteredOrders([]); setLoading(false); return; }
    try {
      // Fetch available orders (unassigned) for ALL and NEW tabs
      const data = await apiGet("/driver/orders/available");
      const rawOrders = data?.orders || [];
      const enriched = await enrichOrders(rawOrders);

      const withinRadius = enriched.filter((o) => o.distance === null || o.distance <= RADIUS_MILES);
      withinRadius.sort((a, b) => (a.distance || 999) - (b.distance || 999));

      // Vibrate and play sound for new orders
      const currentIds = new Set(withinRadius.map((o) => o.id));
      const brandNew = withinRadius.filter((o) => !previousOrderIds.has(o.id));
      if (brandNew.length > 0 && previousOrderIds.size > 0) {
        Vibration.vibrate([0, 300, 100, 300]);
        try {
          const sound = new Sound('notification_sound.mp3', Sound.MAIN_BUNDLE, (error) => {
            if (error) {
              console.log('Using system sound');
            } else {
              sound.setVolume(1.0);
              sound.play(() => sound.release());
            }
          });
        } catch (e) {
          console.log('Sound error:', e);
        }
      }
      setPreviousOrderIds(currentIds);
      setOrders(withinRadius);

      // Fetch driver's own accepted/assigned orders for TODAY tab
      try {
        const myData = await apiGet("/driver/orders/my-orders");
        const myRaw = myData?.orders || [];
        const myEnriched = await enrichOrders(myRaw);
        // Only keep today's orders for the TODAY tab
        const todayOnly = myEnriched.filter((o) => isToday(o.scheduled_for || o.created_at));
        todayOnly.sort((a, b) => (a.distance || 999) - (b.distance || 999));
        setMyTodayOrders(todayOnly);
      } catch (e) {
        console.log("My orders fetch error:", e);
        setMyTodayOrders([]);
      }

      setMapKey((k) => k + 1);
    } catch (e) { console.log("Fetch error:", e); } finally { setLoading(false); }
  }, [isOnline, driverLocation]);

  useEffect(() => {
    fetchOrders();
    if (isOnline) refreshRef.current = setInterval(fetchOrders, REFRESH_INTERVAL);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [isOnline, driverLocation]);

  // Refresh immediately when screen gains focus (catches rescheduled/cancelled orders)
  useFocusEffect(
    useCallback(() => {
      if (isOnline) fetchOrders();
    }, [isOnline, driverLocation])
  );

  // Apply filter
  useEffect(() => {
    if (filter === "TODAY") {
      // Today = only driver's own accepted/assigned orders for today
      setFilteredOrders([...myTodayOrders]);
    } else if (filter === "NEW") {
      setFilteredOrders(orders.filter((o) => o.isNew));
    } else {
      // ALL = all available (unassigned) orders
      setFilteredOrders([...orders]);
    }
  }, [orders, myTodayOrders, filter]);

  // When switching to TODAY, refresh immediately (so rescheduled orders move right away)
  useEffect(() => {
    if (filter === "TODAY" && isOnline) {
      fetchOrders();
    }
  }, [filter, isOnline]);

  // Accept timer
  useEffect(() => {
    if (showDetail && selectedOrder) {
      setAcceptTimer(ACCEPT_TIMER_SECONDS);
      timerRef.current = setInterval(() => {
        setAcceptTimer((p) => { if (p <= 1) { clearInterval(timerRef.current); return 0; } return p - 1; });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [showDetail, selectedOrder?.id]);

  async function toggleOnline() {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      await apiPut("/driver/profile", { isOnline: newStatus });
      await AsyncStorage.setItem("driver_isOnline", newStatus ? "true" : "false");
    } catch (e) { console.log("Toggle error:", e); }
    if (!newStatus) { setOrders([]); setMyTodayOrders([]); setFilteredOrders([]); }
  }

  async function acceptOrder(order) {
    setAccepting(true);
    try {
      await apiPostAuth(`/driver/orders/${order.id}/accept`);
      Vibration.vibrate(200);
      setShowDetail(false);
      navigation.navigate("ActiveOrder", { order });
    } catch (e) { Alert.alert("Error", e.message || "Could not accept order."); } finally { setAccepting(false); }
  }

  function declineOrder(order) {
    setShowDetail(false);
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
  }

  // Cancel an already-accepted order (from Today tab)
  function cancelMyOrder(order) {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This action cannot be undone.",
      [
        { text: "Keep Order", style: "cancel" },
        { text: "Cancel Order", style: "destructive", onPress: async () => {
          try {
            await apiPostAuth(`/driver/orders/${order.id}/cancel`);
            Alert.alert("Cancelled", "Order has been cancelled.");
            setShowDetail(false);
            fetchOrders();
          } catch (e) {
            Alert.alert("Error", e.message || "Could not cancel order.");
          }
        }},
      ]
    );
  }

  // Continue working on an already-accepted order
  function continueOrder(order) {
    setShowDetail(false);
    navigation.navigate("ActiveOrder", { order });
  }

  async function logout() {
    await AsyncStorage.removeItem("driver_token");
    await AsyncStorage.removeItem("driver_isOnline");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  }

  function openOrderDetail(order) { setSelectedOrder(order); setShowDetail(true); }

  // Handle map messages (pin clicks)
  function onMapMessage(event) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "orderClick") {
        // Search in both available orders and my today orders
        const order = orders.find((o) => o.id === msg.id) || myTodayOrders.find((o) => o.id === msg.id);
        if (order) openOrderDetail(order);
      }
    } catch {}
  }

  // ============================================================================
  // ORDER CARD
  // ============================================================================
  function renderOrderCard({ item, index }) {
    const o = item;
    const price = o.estimated_price || o.final_price || "0";
    const distText = o.distance != null ? `${o.distance.toFixed(1)} mi` : "-- mi";
    return (
      <TouchableOpacity style={[styles.orderCard, index === 0 && { marginLeft: 16 }]} onPress={() => openOrderDetail(o)} activeOpacity={0.9}>
        {o.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
        <View style={styles.cardTopRow}>
          <View>
            <Text style={{ fontSize: 11, color: C.gray, fontWeight: "600" }}>You earn:</Text>
            <Text style={styles.cardPrice}>${parseFloat(price).toFixed(0)}</Text>
          </View>
          <View style={styles.cardDistBadge}><Text style={styles.cardDistText}>{distText}</Text></View>
        </View>
        <Text style={styles.cardServiceType}>{o.service_type || "Haul Away"}</Text>
        <Text style={styles.cardDescription} numberOfLines={1}>{o.description || o.service_type || "Junk removal"}</Text>
        <View style={styles.cardDateRow}>
          <Text style={styles.cardIcon}>📅</Text>
          <Text style={styles.cardMeta}>{formatDate(o.scheduled_for || o.created_at)}</Text>
          <Text style={styles.cardIcon}>  🕐</Text>
          <Text style={styles.cardMeta}>{formatTime(o.scheduled_for)}</Text>
        </View>
        <View style={styles.cardDateRow}>
          <Text style={styles.cardIcon}>📍</Text>
          <Text style={styles.cardMeta} numberOfLines={1}>{o.pickup_address || "Address pending"}</Text>
        </View>
        <TouchableOpacity style={styles.cardViewBtn} onPress={() => openOrderDetail(o)}>
          <Text style={styles.cardViewBtnText}>View Details</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  // ============================================================================
  // DETAIL MODAL
  // ============================================================================
  function renderDetailModal() {
    if (!selectedOrder) return null;
    const o = selectedOrder;
    const price = o.estimated_price || o.final_price || "0";
    const distText = o.distance != null ? `${o.distance.toFixed(1)} miles away` : "Distance unknown";
    const timerColor = acceptTimer <= 10 ? C.danger : acceptTimer <= 30 ? C.warning : C.success;
    const timerPct = (acceptTimer / ACCEPT_TIMER_SECONDS) * 100;

    // Check if this order is already accepted/assigned (from myTodayOrders)
    const isMyOrder = myTodayOrders.some((m) => m.id === o.id);

    return (
      <Modal visible={showDetail} animationType="slide" transparent={false}>
        <View style={styles.detailContainer}>
          <StatusBar barStyle="dark-content" backgroundColor={C.white} />
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setShowDetail(false)} style={styles.detailBackBtn}>
              <Text style={styles.detailBackText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.detailHeaderTitle}>Order Details</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Timer bar - only show for new/available orders, not already accepted */}
          {!isMyOrder && (
            <>
              <View style={styles.timerBarBg}>
                <View style={[styles.timerBarFill, { width: `${timerPct}%`, backgroundColor: timerColor }]} />
              </View>
              <Text style={[styles.timerText, { color: timerColor }]}>
                {acceptTimer > 0 ? `${acceptTimer}s remaining to accept` : "Time expired - order still available"}
              </Text>
            </>
          )}
          {isMyOrder && (
            <View style={{ backgroundColor: "#e0f2fe", paddingVertical: 8, alignItems: "center" }}>
              <Text style={{ color: C.primary, fontWeight: "700", fontSize: 14 }}>Your accepted order</Text>
            </View>
          )}

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Price card */}
            <View style={styles.detailPriceCard}>
              <Text style={styles.detailPriceLabel}>Estimated Earnings</Text>
              <Text style={styles.detailPrice}>${parseFloat(price).toFixed(2)}</Text>
              <Text style={styles.detailDist}>{distText}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>SERVICE TYPE</Text>
              <Text style={styles.detailSectionValue}>{o.service_type || "Haul Away"}</Text>
            </View>

            {o.description ? (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>WHAT TO REMOVE</Text>
                <Text style={styles.detailSectionValue}>{o.description}</Text>
              </View>
            ) : null}

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>PICKUP LOCATION</Text>
              <Text style={styles.detailSectionValue}>{o.pickup_address || "Address pending"}</Text>
              <TouchableOpacity style={styles.openMapsBtn} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.pickup_address || "")}`)}>
                <Text style={styles.openMapsBtnText}>Open in Maps</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>SCHEDULE</Text>
              <Text style={styles.detailSectionValue}>{formatDate(o.scheduled_for || o.created_at)} • {formatTime(o.scheduled_for)}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>CUSTOMER</Text>
              <Text style={styles.detailSectionValue}>{o.customer_name || "Customer"}</Text>
              {o.customer_phone ? (
                <TouchableOpacity onPress={() => Linking.openURL(`tel:${o.customer_phone}`)}>
                  <Text style={styles.detailPhone}>{o.customer_phone}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Mini map */}
            {o.coords && (
              <View style={styles.detailMapWrap}>
                <WebView
                  source={{ html: buildDetailMapHtml(o.coords.latitude, o.coords.longitude) }}
                  style={{ flex: 1 }}
                  scrollEnabled={false}
                />
              </View>
            )}
          </ScrollView>

          {/* Bottom buttons */}
          <View style={styles.detailBottomBar}>
            {isMyOrder ? (
              <>
                <TouchableOpacity style={styles.declineBtn} onPress={() => cancelMyOrder(o)}>
                  <Text style={styles.declineBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => continueOrder(o)}>
                  <Text style={styles.acceptBtnText}>CONTINUE ORDER</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.declineBtn} onPress={() => declineOrder(o)}>
                  <Text style={styles.declineBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.acceptBtn, accepting && { opacity: 0.7 }]} onPress={() => acceptOrder(o)} disabled={accepting}>
                  {accepting ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptBtnText}>ACCEPT ORDER</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  const dLat = driverLocation?.latitude || 39.9526;
  const dLng = driverLocation?.longitude || -75.1652;

  return (
    <View style={styles.homeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} translucent={false} />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => menuEmitter.open()} style={styles.hamburgerBtn}>
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
            <View style={styles.hamburgerLine} />
          </TouchableOpacity>
          <View>
            <Text style={styles.topBarTitle}>Haulkind</Text>
            <Text style={styles.topBarSub}>{isOnline ? `${filteredOrders.length} orders nearby` : "You're offline"}</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <Text style={[styles.onlineLabel, { color: isOnline ? "#4ade80" : "#fbbf24" }]}>{isOnline ? "ONLINE" : "OFFLINE"}</Text>
          <Switch value={isOnline} onValueChange={toggleOnline} trackColor={{ false: "#374151", true: "#16a34a" }} thumbColor={isOnline ? "#4ade80" : "#9ca3af"} />

        </View>
      </View>

      {/* MAP */}
      <View style={styles.mapContainer}>
        {driverLocation ? (
          <WebView
            key={`map-${mapKey}`}
            source={{ html: buildMapHtml(dLat, dLng, filteredOrders, RADIUS_MILES) }}
            style={{ flex: 1 }}
            onMessage={onMapMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.mapLoading}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={styles.mapLoadingText}>Getting your location...</Text>
          </View>
        )}

        {!isOnline && (
          <View style={styles.offlineOverlay}>
            <View style={styles.offlineCard}>
              <Text style={styles.offlineTitle}>You're Offline</Text>
              <Text style={styles.offlineText}>Go online to start receiving orders</Text>
              <TouchableOpacity style={styles.goOnlineBtn} onPress={toggleOnline}>
                <Text style={styles.goOnlineBtnText}>GO ONLINE</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* BOTTOM: FILTERS + CAROUSEL */}
      {isOnline && (
        <View style={styles.bottomSection}>
          <View style={styles.dragHandle} />
          <View style={styles.filterRow}>
            {["TODAY", "ALL", "NEW"].map((f) => (
              <TouchableOpacity key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]} onPress={() => setFilter(f)}>
                <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                  {f === "TODAY" ? "Today" : f === "ALL" ? "All" : "New"}
                </Text>
                {f === "NEW" && orders.filter((o) => o.isNew).length > 0 && (
                  <View style={styles.filterBadge}><Text style={styles.filterBadgeText}>{orders.filter((o) => o.isNew).length}</Text></View>
                )}
              </TouchableOpacity>
            ))}
            <View style={{ marginLeft: "auto" }}><Text style={styles.radiusText}>Within {RADIUS_MILES} mi</Text></View>
          </View>

          {loading ? (
            <View style={styles.carouselLoading}><ActivityIndicator size="small" color={C.primary} /><Text style={styles.carouselLoadingText}>Loading orders...</Text></View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.noOrders}>
              <Text style={styles.noOrdersTitle}>{filter === "NEW" ? "No new orders" : "No orders nearby"}</Text>
              <Text style={styles.noOrdersSub}>Orders within {RADIUS_MILES} miles will appear here</Text>
            </View>
          ) : (
            <FlatList data={filteredOrders} renderItem={renderOrderCard} keyExtractor={(item) => item.id}
              horizontal showsHorizontalScrollIndicator={false}
              snapToInterval={SCREEN_WIDTH * 0.78 + 12} decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 16 }} />
          )}
        </View>
      )}

      {renderDetailModal()}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================
const CARD_WIDTH = SCREEN_WIDTH * 0.78;
const SBH = Platform.OS === "android" ? (StatusBar.currentHeight || 24) : 0;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  logoContainerSmall: { alignItems: "center", marginBottom: 20 },
  logoCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  logoText: { fontSize: 28, fontWeight: "bold", color: C.white },
  appName: { fontSize: 22, fontWeight: "bold", color: C.text },
  subtitle: { fontSize: 14, color: C.textSecondary, marginTop: 4 },
  formCard: { backgroundColor: C.white, borderRadius: 12, padding: 24, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  formTitle: { fontSize: 22, fontWeight: "bold", color: C.text, marginBottom: 16 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: C.text, marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: C.text, backgroundColor: C.white },
  primaryBtn: { backgroundColor: C.primary, borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  primaryBtnDisabled: { backgroundColor: "#93c5fd" },
  primaryBtnText: { color: C.white, fontSize: 16, fontWeight: "bold" },
  err: { color: C.danger, fontSize: 13, marginBottom: 8, textAlign: "center" },
  bottomLink: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  bottomText: { color: C.textSecondary, fontSize: 14 },
  linkText: { color: C.primary, fontSize: 14, fontWeight: "bold" },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },

  // Home
  homeContainer: { flex: 1, backgroundColor: C.dark },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.primaryDark, paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16 },
  topBarLeft: { flexDirection: "row", alignItems: "center" },
  logoSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.white, alignItems: "center", justifyContent: "center", marginRight: 10 },
  logoSmallText: { fontSize: 18, fontWeight: "bold", color: C.primary },
  topBarTitle: { fontSize: 18, fontWeight: "bold", color: C.white },
  topBarSub: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  topBarRight: { flexDirection: "row", alignItems: "center" },
  onlineLabel: { fontSize: 11, fontWeight: "bold", marginRight: 4, letterSpacing: 0.5 },
  hamburgerBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center", marginRight: 8 },
  hamburgerLine: { width: 22, height: 2.5, backgroundColor: "#fff", marginBottom: 4, borderRadius: 2 },

  // Map
  mapContainer: { flex: 1 },
  mapLoading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.grayLight },
  mapLoadingText: { marginTop: 8, color: C.textSecondary, fontSize: 14 },
  offlineOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  offlineCard: { backgroundColor: C.white, borderRadius: 16, padding: 32, alignItems: "center", width: SCREEN_WIDTH * 0.8, elevation: 10 },
  offlineTitle: { fontSize: 22, fontWeight: "bold", color: C.dark, marginBottom: 8 },
  offlineText: { fontSize: 14, color: C.textSecondary, textAlign: "center", marginBottom: 20 },
  goOnlineBtn: { backgroundColor: C.success, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  goOnlineBtnText: { color: C.white, fontSize: 16, fontWeight: "bold", letterSpacing: 1 },

  // Bottom section
  bottomSection: { backgroundColor: C.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 8, minHeight: 240, elevation: 10, shadowColor: "#000", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.1, shadowRadius: 8 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: "center", marginBottom: 8 },

  // Filters
  filterRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.grayLight, marginRight: 8, flexDirection: "row", alignItems: "center" },
  filterTabActive: { backgroundColor: C.primary },
  filterTabText: { fontSize: 13, fontWeight: "600", color: C.textSecondary },
  filterTabTextActive: { color: C.white },
  filterBadge: { backgroundColor: C.newBadge, borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center", marginLeft: 4 },
  filterBadgeText: { color: C.white, fontSize: 10, fontWeight: "bold" },
  radiusText: { fontSize: 11, color: C.gray },

  // Cards
  orderCard: { width: CARD_WIDTH, backgroundColor: C.white, borderRadius: 16, padding: 16, marginRight: 12, marginBottom: 16, borderWidth: 1, borderColor: C.border, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  newBadge: { position: "absolute", top: 12, right: 12, backgroundColor: C.newBadge, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3, zIndex: 1 },
  newBadgeText: { color: C.white, fontSize: 10, fontWeight: "bold", letterSpacing: 0.5 },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardPrice: { fontSize: 28, fontWeight: "bold", color: C.success },
  cardDistBadge: { backgroundColor: C.primaryLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  cardDistText: { fontSize: 12, fontWeight: "600", color: C.primary },
  cardServiceType: { fontSize: 16, fontWeight: "700", color: C.dark, marginBottom: 4 },
  cardDescription: { fontSize: 13, color: C.textSecondary, marginBottom: 8 },
  cardDateRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  cardIcon: { fontSize: 12, marginRight: 4 },
  cardMeta: { fontSize: 12, color: C.textSecondary },
  cardViewBtn: { backgroundColor: C.primary, borderRadius: 8, paddingVertical: 10, alignItems: "center", marginTop: 8 },
  cardViewBtnText: { color: C.white, fontSize: 14, fontWeight: "bold" },

  // Loading/empty
  carouselLoading: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 30 },
  carouselLoadingText: { marginLeft: 8, color: C.textSecondary, fontSize: 14 },
  noOrders: { alignItems: "center", paddingVertical: 30 },
  noOrdersTitle: { fontSize: 16, fontWeight: "600", color: C.dark, marginBottom: 4 },
  noOrdersSub: { fontSize: 13, color: C.gray },

  // Detail modal
  detailContainer: { flex: 1, backgroundColor: C.white },
  detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  detailBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.grayLight, alignItems: "center", justifyContent: "center" },
  detailBackText: { fontSize: 18, color: C.dark, fontWeight: "bold" },
  detailHeaderTitle: { fontSize: 18, fontWeight: "bold", color: C.dark },
  timerBarBg: { height: 4, backgroundColor: C.grayLight },
  timerBarFill: { height: 4, borderRadius: 2 },
  timerText: { textAlign: "center", fontSize: 13, fontWeight: "600", paddingVertical: 6 },
  detailPriceCard: { backgroundColor: C.primaryLight, margin: 16, borderRadius: 16, padding: 20, alignItems: "center" },
  detailPriceLabel: { fontSize: 13, color: C.primary, fontWeight: "600", marginBottom: 4 },
  detailPrice: { fontSize: 36, fontWeight: "bold", color: C.primaryDark },
  detailDist: { fontSize: 14, color: C.primary, marginTop: 4 },
  detailSection: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.grayLight },
  detailSectionTitle: { fontSize: 12, fontWeight: "600", color: C.gray, letterSpacing: 0.5, marginBottom: 4 },
  detailSectionValue: { fontSize: 16, color: C.dark, fontWeight: "500" },
  detailPhone: { fontSize: 14, color: C.primary, marginTop: 4, fontWeight: "600" },
  openMapsBtn: { backgroundColor: C.primaryLight, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginTop: 8, alignSelf: "flex-start" },
  openMapsBtnText: { color: C.primary, fontSize: 13, fontWeight: "600" },
  detailMapWrap: { height: 160, margin: 16, borderRadius: 12, overflow: "hidden" },
  detailBottomBar: { flexDirection: "row", padding: 16, paddingBottom: 28, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border },
  declineBtn: { flex: 1, borderRadius: 12, paddingVertical: 16, alignItems: "center", borderWidth: 2, borderColor: C.danger, marginRight: 12 },
  declineBtnText: { color: C.danger, fontSize: 16, fontWeight: "bold" },
  acceptBtn: { flex: 2, borderRadius: 12, paddingVertical: 16, alignItems: "center", backgroundColor: C.success },
  acceptBtnText: { color: C.white, fontSize: 16, fontWeight: "bold", letterSpacing: 0.5 },
});


// ============================================================================
// PENDING SCREEN
// ============================================================================
export function PendingScreen({ navigation }) {
  const [checking, setChecking] = useState(false);
  const checkStatus = async () => {
    setChecking(true);
    try {
      const data = await apiGet("/driver/profile");
      if (data.driver?.status === "approved" || data.driver?.status === "active") {
        Alert.alert("Approved!", "Your account has been approved. Welcome!");
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      } else {
        Alert.alert("Still Pending", "Your account is still under review. Please check back later.");
      }
    } catch (e) {
      Alert.alert("Error", "Could not check status. Please try again.");
    } finally {
      setChecking(false);
    }
  };
  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["driver_token", "driver_data", "user_data"]);
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: SBH }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
          <Text style={{ fontSize: 36 }}>...</Text>
        </View>
        <Text style={{ fontSize: 24, fontWeight: "700", color: C.dark, marginBottom: 8, textAlign: "center" }}>Account Under Review</Text>
        <Text style={{ fontSize: 15, color: C.gray, textAlign: "center", lineHeight: 22, marginBottom: 32 }}>
          We are verifying your documents and information. You will be notified when your account is approved. This usually takes 24-48 hours.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: C.primary, borderRadius: 12, padding: 16, alignItems: "center", width: "100%", opacity: checking ? 0.7 : 1 }}
          onPress={checkStatus}
          disabled={checking}
        >
          {checking ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Check Status</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={handleLogout}>
          <Text style={{ color: C.danger, fontWeight: "600" }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// ORDER DETAIL SCREEN (navigated from carousel tap)
// ============================================================================
export function OrderDetailScreen({ route, navigation }) {
  const order = route.params?.order;
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [timer, setTimer] = useState(ACCEPT_TIMER_SECONDS);

  useEffect(() => {
    if (timer <= 0) return;
    const iv = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [timer]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await apiPostAuth(`/driver/orders/${order.id}/accept`);
      Alert.alert("Order Accepted!", "Navigate to the pickup location.", [
        { text: "OK", onPress: () => navigation.navigate("ActiveOrder", { order }) },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not accept order.");
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    setDeclining(true);
    Alert.alert("Decline Order", "Are you sure you want to decline this order?", [
      { text: "Cancel", style: "cancel", onPress: () => setDeclining(false) },
      { text: "Decline", style: "destructive", onPress: () => navigation.goBack() },
    ]);
  };

  const price = order?.pricing?.total || order?.pricing?.estimatedTotal || order?.estimated_price || order?.final_price || "0";
  const address = order?.pickup_address || order?.address?.street || "N/A";
  const customerName = order?.customer_name || order?.customerName || "Customer";
  const customerPhone = order?.customer_phone || order?.phone || "";
  const serviceType = order?.service_type || order?.serviceType || "Service";
  const scheduledDate = order?.scheduled_date || order?.scheduledDate || "";

  const openMaps = () => {
    const url = Platform.OS === "ios"
      ? `maps:?q=${encodeURIComponent(address)}`
      : `geo:0,0?q=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`));
  };

  const timerPct = timer / ACCEPT_TIMER_SECONDS;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: C.primary, fontWeight: "600" }}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: C.dark }}>Order Details</Text>
        <View style={{ width: 50 }} />
      </View>
      {/* Timer bar */}
      {timer > 0 && (
        <View style={{ height: 4, backgroundColor: C.grayLight }}>
          <View style={{ height: 4, backgroundColor: timer > 15 ? C.success : C.danger, width: `${timerPct * 100}%` }} />
        </View>
      )}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Price Card */}
        <View style={{ backgroundColor: C.primaryLight, margin: 16, borderRadius: 16, padding: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: C.primary, fontWeight: "600", marginBottom: 4 }}>YOUR EARNINGS (70%)</Text>
          <Text style={{ fontSize: 36, fontWeight: "bold", color: C.primaryDark }}>${parseFloat(price).toFixed(0)}</Text>
          {timer > 0 && <Text style={{ fontSize: 14, color: C.primary, marginTop: 4 }}>{timer}s remaining to accept</Text>}
        </View>
        {/* Service */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.grayLight }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: C.gray, letterSpacing: 0.5, marginBottom: 4 }}>SERVICE TYPE</Text>
          <Text style={{ fontSize: 16, color: C.dark, fontWeight: "500" }}>{serviceType}</Text>
        </View>
        {/* Pickup */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.grayLight }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: C.gray, letterSpacing: 0.5, marginBottom: 4 }}>PICKUP LOCATION</Text>
          <Text style={{ fontSize: 16, color: C.dark, fontWeight: "500" }}>{address}</Text>
          <TouchableOpacity onPress={openMaps} style={{ backgroundColor: C.primaryLight, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginTop: 8, alignSelf: "flex-start" }}>
            <Text style={{ color: C.primary, fontSize: 13, fontWeight: "600" }}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
        {/* Schedule */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.grayLight }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: C.gray, letterSpacing: 0.5, marginBottom: 4 }}>SCHEDULE</Text>
          <Text style={{ fontSize: 16, color: C.dark, fontWeight: "500" }}>{scheduledDate ? new Date(scheduledDate).toLocaleDateString() : "ASAP"}</Text>
        </View>
        {/* Customer */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.grayLight }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: C.gray, letterSpacing: 0.5, marginBottom: 4 }}>CUSTOMER</Text>
          <Text style={{ fontSize: 16, color: C.dark, fontWeight: "500" }}>{customerName}</Text>
          {customerPhone ? <Text style={{ fontSize: 14, color: C.primary, marginTop: 4, fontWeight: "600" }}>{customerPhone}</Text> : null}
        </View>
      </ScrollView>
      {/* Bottom Buttons */}
      <View style={{ flexDirection: "row", padding: 16, paddingBottom: 28, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <TouchableOpacity style={{ flex: 1, borderRadius: 12, paddingVertical: 16, alignItems: "center", borderWidth: 2, borderColor: C.danger, marginRight: 12 }} onPress={handleDecline} disabled={declining}>
          <Text style={{ color: C.danger, fontSize: 16, fontWeight: "bold" }}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 2, borderRadius: 12, paddingVertical: 16, alignItems: "center", backgroundColor: timer <= 0 ? C.gray : C.success, opacity: accepting ? 0.7 : 1 }} onPress={handleAccept} disabled={accepting || timer <= 0}>
          {accepting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: C.white, fontSize: 16, fontWeight: "bold", letterSpacing: 0.5 }}>{timer <= 0 ? "Expired" : "Accept Order"}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// ACTIVE ORDER SCREEN
// ============================================================================
// ============================================================================
// STEP FLOW CONSTANTS
// ============================================================================
const STEPS = [
  { key: "accepted", label: "Order Accepted", action: "START TRIP", color: C.primary, icon: "\u2714" },
  { key: "en_route", label: "En Route to Pickup", action: "I'VE ARRIVED", color: C.warning, icon: "\u{1F697}" },
  { key: "arrived", label: "Arrived at Location", action: "START WORK", color: C.primary, icon: "\u{1F4CD}" },
  { key: "in_progress", label: "Work in Progress", action: "TAKE PHOTO", color: C.success, icon: "\u{1F528}" },
  { key: "photo_taken", label: "Photo Taken", action: "GET SIGNATURE", color: C.primary, icon: "\u{1F4F7}" },
  { key: "signed", label: "Signature Captured", action: "COMPLETE ORDER", color: C.success, icon: "\u270D\uFE0F" },
  { key: "completed", label: "Order Completed", action: null, color: C.success, icon: "\u2705" },
];

export function ActiveOrderScreen({ route, navigation }) {
  const order = route.params?.order;
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [showSignature, setShowSignature] = useState(false);
  const [signaturePaths, setSignaturePaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);

  const price = order?.pricing?.total || order?.pricing?.estimatedTotal || order?.estimated_price || order?.final_price || "0";
  const address = order?.pickup_address || order?.address?.street || "N/A";
  const customerName = order?.customer_name || order?.customerName || "Customer";
  const customerPhone = order?.customer_phone || order?.phone || "";
  const serviceType = order?.service_type || order?.serviceType || "Service";
  const description = order?.description || "";
  const orderId = order?.id;

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order? This action cannot be undone.",
      [
        { text: "Keep Order", style: "cancel" },
        { text: "Cancel Order", style: "destructive", onPress: async () => {
          try {
            await apiPostAuth(`/driver/orders/${orderId}/cancel`);
            Alert.alert("Cancelled", "Order has been cancelled.", [
              { text: "OK", onPress: () => navigation.navigate("Home") }
            ]);
          } catch (e) {
            Alert.alert("Error", e.message || "Could not cancel order.");
          }
        }},
      ]
    );
  };

  const callCustomer = () => {
    if (customerPhone) Linking.openURL(`tel:${customerPhone}`);
  };

  const openMaps = () => {
    const url = Platform.OS === "ios"
      ? `maps:?q=${encodeURIComponent(address)}`
      : `geo:0,0?q=${encodeURIComponent(address)}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`));
  };

  const apiCallStep = async (endpoint) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("driver_token");
      const resp = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed");
      return true;
    } catch (e) {
      Alert.alert("Error", e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    const step = STEPS[currentStep];
    if (step.key === "accepted") {
      const ok = await apiCallStep(`/driver/orders/${orderId}/start-trip`);
      if (ok) setCurrentStep(1);
    } else if (step.key === "en_route") {
      const ok = await apiCallStep(`/driver/orders/${orderId}/arrived`);
      if (ok) setCurrentStep(2);
    } else if (step.key === "arrived") {
      const ok = await apiCallStep(`/driver/orders/${orderId}/start-work`);
      if (ok) setCurrentStep(3);
    } else if (step.key === "in_progress") {
      // Take photo
      try {
        const result = await launchCamera({ mediaType: "photo", quality: 0.7, maxWidth: 1024, maxHeight: 1024 });
        if (result.assets && result.assets[0]) {
          setPhotoUri(result.assets[0].uri);
          const ok = await apiCallStep(`/driver/orders/${orderId}/upload-photo`);
          if (ok) setCurrentStep(4);
        }
      } catch (e) {
        Alert.alert("Camera Error", "Could not open camera. Please try again.");
      }
    } else if (step.key === "photo_taken") {
      setShowSignature(true);
    } else if (step.key === "signed") {
      const ok = await apiCallStep(`/driver/orders/${orderId}/complete`);
      if (ok) {
        setCurrentStep(6);
        Alert.alert("Order Completed!", "Great job! The order has been completed successfully.", [
          { text: "OK", onPress: () => navigation.navigate("Home") },
        ]);
      }
    }
  };

  const handleSignatureDone = async () => {
    setShowSignature(false);
    const ok = await apiCallStep(`/driver/orders/${orderId}/signature`);
    if (ok) setCurrentStep(5);
  };

  // Signature PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setCurrentPath([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
      },
      onPanResponderRelease: () => {
        setSignaturePaths((prev) => [...prev, currentPath]);
        setCurrentPath([]);
      },
    })
  ).current;

  const renderSignatureSVG = () => {
    const allPaths = [...signaturePaths, currentPath];
    return allPaths.map((path, i) => {
      if (path.length < 2) return null;
      return (
        <View key={i} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {path.map((point, j) => {
            if (j === 0) return null;
            return (
              <View
                key={j}
                style={{
                  position: "absolute",
                  left: point.x - 1.5,
                  top: point.y - 1.5,
                  width: 3,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: C.dark,
                }}
              />
            );
          })}
        </View>
      );
    });
  };

  const stepInfo = STEPS[currentStep];
  const progress = ((currentStep) / (STEPS.length - 1)) * 100;

  // Signature Modal
  if (showSignature) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
        <View style={{ paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: C.dark }}>Customer Signature</Text>
          <Text style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>Ask the customer to sign below</Text>
        </View>
        <View style={{ flex: 1, padding: 16 }}>
          <View
            style={{ flex: 1, backgroundColor: C.white, borderRadius: 12, borderWidth: 2, borderColor: C.border, borderStyle: "dashed", overflow: "hidden" }}
            {...panResponder.panHandlers}
          >
            <Text style={{ textAlign: "center", color: C.gray, marginTop: 20, fontSize: 14 }}>Sign here</Text>
            {renderSignatureSVG()}
          </View>
        </View>
        <View style={{ flexDirection: "row", padding: 16, paddingBottom: 28, gap: 12 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: C.white, borderRadius: 12, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: C.danger }}
            onPress={() => { setSignaturePaths([]); setCurrentPath([]); }}
          >
            <Text style={{ color: C.danger, fontSize: 16, fontWeight: "bold" }}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 2, backgroundColor: signaturePaths.length > 0 ? C.success : C.gray, borderRadius: 12, paddingVertical: 16, alignItems: "center" }}
            onPress={handleSignatureDone}
            disabled={signaturePaths.length === 0}
          >
            <Text style={{ color: C.white, fontSize: 16, fontWeight: "bold" }}>Confirm Signature</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      {/* Header */}
      <View style={{ paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", color: C.dark }}>Active Order</Text>
        <Text style={{ fontSize: 13, color: stepInfo.color, marginTop: 2, fontWeight: "600" }}>{stepInfo.icon} {stepInfo.label}</Text>
        {/* Progress bar */}
        <View style={{ height: 4, backgroundColor: C.border, borderRadius: 2, marginTop: 8 }}>
          <View style={{ height: 4, backgroundColor: stepInfo.color, borderRadius: 2, width: `${progress}%` }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Step indicators */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16, paddingHorizontal: 4 }}>
          {STEPS.map((s, i) => (
            <View key={s.key} style={{ alignItems: "center" }}>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: i <= currentStep ? s.color : C.border,
                justifyContent: "center", alignItems: "center",
              }}>
                <Text style={{ color: C.white, fontSize: 12, fontWeight: "bold" }}>{i + 1}</Text>
              </View>
              <Text style={{ fontSize: 8, color: i <= currentStep ? C.dark : C.gray, marginTop: 2, textAlign: "center", maxWidth: 45 }} numberOfLines={1}>
                {s.key === "accepted" ? "Accept" : s.key === "en_route" ? "Drive" : s.key === "arrived" ? "Arrive" : s.key === "in_progress" ? "Work" : s.key === "photo_taken" ? "Photo" : s.key === "signed" ? "Sign" : "Done"}
              </Text>
            </View>
          ))}
        </View>

        {/* Order info */}
        <View style={{ backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: C.dark }}>{serviceType}</Text>
          <Text style={{ fontSize: 12, color: C.gray, fontWeight: "600", marginTop: 4 }}>You earn:</Text>
          <Text style={{ fontSize: 28, fontWeight: "bold", color: C.success }}>${parseFloat(price).toFixed(0)}</Text>
          {description ? <Text style={{ fontSize: 13, color: C.gray, marginTop: 6 }}>{description}</Text> : null}
        </View>

        {/* Pickup location */}
        <View style={{ backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: C.gray, marginBottom: 4 }}>PICKUP LOCATION</Text>
          <Text style={{ fontSize: 16, color: C.dark, fontWeight: "500" }}>{address}</Text>
          <TouchableOpacity onPress={openMaps} style={{ backgroundColor: C.primaryLight, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, marginTop: 10, alignItems: "center" }}>
            <Text style={{ color: C.primary, fontSize: 14, fontWeight: "600" }}>Navigate to Pickup</Text>
          </TouchableOpacity>
        </View>

        {/* Customer */}
        <View style={{ backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: C.gray, marginBottom: 4 }}>CUSTOMER</Text>
          <Text style={{ fontSize: 16, color: C.dark, fontWeight: "500" }}>{customerName}</Text>
          {customerPhone ? (
            <TouchableOpacity onPress={callCustomer} style={{ backgroundColor: C.successLight, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16, marginTop: 10, alignItems: "center" }}>
              <Text style={{ color: C.success, fontSize: 14, fontWeight: "600" }}>Call Customer {customerPhone}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Photo preview */}
        {photoUri ? (
          <View style={{ backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.gray, marginBottom: 8 }}>COMPLETION PHOTO</Text>
            <Image source={{ uri: photoUri }} style={{ width: "100%", height: 200, borderRadius: 8 }} resizeMode="cover" />
          </View>
        ) : null}

        {/* Signature confirmation */}
        {currentStep >= 5 ? (
          <View style={{ backgroundColor: C.successLight, borderRadius: 12, padding: 16, marginBottom: 12, alignItems: "center" }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: C.success }}>\u2714 Customer signature captured</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Action button */}
      {stepInfo.action ? (
        <View style={{ padding: 16, paddingBottom: 28, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border }}>
          <TouchableOpacity
            style={{ backgroundColor: loading ? C.gray : stepInfo.color, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 8 }}
            onPress={handleNextStep}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <Text style={{ color: C.white, fontSize: 16, fontWeight: "bold" }}>{stepInfo.action}</Text>
            )}
          </TouchableOpacity>
          {currentStep < 3 && (
            <TouchableOpacity
              style={{ borderRadius: 12, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: C.danger }}
              onPress={handleCancelOrder}
            >
              <Text style={{ color: C.danger, fontSize: 14, fontWeight: "bold" }}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
}

// ============================================================================
// MY ORDERS SCREEN (Accepted/Scheduled Orders)
// ============================================================================
export function MyOrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active"); // active, scheduled, all

  useEffect(() => {
    loadOrders();
    const t = setInterval(loadOrders, REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, []);

  // Refresh when screen gains focus (so rescheduled orders move immediately)
  useFocusEffect(
    useCallback(() => { loadOrders(); }, [])
  );

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Try the my-orders endpoint first, fallback to available with status filter
      let data;
      try {
        data = await apiGet("/driver/orders/my-orders");
      } catch {
        data = await apiGet("/driver/orders/available?include_accepted=true");
      }
      const allOrders = data?.orders || [];
      // Filter to only show accepted/in-progress orders
      const myOrders = allOrders.filter(o => 
        ["accepted", "assigned", "en_route", "arrived", "in_progress", "scheduled"].includes(o.status)
      );
      setOrders(myOrders);
    } catch (e) {
      console.log("My orders error:", e);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (order) => {
    Alert.alert(
      "Cancel Order",
      `Are you sure you want to cancel this order? This action cannot be undone.`,
      [
        { text: "Keep Order", style: "cancel" },
        { text: "Cancel Order", style: "destructive", onPress: async () => {
          try {
            await apiPostAuth(`/driver/orders/${order.id}/cancel`);
            Alert.alert("Cancelled", "Order has been cancelled.");
            loadOrders();
          } catch (e) {
            Alert.alert("Error", e.message || "Could not cancel order.");
          }
        }},
      ]
    );
  };

  const filteredOrders = orders.filter(o => {
    if (tab === "active") {
      // Active = today's orders (scheduled_for is today or no date)
      return isToday(o.scheduled_for || o.created_at);
    }
    if (tab === "scheduled") {
      // Scheduled = future orders (scheduled_for is after today)
      return isFutureDate(o.scheduled_for);
    }
    // All = orders for this week
    return isThisWeek(o.scheduled_for || o.created_at);
  });

  const getStatusColor = (status) => {
    switch(status) {
      case "accepted": case "assigned": return C.primary;
      case "en_route": return C.warning;
      case "arrived": case "in_progress": return C.success;
      case "scheduled": return "#8b5cf6";
      default: return C.gray;
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case "accepted": case "assigned": return "Accepted";
      case "en_route": return "En Route";
      case "arrived": return "Arrived";
      case "in_progress": return "In Progress";
      case "scheduled": return "Scheduled";
      default: return status || "Unknown";
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      <View style={{ paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: C.primary, fontWeight: "600" }}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: C.dark, marginLeft: 16 }}>My Orders</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", padding: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border }}>
        {["active", "scheduled", "all"].map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: tab === t ? C.primary : C.grayLight, marginHorizontal: 4, alignItems: "center" }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: tab === t ? C.white : C.textSecondary }}>
              {t === "active" ? "Active" : t === "scheduled" ? "Scheduled" : "All"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
        ) : filteredOrders.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📦</Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: C.dark }}>No {tab === "active" ? "Active" : tab === "scheduled" ? "Scheduled" : ""} Orders</Text>
            <Text style={{ fontSize: 14, color: C.gray, marginTop: 8, textAlign: "center" }}>Orders you accept will appear here.</Text>
          </View>
        ) : (
          filteredOrders.map((o, i) => (
            <View key={o.id || i} style={{ backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: getStatusColor(o.status) }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: C.dark }}>{o.service_type || o.serviceType || "Service"}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                    <View style={{ backgroundColor: getStatusColor(o.status) + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: "600", color: getStatusColor(o.status) }}>{getStatusLabel(o.status)}</Text>
                    </View>
                  </View>
                </View>
                <Text style={{ fontSize: 22, fontWeight: "bold", color: C.success }}>${parseFloat(o.estimated_price || o.final_price || 0).toFixed(0)}</Text>
              </View>
              <Text style={{ fontSize: 13, color: C.gray, marginTop: 8 }}>📍 {o.pickup_address || "Address pending"}</Text>
              <Text style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>📅 {formatDate(o.scheduled_for || o.created_at)} • {formatTime(o.scheduled_for)}</Text>
              {o.customer_name && <Text style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>👤 {o.customer_name}</Text>}
              <View style={{ flexDirection: "row", marginTop: 12, gap: 8 }}>
                <TouchableOpacity
                  style={{ flex: 2, backgroundColor: C.primary, borderRadius: 8, paddingVertical: 10, alignItems: "center" }}
                  onPress={() => navigation.navigate("ActiveOrder", { order: o })}>
                  <Text style={{ color: C.white, fontSize: 13, fontWeight: "bold" }}>Continue Order</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: C.danger }}
                  onPress={() => cancelOrder(o)}>
                  <Text style={{ color: C.danger, fontSize: 13, fontWeight: "bold" }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// PROFILE SCREEN
// ============================================================================
export function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { loadProfile(); }, []);
  const loadProfile = async () => {
    try {
      const data = await apiGet("/driver/profile");
      setProfile(data.driver || data);
    } catch (e) {
      Alert.alert("Error", "Could not load profile.");
    } finally {
      setLoading(false);
    }
  };
  if (loading) return <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={C.primary} /></View>;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      <View style={{ paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: C.primary, fontWeight: "600" }}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: C.dark, marginLeft: 16 }}>My Profile</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: C.white, borderRadius: 12, padding: 20, alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 28, fontWeight: "700", color: C.primary }}>{(profile?.name || "D")[0].toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: C.dark }}>{profile?.name || "Driver"}</Text>
          <Text style={{ fontSize: 14, color: C.gray, marginTop: 4 }}>{profile?.email || ""}</Text>
          <View style={{ backgroundColor: profile?.status === "approved" ? C.successLight : "#fef3c7", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: profile?.status === "approved" ? C.success : C.warning }}>{(profile?.status || "pending").toUpperCase()}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: C.white, borderRadius: 12, padding: 16 }}>
          <ProfileRow label="Phone" value={profile?.phone || "Not set"} />
          <ProfileRow label="Vehicle" value={profile?.vehicleType || profile?.vehicle_type || "Not set"} />
          <ProfileRow label="License Plate" value={profile?.licensePlate || profile?.license_plate || "Not set"} />
          <ProfileRow label="Member Since" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "N/A"} />
        </View>
      </ScrollView>
    </View>
  );
}
function ProfileRow({ label, value }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.grayLight }}>
      <Text style={{ fontSize: 14, color: C.gray }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: "600", color: C.dark }}>{value}</Text>
    </View>
  );
}

// ============================================================================
// ORDER HISTORY SCREEN (Complete history with date, time, status, earnings)
// ============================================================================
export function OrderHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  useEffect(() => { loadOrders(); }, []);
  const loadOrders = async () => {
    try {
      // Try complete history endpoint, fallback to basic history
      let data;
      try {
        data = await apiGet("/driver/orders/complete-history");
      } catch {
        data = await apiGet("/driver/orders/history");
      }
      const allOrders = data?.orders || [];
      // Sort by date descending (newest first)
      allOrders.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
      setOrders(allOrders);
      // Calculate total earnings
      const total = allOrders
        .filter(o => o.status === "completed")
        .reduce((sum, o) => sum + parseFloat(o.final_price || o.estimated_price || 0), 0);
      setTotalEarnings(total);
    } catch (e) {
      console.log("History error:", e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "completed": return C.success;
      case "cancelled": case "canceled": return C.danger;
      case "accepted": case "assigned": return C.primary;
      case "en_route": case "arrived": case "in_progress": return C.warning;
      default: return C.gray;
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case "completed": return "Completed";
      case "cancelled": case "canceled": return "Cancelled";
      case "accepted": case "assigned": return "Accepted";
      case "en_route": return "En Route";
      case "arrived": return "Arrived";
      case "in_progress": return "In Progress";
      default: return (status || "Unknown").charAt(0).toUpperCase() + (status || "").slice(1);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      <View style={{ paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: C.primary, fontWeight: "600" }}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: C.dark, marginLeft: 16 }}>Order History</Text>
      </View>

      {/* Earnings Summary */}
      {!loading && orders.length > 0 && (
        <View style={{ backgroundColor: C.white, margin: 16, marginBottom: 0, borderRadius: 12, padding: 16, flexDirection: "row", justifyContent: "space-around" }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: C.gray, fontWeight: "600" }}>TOTAL EARNED</Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: C.success }}>${totalEarnings.toFixed(0)}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: C.gray, fontWeight: "600" }}>COMPLETED</Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: C.primary }}>{orders.filter(o => o.status === "completed").length}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 12, color: C.gray, fontWeight: "600" }}>TOTAL ORDERS</Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: C.dark }}>{orders.length}</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
            <Text style={{ fontSize: 18, fontWeight: "600", color: C.dark }}>No Orders Yet</Text>
            <Text style={{ fontSize: 14, color: C.gray, marginTop: 8, textAlign: "center" }}>Your order history will appear here as you complete jobs.</Text>
          </View>
        ) : (
          orders.map((o, i) => {
            const price = parseFloat(o.final_price || o.estimated_price || 0);
            const createdDate = o.created_at ? new Date(o.created_at) : null;
            const completedDate = o.updated_at ? new Date(o.updated_at) : null;
            return (
              <View key={o.id || i} style={{ backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: C.dark }}>{o.service_type || o.serviceType || "Service"}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
                      <View style={{ backgroundColor: getStatusColor(o.status) + "20", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: "600", color: getStatusColor(o.status) }}>{getStatusLabel(o.status)}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: "bold", color: o.status === "completed" ? C.success : C.gray }}>${price.toFixed(0)}</Text>
                </View>
                <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: C.grayLight, paddingTop: 8 }}>
                  <Text style={{ fontSize: 13, color: C.textSecondary }}>📍 {o.pickup_address || "N/A"}</Text>
                  {createdDate && (
                    <Text style={{ fontSize: 12, color: C.gray, marginTop: 4 }}>
                      📅 Created: {createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {createdDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </Text>
                  )}
                  {completedDate && o.status === "completed" && (
                    <Text style={{ fontSize: 12, color: C.success, marginTop: 2 }}>
                      ✅ Completed: {completedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {completedDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </Text>
                  )}
                  {o.customer_name && <Text style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>👤 {o.customer_name}</Text>}
                  {o.description && <Text style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>📦 {o.description}</Text>}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// EARNINGS SCREEN
// ============================================================================
export function EarningsScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      <View style={{ paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: C.primary, fontWeight: "600" }}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: C.dark, marginLeft: 16 }}>Earnings</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: C.white, borderRadius: 12, padding: 20, alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 13, color: C.gray, fontWeight: "600" }}>TOTAL EARNINGS</Text>
          <Text style={{ fontSize: 36, fontWeight: "bold", color: C.success, marginTop: 8 }}>$0.00</Text>
          <Text style={{ fontSize: 13, color: C.gray, marginTop: 4 }}>This Month</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: C.successLight, borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: C.success }}>0</Text>
            <Text style={{ fontSize: 12, color: C.success, marginTop: 4 }}>Jobs Done</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.primaryLight, borderRadius: 12, padding: 16, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: C.primary }}>$0</Text>
            <Text style={{ fontSize: 12, color: C.primary, marginTop: 4 }}>Today</Text>
          </View>
        </View>
        <Text style={{ fontSize: 13, color: C.gray, textAlign: "center", marginTop: 20 }}>Earnings details will appear as you complete orders.</Text>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// SETTINGS SCREEN
// ============================================================================
export function SettingsScreen({ navigation }) {
  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: async () => {
        await AsyncStorage.multiRemove(["driver_token", "driver_data", "user_data"]);
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
      }},
    ]);
  };
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      <View style={{ paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: C.primary, fontWeight: "600" }}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: C.dark, marginLeft: 16 }}>Settings</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {[
          { label: "My Orders", screen: "MyOrders" },
          { label: "My Profile", screen: "Profile" },
          { label: "Order History", screen: "OrderHistory" },
          { label: "Earnings", screen: "Earnings" },
          { label: "Notifications", screen: "Notifications" },
          { label: "Help & Support", screen: null },
          { label: "About", screen: null },
        ].map((item, i) => (
          <TouchableOpacity key={i} style={{ backgroundColor: C.white, flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: C.grayLight, borderRadius: i === 0 ? 12 : 0, borderTopLeftRadius: i === 0 ? 12 : 0, borderTopRightRadius: i === 0 ? 12 : 0 }} onPress={() => item.screen && navigation.navigate(item.screen)}>
            <Text style={{ fontSize: 16, fontWeight: "500", color: C.dark }}>{item.label}</Text>
            <Text style={{ color: C.gray }}>{">"}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={{ backgroundColor: C.white, padding: 16, borderRadius: 12, marginTop: 20 }} onPress={handleLogout}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: C.danger }}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ============================================================================
// DOCUMENTS SCREEN
// ============================================================================
export function DocumentsScreen({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      <View style={{ paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: C.primary, fontWeight: "600" }}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: C.dark, marginLeft: 16 }}>My Documents</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.dark, marginBottom: 12 }}>Uploaded Documents</Text>
          {["Driver's License", "Vehicle Insurance", "Vehicle Registration"].map((doc, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.grayLight }}>
              <Text style={{ fontSize: 14, color: C.dark }}>{doc}</Text>
              <View style={{ backgroundColor: C.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: C.success }}>Uploaded</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 13, color: C.gray, textAlign: "center", marginTop: 8 }}>Contact support to update your documents</Text>
      </ScrollView>
    </View>
  );
}


// ============================================================================
// NOTIFICATIONS SCREEN
// ============================================================================
export function NotificationsScreen({ navigation }) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} translucent={false} />
      <View style={{ paddingTop: SBH + 10, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border, flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 16, color: C.primary, fontWeight: "600" }}>{"< Back"}</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: C.dark, marginLeft: 16 }}>Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={{ backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.dark, marginBottom: 16 }}>Notification Settings</Text>
          
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.grayLight }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.dark }}>Push Notifications</Text>
              <Text style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Receive notifications for new orders</Text>
            </View>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.grayLight }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.dark }}>Sound</Text>
              <Text style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Play sound when new order arrives</Text>
            </View>
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.dark }}>Vibration</Text>
              <Text style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>Vibrate when new order arrives</Text>
            </View>
            <Switch value={vibrationEnabled} onValueChange={setVibrationEnabled} />
          </View>
        </View>

        <View style={{ backgroundColor: C.white, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.dark, marginBottom: 12 }}>Notification Types</Text>
          {[
            { label: "New Orders", desc: "Get notified when new orders are available" },
            { label: "Order Updates", desc: "Get notified about order status changes" },
            { label: "Messages", desc: "Get notified about new messages from customers" },
            { label: "Earnings", desc: "Get notified about payment updates" },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: C.grayLight }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: C.dark }}>{item.label}</Text>
                <Text style={{ fontSize: 12, color: C.gray, marginTop: 2 }}>{item.desc}</Text>
              </View>
              <Switch value={true} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
