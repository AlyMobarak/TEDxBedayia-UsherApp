import * as SecureStore from "expo-secure-store";

const APP_KEY_STORAGE_KEY = "tedx_app_key";
const DEVICE_UID_STORAGE_KEY = "tedx_device_uid";

export async function saveAppKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(APP_KEY_STORAGE_KEY, key);
}

export async function getAppKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(APP_KEY_STORAGE_KEY);
}

export async function deleteAppKey(): Promise<void> {
  await SecureStore.deleteItemAsync(APP_KEY_STORAGE_KEY);
}

/**
 * Get or create a unique device identifier.
 * This ID persists across app launches and is used to identify
 * this specific device for double-scan prevention.
 */
export async function getDeviceUid(): Promise<string> {
  let deviceUid = await SecureStore.getItemAsync(DEVICE_UID_STORAGE_KEY);

  if (!deviceUid) {
    // Generate a short random ID (6 chars)
    deviceUid = Math.random().toString(36).substring(2, 8);
    await SecureStore.setItemAsync(DEVICE_UID_STORAGE_KEY, deviceUid);
  }

  return deviceUid;
}
