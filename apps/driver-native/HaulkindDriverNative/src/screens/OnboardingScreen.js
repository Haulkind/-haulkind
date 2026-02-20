import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
// Document picking uses image picker for compatibility
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from '../api';

const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1e40af',
  bg: '#ffffff',
  bgGray: '#f8f9fa',
  text: '#1f2937',
  textSecondary: '#6b7280',
  border: '#d1d5db',
  borderActive: '#2563eb',
  success: '#16a34a',
  error: '#dc2626',
};

export function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Personal Information
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Step 2: Vehicle & Services
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [liftingLimit, setLiftingLimit] = useState('');
  const [canHaulAway, setCanHaulAway] = useState(true);
  const [canLaborOnly, setCanLaborOnly] = useState(true);

  // Step 3: Documents
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [driversLicense, setDriversLicense] = useState(null);
  const [insurance, setInsurance] = useState(null);
  const [registration, setRegistration] = useState(null);

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const pickImage = async (setter) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
      });

      if (!result.didCancel && result.assets && result.assets[0]) {
        setter(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickDocument = async (setter) => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      if (result.assets && result.assets[0]) {
        setter({
          uri: result.assets[0].uri,
          name: result.assets[0].fileName || 'document.jpg',
          type: result.assets[0].type || 'image/jpeg',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const validateStep1 = () => {
    if (!name || !phone || !address || !city || !state || !zipCode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      Alert.alert('Error', 'Please enter a valid ZIP code');
      return false;
    }
    if (state.length !== 2) {
      Alert.alert('Error', 'State must be 2 letters (e.g., CT)');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!canHaulAway && !canLaborOnly) {
      Alert.alert('Error', 'Please select at least one service type');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!profilePhoto) {
      Alert.alert('Error', 'Please upload your profile photo');
      return false;
    }
    if (!driversLicense) {
      Alert.alert('Error', "Please upload your driver's license");
      return false;
    }
    if (canHaulAway && (!insurance || !registration)) {
      Alert.alert('Error', 'Vehicle insurance and registration are required for Haul Away service');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('driver_token');
      
      // In production, upload images to S3 first
      // For now, sending placeholder URIs
      await apiPost('/driver/onboarding', {
        name,
        phone,
        address,
        city,
        state,
        zipCode,
        vehicleType: vehicleType || undefined,
        vehicleCapacity: vehicleCapacity || undefined,
        liftingLimit: liftingLimit ? parseInt(liftingLimit) : undefined,
        canHaulAway,
        canLaborOnly,
        documents: {
          profilePhoto: profilePhoto?.uri || 'pending',
          license: driversLicense?.uri || 'pending',
          insurance: insurance?.uri || 'pending',
          registration: registration?.uri || 'pending',
        },
      }, token);

      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgGray} />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 3</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Personal Information</Text>
            <Text style={styles.subtitle}>Tell us about yourself</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Smith"
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChangeText={(text) => setPhone(formatPhoneNumber(text))}
                  keyboardType="phone-pad"
                  maxLength={14}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Street Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="123 Main Street"
                  value={address}
                  onChangeText={setAddress}
                  editable={!loading}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.flex2]}>
                  <Text style={styles.label}>City *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Hartford"
                    value={city}
                    onChangeText={setCity}
                    editable={!loading}
                  />
                </View>

                <View style={[styles.inputContainer, styles.flex1]}>
                  <Text style={styles.label}>State *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="CT"
                    value={state}
                    onChangeText={(text) => setState(text.toUpperCase())}
                    maxLength={2}
                    autoCapitalize="characters"
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>ZIP Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="06106"
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="number-pad"
                  maxLength={10}
                  editable={!loading}
                />
              </View>
            </View>
          </View>
        )}

        {/* Step 2: Vehicle & Services */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Vehicle & Services</Text>
            <Text style={styles.subtitle}>What services can you provide?</Text>

            <View style={styles.form}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Vehicle Information (Optional)</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Vehicle Type</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Pickup Truck"
                    value={vehicleType}
                    onChangeText={setVehicleType}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Vehicle Capacity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 1/2 Ton"
                    value={vehicleCapacity}
                    onChangeText={setVehicleCapacity}
                    editable={!loading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Lifting Limit (lbs)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 50"
                    value={liftingLimit}
                    onChangeText={setLiftingLimit}
                    keyboardType="number-pad"
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Services You Can Provide *</Text>
                
                <TouchableOpacity
                  style={[styles.serviceCard, canHaulAway && styles.serviceCardActive]}
                  onPress={() => setCanHaulAway(!canHaulAway)}
                  disabled={loading}
                >
                  <View style={styles.serviceContent}>
                    <Text style={[styles.serviceTitle, canHaulAway && styles.serviceTextActive]}>
                      ð Junk Removal (Haul Away)
                    </Text>
                    <Text style={styles.serviceDescription}>
                      Pick up and dispose of junk
                    </Text>
                  </View>
                  <View style={[styles.checkbox, canHaulAway && styles.checkboxActive]}>
                    {canHaulAway && <Text style={styles.checkmark}>â</Text>}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.serviceCard, canLaborOnly && styles.serviceCardActive]}
                  onPress={() => setCanLaborOnly(!canLaborOnly)}
                  disabled={loading}
                >
                  <View style={styles.serviceContent}>
                    <Text style={[styles.serviceTitle, canLaborOnly && styles.serviceTextActive]}>
                      ðª Labor Only (Help Moving)
                    </Text>
                    <Text style={styles.serviceDescription}>
                      Help customers move items
                    </Text>
                  </View>
                  <View style={[styles.checkbox, canLaborOnly && styles.checkboxActive]}>
                    {canLaborOnly && <Text style={styles.checkmark}>â</Text>}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Upload Documents</Text>
            <Text style={styles.subtitle}>Required for verification</Text>

            <View style={styles.form}>
              {/* Profile Photo */}
              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>Profile Photo *</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickImage(setProfilePhoto)}
                  disabled={loading}
                >
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto.uri }} style={styles.uploadedImage} />
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Text style={styles.uploadIcon}>ð¸</Text>
                      <Text style={styles.uploadText}>Tap to upload photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Driver's License */}
              <View style={styles.uploadSection}>
                <Text style={styles.uploadLabel}>Driver's License *</Text>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => pickDocument(setDriversLicense)}
                  disabled={loading}
                >
                  {driversLicense ? (
                    <View style={styles.uploadedDoc}>
                      <Text style={styles.uploadIcon}>â</Text>
                      <Text style={styles.uploadedText}>License uploaded</Text>
                    </View>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Text style={styles.uploadIcon}>ð</Text>
                      <Text style={styles.uploadText}>Tap to upload</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Insurance (required if Haul Away selected) */}
              {canHaulAway && (
                <View style={styles.uploadSection}>
                  <Text style={styles.uploadLabel}>Vehicle Insurance *</Text>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickDocument(setInsurance)}
                    disabled={loading}
                  >
                    {insurance ? (
                      <View style={styles.uploadedDoc}>
                        <Text style={styles.uploadIcon}>â</Text>
                        <Text style={styles.uploadedText}>Insurance uploaded</Text>
                      </View>
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Text style={styles.uploadIcon}>ð¡ï¸</Text>
                        <Text style={styles.uploadText}>Tap to upload</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Registration (required if Haul Away selected) */}
              {canHaulAway && (
                <View style={styles.uploadSection}>
                  <Text style={styles.uploadLabel}>Vehicle Registration *</Text>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickDocument(setRegistration)}
                    disabled={loading}
                  >
                    {registration ? (
                      <View style={styles.uploadedDoc}>
                        <Text style={styles.uploadIcon}>â</Text>
                        <Text style={styles.uploadedText}>Registration uploaded</Text>
                      </View>
                    ) : (
                      <View style={styles.uploadPlaceholder}>
                        <Text style={styles.uploadIcon}>ð</Text>
                        <Text style={styles.uploadText}>Tap to upload</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.note}>
                <Text style={styles.noteText}>
                  ð Your documents are securely stored and will be reviewed within 24 hours.
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleBack}
            disabled={loading}
          >
            <Text style={styles.buttonSecondaryText}>Back</Text>
          </TouchableOpacity>
        )}
        {currentStep < 3 ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, currentStep === 1 && styles.buttonFull]}
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.buttonPrimaryText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonPrimaryText}>Complete Profile</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  progressContainer: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    backgroundColor: COLORS.bgGray,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  stepContainer: {
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: COLORS.bg,
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  section: {
    gap: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.bg,
  },
  serviceCardActive: {
    borderColor: COLORS.borderActive,
    backgroundColor: '#eff6ff',
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  serviceTextActive: {
    color: COLORS.primary,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadSection: {
    marginBottom: 16,
  },
  uploadLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  uploadIcon: {
    fontSize: 32,
  },
  uploadText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  uploadedDoc: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
  },
  uploadedText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  note: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: COLORS.bg,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonFull: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonSecondaryText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
