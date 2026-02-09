import {
  clearScanHistory,
  getScanHistory,
  ScanRecord,
} from "@/utils/scan-history";
import { getAppKey, getDeviceUid } from "@/utils/storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SettingsScreen() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [deviceUid, setDeviceUid] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      checkKey();
      loadHistory();
      loadDeviceUid();
    }, []),
  );

  async function checkKey() {
    const key = await getAppKey();
    setHasKey(!!key);
  }

  async function loadHistory() {
    const history = await getScanHistory();
    setScanHistory(history);
  }

  async function loadDeviceUid() {
    const uid = await getDeviceUid();
    setDeviceUid(uid);
  }

  function handleClearHistory() {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all scan history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearScanHistory();
            setScanHistory([]);
          },
        },
      ],
    );
  }

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function renderScanItem({ item }: { item: ScanRecord }) {
    return (
      <View style={styles.historyItem}>
        <View
          style={[
            styles.historyIndicator,
            { backgroundColor: item.success ? "#22c55e" : "#ef4444" },
          ]}
        />
        <View style={styles.historyContent}>
          <Text style={styles.historyName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.historyTime}>{formatTime(item.timestamp)}</Text>
        </View>
        <Text style={styles.historyStatus}>{item.success ? "✓" : "✗"}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>TEDx</Text>
        <Text style={styles.title}>eGate System</Text>
      </View>

      <View style={styles.content}>
        {/* App Key Status */}
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

        {/* Scan History */}
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Recent Scans</Text>
          {scanHistory.length > 0 && (
            <Pressable onPress={handleClearHistory}>
              <Text style={styles.clearButton}>Clear</Text>
            </Pressable>
          )}
        </View>

        {scanHistory.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>No scans yet</Text>
          </View>
        ) : (
          <FlatList
            data={scanHistory.slice(0, 20)}
            keyExtractor={(item) => item.id}
            renderItem={renderScanItem}
            style={styles.historyList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          TEDxBedayia {new Date().getFullYear()}
        </Text>
        <Text style={styles.versionText}>Usher App v1.0</Text>
        {deviceUid && (
          <Text style={styles.deviceUidText}>UID: {deviceUid}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#E62B1E",
  },
  title: {
    fontSize: 18,
    color: "#fff",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  statusLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#E62B1E",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  clearButton: {
    fontSize: 14,
    color: "#E62B1E",
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  historyIndicator: {
    width: 4,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyName: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
  },
  historyTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  historyStatus: {
    fontSize: 18,
    marginLeft: 8,
  },
  emptyHistory: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyHistoryText: {
    color: "#666",
    fontSize: 14,
  },
  footer: {
    alignItems: "center",
    paddingBottom: 10,
  },
  footerText: {
    color: "#666",
    fontSize: 14,
    marginBottom: 2,
  },
  versionText: {
    color: "#444",
    fontSize: 11,
  },
  deviceUidText: {
    color: "#333",
    fontSize: 10,
    marginTop: 4,
    fontFamily: "monospace",
  },
});
