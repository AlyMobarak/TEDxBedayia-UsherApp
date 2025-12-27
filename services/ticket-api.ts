const API_BASE_URL = "https://www.tedxbedayia.com/api/tickets/admit";
const REQUEST_TIMEOUT = 15000; // 15 seconds

export interface Applicant {
  full_name: string;
  admitted_at: string | null;
  [key: string]: unknown;
}

export interface TicketSuccessResponse {
  success: true;
  applicant: Applicant;
}

export interface TicketErrorResponse {
  success: false;
  error: string;
  isNetworkError?: boolean;
}

export type TicketResponse = TicketSuccessResponse | TicketErrorResponse;

export async function admitTicket(
  uuid: string,
  appKey: string
): Promise<TicketResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const url = `${API_BASE_URL}/${uuid}?key=${encodeURIComponent(appKey)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "TEDxBedayia-Usher-App/1.0",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (response.status === 200) {
      return {
        success: true,
        applicant: data.applicant,
      };
    } else {
      return {
        success: false,
        error: data.error || "Unknown error occurred",
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          error: "Request timed out. Please check your internet connection.",
          isNetworkError: true,
        };
      }

      // Check for common network errors
      if (
        error.message.includes("Network request failed") ||
        error.message.includes("Failed to fetch") ||
        error.message.includes("network")
      ) {
        return {
          success: false,
          error: "No internet connection. Please check your network.",
          isNetworkError: true,
        };
      }

      return {
        success: false,
        error: error.message,
        isNetworkError: true,
      };
    }

    return {
      success: false,
      error: "Network error occurred. Please try again.",
      isNetworkError: true,
    };
  }
}
