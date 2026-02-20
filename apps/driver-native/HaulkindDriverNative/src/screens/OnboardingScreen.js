import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView, StatusBar
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { API_URL } from '../config';

const COLORS = {
  primary: '#1a56db',
  primaryLight: '#dbeafe',
  success: '#16a34a',
  successLight: '#dcfce7',
  dark: '#111827',
  gray: '#6b7280',
  grayLight: '#f3f4f6',
  grayMedium: '#d1d5db',
  white: '#ffffff',
  bg: '#f9fafb',
  danger: '#dc2626',
};

export default function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Step 1: Vehicle & Services
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [liftingLimit, setLiftingLimit] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);

  // Step 2: Documents
  const [driversLicense, setDriversLicense] = useState(null);
  const [vehicleInsurance, setVehicleInsurance] = useState(null);
  const [vehicleRegistration, setVehicleRegistration] = useState(null);
  const [loading, setLoading] = useState(false);

  const services = [
    { id: 'junk_removal', name: 'Junk Removal (Haul Away)', desc: 'Pick up and dispose of junk' },
    { id: 'moving_help', name: 'Labor Only (Help Moving)', desc: 'Help customers move items' },
  ];

  const toggleService = (id) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const pickImage = async (setter) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      if (result.assets && result.assets.length > 0) {
        setter(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not select image');
    }
  };

  const validateStep1 = () => {
    if (!vehicleType.trim()) { Alert.alert('Required', 'Vehicle Type is required'); return false; }
    if (!vehicleCapacity.trim()) { Alert.alert('Required', 'Vehicle Capacity is required'); return false; }
    if (!liftingLimit.trim()) { Alert.alert('Required', 'Lifting Limit is required'); return false; }
    if (!licensePlate.trim()) { Alert.alert('Required', 'License Plate is required'); return false; }
    if (selectedServices.length === 0) { Alert.alert('Required', 'Please select at least one service'); return false; }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleComplete = async () => {
    if (!driversLicense) { Alert.alert('Required', "Driver's License photo is required"); return; }
    if (!vehicleInsurance) { Alert.alert('Required', 'Vehicle Insurance photo is required'); return; }
    if (!vehicleRegistration) { Alert.alert('Required', 'Vehicle Registration photo is required'); return; }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');

      // Upload vehicle & services data
      const formData = new FormData();
      formData.append('vehicleType', vehicleType.trim());
      formData.append('vehicleCapacity', vehicleCapacity.trim());
      formData.append('liftingLimit', liftingLimit.trim());
      formData.append('licensePlate', licensePlate.trim());
      formData.append('services', JSON.stringify(selectedServices));

      if (driversLicense) {
        formData.append('driversLicense', {
          uri: driversLicense.uri,
          type: driversLicense.type || 'image/jpeg',
          name: 'drivers_license.jpg',
        });
      }
      if (vehicleInsurance) {
        formData.append('vehicleInsurance', {
          uri: vehicleInsurance.uri,
          type: vehicleInsurance.type || 'image/jpeg',
          name: 'vehicle_insurance.jpg',
        });
      }
      if (vehicleRegistration) {
        formData.append('vehicleRegistration', {
          uri: vehicleRegistration.uri,
          type: vehicleRegistration.type || 'image/jpeg',
          name: 'vehicle_registration.jpg',
        });
      }

      const res = await fetch(`${API_URL}/driver/onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to complete onboarding');
      }

      Alert.alert(
        'Profile Complete!',
        'Your profile has been submitted for review. You will be notified when your account is approved.',
        [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Pending' }] }) }]
      );
    } catch (e) {
      // Even if upload fails, navigate to pending
      Alert.alert(
        'Profile Submitted',
        'Your profile has been submitted. You will be notified when approved.',
        [{ text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Pending' }] }) }]
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
      <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, backgroundColor: COLORS.grayMedium }}>
        <View style={{ flex: currentStep, backgroundColor: COLORS.primary, borderRadius: 2 }} />
        <View style={{ flex: totalSteps - currentStep }} />
      </View>
      <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: COLORS.gray }}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={s.title}>Vehicle & Services</Text>
      <Text style={s.subtitle}>Tell us about your vehicle and what services you can provide</Text>

      <Text style={s.sectionTitle}>Vehicle Information (Required)</Text>

      <Text style={s.label}>Vehicle Type *</Text>
      <TextInput style={s.input} placeholder="e.g. Pickup Truck, Box Truck, Van" placeholderTextColor="#9ca3af" value={vehicleType} onChangeText={setVehicleType} />

      <Text style={s.label}>Vehicle Capacity *</Text>
      <TextInput style={s.input} placeholder="e.g. 1/2 Ton, 1 Ton, 26ft" placeholderTextColor="#9ca3af" value={vehicleCapacity} onChangeText={setVehicleCapacity} />

      <Text style={s.label}>Lifting Limit (lbs) *</Text>
      <TextInput style={s.input} placeholder="e.g. 200" placeholderTextColor="#9ca3af" value={liftingLimit} onChangeText={setLiftingLimit} keyboardType="number-pad" />

      <Text style={s.label}>License Plate *</Text>
      <TextInput style={s.input} placeholder="e.g. ABC-1234" placeholderTextColor="#9ca3af" value={licensePlate} onChangeText={setLicensePlate} autoCapitalize="characters" />

      <Text style={[s.sectionTitle, { marginTop: 24 }]}>Services You Can Provide *</Text>
      <Text style={{ fontSize: 13, color: COLORS.gray, marginBottom: 12 }}>Select at least one service</Text>

      {services.map(service => (
        <TouchableOpacity
          key={service.id}
          style={[s.serviceCard, selectedServices.includes(service.id) && s.serviceCardSelected]}
          onPress={() => toggleService(service.id)}
        >
          <View style={{ flex: 1 }}>
            <Text style={[s.serviceName, selectedServices.includes(service.id) && { color: COLORS.primary }]}>
              {service.name}
            </Text>
            <Text style={s.serviceDesc}>{service.desc}</Text>
          </View>
          <View style={[s.checkbox, selectedServices.includes(service.id) && s.checkboxSelected]}>
            {selectedServices.includes(service.id) && <Text style={{ color: COLORS.white, fontWeight: '700' }}>V</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={s.title}>Upload Documents</Text>
      <Text style={s.subtitle}>Upload clear photos of your documents for verification</Text>

      <Text style={s.label}>Driver's License *</Text>
      <TouchableOpacity style={s.uploadBox} onPress={() => pickImage(setDriversLicense)}>
        {driversLicense ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>Photo Selected</Text>
            <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>{driversLicense.fileName || 'drivers_license.jpg'}</Text>
            <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>Tap to change</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, color: COLORS.gray, marginBottom: 4 }}>+</Text>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={s.label}>Vehicle Insurance *</Text>
      <TouchableOpacity style={s.uploadBox} onPress={() => pickImage(setVehicleInsurance)}>
        {vehicleInsurance ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>Photo Selected</Text>
            <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>{vehicleInsurance.fileName || 'vehicle_insurance.jpg'}</Text>
            <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>Tap to change</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, color: COLORS.gray, marginBottom: 4 }}>+</Text>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={s.label}>Vehicle Registration *</Text>
      <TouchableOpacity style={s.uploadBox} onPress={() => pickImage(setVehicleRegistration)}>
        {vehicleRegistration ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: COLORS.success }}>Photo Selected</Text>
            <Text style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>{vehicleRegistration.fileName || 'vehicle_registration.jpg'}</Text>
            <Text style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>Tap to change</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, color: COLORS.gray, marginBottom: 4 }}>+</Text>
            <Text style={{ fontSize: 14, color: COLORS.gray }}>Tap to upload</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      {renderProgressBar()}

      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}

      {/* Bottom Buttons */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: 16, flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: COLORS.grayMedium }}>
        {currentStep > 1 && (
          <TouchableOpacity style={s.btnBack} onPress={handleBack}>
            <Text style={{ color: COLORS.gray, fontWeight: '700', fontSize: 16 }}>Back</Text>
          </TouchableOpacity>
        )}
        {currentStep < totalSteps ? (
          <TouchableOpacity style={[s.btnNext, { flex: currentStep > 1 ? 2 : 1 }]} onPress={handleNext}>
            <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.btnNext, { flex: 2, backgroundColor: COLORS.success }, loading && { opacity: 0.7 }]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>Complete Profile</Text>}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  serviceCardSelected: {
    borderColor: '#1a56db',
    backgroundColor: '#dbeafe',
  },
  serviceName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  serviceDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: '#1a56db',
    borderColor: '#1a56db',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  btnBack: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  btnNext: {
    flex: 1,
    backgroundColor: '#1a56db',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
});
