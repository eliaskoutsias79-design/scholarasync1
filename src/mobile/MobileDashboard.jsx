from pathlib import Path

code = r'''import { useMemo, useState } from "react";

const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "calendar", label: "Calendar", icon: "□" },
  { id: "materials", label: "Materials", icon: "▤" },
  { id: "messages", label: "Messages", icon: "✦" },
  { id: "profile", label: "Profile", icon: "○" },
];

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  // Optional data props. The file works without them.
  assignments = [],
  announcements = [],
  materials = [],
  messages = [],

  // Optional callbacks for future backend wiring.
  onCreateAssignment,
  onCreateMaterial,
  onCreateAnnouncement,
  onOpenAssignment,
  onOpenMaterial,
  onOpenMessage,

  authError = "",
}) {
  const [activePage, setActivePage] = useState("home");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [materialSearch, setMaterialSearch] = useState("");
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const normalizedMode = authMode === "signup" ? "signup" : "login";
  const displayName =
    profile?.full_name ||
    profile?.display_name ||
    profile?.name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "Student";

  const role = String(profile?.role || "student").toLowerCase();
  const isTeacher = ["teacher", "admin", "owner"].includes(role);

  const approvalValue =
    profile?.is_approved ??
    profile?.approved ??
    (profile?.status ? profile.status === "approved" : undefined);

  const setupRequired =
    profile?.role === "SETUP_REQUIRED" ||
    profile?.setup_required === true ||
    profile?.onboarding_complete === false;

  const filteredMaterials = useMemo(() => {
    const query = materialSearch.trim().toLowerCase();
    if (!query) return materials;

    return materials.filter((item) => {
      const searchable = [
        item?.title,
        item?.name,
        item?.subject,
        item?.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [materials, materialSearch]);

  const calendarDays = useMemo(
    () => buildCalendarDays(calendarMonth),
    [calendarMonth]
  );

  const selectedDateAssignments = useMemo(() => {
    const selectedKey = toDateKey(selectedDate);

    return assignments.filter((item) => {
      const itemDate =
        item?.due_date || item?.dueDate || item?.date || item?.deadline;

      if (!itemDate) return false;

      const parsed = new Date(itemDate);
      return !Number.isNaN(parsed.getTime()) && toDateKey(parsed) === selectedKey;
    });
  }, [assignments, selectedDate]);

  async function submitAuth(event) {
    event.preventDefault();

    if (typeof handleAuth === "function") {
      await handleAuth(event);
    }
  }

  function changeAuthMode(mode) {
    if (typeof setAuthMode === "function") {
      setAuthMode(mode);
    }
  }

  function changeMonth(offset) {
    setCalendarMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
  }

  function goToPage(page) {
    setActivePage(page);
    setQuickMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!session) {
    return (
      <>
        <style>{MOBILE_STYLES}</style>

        <main className="md-auth-shell">
          <div className="md-orb md-orb-one" />
          <div className="md-orb md-orb-two" />
          <div className="md-orb md-orb-three" />

          <section className="md-auth-card" aria-label="ScholarAsync sign in">
            <div className="md-brand-mark" aria-hidden="true">
              <span>SA</span>
            </div>

            <div className="md-auth-heading">
              <p className="md-eyebrow">WELCOME TO</p>
              <h1>ScholarAsync</h1>
              <p>
                {normalizedMode === "login"
                  ? "Sign in to continue to your classroom."
                  : "Create your account and join your classroom."}
              </p>
            </div>

            <div className="md-auth-tabs" role="tablist" aria-label="Account mode">
              <button
                type="button"
                className={normalizedMode === "login" ? "is-active" : ""}
                onClick={() => changeAuthMode("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={normalizedMode === "signup" ? "is-active" : ""}
                onClick={() => changeAuthMode("signup")}
              >
                Sign up
              </button>
            </div>

            <form className="md-auth-form" onSubmit={submitAuth}>
              <label className="md-field">
                <span>Email address</span>
                <div className="md-input-wrap">
                  <span className="md-input-icon" aria-hidden="true">
                    @
                  </span>
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email || ""}
                    onChange={(event) => setEmail?.(event.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="md-field">
                <span>Password</span>
                <div className="md-input-wrap">
                  <span className="md-input-icon" aria-hidden="true">
                    •
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      normalizedMode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    placeholder="Enter your password"
                    value={password || ""}
                    onChange={(event) => setPassword?.(event.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    className="md-password-toggle"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              {authError ? (
                <div className="md-auth-error" role="alert">
                  {authError}
                </div>
              ) : null}

              <button
                className="md-primary-button"
                type="submit"
                disabled={Boolean(loading)}
              >
                {loading ? (
                  <>
                    <span className="md-spinner" aria-hidden="true" />
                    Please wait
                  </>
                ) : normalizedMode === "login" ? (
                  <>
                    Sign in <span aria-hidden="true">→</span>
                  </>
                ) : (
                  <>
                    Create account <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="md-divider">
              <span>or</span>
            </div>

            <button
              className="md-google-button"
              type="button"
              onClick={handleGoogleLogin}
              disabled={Boolean(loading)}
            >
              <span className="md-google-g" aria-hidden="true">
                G
              </span>
              Continue with Google
            </button>

            <p className="md-auth-switch">
              {normalizedMode === "login"
                ? "New to ScholarAsync?"
                : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() =>
                  changeAuthMode(
                    normalizedMode === "login" ? "signup" : "login"
                  )
                }
              >
                {normalizedMode === "login" ? "Create one" : "Sign in"}
              </button>
            </p>
          </section>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <style>{MOBILE_STYLES}</style>
        <StatusScreen
          icon="SA"
          title="Loading your workspace"
          description="We are getting your classroom ready."
          loading
        />
      </>
    );
  }

  if (setupRequired) {
    return (
      <>
        <style>{MOBILE_STYLES}</style>
        <StatusScreen
          icon="✦"
          title="Finish account setup"
          description="Your account exists, but your profile still needs to be completed before you can enter ScholarAsync."
          actionLabel="Sign out"
          onAction={signOut}
        />
      </>
    );
  }

  if (approvalValue === false) {
    return (
      <>
        <style>{MOBILE_STYLES}</style>
        <StatusScreen
          icon="✓"
          title="Approval pending"
          description="Your account was created successfully. A school administrator needs to approve it before you can continue."
          actionLabel="Sign out"
          onAction={signOut}
        />
      </>
    );
  }

  return (
    <>
      <style>{MOBILE_STYLES}</style>

      <div className="md-app-shell">
        <header className="md-topbar">
          <button
            type="button"
            className="md-avatar"
            onClick={() => goToPage("profile")}
            aria-label="Open profile"
          >
            {getInitials(displayName)}
          </button>

          <div className="md-topbar-copy">
            <span>{getGreeting()}</span>
            <strong>{displayName}</strong>
          </div>

          <button
            type="button"
            className="md-icon-button"
            aria-label="Notifications"
          >
            <span aria-hidden="true">◌</span>
            {(announcements.length > 0 || messages.length > 0) && (
              <i className="md-notification-dot" />
            )}
          </button>
        </header>

        <main className="md-page-content">
          {activePage === "home" && (
            <HomePage
              displayName={displayName}
              assignments={assignments}
              announcements={announcements}
              materials={materials}
              onOpenAssignment={onOpenAssignment}
              onNavigate={goToPage}
            />
          )}

          {activePage === "calendar" && (
            <CalendarPage
              month={calendarMonth}
              days={calendarDays}
              selectedDate={selectedDate}
              assignments={assignments}
              selectedDateAssignments={selectedDateAssignments}
              onSelectDate={setSelectedDate}
              onPreviousMonth={() => changeMonth(-1)}
              onNextMonth={() => changeMonth(1)}
              onOpenAssignment={onOpenAssignment}
            />
          )}

          {activePage === "materials" && (
            <MaterialsPage
              materials={filteredMaterials}
              query={materialSearch}
              onQueryChange={setMaterialSearch}
              onOpenMaterial={onOpenMaterial}
            />
          )}

          {activePage === "messages" && (
            <MessagesPage messages={messages} onOpenMessage={onOpenMessage} />
          )}

          {activePage === "profile" && (
            <ProfilePage
              profile={profile}
              session={session}
              displayName={displayName}
              role={role}
              signOut={signOut}
            />
          )}
        </main>

        {isTeacher && (
          <div className="md-fab-wrap">
            {quickMenuOpen && (
              <div className="md-quick-menu">
                <button type="button" onClick={onCreateAssignment}>
                  <span>✓</span>
                  Assignment
                </button>
                <button type="button" onClick={onCreateMaterial}>
                  <span>▤</span>
                  Material
                </button>
                <button type="button" onClick={onCreateAnnouncement}>
                  <span>!</span>
                  Announcement
                </button>
              </div>
            )}

            <button
              type="button"
              className={`md-fab ${quickMenuOpen ? "is-open" : ""}`}
              onClick={() => setQuickMenuOpen((current) => !current)}
              aria-label={quickMenuOpen ? "Close quick menu" : "Open quick menu"}
            >
              +
            </button>
          </div>
        )}

        <nav className="md-bottom-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={activePage === item.id ? "is-active" : ""}
              onClick={() => goToPage(item.id)}
            >
              <span className="md-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

function HomePage({
  assignments,
  announcements,
  materials,
  onOpenAssignment,
  onNavigate,
}) {
  const upcoming = assignments.slice(0, 3);
  const latestAnnouncements = announcements.slice(0, 2);

  return (
    <section className="md-page md-home-page">
      <div className="md-hero-card">
        <div>
          <p className="md-eyebrow">YOUR DAY</p>
          <h1>Stay on top of everything.</h1>
          <p>
            {assignments.length
              ? `${assignments.length} assignment${
                  assignments.length === 1 ? "" : "s"
                } in your workspace.`
              : "Your workspace is clear right now."}
          </p>
        </div>
        <div className="md-hero-symbol" aria-hidden="true">
          ✦
        </div>
      </div>

      <div className="md-stat-grid">
        <button type="button" onClick={() => onNavigate("calendar")}>
          <span>Assignments</span>
          <strong>{assignments.length}</strong>
          <small>View calendar</small>
        </button>
        <button type="button" onClick={() => onNavigate("materials")}>
          <span>Materials</span>
          <strong>{materials.length}</strong>
          <small>Open library</small>
        </button>
      </div>

      <SectionHeader
        title="Upcoming"
        actionLabel="See calendar"
        onAction={() => onNavigate("calendar")}
      />

      {upcoming.length ? (
        <div className="md-stack">
          {upcoming.map((item, index) => (
            <AssignmentCard
              key={item?.id || `${item?.title || "assignment"}-${index}`}
              item={item}
              onClick={() => onOpenAssignment?.(item)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="✓"
          title="Nothing due yet"
          description="New assignments will appear here."
        />
      )}

      <SectionHeader title="Announcements" />

      {latestAnnouncements.length ? (
        <div className="md-stack">
          {latestAnnouncements.map((item, index) => (
            <article
              className="md-announcement-card"
              key={item?.id || `${item?.title || "announcement"}-${index}`}
            >
              <div className="md-card-icon">!</div>
              <div>
                <h3>{item?.title || "Announcement"}</h3>
                <p>{item?.content || item?.message || item?.description}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="!"
          title="No announcements"
          description="School updates will appear here."
        />
      )}
    </section>
  );
}

function CalendarPage({
  month,
  days,
  selectedDate,
  assignments,
  selectedDateAssignments,
  onSelectDate,
  onPreviousMonth,
  onNextMonth,
  onOpenAssignment,
}) {
  const assignmentDateKeys = useMemo(() => {
    const keys = new Set();

    assignments.forEach((item) => {
      const value =
        item?.due_date || item?.dueDate || item?.date || item?.deadline;
      if (!value) return;

      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) keys.add(toDateKey(parsed));
    });

    return keys;
  }, [assignments]);

  return (
    <section className="md-page">
      <PageTitle
        eyebrow="SCHEDULE"
        title="Calendar"
        description="Select a date to see what is due."
      />

      <div className="md-calendar-card">
        <div className="md-calendar-head">
          <button type="button" onClick={onPreviousMonth} aria-label="Previous month">
            ‹
          </button>
          <strong>
            {month.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </strong>
          <button type="button" onClick={onNextMonth} aria-label="Next month">
            ›
          </button>
        </div>

        <div className="md-calendar-grid md-calendar-weekdays">
          {WEEKDAYS.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="md-calendar-grid">
          {days.map((day) => {
            const selected = toDateKey(day.date) === toDateKey(selectedDate);
            const today = toDateKey(day.date) === toDateKey(new Date());
            const hasAssignment = assignmentDateKeys.has(toDateKey(day.date));

            return (
              <button
                type="button"
                key={day.key}
                className={[
                  "md-calendar-day",
                  day.inCurrentMonth ? "" : "is-muted",
                  selected ? "is-selected" : "",
                  today ? "is-today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelectDate(day.date)}
              >
                <span>{day.date.getDate()}</span>
                {hasAssignment && <i />}
              </button>
            );
          })}
        </div>
      </div>

      <SectionHeader
        title={selectedDate.toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      />

      {selectedDateAssignments.length ? (
        <div className="md-stack">
          {selectedDateAssignments.map((item, index) => (
            <AssignmentCard
              key={item?.id || `${item?.title || "assignment"}-${index}`}
              item={item}
              onClick={() => onOpenAssignment?.(item)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="□"
          title="No work due"
          description="There are no assignments scheduled for this date."
        />
      )}
    </section>
  );
}

function MaterialsPage({
  materials,
  query,
  onQueryChange,
  onOpenMaterial,
}) {
  return (
    <section className="md-page">
      <PageTitle
        eyebrow="LIBRARY"
        title="Materials"
        description="Notes, files and classroom resources."
      />

      <label className="md-search">
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Search materials"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      {materials.length ? (
        <div className="md-material-grid">
          {materials.map((item, index) => (
            <button
              type="button"
              className="md-material-card"
              key={item?.id || `${item?.title || "material"}-${index}`}
              onClick={() => onOpenMaterial?.(item)}
            >
              <div className="md-material-icon">
                {getMaterialIcon(item?.type || item?.file_type)}
              </div>
              <div>
                <span>{item?.subject || item?.category || "Resource"}</span>
                <h3>{item?.title || item?.name || "Untitled material"}</h3>
                <p>{item?.description || "Tap to open this material."}</p>
              </div>
              <strong aria-hidden="true">→</strong>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="▤"
          title={query ? "No matching materials" : "No materials yet"}
          description={
            query
              ? "Try another search term."
              : "Shared classroom resources will appear here."
          }
        />
      )}
    </section>
  );
}

function MessagesPage({ messages, onOpenMessage }) {
  return (
    <section className="md-page">
      <PageTitle
        eyebrow="INBOX"
        title="Messages"
        description="Recent classroom conversations."
      />

      {messages.length ? (
        <div className="md-message-list">
          {messages.map((item, index) => {
            const sender =
              item?.sender_name ||
              item?.from_name ||
              item?.sender ||
              item?.from ||
              "Classroom";

            return (
              <button
                type="button"
                className="md-message-row"
                key={item?.id || `${sender}-${index}`}
                onClick={() => onOpenMessage?.(item)}
              >
                <span className="md-message-avatar">{getInitials(sender)}</span>
                <span className="md-message-copy">
                  <strong>{sender}</strong>
                  <small>
                    {item?.subject || item?.message || item?.content || "Message"}
                  </small>
                </span>
                <span className="md-message-time">
                  {formatRelativeDate(
                    item?.created_at || item?.date || item?.timestamp
                  )}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="✦"
          title="Your inbox is empty"
          description="New classroom messages will appear here."
        />
      )}
    </section>
  );
}

function ProfilePage({ profile, session, displayName, role, signOut }) {
  return (
    <section className="md-page">
      <PageTitle
        eyebrow="ACCOUNT"
        title="Profile"
        description="Your ScholarAsync account."
      />

      <div className="md-profile-card">
        <div className="md-profile-avatar">{getInitials(displayName)}</div>
        <div>
          <h2>{displayName}</h2>
          <p>{session?.user?.email}</p>
          <span>{capitalize(role)}</span>
        </div>
      </div>

      <div className="md-settings-card">
        <ProfileRow label="School" value={profile?.school_name || "Not set"} />
        <ProfileRow
          label="Class"
          value={profile?.class_name || profile?.classroom || "Not set"}
        />
        <ProfileRow
          label="Account status"
          value={
            profile?.is_approved === false || profile?.approved === false
              ? "Pending"
              : "Active"
          }
        />
      </div>

      <button className="md-logout-button" type="button" onClick={signOut}>
        Sign out
      </button>
    </section>
  );
}

function StatusScreen({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  loading = false,
}) {
  return (
    <main className="md-status-shell">
      <div className="md-status-card">
        <div className="md-status-icon">{loading ? <span className="md-spinner" /> : icon}</div>
        <h1>{title}</h1>
        <p>{description}</p>
        {actionLabel && (
          <button type="button" className="md-secondary-button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </main>
  );
}

function PageTitle({ eyebrow, title, description }) {
  return (
    <header className="md-page-title">
      <p className="md-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <span>{description}</span>
    </header>
  );
}

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div className="md-section-head">
      <h2>{title}</h2>
      {actionLabel && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function AssignmentCard({ item, onClick }) {
  const dueValue =
    item?.due_date || item?.dueDate || item?.date || item?.deadline;

  return (
    <button type="button" className="md-assignment-card" onClick={onClick}>
      <span className="md-subject-stripe" />
      <span className="md-assignment-copy">
        <small>{item?.subject || item?.course || "Assignment"}</small>
        <strong>{item?.title || item?.name || "Untitled assignment"}</strong>
        <span>{dueValue ? `Due ${formatDate(dueValue)}` : "No due date"}</span>
      </span>
      <span className="md-assignment-arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="md-empty-state">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="md-profile-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildCalendarDays(month) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const mondayBasedOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, monthIndex, 1 - mondayBasedOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index
    );

    return {
      date,
      key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      inCurrentMonth: date.getMonth() === monthIndex,
    };
  });
}

function toDateKey(date) {
  const value = new Date(date);

  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function formatRelativeDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = toDateKey(now) === toDateKey(date);

  if (sameDay) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getInitials(value) {
  const words = String(value || "SA")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "SA";

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function capitalize(value) {
  const stringValue = String(value || "student");
  return stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
}

function getMaterialIcon(type) {
  const normalized = String(type || "").toLowerCase();

  if (normalized.includes("pdf")) return "PDF";
  if (normalized.includes("video")) return "▶";
  if (normalized.includes("image")) return "IMG";
  if (normalized.includes("link")) return "↗";
  return "DOC";
}

const MOBILE_STYLES = `
  :root {
    color-scheme: dark;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
      "Segoe UI", sans-serif;
    background: #080b14;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    min-height: 100%;
    margin: 0;
  }

  button,
  input {
    font: inherit;
  }

  button {
    -webkit-tap-highlight-color: transparent;
  }

  .md-auth-shell,
  .md-status-shell {
    position: relative;
    min-height: 100svh;
    display: grid;
    place-items: center;
    overflow: hidden;
    padding:
      max(24px, env(safe-area-inset-top))
      18px
      max(24px, env(safe-area-inset-bottom));
    color: #f8fafc;
    background:
      radial-gradient(circle at top, rgba(111, 76, 255, 0.14), transparent 40%),
      linear-gradient(155deg, #070913 0%, #0b1020 48%, #090b16 100%);
  }

  .md-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(70px);
    pointer-events: none;
    opacity: 0.45;
    animation: md-float 9s ease-in-out infinite;
  }

  .md-orb-one {
    width: 260px;
    height: 260px;
    top: -110px;
    left: -85px;
    background: #7546ff;
  }

  .md-orb-two {
    width: 240px;
    height: 240px;
    right: -110px;
    bottom: 8%;
    background: #2368ff;
    animation-delay: -3s;
  }

  .md-orb-three {
    width: 170px;
    height: 170px;
    left: 35%;
    bottom: -90px;
    background: #c142ff;
    animation-delay: -6s;
  }

  @keyframes md-float {
    0%,
    100% {
      transform: translate3d(0, 0, 0) scale(1);
    }

    50% {
      transform: translate3d(12px, -18px, 0) scale(1.08);
    }
  }

  .md-auth-card,
  .md-status-card {
    position: relative;
    z-index: 2;
    width: min(100%, 430px);
    padding: 28px 22px 24px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 30px;
    background: rgba(13, 18, 34, 0.82);
    box-shadow:
      0 28px 90px rgba(0, 0, 0, 0.48),
      inset 0 1px 0 rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(24px);
    animation: md-card-in 0.5s ease both;
  }

  @keyframes md-card-in {
    from {
      opacity: 0;
      transform: translateY(14px) scale(0.98);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .md-brand-mark,
  .md-status-icon {
    width: 66px;
    height: 66px;
    display: grid;
    place-items: center;
    margin: 0 auto 18px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 21px;
    color: #ffffff;
    background:
      linear-gradient(145deg, rgba(138, 92, 255, 0.95), rgba(74, 73, 234, 0.92));
    box-shadow:
      0 16px 32px rgba(102, 74, 255, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.28);
    font-size: 19px;
    font-weight: 900;
    letter-spacing: -0.04em;
  }

  .md-auth-heading {
    text-align: center;
  }

  .md-eyebrow {
    margin: 0 0 8px;
    color: #9789ff;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.18em;
  }

  .md-auth-heading h1,
  .md-status-card h1 {
    margin: 0;
    color: #ffffff;
    font-size: clamp(30px, 9vw, 40px);
    line-height: 1;
    letter-spacing: -0.055em;
  }

  .md-auth-heading > p:last-child,
  .md-status-card > p {
    margin: 13px auto 0;
    max-width: 300px;
    color: #9da7bc;
    font-size: 14px;
    line-height: 1.55;
  }

  .md-auth-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin: 25px 0 20px;
    padding: 4px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.035);
  }

  .md-auth-tabs button {
    min-height: 42px;
    border: 0;
    border-radius: 11px;
    color: #7f899c;
    background: transparent;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: 0.22s ease;
  }

  .md-auth-tabs button.is-active {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.09);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  }

  .md-auth-form {
    display: grid;
    gap: 15px;
  }

  .md-field {
    display: grid;
    gap: 8px;
  }

  .md-field > span {
    padding-left: 2px;
    color: #cfd5e3;
    font-size: 12px;
    font-weight: 750;
  }

  .md-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .md-input-wrap input,
  .md-search input {
    width: 100%;
    min-width: 0;
    border: 1px solid rgba(255, 255, 255, 0.075);
    outline: 0;
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.045);
    transition: 0.2s ease;
  }

  .md-input-wrap input {
    height: 54px;
    padding: 0 62px 0 45px;
    border-radius: 15px;
    font-size: 15px;
  }

  .md-input-wrap input::placeholder,
  .md-search input::placeholder {
    color: #687286;
  }

  .md-input-wrap input:focus,
  .md-search input:focus {
    border-color: rgba(139, 102, 255, 0.78);
    background: rgba(255, 255, 255, 0.065);
    box-shadow: 0 0 0 4px rgba(116, 82, 255, 0.11);
  }

  .md-input-icon {
    position: absolute;
    left: 16px;
    z-index: 1;
    color: #8c96aa;
    font-size: 15px;
    font-weight: 900;
  }

  .md-password-toggle {
    position: absolute;
    right: 9px;
    height: 36px;
    padding: 0 9px;
    border: 0;
    border-radius: 9px;
    color: #aaa2ff;
    background: transparent;
    font-size: 11px;
    font-weight: 850;
    cursor: pointer;
  }

  .md-primary-button,
  .md-google-button,
  .md-secondary-button,
  .md-logout-button {
    min-height: 53px;
    border-radius: 15px;
    font-weight: 850;
    cursor: pointer;
    transition:
      transform 0.16s ease,
      opacity 0.16s ease,
      filter 0.16s ease;
  }

  .md-primary-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    margin-top: 3px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    color: #ffffff;
    background: linear-gradient(135deg, #8959ff, #5d5ce9);
    box-shadow: 0 14px 28px rgba(94, 72, 220, 0.27);
  }

  .md-primary-button:active,
  .md-google-button:active,
  .md-secondary-button:active,
  .md-logout-button:active {
    transform: scale(0.985);
  }

  .md-primary-button:disabled,
  .md-google-button:disabled {
    cursor: not-allowed;
    opacity: 0.58;
  }

  .md-google-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    color: #e7eaf0;
    background: rgba(255, 255, 255, 0.055);
  }

  .md-google-g {
    display: grid;
    place-items: center;
    width: 25px;
    height: 25px;
    border-radius: 8px;
    color: #222;
    background: #ffffff;
    font-size: 13px;
    font-weight: 950;
  }

  .md-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 18px 0;
    color: #626c80;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .md-divider::before,
  .md-divider::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(255, 255, 255, 0.07);
  }

  .md-auth-switch {
    margin: 18px 0 0;
    color: #7f899c;
    text-align: center;
    font-size: 13px;
  }

  .md-auth-switch button {
    border: 0;
    padding: 0;
    color: #aaa1ff;
    background: transparent;
    font-weight: 850;
    cursor: pointer;
  }

  .md-auth-error {
    padding: 11px 13px;
    border: 1px solid rgba(255, 103, 124, 0.2);
    border-radius: 12px;
    color: #ffb2bf;
    background: rgba(255, 81, 109, 0.08);
    font-size: 12px;
    line-height: 1.45;
  }

  .md-spinner {
    width: 19px;
    height: 19px;
    display: inline-block;
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-top-color: #ffffff;
    border-radius: 999px;
    animation: md-spin 0.75s linear infinite;
  }

  @keyframes md-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .md-status-card {
    text-align: center;
  }

  .md-secondary-button {
    width: 100%;
    margin-top: 22px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    color: #ffffff;
    background: rgba(255, 255, 255, 0.06);
  }

  .md-app-shell {
    min-height: 100svh;
    color: #eff2f8;
    background:
      radial-gradient(circle at 50% -10%, rgba(93, 66, 209, 0.18), transparent 32%),
      #090c15;
  }

  .md-topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    min-height: 82px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding:
      max(14px, env(safe-area-inset-top))
      18px
      12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.055);
    background: rgba(9, 12, 21, 0.82);
    backdrop-filter: blur(22px);
  }

  .md-avatar,
  .md-message-avatar {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: #ffffff;
    background: linear-gradient(145deg, #8055f3, #4c55d7);
    font-weight: 900;
  }

  .md-avatar {
    width: 44px;
    height: 44px;
    border-radius: 15px;
    cursor: pointer;
  }

  .md-topbar-copy {
    min-width: 0;
    display: grid;
    flex: 1;
  }

  .md-topbar-copy span {
    color: #717b8f;
    font-size: 11px;
    font-weight: 750;
  }

  .md-topbar-copy strong {
    overflow: hidden;
    color: #f7f8fb;
    font-size: 17px;
    letter-spacing: -0.025em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .md-icon-button {
    position: relative;
    width: 43px;
    height: 43px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.075);
    border-radius: 14px;
    color: #d8dce7;
    background: rgba(255, 255, 255, 0.04);
    font-size: 22px;
  }

  .md-notification-dot {
    position: absolute;
    top: 9px;
    right: 9px;
    width: 7px;
    height: 7px;
    border: 2px solid #0b0e18;
    border-radius: 999px;
    background: #a66cff;
  }

  .md-page-content {
    width: min(100%, 760px);
    min-height: calc(100svh - 82px);
    margin: 0 auto;
    padding: 18px 16px calc(112px + env(safe-area-inset-bottom));
  }

  .md-page {
    animation: md-page-in 0.28s ease both;
  }

  @keyframes md-page-in {
    from {
      opacity: 0;
      transform: translateY(7px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .md-hero-card {
    min-height: 185px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    overflow: hidden;
    padding: 23px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 27px;
    background:
      linear-gradient(145deg, rgba(126, 82, 243, 0.9), rgba(68, 69, 193, 0.92)),
      #5b4adb;
    box-shadow: 0 24px 55px rgba(51, 40, 133, 0.24);
  }

  .md-hero-card h1 {
    max-width: 255px;
    margin: 0 0 10px;
    color: #ffffff;
    font-size: clamp(26px, 8vw, 36px);
    line-height: 1.03;
    letter-spacing: -0.05em;
  }

  .md-hero-card p:last-child {
    margin: 0;
    color: rgba(255, 255, 255, 0.72);
    font-size: 13px;
    line-height: 1.45;
  }

  .md-hero-symbol {
    flex: 0 0 auto;
    width: 72px;
    height: 72px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 24px;
    color: rgba(255, 255, 255, 0.88);
    background: rgba(255, 255, 255, 0.09);
    font-size: 35px;
    transform: rotate(8deg);
  }

  .md-stat-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 13px;
  }

  .md-stat-grid button {
    display: grid;
    gap: 4px;
    min-height: 128px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 22px;
    color: inherit;
    text-align: left;
    background: rgba(255, 255, 255, 0.035);
  }

  .md-stat-grid span {
    color: #8f98ab;
    font-size: 12px;
    font-weight: 750;
  }

  .md-stat-grid strong {
    color: #ffffff;
    font-size: 32px;
    letter-spacing: -0.05em;
  }

  .md-stat-grid small {
    color: #8074dc;
    font-size: 11px;
    font-weight: 800;
  }

  .md-section-head {
    min-height: 60px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    padding: 22px 3px 10px;
  }

  .md-section-head h2 {
    margin: 0;
    color: #f3f5f9;
    font-size: 18px;
    letter-spacing: -0.035em;
  }

  .md-section-head button {
    border: 0;
    padding: 5px 0;
    color: #8f83ed;
    background: transparent;
    font-size: 11px;
    font-weight: 850;
  }

  .md-stack {
    display: grid;
    gap: 10px;
  }

  .md-assignment-card,
  .md-announcement-card,
  .md-material-card,
  .md-message-row {
    border: 1px solid rgba(255, 255, 255, 0.07);
    color: inherit;
    background: rgba(255, 255, 255, 0.035);
  }

  .md-assignment-card {
    position: relative;
    width: 100%;
    min-height: 92px;
    display: flex;
    align-items: center;
    gap: 14px;
    overflow: hidden;
    padding: 14px 15px 14px 20px;
    border-radius: 20px;
    text-align: left;
  }

  .md-subject-stripe {
    position: absolute;
    top: 18px;
    bottom: 18px;
    left: 0;
    width: 4px;
    border-radius: 0 5px 5px 0;
    background: linear-gradient(#9a6bff, #575fe2);
  }

  .md-assignment-copy {
    min-width: 0;
    display: grid;
    flex: 1;
    gap: 3px;
  }

  .md-assignment-copy small {
    color: #8f83ed;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .md-assignment-copy strong {
    overflow: hidden;
    color: #f1f3f8;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .md-assignment-copy span {
    color: #717b8f;
    font-size: 11px;
  }

  .md-assignment-arrow {
    color: #747e91;
    font-size: 18px;
  }

  .md-announcement-card {
    display: flex;
    gap: 13px;
    padding: 16px;
    border-radius: 20px;
  }

  .md-card-icon {
    flex: 0 0 auto;
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    color: #b7aeff;
    background: rgba(126, 91, 234, 0.13);
    font-weight: 950;
  }

  .md-announcement-card h3 {
    margin: 1px 0 5px;
    color: #edf0f6;
    font-size: 14px;
  }

  .md-announcement-card p {
    display: -webkit-box;
    overflow: hidden;
    margin: 0;
    color: #737d90;
    font-size: 12px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .md-empty-state {
    display: grid;
    place-items: center;
    padding: 34px 18px;
    border: 1px dashed rgba(255, 255, 255, 0.1);
    border-radius: 22px;
    text-align: center;
    background: rgba(255, 255, 255, 0.02);
  }

  .md-empty-state > div {
    width: 47px;
    height: 47px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    color: #a499ff;
    background: rgba(133, 98, 243, 0.1);
    font-weight: 900;
  }

  .md-empty-state h3 {
    margin: 12px 0 5px;
    color: #e9ecf2;
    font-size: 14px;
  }

  .md-empty-state p {
    margin: 0;
    color: #6f788b;
    font-size: 12px;
  }

  .md-page-title {
    padding: 4px 2px 20px;
  }

  .md-page-title h1 {
    margin: 0 0 7px;
    color: #f7f8fb;
    font-size: 34px;
    line-height: 1;
    letter-spacing: -0.055em;
  }

  .md-page-title span {
    color: #737d90;
    font-size: 13px;
  }

  .md-calendar-card {
    padding: 15px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.035);
  }

  .md-calendar-head {
    display: grid;
    grid-template-columns: 42px 1fr 42px;
    align-items: center;
    margin-bottom: 14px;
  }

  .md-calendar-head strong {
    text-align: center;
    font-size: 14px;
  }

  .md-calendar-head button {
    width: 38px;
    height: 38px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 12px;
    color: #d9ddea;
    background: rgba(255, 255, 255, 0.035);
    font-size: 24px;
  }

  .md-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  .md-calendar-weekdays {
    margin-bottom: 5px;
  }

  .md-calendar-weekdays span {
    padding: 5px 0;
    color: #5f687b;
    text-align: center;
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .md-calendar-day {
    position: relative;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 13px;
    color: #c8ceda;
    background: transparent;
    font-size: 12px;
    font-weight: 750;
  }

  .md-calendar-day.is-muted {
    color: #3f4756;
  }

  .md-calendar-day.is-selected {
    color: #ffffff;
    background: linear-gradient(145deg, #8559f4, #5457da);
    box-shadow: 0 8px 18px rgba(84, 77, 211, 0.27);
  }

  .md-calendar-day.is-today:not(.is-selected) {
    box-shadow: inset 0 0 0 1px rgba(135, 102, 245, 0.55);
  }

  .md-calendar-day i {
    position: absolute;
    bottom: 5px;
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: #a991ff;
  }

  .md-calendar-day.is-selected i {
    background: #ffffff;
  }

  .md-search {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .md-search > span {
    position: absolute;
    z-index: 1;
    margin-left: 16px;
    color: #727c8f;
    font-size: 20px;
  }

  .md-search input {
    height: 53px;
    padding: 0 17px 0 46px;
    border-radius: 16px;
  }

  .md-material-grid {
    display: grid;
    gap: 11px;
  }

  .md-material-card {
    width: 100%;
    display: grid;
    grid-template-columns: 50px 1fr 22px;
    align-items: center;
    gap: 13px;
    padding: 14px;
    border-radius: 20px;
    text-align: left;
  }

  .md-material-icon {
    width: 50px;
    height: 50px;
    display: grid;
    place-items: center;
    border-radius: 15px;
    color: #b6adff;
    background: rgba(128, 89, 239, 0.12);
    font-size: 11px;
    font-weight: 950;
  }

  .md-material-card > div:nth-child(2) {
    min-width: 0;
  }

  .md-material-card span {
    color: #7e73d8;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .md-material-card h3 {
    overflow: hidden;
    margin: 3px 0;
    color: #edf0f6;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .md-material-card p {
    overflow: hidden;
    margin: 0;
    color: #6e788a;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .md-material-card > strong {
    color: #6f788b;
  }

  .md-message-list {
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.065);
    border-radius: 23px;
    background: rgba(255, 255, 255, 0.025);
  }

  .md-message-row {
    width: 100%;
    min-height: 76px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 13px 14px;
    border-width: 0 0 1px;
    text-align: left;
    background: transparent;
  }

  .md-message-row:last-child {
    border-bottom: 0;
  }

  .md-message-avatar {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    font-size: 12px;
  }

  .md-message-copy {
    min-width: 0;
    display: grid;
    flex: 1;
    gap: 4px;
  }

  .md-message-copy strong {
    color: #e9ecf3;
    font-size: 13px;
  }

  .md-message-copy small {
    overflow: hidden;
    color: #707a8d;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .md-message-time {
    color: #5e6879;
    font-size: 9px;
  }

  .md-profile-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 24px;
    background: linear-gradient(
      145deg,
      rgba(119, 83, 224, 0.14),
      rgba(255, 255, 255, 0.03)
    );
  }

  .md-profile-avatar {
    flex: 0 0 auto;
    width: 68px;
    height: 68px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.13);
    border-radius: 22px;
    color: #ffffff;
    background: linear-gradient(145deg, #8459ee, #4b55d1);
    font-size: 20px;
    font-weight: 950;
  }

  .md-profile-card h2 {
    margin: 0 0 4px;
    color: #ffffff;
    font-size: 20px;
    letter-spacing: -0.035em;
  }

  .md-profile-card p {
    margin: 0 0 8px;
    color: #788296;
    font-size: 11px;
  }

  .md-profile-card span {
    display: inline-flex;
    padding: 5px 9px;
    border-radius: 999px;
    color: #b7aeff;
    background: rgba(131, 95, 237, 0.12);
    font-size: 9px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .md-settings-card {
    overflow: hidden;
    margin-top: 14px;
    border: 1px solid rgba(255, 255, 255, 0.065);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.03);
  }

  .md-profile-row {
    min-height: 61px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.055);
  }

  .md-profile-row:last-child {
    border-bottom: 0;
  }

  .md-profile-row span {
    color: #737d90;
    font-size: 12px;
  }

  .md-profile-row strong {
    overflow: hidden;
    color: #dce0e9;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .md-logout-button {
    width: 100%;
    margin-top: 15px;
    border: 1px solid rgba(255, 91, 115, 0.15);
    color: #ff9bac;
    background: rgba(255, 70, 98, 0.07);
  }

  .md-bottom-nav {
    position: fixed;
    z-index: 50;
    right: 12px;
    bottom: max(10px, env(safe-area-inset-bottom));
    left: 12px;
    min-height: 70px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    padding: 6px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 23px;
    background: rgba(16, 20, 32, 0.91);
    box-shadow: 0 19px 55px rgba(0, 0, 0, 0.43);
    backdrop-filter: blur(24px);
  }

  .md-bottom-nav button {
    min-width: 0;
    display: grid;
    place-items: center;
    gap: 3px;
    border: 0;
    border-radius: 17px;
    color: #5f687b;
    background: transparent;
    font-size: 9px;
    font-weight: 800;
    cursor: pointer;
    transition: 0.2s ease;
  }

  .md-bottom-nav button.is-active {
    color: #b2a9ff;
    background: rgba(128, 91, 234, 0.12);
  }

  .md-nav-icon {
    font-size: 20px;
    line-height: 1;
  }

  .md-fab-wrap {
    position: fixed;
    z-index: 60;
    right: 21px;
    bottom: calc(92px + env(safe-area-inset-bottom));
  }

  .md-fab {
    width: 56px;
    height: 56px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 19px;
    color: #ffffff;
    background: linear-gradient(145deg, #895bf2, #5458d5);
    box-shadow: 0 17px 34px rgba(61, 52, 167, 0.37);
    font-size: 28px;
    cursor: pointer;
    transition: 0.22s ease;
  }

  .md-fab.is-open {
    transform: rotate(45deg);
  }

  .md-quick-menu {
    position: absolute;
    right: 0;
    bottom: 67px;
    width: 178px;
    display: grid;
    gap: 7px;
    padding: 9px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 19px;
    background: rgba(17, 21, 34, 0.95);
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.42);
    backdrop-filter: blur(22px);
    animation: md-menu-in 0.18s ease both;
  }

  @keyframes md-menu-in {
    from {
      opacity: 0;
      transform: translateY(7px) scale(0.97);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .md-quick-menu button {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 0;
    border-radius: 13px;
    color: #dce0e9;
    text-align: left;
    background: transparent;
    font-size: 12px;
    font-weight: 750;
  }

  .md-quick-menu button:active {
    background: rgba(255, 255, 255, 0.06);
  }

  .md-quick-menu span {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    color: #b4abff;
    background: rgba(128, 91, 234, 0.12);
    font-weight: 950;
  }

  @media (min-width: 620px) {
    .md-bottom-nav {
      width: min(560px, calc(100% - 24px));
      right: auto;
      left: 50%;
      transform: translateX(-50%);
    }

    .md-fab-wrap {
      right: max(24px, calc((100vw - 720px) / 2));
    }

    .md-page-content {
      padding-right: 22px;
      padding-left: 22px;
    }
  }

  @media (max-width: 360px) {
    .md-auth-card {
      padding-right: 18px;
      padding-left: 18px;
      border-radius: 25px;
    }

    .md-hero-card {
      padding: 20px;
    }

    .md-hero-symbol {
      width: 58px;
      height: 58px;
      border-radius: 19px;
      font-size: 28px;
    }

    .md-bottom-nav {
      right: 7px;
      left: 7px;
    }

    .md-bottom-nav button {
      font-size: 8px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

'''

path = Path("/mnt/data/MobileDashboard.jsx")
path.write_text(code, encoding="utf-8")
print(f"Created {path} ({path.stat().st_size:,} bytes)")
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
