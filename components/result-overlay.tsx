import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface ResultOverlayProps {
  visible: boolean;
  success: boolean;
  name?: string;
  errorMessage?: string;
  onDismiss: () => void;
}

export function ResultOverlay({
  visible,
  success,
  name,
  errorMessage,
  onDismiss,
}: ResultOverlayProps) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Play haptic feedback
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Heavy vibration for rejection
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Add extra vibration for emphasis
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 200);
      }

      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, success, opacity]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity,
          backgroundColor: success
            ? "rgba(34, 197, 94, 0.95)"
            : "rgba(239, 68, 68, 0.95)",
        },
      ]}
    >
      <Pressable style={styles.pressable} onPress={onDismiss}>
        <View style={styles.content}>
          <Text style={styles.icon}>{success ? "✓" : "✗"}</Text>
          <Text style={styles.status}>{success ? "ADMITTED" : "REJECTED"}</Text>
          {success && name && <Text style={styles.name}>{name}</Text>}
          {!success && errorMessage && (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          )}
          <Text style={styles.tapHint}>Tap anywhere to continue</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  pressable: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    padding: 40,
  },
  icon: {
    fontSize: 120,
    color: "white",
    fontWeight: "bold",
    marginBottom: 20,
  },
  status: {
    fontSize: 48,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 4,
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    color: "white",
    textAlign: "center",
    marginTop: 10,
  },
  errorMessage: {
    fontSize: 20,
    color: "white",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  tapHint: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 40,
  },
});
