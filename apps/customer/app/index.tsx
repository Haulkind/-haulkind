import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../lib/AuthContext';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && user) {
      router.replace('/home');
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <SafeAreaView style={s.c}>
        <View style={s.lc}>
          <Text style={s.lt}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.c}>
      <View style={s.ct}>
        <View style={s.lg}>
          <Text style={s.lgt}>H</Text>
        </View>
        <Text style={s.t}>Haulkind</Text>
        <Text style={s.st}>Junk removal made easy</Text>
        <View style={s.bc}>
          <TouchableOpacity style={s.pb} onPress={() => router.push('/auth/signup')}>
            <Text style={s.pbt}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.sb} onPress={() => router.push('/auth/login')}>
            <Text style={s.sbt}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: '#f8fafc' },
  lc: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lt: { fontSize: 18, color: '#64748b' },
  ct: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  lg: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  lgt: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  t: { fontSize: 32, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  st: { fontSize: 18, color: '#64748b', marginBottom: 40 },
  bc: { width: '100%', gap: 12 },
  pb: { backgroundColor: '#2563eb', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  pbt: { color: '#fff', fontSize: 18, fontWeight: '600' },
  sb: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  sbt: { color: '#1e293b', fontSize: 18, fontWeight: '600' },
});ff',
      fontSize: 18,
      fontWeight: '600',
  },
    secondaryButton: {
      backgroundColor: '#fff',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#e2e8f0',
        },
  secondaryButtonText: {
    color: '#1e293b',
          fontSize: 18,
          fontWeight: '600',
      },
});
