import {
  OnDoorTicketPayload,
  sellOnDoorTicket,
  TicketResponse,
} from "@/services/ticket-api";
import { getAppKey, getDeviceUid } from "@/utils/storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type PaymentMethod = "telda" | "instapay" | "cash";

export default function OnDoorScreen() {
  const [appKey, setAppKey] = useState<string | null>(null);
  const [deviceUid, setDeviceUid] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [senderUsername, setSenderUsername] = useState("");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    text: string;
    success: boolean;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAppKey();
      loadDeviceUid();
    }, []),
  );

  async function loadAppKey() {
    const key = await getAppKey();
    setAppKey(key ?? "");
  }

  async function loadDeviceUid() {
    const uid = await getDeviceUid();
    setDeviceUid(uid);
  }

  // Redirect to setup if no app key
  React.useEffect(() => {
    if (appKey === "") {
      router.replace("/setup");
    }
  }, [appKey]);

  const requiresUsername =
    paymentMethod === "telda" || paymentMethod === "instapay";

  const isFormValid =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    phone.trim().length > 0 &&
    (!requiresUsername || senderUsername.trim().length > 0);

  function handleConfirmPress() {
    setShowConfirmModal(true);
  }

  async function handleGoAhead() {
    if (!appKey || !deviceUid) {
      Alert.alert("Error", "App key or device ID not available.");
      return;
    }

    setShowConfirmModal(false);
    setIsSubmitting(true);
    setResultMessage(null);

    const payload: OnDoorTicketPayload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      paymentMethod,
      senderUsername: requiresUsername ? senderUsername.trim() : undefined,
    };

    try {
      const response: TicketResponse = await sellOnDoorTicket(
        payload,
        appKey,
        deviceUid,
      );

      if (response.success) {
        setResultMessage({
          text: `Ticket created for ${response.applicant.full_name}`,
          success: true,
        });
        // Clear form on success
        setName("");
        setEmail("");
        setPhone("");
        setPaymentMethod("cash");
        setSenderUsername("");
      } else {
        setResultMessage({
          text: response.error,
          success: false,
        });
      }
    } catch {
      setResultMessage({
        text: "An unexpected error occurred.",
        success: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loading state
  if (appKey === null || appKey === "") {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>TEDx</Text>
          <Text style={styles.title}>On-Door Ticket</Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>450 EGP</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Attendee Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            placeholderTextColor="#666"
            autoCapitalize="words"
            autoCorrect={false}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+20 XXX XXX XXXX"
            placeholderTextColor="#666"
            keyboardType="phone-pad"
          />

          {/* Payment Method */}
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.paymentMethodRow}>
            {(["telda", "instapay", "cash"] as PaymentMethod[]).map(
              (method) => (
                <Pressable
                  key={method}
                  style={[
                    styles.paymentMethodButton,
                    paymentMethod === method &&
                      styles.paymentMethodButtonActive,
                  ]}
                  onPress={() => {
                    setPaymentMethod(method);
                    if (method === "cash") setSenderUsername("");
                  }}
                >
                  <Text
                    style={[
                      styles.paymentMethodText,
                      paymentMethod === method &&
                        styles.paymentMethodTextActive,
                    ]}
                  >
                    {method === "telda"
                      ? "Telda"
                      : method === "instapay"
                        ? "InstaPay"
                        : "Cash"}
                  </Text>
                </Pressable>
              ),
            )}
          </View>

          {/* Sender Username (for Telda / InstaPay) */}
          {requiresUsername && (
            <>
              <Text style={styles.label}>
                {paymentMethod === "telda" ? "Telda" : "InstaPay"} Username
              </Text>
              <TextInput
                style={styles.input}
                value={senderUsername}
                onChangeText={setSenderUsername}
                placeholder={`Sender's ${paymentMethod === "telda" ? "Telda" : "InstaPay"} username`}
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}
        </View>

        {/* Result Message */}
        {resultMessage && (
          <View
            style={[
              styles.resultBanner,
              {
                backgroundColor: resultMessage.success
                  ? "rgba(34, 197, 94, 0.15)"
                  : "rgba(239, 68, 68, 0.15)",
                borderColor: resultMessage.success ? "#22c55e" : "#ef4444",
              },
            ]}
          >
            <Text
              style={[
                styles.resultText,
                { color: resultMessage.success ? "#22c55e" : "#ef4444" },
              ]}
            >
              {resultMessage.success ? "✓ " : "✗ "}
              {resultMessage.text}
            </Text>
          </View>
        )}

        {/* Confirm Button */}
        <Pressable
          style={[
            styles.confirmButton,
            (!isFormValid || isSubmitting) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirmPress}
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm</Text>
          )}
        </Pressable>
      </ScrollView>

      {/* Payment Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.warningIconContainer}>
              <Text style={styles.warningIcon}>⚠️</Text>
            </View>

            <Text style={styles.modalTitle}>PAYMENT CONFIRMATION</Text>

            <Text style={styles.modalWarningText}>
              I CONFIRM I SAW THE PAYMENT BEING TRANSFERRED OR RECEIVED CASH
            </Text>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.goAheadButton]}
                onPress={handleGoAhead}
              >
                <Text style={styles.goAheadButtonText}>Go Ahead</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
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
  priceBadge: {
    backgroundColor: "rgba(230, 43, 30, 0.15)",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E62B1E",
  },
  priceText: {
    color: "#E62B1E",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  form: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  paymentMethodRow: {
    flexDirection: "row",
    gap: 10,
  },
  paymentMethodButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
  },
  paymentMethodButtonActive: {
    backgroundColor: "rgba(230, 43, 30, 0.15)",
    borderColor: "#E62B1E",
  },
  paymentMethodText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  paymentMethodTextActive: {
    color: "#E62B1E",
  },
  resultBanner: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  resultText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  confirmButton: {
    backgroundColor: "#E62B1E",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: "#4a1a17",
    opacity: 0.6,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginTop: 100,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  warningIconContainer: {
    marginBottom: 16,
  },
  warningIcon: {
    fontSize: 48,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E62B1E",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 1,
  },
  modalWarningText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#444",
  },
  cancelButtonText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "600",
  },
  goAheadButton: {
    backgroundColor: "#22c55e",
  },
  goAheadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
