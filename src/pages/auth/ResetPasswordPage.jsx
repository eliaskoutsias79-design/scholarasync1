import { useState } from "react";

export default function ResetPasswordPage({ onResetPassword, onCancel }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (password.length < 8) {
      setMessage("Your new password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    const result = await onResetPassword(password);
    if (!result.ok) setMessage(result.message);
    setSubmitting(false);
  };

  return (
    <div className="auth-container glow-auth">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <div className="auth-shell reset-password-shell">
        <div className="auth-card glow-card">
          <div className="auth-header">
            <div className="text-logo">
              Scholar<span>Async</span>
            </div>
            <h2>Choose a new password</h2>
            <p className="auth-subtitle">
              Create a strong password you haven’t used for this account before.
            </p>
          </div>

          <div className="auth-form-stack">
            <label className="field-label">
              New password
              <input
                className="glow-input"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            <label className="field-label">
              Confirm new password
              <input
                className="glow-input"
                type="password"
                autoComplete="new-password"
                placeholder="Type it again"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onKeyDown={(event) =>
                  event.key === "Enter" && !submitting && handleSubmit()
                }
              />
            </label>

            {message && (
              <p className="password-reset-message" role="alert">
                {message}
              </p>
            )}

            <button
              type="button"
              className="main-btn glow-primary-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Updating password…" : "Update password"}
            </button>
            <button
              type="button"
              className="forgot-password-link"
              onClick={onCancel}
              disabled={submitting}
            >
              Back to sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
