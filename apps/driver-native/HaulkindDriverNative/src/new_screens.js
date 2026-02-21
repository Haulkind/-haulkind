import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert,
  Dimensions, FlatList, Modal, Vibration, Switch, PermissionsAndroid,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import Geolocation from "@react-native-community/geolocation";
import { apiPost } from "./api";
import { API_URL } from "./config";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RADIUS_MILES = 40;
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

  // 40 mile radius circle
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

  // Request location
  useEffect(() => {
    async function requestLoc() {
      if (Platform.OS === "android") {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            { title: "Location Permission", message: "Haulkind needs your location to show nearby orders.", buttonPositive: "Allow" }
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) getLoc();
          else setDriverLocation({ latitude: 28.5383, longitude: -81.3792 });
        } catch { setDriverLocation({ latitude: 28.5383, longitude: -81.3792 }); }
      } else getLoc();
    }
    function getLoc() {
      Geolocation.getCurrentPosition(
        (pos) => setDriverLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => setDriverLocation({ latitude: 28.5383, longitude: -81.3792 }),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }
    requestLoc();
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

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!isOnline) { setOrders([]); setFilteredOrders([]); setLoading(false); return; }
    try {
      const data = await apiGet("/driver/orders/available");
      const rawOrders = data?.orders || [];
      const enriched = await Promise.all(rawOrders.map(async (order) => {
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

      const withinRadius = enriched.filter((o) => o.distance === null || o.distance <= RADIUS_MILES);
      withinRadius.sort((a, b) => (a.distance || 999) - (b.distance || 999));

      // Vibrate for new orders
      const currentIds = new Set(withinRadius.map((o) => o.id));
      const brandNew = withinRadius.filter((o) => !previousOrderIds.has(o.id));
      if (brandNew.length > 0 && previousOrderIds.size > 0) {
        Vibration.vibrate([0, 300, 100, 300]);
      }
      setPreviousOrderIds(currentIds);
      setOrders(withinRadius);
      setMapKey((k) => k + 1);
    } catch (e) { console.log("Fetch error:", e); } finally { setLoading(false); }
  }, [isOnline, driverLocation]);

  useEffect(() => {
    fetchOrders();
    if (isOnline) refreshRef.current = setInterval(fetchOrders, REFRESH_INTERVAL);
    return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
  }, [isOnline, driverLocation]);

  // Apply filter
  useEffect(() => {
    let f = [...orders];
    if (filter === "TODAY") f = f.filter((o) => isToday(o.scheduled_for || o.created_at));
    else if (filter === "NEW") f = f.filter((o) => o.isNew);
    setFilteredOrders(f);
  }, [orders, filter]);

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
    if (!newStatus) { setOrders([]); setFilteredOrders([]); }
  }

  async function acceptOrder(order) {
    setAccepting(true);
    try {
      await apiPostAuth(`/driver/orders/${order.id}/accept`);
      Vibration.vibrate(200);
      Alert.alert("Order Accepted!", `You accepted the ${order.service_type || "Haul Away"} order.`, [
        { text: "OK", onPress: () => { setShowDetail(false); fetchOrders(); } },
      ]);
    } catch (e) { Alert.alert("Error", e.message || "Could not accept order."); } finally { setAccepting(false); }
  }

  function declineOrder(order) {
    setShowDetail(false);
    setOrders((prev) => prev.filter((o) => o.id !== order.id));
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
        const order = orders.find((o) => o.id === msg.id);
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
          <Text style={styles.cardPrice}>${parseFloat(price).toFixed(0)}</Text>
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

          {/* Timer bar */}
          <View style={styles.timerBarBg}>
            <View style={[styles.timerBarFill, { width: `${timerPct}%`, backgroundColor: timerColor }]} />
          </View>
          <Text style={[styles.timerText, { color: timerColor }]}>
            {acceptTimer > 0 ? `${acceptTimer}s remaining to accept` : "Time expired - order still available"}
          </Text>

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
            <TouchableOpacity style={styles.declineBtn} onPress={() => declineOrder(o)}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.acceptBtn, accepting && { opacity: 0.7 }]} onPress={() => acceptOrder(o)} disabled={accepting}>
              {accepting ? <ActivityIndicator color="#fff" /> : <Text style={styles.acceptBtnText}>ACCEPT ORDER</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================
  const dLat = driverLocation?.latitude || 28.5383;
  const dLng = driverLocation?.longitude || -81.3792;

  return (
    <View style={styles.homeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} translucent={false} />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoSmall}><Text style={styles.logoSmallText}>H</Text></View>
          <View>
            <Text style={styles.topBarTitle}>Haulkind</Text>
            <Text style={styles.topBarSub}>{isOnline ? `${filteredOrders.length} orders nearby` : "You're offline"}</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <Text style={[styles.onlineLabel, { color: isOnline ? "#4ade80" : "#fbbf24" }]}>{isOnline ? "ONLINE" : "OFFLINE"}</Text>
          <Switch value={isOnline} onValueChange={toggleOnline} trackColor={{ false: "#374151", true: "#16a34a" }} thumbColor={isOnline ? "#4ade80" : "#9ca3af"} />
          <TouchableOpacity onPress={logout} style={styles.logoutIcon}><Text style={styles.logoutIconText}>⏻</Text></TouchableOpacity>
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
  logoutIcon: { padding: 6, marginLeft: 4 },
  logoutIconText: { fontSize: 18, color: "rgba(255,255,255,0.7)" },

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
