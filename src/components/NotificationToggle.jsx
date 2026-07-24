import { useEffect, useState } from "react";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushStatus,
} from "../services/pushNotifications";

export default function NotificationToggle({ userId }) {
  const [status, setStatus] = useState("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getPushStatus().then(setStatus).catch(() => setStatus("unsupported"));
  }, []);

  const toggle = async () => {
    setBusy(true);
    setMessage("");
    try {
      if (status === "enabled") {
        await disablePushNotifications();
        setStatus("default");
        setMessage("Notifications disabled on this device.");
      } else {
        await enablePushNotifications(userId);
        setStatus("enabled");
        setMessage("Notifications enabled on this device.");
      }
    } catch (error) {
      setStatus(await getPushStatus());
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || status === "unsupported") return null;

  return (
    <div className="push-notification-control">
      <button
        className={`notification-toggle ${status === "enabled" ? "enabled" : ""}`}
        type="button"
        onClick={toggle}
        disabled={busy || status === "denied"}
        title={
          status === "denied"
            ? "Notifications are blocked in browser settings"
            : status === "enabled"
              ? "Disable notifications on this device"
              : "Enable notifications on this device"
        }
        aria-label="Notification settings"
      >
        <span aria-hidden="true">{status === "enabled" ? "🔔" : "🔕"}</span>
        <span>{status === "enabled" ? "Notifications on" : "Enable notifications"}</span>
      </button>
      {(message || status === "denied") && (
        <span className="push-notification-message">
          {status === "denied"
            ? "Allow notifications in your browser settings."
            : message}
        </span>
      )}
    </div>
  );
}
