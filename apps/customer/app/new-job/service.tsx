import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/AuthContextFixed';

export default function ServiceSelection() {
  const router = useRouter();
  const { customer } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');

  const handleContinue = () => {
    if (!selectedService) {
      Alert.alert('Error', 'Please select a service type');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter your address');
      return;
    }
    
    Alert.alert(
      'Request Submitted',
      `Your ${selectedService === 'haul' ? 'Haul Away' : 'Labor Only'} request has been submitted. We will contact you shortly!`,
      [{ text: 'OK', onPress: () => router.replace('/home') }]
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView style={s.scroll}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={s.title}>New Job Request</Text>
        </View>

        <Text style={s.sectionTitle}>Select Service Type</Text>
        <View style={s.serviceGrid}>
          <TouchableOpacity 
            style={[s.serviceCard, selectedService === 'haul' && s.selected]}
            onPress={() => setSelectedService('haul')}
          >
            <Text style={s.serviceIcon}>🚛</Text>
            <Text style={s.serviceName}>Haul Away</Text>
            <Text style={s.serviceDesc}>Remove junk from your property</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[s.serviceCard, selectedService === 'labor' && s.selected]}
            onPress={() => setSelectedService('labor')}
          >
            <Text style={s.serviceIcon}>💪</Text>
            <Text style={s.serviceName}>Labor Only</Text>
            <Text style={s.serviceDesc}>Get help with heavy lifting</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Job Details</Text>
        <View style={s.inputGroup}>
          <Text style={s.label}>Address *</Text>
          <TextInput
            style={s.input}
            placeholder="Enter pickup address"
            value={address}
            onChangeText={setAddress}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>Description (optional)</Text>
          <TextInput
            style={[s.input, s.textArea]}
            placeholder="Describe what needs to be hauled or moved..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <TouchableOpacity style={s.submitBtn} onPress={handleContinue}>
          <Text style={s.submitText}>Submit Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  header: { padding: 20 },
  back: { color: '#3b82f6', fontSize: 16, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b', paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  serviceGrid: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  serviceCard: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20, 
    borderRadius: 16, 
    alignItems: 'center', 
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  selected: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  serviceIcon: { fontSize: 40, marginBottom: 12 },
  serviceName: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  serviceDesc: { fontSize: 12, color: '#64748b', textAlign: 'center' },
  inputGroup: { paddingHorizontal: 20, marginTop: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#475569', marginBottom: 8 },
  input: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    fontSize: 16, 
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: { 
    backgroundColor: '#3b82f6', 
    marginHorizontal: 20, 
    marginTop: 30, 
    marginBottom: 40,
    padding: 18, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  submitText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
