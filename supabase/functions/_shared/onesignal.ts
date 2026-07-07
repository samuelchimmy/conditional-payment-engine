// OneSignal Push Notifications Helper

const ONESIGNAL_APP_ID = Deno.env.get("ONESIGNAL_APP_ID") || "placeholder-app-id";
const ONESIGNAL_REST_API_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY") || "placeholder-api-key";

interface PushNotificationPayload {
  targetWalletAddresses: string[];
  title: string;
  message: string;
  url?: string;
  data?: any;
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  if (ONESIGNAL_REST_API_KEY === "placeholder-api-key") {
    console.warn("OneSignal API Key not configured. Skipping push notification.");
    return;
  }

  // Address users by their connected usernames if we passed them via tags, 
  // but OneSignal handles this by matching external_id which we set to walletAddress.toLowerCase()
  const body = {
    app_id: ONESIGNAL_APP_ID,
    target_channel: "push",
    include_aliases: {
      external_id: payload.targetWalletAddresses.map(addr => addr.toLowerCase())
    },
    headings: { en: payload.title },
    contents: { en: payload.message },
    url: payload.url,
    data: payload.data
  };

  try {
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    console.log("OneSignal push result:", result);
    return result;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    throw error;
  }
}
