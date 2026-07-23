import { supabase } from "../supabaseClient";

export const VAPID_PUBLIC_KEY =
  "BAZ4ssZk0weHLxI3w6PPrwGxEeb7IzY4ZlqPX5jqxnNhHXsKwi4_zpeZ3TQzWyTnL79NTW261wGnuHOl_VZWpA4";

const urlBase64ToUint8Array = (value) => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
};

export const supportsPushNotifications = () =>
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export async function getPushStatus() {
  if (!supportsPushNotifications()) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "enabled" : Notification.permission;
}

export async function enablePushNotifications(userId) {
  if (!supportsPushNotifications()) {
    throw new Error("Push notifications are not supported by this browser.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked in your browser settings."
        : "Notification permission was not granted."
    );
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    await subscription.unsubscribe();
    throw error;
  }

  return subscription;
}

export async function disablePushNotifications() {
  if (!supportsPushNotifications()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", subscription.endpoint);
  await subscription.unsubscribe();
}
