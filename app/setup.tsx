import { deleteAppKey, getAppKey, saveAppKey } from "@/utils/storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function SetupScreen() {
  const [appKey, setAppKey] = useState("");
  const [existingKey, setExistingKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadExistingKey();
  }, []);

  async function loadExistingKey() {
    try {
      const key = await getAppKey();
      setExistingKey(key);
      if (key) {
        setAppKey(key);
      }
    } catch (error) {
      console.error("Error loading key:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!appKey.trim()) {
      Alert.alert("Error", "Please enter an app key");
      return;
    }

    setSaving(true);
    try {
      await saveAppKey(appKey.trim());
      Alert.alert("Success", "App key saved successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to save app key");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    Alert.alert(
      "Clear App Key",
      "Are you sure you want to remove the saved app key?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAppKey();
              setAppKey("");
              setExistingKey(null);
              Alert.alert("Success", "App key cleared");
            } catch {
              Alert.alert("Error", "Failed to clear app key");
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E62B1E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>TEDx</Text>
        <Text style={styles.title}>Bedayia Ushers</Text>
      </View>

      <View style={styles.form}>
        {existingKey && !isEditing ? (
          // Show status view when key exists and not editing
          <>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>App Key Status</Text>
              <Text style={styles.statusValue}>Configured ✓</Text>
              <Text style={styles.maskedKey}>••••••••••••••••</Text>
            </View>

            <Pressable
              style={[styles.button, styles.editButton]}
              onPress={() => {
                setIsEditing(true);
                setAppKey("");
              }}
            >
              <Text style={styles.buttonText}>Change App Key</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
            >
              <Text style={styles.clearButtonText}>Clear Saved Key</Text>
            </Pressable>
          </>
        ) : (
          // Show input form when no key or editing
          <>
            <Text style={styles.label}>App Key</Text>
            <TextInput
              style={styles.input}
              value={appKey}
              onChangeText={setAppKey}
              placeholder="Enter your app key"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              autoFocus={isEditing}
            />

            <Pressable
              style={[
                styles.button,
                styles.saveButton,
                saving && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Save Key</Text>
              )}
            </Pressable>

            {isEditing && (
              <Pressable
                style={[styles.button, styles.clearButton]}
                onPress={() => {
                  setIsEditing(false);
                  setAppKey(existingKey || "");
                }}
              >
                <Text style={styles.clearButtonText}>Cancel</Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Contact your event coordinator if you don&apos;t have an app key.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#E62B1E",
  },
  title: {
    fontSize: 24,
    color: "#fff",
    marginTop: 8,
  },
  form: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  hint: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: "#E62B1E",
  },
  editButton: {
    backgroundColor: "#E62B1E",
  },
  clearButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#444",
  },
  statusCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#22c55e",
    marginBottom: 8,
  },
  maskedKey: {
    fontSize: 16,
    color: "#666",
    letterSpacing: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  clearButtonText: {
    color: "#888",
    fontSize: 16,
  },
  footer: {
    marginTop: 48,
    alignItems: "center",
  },
  footerText: {
    color: "#666",
    textAlign: "center",
    fontSize: 14,
  },
});
