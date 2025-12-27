const API_BASE_URL = "https://www.tedxbedayia.com/api/tickets/admit";

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
}

export type TicketResponse = TicketSuccessResponse | TicketErrorResponse;

export async function admitTicket(
  uuid: string,
  appKey: string
): Promise<TicketResponse> {
  try {
    const url = `${API_BASE_URL}/${uuid}?key=${encodeURIComponent(appKey)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "TEDxBedayia-Usher-App/1.0",
      },
    });

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}
