import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPost } from "./api";

const COLORS = {
  primary: "#1a56db",
  primaryDark: "#1e40af",
  bg: "#f8f9fa",
  white: "#ffffff",
  text: "#1f2937",
  textSecondary: "#6b7280",
  border: "#d1d5db",
  error: "#dc2626",
  success: "#16a34a",
};

function InputField({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, required }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}{required ? " *" : ""}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || "sentences"}
      />
    </View>
  );
}

function PrimaryButton({ title, onPress, disabled, loading }) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, disabled && styles.primaryBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.primaryBtnText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

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
    setErr("");
    setLoading(true);
    try {
      const data = await apiPost("/driver/auth/login", { email, password });
      const token = data?.token || data?.accessToken;
      if (token) await AsyncStorage.setItem("driver_token", token);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainerSmall}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>H</Text>
          </View>
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
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
    if (!firstName.trim() || !lastName.trim()) {
      setErr("First name and last name are required.");
      return;
    }
    if (!email.trim()) {
      setErr("Email is required.");
      return;
    }
    if (!phone.trim()) {
      setErr("Phone number is required.");
      return;
    }
    if (!address.trim() || !city.trim() || !state.trim() || !zipCode.trim()) {
      setErr("Complete address is required.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const data = await apiPost("/driver/auth/signup", {
        name: fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        password,
      });
      const token = data?.token || data?.accessToken;
      if (token) await AsyncStorage.setItem("driver_token", token);
      navigation.reset({ index: 0, routes: [{ name: "Onboarding" }] });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  const allFilled = firstName && lastName && email && phone && address && city && state && zipCode && password && confirmPassword;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainerSmall}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Text style={styles.appName}>Haulkind Driver</Text>
          <Text style={styles.subtitle}>Create your driver account</Text>
        </View>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Sign Up</Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <InputField label="First Name" value={firstName} onChangeText={setFirstName} placeholder="John" required />
            </View>
            <View style={styles.halfField}>
              <InputField label="Last Name" value={lastName} onChangeText={setLastName} placeholder="Smith" required />
            </View>
          </View>

          <InputField label="Email" value={email} onChangeText={setEmail} placeholder="your.email@example.com" keyboardType="email-address" autoCapitalize="none" required />

          <InputField label="Phone Number" value={phone} onChangeText={(t) => setPhone(formatPhone(t))} placeholder="(555) 123-4567" keyboardType="phone-pad" required />

          <InputField label="Street Address" value={address} onChangeText={setAddress} placeholder="123 Main St" required />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <InputField label="City" value={city} onChangeText={setCity} placeholder="New York" required />
            </View>
            <View style={styles.halfField}>
              <InputField label="State" value={state} onChangeText={setState} placeholder="NY" autoCapitalize="characters" required />
            </View>
          </View>

          <InputField label="ZIP Code" value={zipCode} onChangeText={setZipCode} placeholder="10001" keyboardType="number-pad" required />

          <InputField label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry required />

          <InputField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter your password" secureTextEntry required />

          {err ? <Text style={styles.err}>{err}</Text> : null}

          <PrimaryButton title="Create Account" onPress={onSignup} disabled={!allFilled} loading={loading} />
        </View>
        <View style={styles.bottomLink}>
          <Text style={styles.bottomText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function HomeScreen({ navigation }) {
  const [token, setToken] = useState(null);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem("driver_token");
      setToken(t);
      if (!t) navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    })();
  }, [navigation]);

  async function logout() {
    await AsyncStorage.removeItem("driver_token");
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  }

  return (
    <View style={styles.homeWrap}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.homeHeader}>
        <Text style={styles.homeHeaderText}>Haulkind Driver</Text>
      </View>
      <View style={styles.homeContent}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome, Driver!</Text>
          <Text style={styles.welcomeText}>You are logged in and ready to receive jobs.</Text>
        </View>
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusOnline}>Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  logoContainerSmall: { alignItems: "center", marginBottom: 20 },
  logoCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  logoText: { fontSize: 28, fontWeight: "bold", color: COLORS.white },
  appName: { fontSize: 22, fontWeight: "bold", color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  formCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  formTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.text, marginBottom: 16 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: COLORS.text, backgroundColor: COLORS.white },
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: "center", marginTop: 8 },
  primaryBtnDisabled: { backgroundColor: "#93c5fd" },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  err: { color: COLORS.error, fontSize: 13, marginBottom: 8, textAlign: "center" },
  bottomLink: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  bottomText: { color: COLORS.textSecondary, fontSize: 14 },
  linkText: { color: COLORS.primary, fontSize: 14, fontWeight: "bold" },
  row: { flexDirection: "row", gap: 12 },
  halfField: { flex: 1 },
  homeWrap: { flex: 1, backgroundColor: COLORS.bg },
  homeHeader: { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 20, paddingHorizontal: 24 },
  homeHeaderText: { fontSize: 22, fontWeight: "bold", color: COLORS.white },
  homeContent: { flex: 1, padding: 24 },
  welcomeCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 24, marginBottom: 16, alignItems: "center", elevation: 3 },
  welcomeTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.text, marginBottom: 8 },
  welcomeText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  statusCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, marginBottom: 16, elevation: 3 },
  statusTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text, marginBottom: 8 },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success, marginRight: 8 },
  statusOnline: { fontSize: 14, color: COLORS.success, fontWeight: "600" },
  logoutBtn: { backgroundColor: COLORS.white, borderRadius: 8, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: COLORS.error },
  logoutText: { color: COLORS.error, fontSize: 16, fontWeight: "bold" },
});
