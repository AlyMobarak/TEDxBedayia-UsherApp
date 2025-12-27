import { getAppKey } from "@/utils/storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function SettingsScreen() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      checkKey();
    }, [])
  );

  async function checkKey() {
    const key = await getAppKey();
    setHasKey(!!key);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>TEDx</Text>
        <Text style={styles.title}>eTicket Usher System</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>App Key Status</Text>
          <Text
            style={[
              styles.statusValue,
              { color: hasKey ? "#22c55e" : "#ef4444" },
            ]}
          >
            {hasKey === null
              ? "Checking..."
              : hasKey
              ? "Configured ✓"
              : "Not Set"}
          </Text>
        </View>

        <Pressable style={styles.button} onPress={() => router.push("/setup")}>
          <Text style={styles.buttonText}>
            {hasKey ? "Change App Key" : "Set Up App Key"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>TEDxBedayia 2025</Text>
        <Text style={styles.versionText}>Usher App v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 24,
    paddingTop: 80,
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
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#333",
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
  },
  button: {
    backgroundColor: "#E62B1E",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    color: "#666",
    fontSize: 16,
    marginBottom: 4,
  },
  versionText: {
    color: "#444",
    fontSize: 12,
  },
});
