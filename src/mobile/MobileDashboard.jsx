import { useState } from "react";

export default function MobileDashboard({
  session,
  profile,
  email,
  setEmail,
  password,
  setPassword,
  authMode,
  setAuthMode,
  loading,
  handleAuth,
  handleGoogleLogin,
  signOut,
}) {
  const [page, setPage] = useState("home");

  if (!session) {
    return (
      <div style={styles.container}>
        <div style={styles.backgroundBlob1}></div>
        <div style={styles.backgroundBlob2}></div>

        <div style={styles.card}>
          <div style={styles.logo}>📚</div>

          <h1 style={styles.title}>ScholarAsync</h1>

          <p style={styles.subtitle}>
            {authMode === "login"
              ? "Welcome back!"
              : "Create your account"}
          </p>

          <input
            style={styles.input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            style={styles.primaryButton}
            disabled={loading}
            onClick={handleAuth}
          >
            {loading
              ? "Loading..."
              : authMode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>

          <button
            style={styles.googleButton}
            onClick={handleGoogleLogin}
          >
            Continue with Google
          </button>

          <button
            style={styles.switchButton}
            onClick={() =>
              setAuthMode(
                authMode === "login"
                  ? "signup"
                  : "login"
              )
            }
          >
            {authMode === "login"
              ? "Create Account"
              : "Already have an account?"}
          </button>
        </div>
      </div>
    );
  }

  if (profile?.role === "SETUP_REQUIRED") {
    return (
      <div style={styles.center}>
        <h2>Finish onboarding...</h2>
      </div>
    );
  }

  if (!profile?.is_approved) {
    return (
      <div style={styles.center}>
        <h2>Waiting for approval...</h2>
      </div>
    );
  }

  return (
    <div style={styles.center}>
      <h1>Home coming in Snippet 2</h1>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#0f172a",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    padding: 20,
  },

  backgroundBlob1: {
    position: "absolute",
    width: 300,
    height: 300,
    background: "#7c3aed",
    borderRadius: "50%",
    filter: "blur(120px)",
    top: -100,
    left: -100,
    opacity: .5,
  },

  backgroundBlob2: {
    position: "absolute",
    width: 250,
    height: 250,
    background: "#2563eb",
    borderRadius: "50%",
    filter: "blur(100px)",
    bottom: -100,
    right: -100,
    opacity: .5,
  },

  card: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 380,
    padding: 30,
    borderRadius: 25,
    backdropFilter: "blur(30px)",
    background: "rgba(255,255,255,.08)",
    border: "1px solid rgba(255,255,255,.1)",
  },

  logo: {
    fontSize: 60,
    textAlign: "center",
  },

  title: {
    color: "white",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 5,
  },

  subtitle: {
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 30,
  },

  input: {
    width: "100%",
    padding: 16,
    marginBottom: 15,
    borderRadius: 15,
    border: "none",
    outline: "none",
    background: "rgba(255,255,255,.1)",
    color: "white",
    boxSizing: "border-box",
    fontSize: 16,
  },

  primaryButton: {
    width: "100%",
    padding: 16,
    borderRadius: 15,
    border: "none",
    cursor: "pointer",
    background:
      "linear-gradient(90deg,#7c3aed,#9333ea)",
    color: "white",
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 15,
  },

  googleButton: {
    width: "100%",
    padding: 16,
    borderRadius: 15,
    border: "none",
    cursor: "pointer",
    background: "white",
    fontWeight: 600,
    marginBottom: 10,
  },

  switchButton: {
    width: "100%",
    background: "transparent",
    color: "#c4b5fd",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#0f172a",
    color: "white",
  },
};
