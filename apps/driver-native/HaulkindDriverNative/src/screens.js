import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPost } from "./api";

const COLORS = {
  primary: "#1B5E20",
  primaryDark: "#0D3B12",
  primaryLight: "#E8F5E9",
  accent: "#FF6F00",
  white: "#FFFFFF",
  bg: "#F5F5F5",
  text: "#212121",
  textSecondary: "#757575",
  border: "#E0E0E0",
  error: "#D32F2F",
  inputBg: "#FFFFFF",
};

function InputField({ label, icon, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{icon} {label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#BDBDBD"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || "default"}
        autoCapitalize={autoCapitalize || "sentences"}
        style={styles.input}
      />
    </View>
  );
}

function PrimaryButton({ title, onPress, disabled, loading }) {
  if (loading) {
    return (
      <View style={[styles.btn, styles.btnLoading]}>
        <ActivityIndicator color={COLORS.white} />
        <Text style={styles.btnText}>  Aguarde...</Text>
      </View>
    );
  }
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.btn, disabled && styles.btnDisabled]} activeOpacity={0.8}>
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>🚛</Text>
          </View>
          <Text style={styles.appName}>Haulkind Driver</Text>
          <Text style={styles.subtitle}>Faça login para continuar</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Login</Text>

          <InputField
            label="E-mail"
            icon="📧"
            value={email}
            onChangeText={setEmail}
            placeholder="seu.email@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Senha"
            icon="🔒"
            value={password}
            onChangeText={setPassword}
            placeholder="Digite sua senha"
            secureTextEntry
          />

          {err ? <Text style={styles.err}>{err}</Text> : null}

          <PrimaryButton
            title="Entrar"
            onPress={onLogin}
            disabled={!email || !password}
            loading={loading}
          />
        </View>

        <View style={styles.bottomLink}>
          <Text style={styles.bottomText}>Não tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.linkText}>Criar conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSignup() {
    setErr("");
    if (password !== confirmPassword) {
      setErr("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setErr("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiPost("/driver/auth/signup", { name, email, phone, password });
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
            <Text style={styles.logoIcon}>🚛</Text>
          </View>
          <Text style={styles.appName}>Haulkind Driver</Text>
          <Text style={styles.subtitle}>Crie sua conta de motorista</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Cadastro</Text>

          <InputField
            label="Nome completo"
            icon="👤"
            value={name}
            onChangeText={setName}
            placeholder="Ex: João da Silva"
          />

          <InputField
            label="E-mail"
            icon="📧"
            value={email}
            onChangeText={setEmail}
            placeholder="seu.email@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <InputField
            label="Telefone"
            icon="📱"
            value={phone}
            onChangeText={setPhone}
            placeholder="(11) 99999-9999"
            keyboardType="phone-pad"
          />

          <InputField
            label="Senha"
            icon="🔒"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
          />

          <InputField
            label="Confirmar senha"
            icon="🔒"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repita a senha"
            secureTextEntry
          />

          {err ? <Text style={styles.err}>{err}</Text> : null}

          <PrimaryButton
            title="Criar conta"
            onPress={onSignup}
            disabled={!name || !email || !phone || !password || !confirmPassword}
            loading={loading}
          />
        </View>

        <View style={styles.bottomLink}>
          <Text style={styles.bottomText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Fazer login</Text>
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
        <Text style={styles.homeHeaderText}>🚛 Haulkind Driver</Text>
      </View>
      <View style={styles.homeContent}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeIcon}>✅</Text>
          <Text style={styles.welcomeTitle}>Bem-vindo, Motorista!</Text>
          <Text style={styles.welcomeText}>Você está conectado e pronto para receber entregas.</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusOnline}>Online</Text>
          </View>
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.8}>
          <Text style={styles.logoutText}>🚪 Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  // Logo
  logoContainer: { alignItems: "center", marginTop: 60, marginBottom: 30 },
  logoContainerSmall: { alignItems: "center", marginTop: 30, marginBottom: 20 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: "center", alignItems: "center",
    marginBottom: 12,
  },
  logoIcon: { fontSize: 36 },
  appName: { fontSize: 24, fontWeight: "800", color: COLORS.primary },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

  // Form Card
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 16 },

  // Input Fields
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.inputBg,
  },

  // Button
  btn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  btnDisabled: { opacity: 0.4 },
  btnLoading: { opacity: 0.7 },
  btnText: { color: COLORS.white, fontWeight: "700", fontSize: 16 },

  // Error
  err: { color: COLORS.error, fontSize: 13, marginBottom: 4, textAlign: "center" },

  // Bottom Link
  bottomLink: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  bottomText: { color: COLORS.textSecondary, fontSize: 14 },
  linkText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },

  // Home Screen
  homeWrap: { flex: 1, backgroundColor: COLORS.bg },
  homeHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  homeHeaderText: { color: COLORS.white, fontSize: 22, fontWeight: "800" },
  homeContent: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },

  welcomeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  welcomeIcon: { fontSize: 40, marginBottom: 12 },
  welcomeTitle: { fontSize: 20, fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  welcomeText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },

  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  statusTitle: { fontSize: 16, fontWeight: "600", color: COLORS.text },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#4CAF50", marginRight: 6 },
  statusOnline: { fontSize: 14, fontWeight: "600", color: "#4CAF50" },

  logoutBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.error,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: { color: COLORS.error, fontWeight: "700", fontSize: 15 },
});
