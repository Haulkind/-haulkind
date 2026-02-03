import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/AuthContextFixed';

export default function Home() {
  const router = useRouter();
  const { customer, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={s.c}>
      <ScrollView style={s.sc}>
        <View style={s.h}>
          <Text style={s.wt}>Welcome, {customer?.name || 'User'}!</Text>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={s.lo}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.st}>What would you like to do today?</Text>
        <View style={s.g}>
          <TouchableOpacity style={s.card} onPress={() => router.push('/new-job/service')}>
            <Text style={s.ci}>🚛</Text>
            <Text style={s.ct}>Haul Away</Text>
            <Text style={s.cd}>Remove junk from your property</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.card} onPress={() => router.push('/new-job/service')}>
            <Text style={s.ci}>💪</Text>
            <Text style={s.ct}>Labor Only</Text>
            <Text style={s.cd}>Get help with heavy lifting</Text>
          </TouchableOpacity>
        </View>
        <View style={s.sec}>
          <Text style={s.sh}>Recent Jobs</Text>
          <View style={s.ej}>
            <Text style={s.ejt}>No jobs yet</Text>
            <Text style={s.ejs}>Your completed jobs will appear here</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#f8fafc' },
  sc: { flex: 1 },
  h: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  wt: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  lo: { color: '#ef4444', fontSize: 16 },
  st: { fontSize: 16, color: '#64748b', paddingHorizontal: 20, marginBottom: 20 },
  g: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 30 },
  card: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  ci: { fontSize: 40, marginBottom: 12 },
  ct: { fontSize: 18, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  cd: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  sec: { paddingHorizontal: 20 },
  sh: { fontSize: 20, fontWeight: '600', color: '#1e293b', marginBottom: 12 },
  ej: { backgroundColor: '#fff', padding: 30, borderRadius: 12, alignItems: 'center' },
  ejt: { fontSize: 16, color: '#64748b', marginBottom: 4 },
  ejs: { fontSize: 14, color: '#94a3b8' },
});
