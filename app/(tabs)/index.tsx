import { ResultOverlay } from "@/components/result-overlay";
import { admitTicket, TicketResponse } from "@/services/ticket-api";
import { addScanRecord } from "@/utils/scan-history";
import { getAppKey, getDeviceUid } from "@/utils/storage";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useKeepAwake } from "expo-keep-awake";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ScannerScreen() {
  // Keep screen awake while scanning
  useKeepAwake();

  const [permission, requestPermission] = useCameraPermissions();
  const [appKey, setAppKey] = useState<string | null>(null);
  const [deviceUid, setDeviceUid] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<TicketResponse | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualUuid, setManualUuid] = useState("");
  const lastScannedRef = useRef<string | null>(null);

  // Loading animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isProcessing) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isProcessing, pulseAnim]);

  // Load app key when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAppKey();
      loadDeviceUid();
      // Reset scanning state when returning to this screen
      setIsScanning(true);
      setShowResult(false);
      setResult(null);
      lastScannedRef.current = null;
    }, []),
  );

  // Redirect to setup if no app key configured
  useEffect(() => {
    if (appKey === "") {
      router.replace("/setup");
    }
  }, [appKey]);

  async function loadAppKey() {
    const key = await getAppKey();
    setAppKey(key ?? ""); // null from storage becomes empty string to indicate "not set"
  }

  async function loadDeviceUid() {
    const uid = await getDeviceUid();
    setDeviceUid(uid);
  }

  async function processTicket(uuid: string) {
    if (!appKey) {
      Alert.alert("No App Key", "Please set up your app key first.", [
        { text: "Setup", onPress: () => router.push("/setup") },
      ]);
      return;
    }

    if (!deviceUid) {
      Alert.alert("Error", "Device ID not available. Please restart the app.");
      return;
    }

    setIsScanning(false);
    setIsProcessing(true);

    try {
      const response = await admitTicket(uuid, appKey, deviceUid);
      setResult(response);
      setShowResult(true);

      // Save to scan history
      await addScanRecord({
        uuid,
        name: response.success ? response.applicant.full_name : "Unknown",
        success: response.success,
        error: !response.success ? response.error : undefined,
      });
    } catch {
      const errorResponse: TicketResponse = {
        success: false,
        error: "Failed to process ticket",
      };
      setResult(errorResponse);
      setShowResult(true);

      await addScanRecord({
        uuid,
        name: "Unknown",
        success: false,
        error: "Failed to process ticket",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleBarcodeScanned(scanResult: BarcodeScanningResult) {
    // Prevent multiple scans of the same code or while processing
    if (!isScanning || isProcessing) return;

    const scannedData = scanResult.data;

    // Avoid processing the same QR code twice in a row
    if (lastScannedRef.current === scannedData) return;
    lastScannedRef.current = scannedData;

    // Extract UUID from QR code data
    let uuid = scannedData;

    // If it's a URL, try to extract the UUID from it
    if (scannedData.includes("/")) {
      const parts = scannedData.split("/");
      uuid = parts[parts.length - 1];
    }

    await processTicket(uuid);
  }

  async function handleManualSubmit() {
    const uuid = manualUuid.trim();
    if (!uuid) {
      Alert.alert("Error", "Please enter a valid UUID");
      return;
    }

    setShowManualEntry(false);
    setManualUuid("");
    await processTicket(uuid);
  }

  function handleDismissResult() {
    setShowResult(false);
    setResult(null);
    setIsScanning(true);
    // Allow scanning the same code again after dismissing
    lastScannedRef.current = null;
  }

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          Camera access is required to scan tickets
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  // App key loading or not set - show loading screen
  // The redirect to setup happens in useEffect below
  if (appKey === null || appKey === "") {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />

      {/* Overlay positioned absolutely on top of camera */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top section with flashlight button */}
        <View style={styles.overlaySection}>
          <View style={styles.topControls}>
            <Pressable
              style={[styles.iconButton, torchOn && styles.iconButtonActive]}
              onPress={() => setTorchOn(!torchOn)}
            >
              <Text style={styles.iconButtonText}>{torchOn ? "🔦" : "💡"}</Text>
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => setShowManualEntry(true)}
            >
              <Text style={styles.iconButtonText}>⌨️</Text>
            </Pressable>
          </View>
        </View>

        {/* Middle section with scanner frame */}
        <View style={styles.middleSection}>
          <View style={styles.overlaySection} />
          <Animated.View
            style={[
              styles.scanFrame,
              isProcessing && { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View
              style={[
                styles.corner,
                styles.topLeft,
                isProcessing && styles.cornerProcessing,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.topRight,
                isProcessing && styles.cornerProcessing,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.bottomLeft,
                isProcessing && styles.cornerProcessing,
              ]}
            />
            <View
              style={[
                styles.corner,
                styles.bottomRight,
                isProcessing && styles.cornerProcessing,
              ]}
            />
          </Animated.View>
          <View style={styles.overlaySection} />
        </View>

        {/* Bottom section */}
        <View style={styles.overlaySection}>
          <View style={styles.instructions}>
            {!appKey ? (
              <Pressable
                style={styles.setupButton}
                onPress={() => router.push("/setup")}
              >
                <Text style={styles.setupButtonText}>Set Up App Key</Text>
              </Pressable>
            ) : isProcessing ? (
              <Text style={styles.instructionText}>Processing...</Text>
            ) : (
              <Text style={styles.instructionText}>
                Point camera at QR code
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manual Entry</Text>
            <Text style={styles.modalSubtitle}>
              Enter the ticket UUID manually
            </Text>
            <TextInput
              style={styles.modalInput}
              value={manualUuid}
              onChangeText={setManualUuid}
              placeholder="Enter the first 8 characters of the ticket ID or Attendee's First Name"
              placeholderTextColor="#666"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowManualEntry(false);
                  setManualUuid("");
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={handleManualSubmit}
              >
                <Text style={styles.modalButtonText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ResultOverlay
        visible={showResult}
        success={result?.success ?? false}
        name={result?.success ? result.applicant.full_name : undefined}
        errorMessage={!result?.success ? result?.error : undefined}
        onDismiss={handleDismissResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  overlaySection: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  middleSection: {
    flexDirection: "row",
    height: 280,
  },
  scanFrame: {
    width: 280,
    height: 280,
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#E62B1E",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  cornerProcessing: {
    borderColor: "#fbbf24",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 60,
    paddingHorizontal: 20,
    gap: 12,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonActive: {
    backgroundColor: "rgba(251, 191, 36, 0.4)",
  },
  iconButtonText: {
    fontSize: 24,
  },
  instructions: {
    alignItems: "center",
    paddingTop: 40,
  },
  instructionText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  setupButton: {
    backgroundColor: "#E62B1E",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  setupButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  message: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#E62B1E",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 24,
  },
  modalInput: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#444",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#444",
  },
  modalButtonSubmit: {
    backgroundColor: "#E62B1E",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalButtonTextCancel: {
    color: "#888",
    fontSize: 16,
  },
});
