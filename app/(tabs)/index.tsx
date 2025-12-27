import { ResultOverlay } from "@/components/result-overlay";
import { admitTicket, TicketResponse } from "@/services/ticket-api";
import { getAppKey } from "@/utils/storage";
import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [appKey, setAppKey] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<TicketResponse | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  // Load app key when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadAppKey();
      // Reset scanning state when returning to this screen
      setIsScanning(true);
      setShowResult(false);
      setResult(null);
      lastScannedRef.current = null;
    }, [])
  );

  async function loadAppKey() {
    const key = await getAppKey();
    setAppKey(key);
  }

  async function handleBarcodeScanned(scanResult: BarcodeScanningResult) {
    // Prevent multiple scans of the same code or while processing
    if (!isScanning || isProcessing) return;

    const scannedData = scanResult.data;

    // Avoid processing the same QR code twice in a row
    if (lastScannedRef.current === scannedData) return;
    lastScannedRef.current = scannedData;

    if (!appKey) {
      Alert.alert("No App Key", "Please set up your app key first.", [
        { text: "Setup", onPress: () => router.push("/setup") },
      ]);
      return;
    }

    setIsScanning(false);
    setIsProcessing(true);

    try {
      // Extract UUID from QR code data
      // The QR code might contain just the UUID or a full URL
      let uuid = scannedData;

      // If it's a URL, try to extract the UUID from it
      if (scannedData.includes("/")) {
        const parts = scannedData.split("/");
        uuid = parts[parts.length - 1];
      }

      const response = await admitTicket(uuid, appKey);
      setResult(response);
      setShowResult(true);
    } catch (error) {
      setResult({
        success: false,
        error: "Failed to process ticket",
      });
      setShowResult(true);
    } finally {
      setIsProcessing(false);
    }
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

  // No app key set
  if (appKey === null) {
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
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />

      {/* Overlay positioned absolutely on top of camera */}
      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top section */}
        <View style={styles.overlaySection} />

        {/* Middle section with scanner frame */}
        <View style={styles.middleSection}>
          <View style={styles.overlaySection} />
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
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
});
