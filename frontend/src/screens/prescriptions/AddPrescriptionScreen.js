import React, { useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { createPrescription } from "../../api/prescriptions";

const TYPES = [
  {
    label: "Single Vision",
    value: "SINGLE_VISION",
  },
  {
    label: "Progressive",
    value: "PROGRESSIVE",
  },
  {
    label: "Reading",
    value: "READING",
  },
  {
    label: "No Prescription",
    value: "NON_PRESCRIPTION",
  },
];

export default function AddPrescriptionScreen({ navigation }) {
  const [name, setName] = useState("");

  const [prescriptionType, setPrescriptionType] = useState("SINGLE_VISION");

  const [odSph, setOdSph] = useState("");

  const [odCyl, setOdCyl] = useState("");

  const [odAxis, setOdAxis] = useState("");

  const [odAdd, setOdAdd] = useState("");

  const [osSph, setOsSph] = useState("");

  const [osCyl, setOsCyl] = useState("");

  const [osAxis, setOsAxis] = useState("");

  const [osAdd, setOsAdd] = useState("");

  const [pd, setPd] = useState("");

  const [hasPrism, setHasPrism] = useState(false);

  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  const toNumber = (value) => {
    return Number(value);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter a prescription name.");

      return;
    }

    if (!odSph || !odCyl || !odAxis || !osSph || !osCyl || !osAxis || !pd) {
      Alert.alert(
        "Missing Information",
        "Please complete the required prescription values.",
      );

      return;
    }

    const payload = {
      name: name.trim(),

      prescriptionType,

      OD: {
        sph: toNumber(odSph),
        cyl: toNumber(odCyl),
        axis: Number(odAxis),
        add: odAdd ? toNumber(odAdd) : 0,
      },

      OS: {
        sph: toNumber(osSph),
        cyl: toNumber(osCyl),
        axis: Number(osAxis),
        add: osAdd ? toNumber(osAdd) : 0,
      },

      pd: toNumber(pd),

      hasPrism,

      notes: notes.trim() || null,
    };

    try {
      setSaving(true);

      const result = await createPrescription(payload);

      if (result.error) {
        Alert.alert("Unable to Save", result.error.message);

        return;
      }

      Alert.alert("Saved", "Your prescription has been saved.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error("Create prescription error:", err);

      Alert.alert(
        "Unable to Save",
        err.response?.data?.error?.message ||
          "Unable to save your prescription.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Add Prescription</Text>

      <Text style={styles.subtitle}>
        Enter the prescription provided by your eye care professional.
      </Text>

      <Text style={styles.label}>Prescription Name</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. My Main Prescription"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Prescription Type</Text>

      <View style={styles.options}>
        {TYPES.map((type) => (
          <Pressable
            key={type.value}
            style={[
              styles.option,
              prescriptionType === type.value && styles.optionSelected,
            ]}
            onPress={() => setPrescriptionType(type.value)}
          >
            <Text
              style={[
                styles.optionText,
                prescriptionType === type.value && styles.optionTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <EyeSection
        title="OD"
        subtitle="Right Eye"
        sph={odSph}
        setSph={setOdSph}
        cyl={odCyl}
        setCyl={setOdCyl}
        axis={odAxis}
        setAxis={setOdAxis}
        add={odAdd}
        setAdd={setOdAdd}
      />

      <EyeSection
        title="OS"
        subtitle="Left Eye"
        sph={osSph}
        setSph={setOsSph}
        cyl={osCyl}
        setCyl={setOsCyl}
        axis={osAxis}
        setAxis={setOsAxis}
        add={osAdd}
        setAdd={setOsAdd}
      />

      <Text style={styles.label}>Pupillary Distance (PD)</Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. 64.5"
        keyboardType="decimal-pad"
        value={pd}
        onChangeText={setPd}
      />

      <Pressable
        style={styles.prismRow}
        onPress={() => setHasPrism((current) => !current)}
      >
        <View style={[styles.checkbox, hasPrism && styles.checkboxSelected]}>
          {hasPrism ? <Text style={styles.check}>✓</Text> : null}
        </View>

        <Text style={styles.prismText}>My prescription has prism</Text>
      </Pressable>

      <Text style={styles.label}>Notes</Text>

      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Optional notes"
        multiline
        textAlignVertical="top"
        value={notes}
        onChangeText={setNotes}
      />

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Important</Text>

        <Text style={styles.noticeText}>
          Enter prescription values exactly as provided by your eye care
          professional.
        </Text>
      </View>

      <Pressable
        style={[styles.saveButton, saving && styles.disabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>Save Prescription</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function EyeSection({
  title,
  subtitle,
  sph,
  setSph,
  cyl,
  setCyl,
  axis,
  setAxis,
  add,
  setAdd,
}) {
  return (
    <View style={styles.eyeSection}>
      <Text style={styles.eyeTitle}>{title}</Text>

      <Text style={styles.eyeSubtitle}>{subtitle}</Text>

      <View style={styles.eyeRow}>
        <Field
          label="SPH"
          placeholder="0.00"
          value={sph}
          onChangeText={setSph}
        />

        <Field
          label="CYL"
          placeholder="0.00"
          value={cyl}
          onChangeText={setCyl}
        />
      </View>

      <View style={styles.eyeRow}>
        <Field
          label="AXIS"
          placeholder="0"
          value={axis}
          onChangeText={setAxis}
          keyboardType="number-pad"
        />

        <Field
          label="ADD"
          placeholder="0.00"
          value={add}
          onChangeText={setAdd}
        />
      </View>
    </View>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "decimal-pad",
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
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

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 9,
    marginTop: 4,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 10,
    paddingHorizontal: 13,
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  option: {
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  optionSelected: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },

  optionText: {
    fontSize: 12,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: "#FFFFFF",
  },

  eyeSection: {
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  eyeTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  eyeSubtitle: {
    fontSize: 11,
    color: "#888888",
    marginTop: 3,
    marginBottom: 14,
  },

  eyeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  field: {
    flex: 1,
  },

  fieldLabel: {
    fontSize: 10,
    color: "#888888",
    marginBottom: 5,
  },

  prismRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
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
    fontSize: 13,
    fontWeight: "800",
  },

  prismText: {
    fontSize: 13,
  },

  notesInput: {
    height: 90,
    paddingTop: 12,
  },

  notice: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
    marginVertical: 18,
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },

  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#666666",
  },

  saveButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  disabled: {
    opacity: 0.5,
  },
});
