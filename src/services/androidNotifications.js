import { supabase } from "../supabaseClient";

const TOKEN_EVENT = "scholarasync:fcm-token";
let lastAndroidToken = "";

async function saveAndroidToken(userId, token) {
  if (!userId || !token) return;
  lastAndroidToken = token;

  const { error } = await supabase.from("android_push_tokens").upsert(
    {
      user_id: userId,
      token,
      device_info: navigator.userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "token" }
  );

  if (error) {
    console.error("Could not register Android notifications:", error);
  }
}

export function registerAndroidNotificationBridge(userId) {
  if (!userId) return () => {};

  const handleToken = (event) => {
    const token = event?.detail?.token;

    if (event?.detail?.platform === "android" && token) {
      void saveAndroidToken(userId, token);
    }
  };

  window.addEventListener(TOKEN_EVENT, handleToken);

  if (window.__SCHOLARASYNC_FCM_TOKEN__) {
    void saveAndroidToken(
      userId,
      window.__SCHOLARASYNC_FCM_TOKEN__
    );
  }

  return () => {
    window.removeEventListener(TOKEN_EVENT, handleToken);
  };
}

export async function removeAndroidNotificationToken(userId) {
  const token =
    lastAndroidToken ||
    (typeof window !== "undefined"
      ? window.__SCHOLARASYNC_FCM_TOKEN__
      : "");
  if (!userId || !token) return;

  const { error } = await supabase
    .from("android_push_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("token", token);

  if (error) throw error;
}
