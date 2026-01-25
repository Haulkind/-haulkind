import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContext';

export default function Login() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error', 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.c}>
      <View style={s.m}>
        <TouchableOpacity style={s.b} onPress={() => router.back()}>
          <Text style={s.bt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.t}>Sign In</Text>
        <View style={s.f}>
          <TextInput style={s.i} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={s.i} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
            <Text style={s.btt}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push('/auth/signup')}>
          <Text style={s.lt}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#f8fafc' },
  m: { flex: 1, padding: 20 },
  b: { marginBottom: 20 },
  bt: { color: '#2563eb', fontSize: 16 },
  t: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 30 },
  f: { gap: 16 },
  i: { backgroundColor: '#fff', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  btn: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btt: { color: '#fff', fontSize: 18, fontWeight: '600' },
  lt: { color: '#2563eb', textAlign: 'center', marginTop: 20 },
});
