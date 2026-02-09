import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const APP_KEY_STORAGE_KEY = "tedx_app_key";
const DEVICE_UID_STORAGE_KEY = "tedx_device_uid";

// Platform-aware storage helpers
async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveAppKey(key: string): Promise<void> {
  await setItem(APP_KEY_STORAGE_KEY, key);
}

export async function getAppKey(): Promise<string | null> {
  return await getItem(APP_KEY_STORAGE_KEY);
}

export async function deleteAppKey(): Promise<void> {
  await deleteItem(APP_KEY_STORAGE_KEY);
}

/**
 * Get or create a unique device identifier.
 * This ID persists across app launches and is used to identify
 * this specific device for double-scan prevention.
 */
export async function getDeviceUid(): Promise<string> {
  let deviceUid = await getItem(DEVICE_UID_STORAGE_KEY);

  if (!deviceUid) {
    // Generate a short random ID (6 chars)
    deviceUid = Math.random().toString(36).substring(2, 8);
    await setItem(DEVICE_UID_STORAGE_KEY, deviceUid);
  }

  return deviceUid;
}
