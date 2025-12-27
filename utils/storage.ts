import * as SecureStore from "expo-secure-store";

const APP_KEY_STORAGE_KEY = "tedx_app_key";

export async function saveAppKey(key: string): Promise<void> {
  await SecureStore.setItemAsync(APP_KEY_STORAGE_KEY, key);
}

export async function getAppKey(): Promise<string | null> {
  return await SecureStore.getItemAsync(APP_KEY_STORAGE_KEY);
}

export async function deleteAppKey(): Promise<void> {
  await SecureStore.deleteItemAsync(APP_KEY_STORAGE_KEY);
}
