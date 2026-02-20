import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  StatusBar, ActivityIndicator, Alert, Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from "react-native-image-picker";
import { API_URL } from "../config";

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
  selected: "#dbeafe",
  selectedBorder: "#1a56db",
};

const TOTAL_STEPS = 2;

export function OnboardingScreen({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Vehicle & Services (ALL REQUIRED)
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleCapacity, setVehicleCapacity] = useState("");
  const [liftingLimit, setLiftingLimit] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);

  // Step 2: Documents
  const [documents, setDocuments] = useState({
    profilePhoto: null,
    driversLicense: null,
    vehicleInsurance: null,
    vehicleRegistration: null,
  });

  const services = [
    { id: "junk_removal", name: "Junk Removal (Haul Away)", desc: "Pick up and dispose of junk" },
    { id: "labor_only", name: "Labor Only (Help Moving)", desc: "Help customers move items" },
  ];

  function toggleService(id) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function pickImage(docType) {
    try {
      const result = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
      });
      if (result.assets && result.assets.length > 0) {
        setDocuments((prev) => ({ ...prev, [docType]: result.assets[0] }));
      }
    } catch (e) {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  }

  async function uploadDocument(docType, asset) {
    try {
      const token = await AsyncStorage.getItem("driver_token");
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        type: asset.type || "image/jpeg",
        name: asset.fileName || `${docType}.jpg`,
      });
      formData.append("documentType", docType);

      const res = await fetch(`${API_URL}/driver/documents/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
      return res.ok;
    } catch (e) {
      console.log("Upload error:", e);
      return false;
    }
  }

  async function saveVehicleInfo() {
    try {
      const token = await AsyncStorage.getItem("driver_token");
      const res = await fetch(`${API_URL}/driver/profile/vehicle`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleType,
          vehicleCapacity,
          liftingLimit: liftingLimit ? parseInt(liftingLimit) : null,
          services: selectedServices,
        }),
      });
      return res.ok;
    } catch (e) {
      console.log("Save vehicle error:", e);
      return false;
    }
  }

  async function completeOnboarding() {
    setLoading(true);
    try {
      // Save vehicle info
      await saveVehicleInfo();

      // Upload documents
      for (const [docType, asset] of Object.entries(documents)) {
        if (asset) {
          await uploadDocument(docType, asset);
        }
      }

      // Navigate to Home
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function canProceedStep1() {
    return vehicleType.trim() !== "" && vehicleCapacity.trim() !== "" && selectedServices.length > 0;
  }

  function canProceedStep2() {
    return documents.driversLicense !== null && documents.vehicleInsurance !== null && documents.vehicleRegistration !== null;
  }

  function renderProgressBar() {
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / TOTAL_STEPS) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of {TOTAL_STEPS}</Text>
      </View>
    );
  }

  function renderStep1() {
    return (
      <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepTitle}>Vehicle & Services</Text>
        <Text style={styles.stepSubtitle}>Tell us about your vehicle and the services you can provide</Text>

        <Text style={styles.sectionTitle}>Vehicle Information *</Text>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Vehicle Type *</Text>
          <TextInput
            style={styles.fieldInput}
            value={vehicleType}
            onChangeText={setVehicleType}
            placeholder="e.g. Pickup Truck, Box Truck, Van"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Vehicle Capacity *</Text>
          <TextInput
            style={styles.fieldInput}
            value={vehicleCapacity}
            onChangeText={setVehicleCapacity}
            placeholder="e.g. 1/2 Ton, 1 Ton, 26ft"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Lifting Limit (lbs)</Text>
          <TextInput
            style={styles.fieldInput}
            value={liftingLimit}
            onChangeText={setLiftingLimit}
            placeholder="e.g. 150"
            placeholderTextColor="#9ca3af"
            keyboardType="number-pad"
          />
        </View>

        <Text style={styles.sectionTitle}>Services You Can Provide *</Text>
        <Text style={styles.sectionHint}>Select at least one service</Text>

        {services.map((service) => {
          const isSelected = selectedServices.includes(service.id);
          return (
            <TouchableOpacity
              key={service.id}
              style={[styles.serviceCard, isSelected && styles.serviceCardSelected]}
              onPress={() => toggleService(service.id)}
              activeOpacity={0.7}
            >
              <View style={styles.serviceInfo}>
                <Text style={[styles.serviceName, isSelected && styles.serviceNameSelected]}>
                  {service.name}
                </Text>
                <Text style={styles.serviceDesc}>{service.desc}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={styles.checkmark}>{"✓"}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.nextBtn, !canProceedStep1() && styles.nextBtnDisabled]}
            onPress={() => setCurrentStep(2)}
            disabled={!canProceedStep1()}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  function renderDocUpload(label, docType) {
    const doc = documents[docType];
    return (
      <View style={styles.docSection}>
        <Text style={styles.fieldLabel}>{label} *</Text>
        <TouchableOpacity
          style={[styles.uploadBox, doc && styles.uploadBoxDone]}
          onPress={() => pickImage(docType)}
          activeOpacity={0.7}
        >
          {doc ? (
            <View style={styles.uploadedContent}>
              <Image source={{ uri: doc.uri }} style={styles.uploadedImage} />
              <Text style={styles.uploadedText}>Tap to change</Text>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>+</Text>
              <Text style={styles.uploadText}>Tap to upload</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  function renderStep2() {
    return (
      <ScrollView contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.stepTitle}>Documents</Text>
        <Text style={styles.stepSubtitle}>Upload your required documents</Text>

        {renderDocUpload("Profile Photo", "profilePhoto")}
        {renderDocUpload("Driver's License", "driversLicense")}
        {renderDocUpload("Vehicle Insurance", "vehicleInsurance")}
        {renderDocUpload("Vehicle Registration", "vehicleRegistration")}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setCurrentStep(1)}
            activeOpacity={0.8}
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, !canProceedStep2() && styles.nextBtnDisabled]}
            onPress={completeOnboarding}
            disabled={!canProceedStep2() || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.nextBtnText}>Complete Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      {renderProgressBar()}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  progressContainer: { paddingTop: 50, paddingHorizontal: 24, paddingBottom: 8, backgroundColor: COLORS.white },
  progressBar: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  progressText: { textAlign: "center", marginTop: 8, fontSize: 14, color: COLORS.textSecondary },
  stepContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  stepTitle: { fontSize: 24, fontWeight: "bold", color: COLORS.text, marginBottom: 4 },
  stepSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text, marginTop: 16, marginBottom: 8 },
  sectionHint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  fieldInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: COLORS.text, backgroundColor: COLORS.white },
  serviceCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 16, marginBottom: 12 },
  serviceCardSelected: { borderColor: COLORS.selectedBorder, backgroundColor: COLORS.selected },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: "bold", color: COLORS.text, marginBottom: 4 },
  serviceNameSelected: { color: COLORS.primary },
  serviceDesc: { fontSize: 13, color: COLORS.textSecondary },
  checkbox: { width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  checkboxSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  buttonRow: { flexDirection: "row", marginTop: 24, gap: 12 },
  backBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, paddingVertical: 14, alignItems: "center", backgroundColor: COLORS.white },
  backBtnText: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  nextBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  nextBtnDisabled: { backgroundColor: "#93c5fd" },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  docSection: { marginBottom: 20 },
  uploadBox: { borderWidth: 2, borderColor: COLORS.border, borderStyle: "dashed", borderRadius: 10, padding: 24, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.white, minHeight: 120 },
  uploadBoxDone: { borderColor: COLORS.success, borderStyle: "solid" },
  uploadPlaceholder: { alignItems: "center" },
  uploadIcon: { fontSize: 32, color: COLORS.textSecondary, marginBottom: 4 },
  uploadText: { fontSize: 14, color: COLORS.textSecondary },
  uploadedContent: { alignItems: "center" },
  uploadedImage: { width: 100, height: 100, borderRadius: 8, marginBottom: 8 },
  uploadedText: { fontSize: 12, color: COLORS.primary },
});
