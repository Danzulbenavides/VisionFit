import React, { useMemo, useState } from "react";

import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// Simple dropdown (no extra dependency). Opens a bottom sheet with the options.
// options: [{ label, value }]  |  value: string
export default function Dropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select",
  error,
  searchable = false,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(query.trim().toLowerCase()),
    );
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <Pressable
        style={[
          styles.input,
          error ? styles.inputError : null,
          disabled ? styles.inputDisabled : null,
        ]}
        onPress={() => !disabled && setOpen(true)}
      >
        <Text style={selected ? styles.value : styles.placeholder}>
          {selected ? selected.label : placeholder}
        </Text>

        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />

        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label || placeholder}</Text>

          {searchable ? (
            <TextInput
              style={styles.search}
              placeholder="Search"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.value)}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.option,
                  item.value === value ? styles.optionSelected : null,
                ]}
                onPress={() => {
                  onChange(item.value);
                  close();
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    item.value === value ? styles.optionTextSelected : null,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.empty}>No results</Text>}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  inputError: { borderColor: "#D93025" },
  inputDisabled: { backgroundColor: "#F3F3F3" },
  value: { fontSize: 15, color: "#111111" },
  placeholder: { fontSize: 15, color: "#999999" },
  chevron: { fontSize: 16, color: "#666666" },
  errorText: { color: "#D93025", fontSize: 12, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    maxHeight: "60%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  search: {
    marginHorizontal: 20,
    marginBottom: 8,
    height: 42,
    borderWidth: 1,
    borderColor: "#D5D5D5",
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  option: { paddingVertical: 14, paddingHorizontal: 20 },
  optionSelected: { backgroundColor: "#F2F2F2" },
  optionText: { fontSize: 15, color: "#111111" },
  optionTextSelected: { fontWeight: "800" },
  empty: { textAlign: "center", padding: 20, color: "#888888" },
});
