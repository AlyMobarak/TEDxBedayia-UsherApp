import { getAppKey, saveAppKey } from "@/utils/storage";
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
        { text: "OK", onPress: () => router.dismiss() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to save app key");
    } finally {
      setSaving(false);
    }
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
        <Text style={styles.label}>
          {existingKey ? "New App Key" : "App Key"}
        </Text>
        <TextInput
          style={styles.input}
          value={appKey}
          onChangeText={setAppKey}
          placeholder="Enter your app key"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          autoFocus
        />

        {existingKey && (
          <Text style={styles.hint}>
            A key is already configured. Enter a new one to replace it.
          </Text>
        )}

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

        <Pressable
          style={[styles.button, styles.clearButton]}
          onPress={() => router.dismiss()}
        >
          <Text style={styles.clearButtonText}>Cancel</Text>
        </Pressable>
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
  clearButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#444",
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
