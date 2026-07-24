import GoogleIcon from "../../components/GoogleIcon";
import { AVAILABLE_CLASSES } from "../../constants/app";

export default function LoginPage({
  authMode,
  setAuthMode,
  authBusy,
  authData,
  setAuthData,
  onAuth,
  onGoogleLogin,
  onForgotPassword,
}) {
  const isForgotPassword = authMode === "forgot";

  return (
    <div className="auth-container glow-auth">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <div className="auth-shell">
        <section className="auth-showcase">
          <div className="showcase-badge">Built for modern classrooms</div>
          <div className="showcase-logo">
            Scholar<span>Async</span>
          </div>
          <h1>Everything your class needs, in one calm workspace.</h1>
          <p>
            Assignments, announcements, materials, messages and grades— organized
            without the noise.
          </p>

          <div className="showcase-points">
            <div><span>✓</span> One dashboard for students and teachers</div>
            <div><span>✓</span> Fast Google or email access</div>
            <div><span>✓</span> Secure approval before entering</div>
          </div>
        </section>

        <div className="auth-card glow-card">
          <div className="auth-header">
            <div className="text-logo">
              Scholar<span>Async</span>
            </div>
            <h2>
              {isForgotPassword
                ? "Reset your password"
                : authMode === "login"
                  ? "Welcome back"
                  : "Create your account"}
            </h2>
            <p className="auth-subtitle">
              {isForgotPassword
                ? "Enter your email and we’ll send you a secure recovery link."
                : authMode === "login"
                  ? "Sign in to continue to your educational portal."
                  : "Tell us who you are, then wait for administrator approval."}
            </p>
          </div>

          <form
            className="auth-form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              if (isForgotPassword) onForgotPassword();
              else onAuth();
            }}
          >
            {authMode === "signup" && (
              <div className="signup-fields">
                <label className="field-label">
                  Full name
                  <input
                    className="glow-input"
                    placeholder="Nikolaos Koutsias"
                    value={authData.fullName}
                    required
                    disabled={authBusy}
                    onChange={(event) =>
                      setAuthData({ ...authData, fullName: event.target.value })
                    }
                  />
                </label>

                <div className="role-choice compact-role-choice">
                  <button
                    type="button"
                    className={
                      authData.role === "student" ? "role-card active" : "role-card"
                    }
                    disabled={authBusy}
                    onClick={() => setAuthData({ ...authData, role: "student" })}
                  >
                    <span className="role-icon">🎓</span>
                    <span><strong>Student</strong><small>Join your class</small></span>
                  </button>
                  <button
                    type="button"
                    className={
                      authData.role === "teacher" ? "role-card active" : "role-card"
                    }
                    disabled={authBusy}
                    onClick={() => setAuthData({ ...authData, role: "teacher" })}
                  >
                    <span className="role-icon">🧑‍🏫</span>
                    <span><strong>Teacher</strong><small>Manage classes</small></span>
                  </button>
                </div>

                {authData.role === "student" ? (
                  <label className="field-label">
                    Class
                    <select
                      className="glow-input dark-select"
                      value={authData.userClass}
                      disabled={authBusy}
                      onChange={(event) =>
                        setAuthData({ ...authData, userClass: event.target.value })
                      }
                    >
                      {AVAILABLE_CLASSES.map((className) => (
                        <option key={className} value={className}>{className}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <>
                    <label className="field-label">
                      Classes you teach
                      <input
                        className="glow-input"
                        placeholder="JA1, JB2, HA1"
                        value={authData.teacherClasses}
                        required
                        disabled={authBusy}
                        onChange={(event) =>
                          setAuthData({
                            ...authData,
                            teacherClasses: event.target.value,
                          })
                        }
                      />
                    </label>
                    <label className="field-label">
                      Subjects
                      <input
                        className="glow-input"
                        placeholder="Math, Physics"
                        value={authData.teacherSubjects}
                        required
                        disabled={authBusy}
                        onChange={(event) =>
                          setAuthData({
                            ...authData,
                            teacherSubjects: event.target.value,
                          })
                        }
                      />
                    </label>
                  </>
                )}
              </div>
            )}

            <label className="field-label">
              Email
              <input
                className="glow-input"
                type="email"
                placeholder="you@example.com"
                value={authData.email}
                required
                disabled={authBusy}
                onChange={(event) =>
                  setAuthData({ ...authData, email: event.target.value })
                }
              />
            </label>

            {!isForgotPassword && (
              <>
                <label className="field-label">
                  Password
                  <input
                    className="glow-input"
                    type="password"
                    placeholder="Your password"
                    value={authData.password}
                    required
                    minLength={6}
                    disabled={authBusy}
                    onChange={(event) =>
                      setAuthData({ ...authData, password: event.target.value })
                    }
                  />
                </label>

                {authMode === "login" && (
                  <button
                    type="button"
                    className="forgot-password-link"
                    disabled={authBusy}
                    onClick={() => setAuthMode("forgot")}
                  >
                    Forgot your password?
                  </button>
                )}
              </>
            )}

            <button
              type="submit"
              className="main-btn glow-primary-btn"
              disabled={authBusy}
            >
              {authBusy
                ? "Please wait…"
                : isForgotPassword
                  ? "Send recovery link"
                  : authMode === "login"
                    ? "Sign in"
                    : "Request access"}
            </button>

            {!isForgotPassword && (
              <>
                <div className="auth-divider"><span>or continue with</span></div>

                <button
                  type="button"
                  className="google-login-btn"
                  onClick={onGoogleLogin}
                  disabled={authBusy}
                >
                  <GoogleIcon />
                  <span>Google</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="auth-toggle"
              disabled={authBusy}
              onClick={() => {
                setAuthMode(
                  isForgotPassword
                    ? "login"
                    : authMode === "login"
                      ? "signup"
                      : "login"
                );
              }}
            >
              {isForgotPassword ? (
                <>Remembered it? <strong>Back to sign in</strong></>
              ) : authMode === "login" ? (
                <>New to ScholarAsync? <strong>Create an account</strong></>
              ) : (
                <>Already registered? <strong>Sign in</strong></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
