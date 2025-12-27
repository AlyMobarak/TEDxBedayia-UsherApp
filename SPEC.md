The app uses Expo Camera. When a QR Code is detected, check it against a database at tedxbedayia.com/api/tickets/admit/" + uuid_from_qr + "?key=" + appKey. If valid, play a haptic success vibration and show a green overlay. If invalid, vibrate heavily and show red.

The API call returns the applicant's database entry containing their full_name, admitted_at date (or null if not admitted), ... in response.json().applicant. If the attendee was already admitted into the event or hasn't paid or the event didn't start yet, a 400 error code is returned with a descriptive message at "error" field in the json returned. Status code 200 means user should be allowed in.

The App key should be inserted on a separate screen then saved to the local device.
