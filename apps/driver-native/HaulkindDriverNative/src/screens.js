import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPost } from "./api";

function Btn({ title, onPress, disabled }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.btn, disabled && styles.btnDisabled]}>
      <Text style={styles.btnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onLogin() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiPost("/driver/auth/login", { email, password });
      const token = data?.token || data?.accessToken;
      if (!token) throw new Error("Token não retornou na resposta.");
      await AsyncStorage.setItem("driver_token", token);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.h1}>Driver Login</Text>

      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" style={styles.input} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />

      {err ? <Text style={styles.err}>{err}</Text> : null}

      {loading ? <ActivityIndicator /> : <Btn title="Login" onPress={onLogin} disabled={!email || !password} />}

      <TouchableOpacity onPress={() => navigation.navigate("Signup")} style={styles.link}>
        <Text style={styles.linkText}>Create account</Text>
      </TouchableOpacity>
    </View>
  );
}

export function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSignup() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiPost("/driver/auth/signup", { name, email, password });
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
    <View style={styles.wrap}>
      <Text style={styles.h1}>Driver Signup</Text>

      <TextInput value={name} onChangeText={setName} placeholder="Name" style={styles.input} />
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" style={styles.input} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry style={styles.input} />

      {err ? <Text style={styles.err}>{err}</Text> : null}

      {loading ? <ActivityIndicator /> : <Btn title="Create" onPress={onSignup} disabled={!name || !email || !password} />}

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
        <Text style={styles.linkText}>Back to login</Text>
      </TouchableOpacity>
    </View>
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
    <View style={styles.wrap}>
      <Text style={styles.h1}>Home</Text>
      <Text style={styles.p}>Você está logado.</Text>
      <Text style={styles.small}>Token: {token ? token.slice(0, 20) + "..." : "-"}</Text>
      <Btn title="Logout" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20, justifyContent: "center", gap: 12 },
  h1: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  p: { fontSize: 16 },
  small: { fontSize: 12, opacity: 0.7 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12 },
  btn: { backgroundColor: "#111", padding: 14, borderRadius: 12, alignItems: "center" },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "700" },
  err: { color: "crimson" },
  link: { paddingTop: 8, alignItems: "center" },
  linkText: { color: "#1d4ed8", fontWeight: "600" },
});
