export default function GoogleOnboarding({
  profile,
  session,
  googleAvatar,
  firstName,
  authData,
  setAuthData,
  classSearch,
  setClassSearch,
  filteredAvailableClasses,
  onComplete,
}) {
  return (
    <div className="auth-container glow-auth">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <div className="onboarding-card glow-card">
        <div className="onboarding-top">
          {googleAvatar ? (
            <img
              className="profile-avatar"
              src={googleAvatar}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="profile-avatar avatar-fallback">
              {firstName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <span className="eyebrow">Google account connected</span>
            <h1>Welcome, {firstName} 👋</h1>
            <p>Complete your ScholarAsync profile before requesting access.</p>
          </div>
        </div>

        <div className="onboarding-section">
          <div className="section-heading">
            <span>1</span>
            <div>
              <h3>Choose your role</h3>
              <p>This controls the tools you will see after approval.</p>
            </div>
          </div>

          <div className="role-choice">
            <button
              type="button"
              className={
                authData.role === "student" ? "role-card active" : "role-card"
              }
              onClick={() => setAuthData({ ...authData, role: "student" })}
            >
              <span className="role-icon">🎓</span>
              <span>
                <strong>Student</strong>
                <small>View assignments, materials, messages and grades</small>
              </span>
              <span className="role-check">✓</span>
            </button>

            <button
              type="button"
              className={
                authData.role === "teacher" ? "role-card active" : "role-card"
              }
              onClick={() => setAuthData({ ...authData, role: "teacher" })}
            >
              <span className="role-icon">🧑‍🏫</span>
              <span>
                <strong>Teacher</strong>
                <small>Post work, share resources and communicate</small>
              </span>
              <span className="role-check">✓</span>
            </button>
          </div>
        </div>

        <div className="onboarding-section">
          <div className="section-heading">
            <span>2</span>
            <div>
              <h3>
                {authData.role === "student"
                  ? "Select your class"
                  : "Tell us what you teach"}
              </h3>
              <p>
                {authData.role === "student"
                  ? "Search and choose one class."
                  : "Use commas to separate multiple entries."}
              </p>
            </div>
          </div>

          {authData.role === "student" ? (
            <>
              <div className="class-search-wrap">
                <span>⌕</span>
                <input
                  className="glow-input"
                  placeholder="Search classes..."
                  value={classSearch}
                  onChange={(event) => setClassSearch(event.target.value)}
                />
              </div>

              <div className="class-grid" role="listbox" aria-label="Choose your class">
                {filteredAvailableClasses.map((className) => (
                  <button
                    type="button"
                    key={className}
                    className={
                      authData.userClass === className
                        ? "class-chip active"
                        : "class-chip"
                    }
                    onClick={() =>
                      setAuthData({ ...authData, userClass: className })
                    }
                  >
                    {className}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="teacher-fields">
              <label className="field-label">
                Classes you teach
                <input
                  className="glow-input"
                  placeholder="JA1, JB2, High School A1"
                  value={authData.teacherClasses}
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
                  placeholder="Math, Physics, History"
                  value={authData.teacherSubjects}
                  onChange={(event) =>
                    setAuthData({
                      ...authData,
                      teacherSubjects: event.target.value,
                    })
                  }
                />
              </label>
            </div>
          )}
        </div>

        <div className="onboarding-footer">
          <div className="signed-in-note">
            <span>🔒</span>
            <div>
              <small>Signed in securely as</small>
              <strong>{session?.user?.email}</strong>
            </div>
          </div>

          <button
            className="main-btn glow-primary-btn onboarding-submit"
            onClick={onComplete}
          >
            Complete registration
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
