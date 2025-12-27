import AsyncStorage from "@react-native-async-storage/async-storage";

const SCAN_HISTORY_KEY = "tedx_scan_history";
const MAX_HISTORY_ITEMS = 50;

export interface ScanRecord {
  id: string;
  uuid: string;
  name: string;
  success: boolean;
  error?: string;
  timestamp: number;
}

export async function getScanHistory(): Promise<ScanRecord[]> {
  try {
    const data = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch {
    return [];
  }
}

export async function addScanRecord(
  record: Omit<ScanRecord, "id" | "timestamp">
): Promise<void> {
  try {
    const history = await getScanHistory();
    const newRecord: ScanRecord = {
      ...record,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    // Add to beginning and limit size
    const updated = [newRecord, ...history].slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save scan record:", error);
  }
}

export async function clearScanHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SCAN_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear scan history:", error);
  }
}

export async function getTodayStats(): Promise<{
  total: number;
  admitted: number;
  rejected: number;
}> {
  const history = await getScanHistory();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  const todayScans = history.filter((scan) => scan.timestamp >= todayStart);

  return {
    total: todayScans.length,
    admitted: todayScans.filter((scan) => scan.success).length,
    rejected: todayScans.filter((scan) => !scan.success).length,
  };
}
