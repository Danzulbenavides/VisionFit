import React, { useState, useEffect } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { createAddress, getServiceArea } from "../../api/addresses";

export default function AddAddressScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");

  const [lastName, setLastName] = useState("");

  const [street, setStreet] = useState("");

  const [apartment, setApartment] = useState("");

  const [phone, setPhone] = useState("");

  const [isDefault, setIsDefault] = useState(false);

  const [saving, setSaving] = useState(false);

  const [barangay, setBarangay] = useState("");

  const [serviceArea, setServiceArea] = useState(null);

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    getServiceArea()
      .then((result) => result.data && setServiceArea(result.data))
      .catch((err) => console.error("Load service area error:", err));
  }, []);

  const handleSave = async () => {
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !street.trim() ||
      !phone.trim() ||
      !barangay.trim()
    ) {
      Alert.alert(
        "Missing Information",
        "Please complete all required address fields.",
      );

      return;
    }

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      street: street.trim(),
      apartment: apartment.trim() || null,
      barangay,
      phone: phone.trim(),
      isDefault,
    };

    try {
      setSaving(true);

      const result = await createAddress(payload);

      if (result.error) {
        Alert.alert("Unable to Save", result.error.message);

        return;
      }

      Alert.alert("Address Saved", "Your shipping address has been saved.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error("Create address error:", err);

      Alert.alert(
        "Unable to Save",
        err.response?.data?.error?.message || "Unable to save your address.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add Address</Text>

      <Text style={styles.subtitle}>
        Enter the address where your order should be delivered.
      </Text>

      <View style={styles.areaBanner}>
        <Text style={styles.areaBannerText}>
          We currently deliver only within Dagupan City, Pangasinan.
        </Text>
      </View>

      <Field
        label="First Name *"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First name"
      />

      <Field
        label="Last Name *"
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last name"
      />

      <Field
        label="Street Address *"
        value={street}
        onChangeText={setStreet}
        placeholder="Street address"
      />

      <Field
        label="Apartment / Unit"
        value={apartment}
        onChangeText={setApartment}
        placeholder="Optional"
      />

      <View style={styles.field}>
          <Text style={styles.label}>Barangay *</Text>
        <Pressable style={styles.pickerButton} onPress={() => setPickerOpen(true)}>
          <Text>{barangay || "Select your barangay"}</Text>
        </Pressable>
      </View>

      <Field
        label="Phone *"
        value={phone}
        onChangeText={setPhone}
        placeholder="Phone number"
        keyboardType="phone-pad"
      />

      <Pressable
        style={styles.defaultRow}
        onPress={() => setIsDefault((current) => !current)}
      >
        <View style={[styles.checkbox, isDefault && styles.checkboxSelected]}>
          {isDefault ? <Text style={styles.check}>✓</Text> : null}
        </View>

        <Text style={styles.defaultText}>Make this my default address</Text>
      </Pressable>

      <Pressable
        style={[styles.saveButton, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Address</Text>
        )}
      </Pressable>

            <Modal visible={pickerOpen} transparent animationType="slide"
        onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <View style={styles.modalSheet}>
            <FlatList
              data={serviceArea?.barangays || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable style={styles.modalOption}
                  onPress={() => { setBarangay(item); setPickerOpen(false); }}>
                  <Text>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 24,
  },

  field: {
    marginBottom: 15,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 10,
    paddingHorizontal: 13,
    fontSize: 14,
  },

  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: "#BBBBBB",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },

  checkboxSelected: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },

  check: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  defaultText: {
    fontSize: 13,
  },

  saveButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  disabled: {
    opacity: 0.5,
  },

  areaBanner: { backgroundColor: "#EEF5F1", borderRadius: 10, padding: 12, marginBottom: 18 },
  areaBannerText: { fontSize: 12, color: "#2F4F3E" },
  pickerButton: { height: 48, borderWidth: 1, borderColor: "#D5D5D5", borderRadius: 10, paddingHorizontal: 13, justifyContent: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: "70%" },
  modalOption: { paddingVertical: 14, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
});
