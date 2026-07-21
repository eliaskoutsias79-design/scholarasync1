import { useMemo, useState } from "react";

const navItems = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "calendar", label: "Calendar", icon: "□" },
  { id: "materials", label: "Materials", icon: "▤" },
  { id: "messages", label: "Messages", icon: "✦" },
  { id: "profile", label: "Profile", icon: "○" },
];

const demoAssignments = [
  { id: 1, subject: "Mathematics", title: "Algebra worksheet", due: "Tomorrow" },
  { id: 2, subject: "Chemistry", title: "Lab report", due: "Friday" },
  { id: 3, subject: "English", title: "Essay draft", due: "Monday" },
];

const demoMaterials = [
  { id: 1, type: "PDF", subject: "Mathematics", title: "Chapter 4 notes" },
  { id: 2, type: "DOC", subject: "Physics", title: "Motion summary" },
  { id: 3, type: "VID", subject: "Chemistry", title: "Acids and bases" },
];

const demoMessages = [
  { id: 1, sender: "Ms. Carter", text: "The homework deadline was moved.", time: "18:20" },
  { id: 2, sender: "Mr. Lewis", text: "Remember to bring your workbook.", time: "Yesterday" },
];

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
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [search, setSearch] = useState("");

  const mode = authMode === "signup" ? "signup" : "login";
  const displayName =
    profile?.full_name ||
    profile?.name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "Student";

  const role = String(profile?.role || "student").toLowerCase();
  const setupRequired =
    profile?.role === "SETUP_REQUIRED" ||
    profile?.setup_required === true ||
    profile?.onboarding_complete === false;

  const approvalKnown =
    profile &&
    (Object.prototype.hasOwnProperty.call(profile, "is_approved") ||
      Object.prototype.hasOwnProperty.call(profile, "approved"));

  const approved = profile?.is_approved ?? profile?.approved ?? true;

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return demoMaterials;

    return demoMaterials.filter((item) =>
      `${item.subject} ${item.title} ${item.type}`.toLowerCase().includes(query)
    );
  }, [search]);

  async function submitAuth(event) {
    event.preventDefault();
    if (typeof handleAuth === "function") {
      await handleAuth(event);
    }
  }

  if (!session) {
    return (
      <>
        <style>{styles}</style>
        <main className="mobile-auth-shell">
          <div className="orb orb-one" />
          <div className="orb orb-two" />

          <section className="auth-card">
            <div className="brand-icon">SA</div>

            <div className="auth-title">
              <span>SCHOLARASYNC</span>
              <h1>{mode === "login" ? "Welcome back" : "Create account"}</h1>
              <p>
                {mode === "login"
                  ? "Sign in to continue to your classroom."
                  : "Create your account to join ScholarAsync."}
              </p>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => setAuthMode?.("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={mode === "signup" ? "active" : ""}
                onClick={() => setAuthMode?.("signup")}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={submitAuth} className="auth-form">
              <label>
                <span>Email address</span>
                <div className="input-shell">
                  <b>@</b>
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

              <label>
                <span>Password</span>
                <div className="input-shell">
                  <b>•</b>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    placeholder="Enter your password"
                    value={password || ""}
                    onChange={(event) => setPassword?.(event.target.value)}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <button className="primary-button" type="submit" disabled={Boolean(loading)}>
                {loading ? (
                  <>
                    <i className="spinner" /> Please wait
                  </>
                ) : mode === "login" ? (
                  <>Sign in <span>→</span></>
                ) : (
                  <>Create account <span>→</span></>
                )}
              </button>
            </form>

            <div className="divider"><span>or</span></div>

            <button
              type="button"
              className="google-button"
              onClick={handleGoogleLogin}
              disabled={Boolean(loading)}
            >
              <strong>G</strong>
              Continue with Google
            </button>

            <p className="switch-mode">
              {mode === "login" ? "New to ScholarAsync?" : "Already registered?"}{" "}
              <button
                type="button"
                onClick={() => setAuthMode?.(mode === "login" ? "signup" : "login")}
              >
                {mode === "login" ? "Create an account" : "Sign in"}
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
        <style>{styles}</style>
        <StatusCard
          loading
          title="Loading your workspace"
          text="ScholarAsync is getting your classroom ready."
        />
      </>
    );
  }

  if (setupRequired) {
    return (
      <>
        <style>{styles}</style>
        <StatusCard
          icon="✦"
          title="Finish account setup"
          text="Your account needs to be completed before you can enter ScholarAsync."
          buttonText="Sign out"
          onButton={signOut}
        />
      </>
    );
  }

  if (approvalKnown && !approved) {
    return (
      <>
        <style>{styles}</style>
        <StatusCard
          icon="✓"
          title="Approval pending"
          text="Your account was created successfully. A school administrator needs to approve it."
          buttonText="Sign out"
          onButton={signOut}
        />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="mobile-app">
        <header className="topbar">
          <button className="avatar" type="button" onClick={() => setPage("profile")}>
            {initials(displayName)}
          </button>
          <div className="greeting">
            <span>{greeting()}</span>
            <strong>{displayName}</strong>
          </div>
          <button className="notification" type="button" aria-label="Notifications">
            ◌
            <i />
          </button>
        </header>

        <main className="page-content">
          {page === "home" && <HomePage onNavigate={setPage} />}
          {page === "calendar" && (
            <CalendarPage selectedDay={selectedDay} setSelectedDay={setSelectedDay} />
          )}
          {page === "materials" && (
            <MaterialsPage
              materials={filteredMaterials}
              search={search}
              setSearch={setSearch}
            />
          )}
          {page === "messages" && <MessagesPage />}
          {page === "profile" && (
            <ProfilePage
              displayName={displayName}
              emailAddress={session?.user?.email || ""}
              role={role}
              profile={profile}
              signOut={signOut}
            />
          )}
        </main>

        <nav className="bottom-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? "active" : ""}
              onClick={() => {
                setPage(item.id);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <span>{item.icon}</span>
              <small>{item.label}</small>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}

function HomePage({ onNavigate }) {
  return (
    <section className="page">
      <div className="hero-card">
        <div>
          <span>YOUR DAY</span>
          <h1>Stay on top of everything.</h1>
          <p>Three assignments are coming up.</p>
        </div>
        <div className="hero-symbol">✦</div>
      </div>

      <div className="stats-grid">
        <button type="button" onClick={() => onNavigate("calendar")}>
          <span>Assignments</span>
          <strong>{demoAssignments.length}</strong>
          <small>View calendar</small>
        </button>
        <button type="button" onClick={() => onNavigate("materials")}>
          <span>Materials</span>
          <strong>{demoMaterials.length}</strong>
          <small>Open library</small>
        </button>
      </div>

      <SectionTitle title="Upcoming" action="See calendar" onAction={() => onNavigate("calendar")} />
      <div className="stack">
        {demoAssignments.map((item) => <AssignmentCard key={item.id} item={item} />)}
      </div>

      <SectionTitle title="Announcements" />
      <article className="announcement-card">
        <div>!</div>
        <section>
          <h3>Physics test moved</h3>
          <p>The test will now take place next Tuesday during the normal lesson.</p>
        </section>
      </article>
    </section>
  );
}

function CalendarPage({ selectedDay, setSelectedDay }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const calendarCells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <section className="page">
      <PageHeading eyebrow="SCHEDULE" title="Calendar" text="Select a date to view what is due." />

      <div className="calendar-card">
        <div className="calendar-header">
          <button type="button">‹</button>
          <strong>{today.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong>
          <button type="button">›</button>
        </div>

        <div className="weekdays">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day}>{day}</span>)}
        </div>

        <div className="calendar-grid">
          {calendarCells.map((day, index) =>
            day ? (
              <button
                type="button"
                key={`${day}-${index}`}
                className={selectedDay === day ? "selected" : ""}
                onClick={() => setSelectedDay(day)}
              >
                {day}
                {[today.getDate(), today.getDate() + 1, today.getDate() + 3].includes(day) && <i />}
              </button>
            ) : <span key={`blank-${index}`} />
          )}
        </div>
      </div>

      <SectionTitle title={`${selectedDay} ${today.toLocaleDateString(undefined, { month: "long" })}`} />
      <div className="stack">
        {selectedDay === today.getDate() || selectedDay === today.getDate() + 1 ? (
          demoAssignments.slice(0, 2).map((item) => <AssignmentCard key={item.id} item={item} />)
        ) : (
          <EmptyState icon="□" title="Nothing due" text="There are no assignments on this date." />
        )}
      </div>
    </section>
  );
}

function MaterialsPage({ materials, search, setSearch }) {
  return (
    <section className="page">
      <PageHeading eyebrow="LIBRARY" title="Materials" text="Notes, files and classroom resources." />

      <label className="search-box">
        <span>⌕</span>
        <input
          type="search"
          placeholder="Search materials"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      <div className="materials-grid">
        {materials.length ? materials.map((item) => (
          <button className="material-card" type="button" key={item.id}>
            <div>{item.type}</div>
            <section>
              <span>{item.subject}</span>
              <h3>{item.title}</h3>
              <p>Tap to open this classroom material.</p>
            </section>
            <strong>→</strong>
          </button>
        )) : <EmptyState icon="▤" title="No results" text="Try another search term." />}
      </div>
    </section>
  );
}

function MessagesPage() {
  return (
    <section className="page">
      <PageHeading eyebrow="INBOX" title="Messages" text="Recent classroom conversations." />

      <div className="message-list">
        {demoMessages.map((message) => (
          <button className="message-row" type="button" key={message.id}>
            <span className="message-avatar">{initials(message.sender)}</span>
            <section>
              <strong>{message.sender}</strong>
              <small>{message.text}</small>
            </section>
            <time>{message.time}</time>
          </button>
        ))}
      </div>
    </section>
  );
}

function ProfilePage({ displayName, emailAddress, role, profile, signOut }) {
  return (
    <section className="page">
      <PageHeading eyebrow="ACCOUNT" title="Profile" text="Your ScholarAsync account." />

      <div className="profile-card">
        <div>{initials(displayName)}</div>
        <section>
          <h2>{displayName}</h2>
          <p>{emailAddress}</p>
          <span>{capitalize(role)}</span>
        </section>
      </div>

      <div className="settings-card">
        <ProfileRow label="School" value={profile?.school_name || "Not set"} />
        <ProfileRow label="Class" value={profile?.class_name || profile?.classroom || "Not set"} />
        <ProfileRow label="Status" value="Active" />
      </div>

      <button className="logout-button" type="button" onClick={signOut}>Sign out</button>
    </section>
  );
}

function StatusCard({ icon, loading, title, text, buttonText, onButton }) {
  return (
    <main className="status-shell">
      <section className="status-card">
        <div className="status-icon">{loading ? <i className="spinner" /> : icon}</div>
        <h1>{title}</h1>
        <p>{text}</p>
        {buttonText && <button type="button" onClick={onButton}>{buttonText}</button>}
      </section>
    </main>
  );
}

function PageHeading({ eyebrow, title, text }) {
  return (
    <header className="page-heading">
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{text}</p>
    </header>
  );
}

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      {action && <button type="button" onClick={onAction}>{action}</button>}
    </div>
  );
}

function AssignmentCard({ item }) {
  return (
    <button className="assignment-card" type="button">
      <i />
      <section>
        <span>{item.subject}</span>
        <strong>{item.title}</strong>
        <small>Due {item.due}</small>
      </section>
      <b>→</b>
    </button>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="empty-state">
      <div>{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ProfileRow({ label, value }) {
  return <div className="profile-row"><span>{label}</span><strong>{value}</strong></div>;
}

function initials(value) {
  return String(value || "SA")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function capitalize(value) {
  const text = String(value || "student");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = `
  :root { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body, #root { min-height: 100%; margin: 0; }
  button, input { font: inherit; }
  button { -webkit-tap-highlight-color: transparent; }

  .mobile-auth-shell, .status-shell {
    min-height: 100svh; display: grid; place-items: center; position: relative; overflow: hidden;
    padding: max(24px, env(safe-area-inset-top)) 18px max(24px, env(safe-area-inset-bottom));
    color: #f8fafc; background: radial-gradient(circle at top, rgba(112,76,255,.18), transparent 40%), linear-gradient(155deg,#070913,#0b1020 50%,#090b16);
  }
  .orb { position: absolute; border-radius: 999px; filter: blur(70px); opacity: .45; animation: float 8s ease-in-out infinite; }
  .orb-one { width: 260px; height: 260px; left: -100px; top: -100px; background: #7546ff; }
  .orb-two { width: 250px; height: 250px; right: -110px; bottom: -70px; background: #2368ff; animation-delay: -3s; }
  @keyframes float { 50% { transform: translateY(-18px) scale(1.08); } }

  .auth-card, .status-card {
    width: min(100%,430px); position: relative; z-index: 2; padding: 28px 22px 24px; border: 1px solid rgba(255,255,255,.10);
    border-radius: 30px; background: rgba(13,18,34,.84); box-shadow: 0 28px 90px rgba(0,0,0,.48); backdrop-filter: blur(24px);
  }
  .brand-icon, .status-icon { width: 66px; height: 66px; display: grid; place-items: center; margin: 0 auto 18px; border-radius: 21px; color: white; background: linear-gradient(145deg,#8a5cff,#4a49ea); box-shadow: 0 16px 32px rgba(102,74,255,.3); font-weight: 900; }
  .auth-title { text-align: center; }
  .auth-title > span, .page-heading > span { color: #9789ff; font-size: 11px; font-weight: 900; letter-spacing: .18em; }
  .auth-title h1, .status-card h1 { margin: 7px 0 0; font-size: clamp(30px,9vw,40px); line-height: 1; letter-spacing: -.055em; }
  .auth-title p, .status-card p { margin: 13px auto 0; max-width: 310px; color: #9da7bc; font-size: 14px; line-height: 1.55; }
  .auth-tabs { display: grid; grid-template-columns: 1fr 1fr; margin: 25px 0 20px; padding: 4px; border: 1px solid rgba(255,255,255,.07); border-radius: 15px; background: rgba(255,255,255,.035); }
  .auth-tabs button { min-height: 42px; border: 0; border-radius: 11px; color: #7f899c; background: transparent; font-size: 13px; font-weight: 800; }
  .auth-tabs button.active { color: white; background: rgba(255,255,255,.09); }
  .auth-form { display: grid; gap: 15px; }
  .auth-form label { display: grid; gap: 8px; }
  .auth-form label > span { color: #cfd5e3; font-size: 12px; font-weight: 750; }
  .input-shell { position: relative; display: flex; align-items: center; }
  .input-shell > b { position: absolute; left: 16px; z-index: 1; color: #8c96aa; }
  .input-shell input { width: 100%; height: 54px; padding: 0 62px 0 45px; border: 1px solid rgba(255,255,255,.075); border-radius: 15px; outline: 0; color: #f8fafc; background: rgba(255,255,255,.045); }
  .input-shell input:focus { border-color: rgba(139,102,255,.78); box-shadow: 0 0 0 4px rgba(116,82,255,.11); }
  .password-toggle { position: absolute; right: 9px; height: 36px; padding: 0 9px; border: 0; color: #aaa2ff; background: transparent; font-size: 11px; font-weight: 850; }
  .primary-button, .google-button, .logout-button, .status-card > button { min-height: 53px; border-radius: 15px; font-weight: 850; }
  .primary-button { display: flex; align-items: center; justify-content: center; gap: 9px; border: 1px solid rgba(255,255,255,.16); color: white; background: linear-gradient(135deg,#8959ff,#5d5ce9); }
  .primary-button:disabled, .google-button:disabled { opacity: .58; }
  .spinner { width: 19px; height: 19px; display: inline-block; border: 2px solid rgba(255,255,255,.25); border-top-color: white; border-radius: 50%; animation: spin .75s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; color: #626c80; font-size: 11px; font-weight: 800; text-transform: uppercase; }
  .divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: rgba(255,255,255,.07); }
  .google-button { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; border: 1px solid rgba(255,255,255,.09); color: #e7eaf0; background: rgba(255,255,255,.055); }
  .google-button strong { width: 25px; height: 25px; display: grid; place-items: center; border-radius: 8px; color: #222; background: white; font-size: 13px; }
  .switch-mode { margin: 18px 0 0; color: #7f899c; text-align: center; font-size: 13px; }
  .switch-mode button { border: 0; padding: 0; color: #aaa1ff; background: transparent; font-weight: 850; }

  .status-card { text-align: center; }
  .status-card > button { width: 100%; margin-top: 22px; border: 1px solid rgba(255,255,255,.09); color: white; background: rgba(255,255,255,.06); }

  .mobile-app { min-height: 100svh; color: #eff2f8; background: radial-gradient(circle at 50% -10%,rgba(93,66,209,.18),transparent 32%),#090c15; }
  .topbar { position: sticky; top: 0; z-index: 20; min-height: 82px; display: flex; align-items: center; gap: 12px; padding: max(14px,env(safe-area-inset-top)) 18px 12px; border-bottom: 1px solid rgba(255,255,255,.055); background: rgba(9,12,21,.84); backdrop-filter: blur(22px); }
  .avatar, .message-avatar { display: grid; place-items: center; border: 1px solid rgba(255,255,255,.12); color: white; background: linear-gradient(145deg,#8055f3,#4c55d7); font-weight: 900; }
  .avatar { width: 44px; height: 44px; border-radius: 15px; }
  .greeting { min-width: 0; display: grid; flex: 1; }
  .greeting span { color: #717b8f; font-size: 11px; }
  .greeting strong { overflow: hidden; font-size: 17px; text-overflow: ellipsis; white-space: nowrap; }
  .notification { position: relative; width: 43px; height: 43px; border: 1px solid rgba(255,255,255,.075); border-radius: 14px; color: #d8dce7; background: rgba(255,255,255,.04); font-size: 22px; }
  .notification i { position: absolute; top: 9px; right: 9px; width: 7px; height: 7px; border: 2px solid #0b0e18; border-radius: 50%; background: #a66cff; }
  .page-content { width: min(100%,760px); min-height: calc(100svh - 82px); margin: 0 auto; padding: 18px 16px calc(112px + env(safe-area-inset-bottom)); }
  .page { animation: pagein .25s ease both; }
  @keyframes pagein { from { opacity: 0; transform: translateY(7px); } }
  .page-heading { padding: 4px 2px 20px; }
  .page-heading h1 { margin: 7px 0 7px; font-size: 34px; line-height: 1; letter-spacing: -.055em; }
  .page-heading p { margin: 0; color: #737d90; font-size: 13px; }
  .hero-card { min-height: 185px; display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding: 23px; border: 1px solid rgba(255,255,255,.10); border-radius: 27px; background: linear-gradient(145deg,rgba(126,82,243,.94),rgba(68,69,193,.94)); box-shadow: 0 24px 55px rgba(51,40,133,.24); }
  .hero-card > div > span { color: rgba(255,255,255,.68); font-size: 10px; font-weight: 900; letter-spacing: .18em; }
  .hero-card h1 { max-width: 255px; margin: 8px 0 10px; font-size: clamp(26px,8vw,36px); line-height: 1.03; letter-spacing: -.05em; }
  .hero-card p { margin: 0; color: rgba(255,255,255,.72); font-size: 13px; }
  .hero-symbol { width: 72px; height: 72px; display: grid; place-items: center; border: 1px solid rgba(255,255,255,.13); border-radius: 24px; background: rgba(255,255,255,.09); font-size: 35px; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 13px; }
  .stats-grid button { min-height: 128px; display: grid; gap: 4px; padding: 16px; border: 1px solid rgba(255,255,255,.07); border-radius: 22px; color: inherit; text-align: left; background: rgba(255,255,255,.035); }
  .stats-grid span { color: #8f98ab; font-size: 12px; }
  .stats-grid strong { font-size: 32px; letter-spacing: -.05em; }
  .stats-grid small { color: #8074dc; font-size: 11px; font-weight: 800; }
  .section-title { min-height: 60px; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding: 22px 3px 10px; }
  .section-title h2 { margin: 0; font-size: 18px; letter-spacing: -.035em; }
  .section-title button { border: 0; padding: 5px 0; color: #8f83ed; background: transparent; font-size: 11px; font-weight: 850; }
  .stack, .materials-grid { display: grid; gap: 10px; }
  .assignment-card, .announcement-card, .material-card, .message-row { border: 1px solid rgba(255,255,255,.07); color: inherit; background: rgba(255,255,255,.035); }
  .assignment-card { width: 100%; min-height: 92px; display: flex; align-items: center; gap: 14px; padding: 14px 15px 14px 20px; border-radius: 20px; text-align: left; }
  .assignment-card > i { width: 4px; align-self: stretch; border-radius: 4px; background: linear-gradient(#9a6bff,#575fe2); }
  .assignment-card section { min-width: 0; display: grid; flex: 1; gap: 3px; }
  .assignment-card section span { color: #8f83ed; font-size: 10px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
  .assignment-card section strong { overflow: hidden; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
  .assignment-card section small { color: #717b8f; font-size: 11px; }
  .assignment-card > b { color: #747e91; }
  .announcement-card { display: flex; gap: 13px; padding: 16px; border-radius: 20px; }
  .announcement-card > div { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; color: #b7aeff; background: rgba(126,91,234,.13); font-weight: 950; }
  .announcement-card h3 { margin: 1px 0 5px; font-size: 14px; }
  .announcement-card p { margin: 0; color: #737d90; font-size: 12px; line-height: 1.45; }
  .calendar-card { padding: 15px; border: 1px solid rgba(255,255,255,.07); border-radius: 24px; background: rgba(255,255,255,.035); }
  .calendar-header { display: grid; grid-template-columns: 42px 1fr 42px; align-items: center; margin-bottom: 14px; }
  .calendar-header strong { text-align: center; font-size: 14px; }
  .calendar-header button { width: 38px; height: 38px; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; color: #d9ddea; background: rgba(255,255,255,.035); font-size: 24px; }
  .weekdays, .calendar-grid { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; }
  .weekdays span { padding: 5px 0; color: #5f687b; text-align: center; font-size: 9px; font-weight: 900; }
  .calendar-grid button { position: relative; aspect-ratio: 1; border: 0; border-radius: 13px; color: #c8ceda; background: transparent; font-size: 12px; }
  .calendar-grid button.selected { color: white; background: linear-gradient(145deg,#8559f4,#5457da); }
  .calendar-grid button i { position: absolute; bottom: 5px; left: calc(50% - 2px); width: 4px; height: 4px; border-radius: 50%; background: #a991ff; }
  .search-box { display: flex; align-items: center; margin-bottom: 16px; }
  .search-box span { position: absolute; z-index: 1; margin-left: 16px; color: #727c8f; font-size: 20px; }
  .search-box input { width: 100%; height: 53px; padding: 0 17px 0 46px; border: 1px solid rgba(255,255,255,.075); border-radius: 16px; outline: 0; color: #f8fafc; background: rgba(255,255,255,.045); }
  .material-card { width: 100%; display: grid; grid-template-columns: 50px 1fr 22px; align-items: center; gap: 13px; padding: 14px; border-radius: 20px; text-align: left; }
  .material-card > div { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 15px; color: #b6adff; background: rgba(128,89,239,.12); font-size: 11px; font-weight: 950; }
  .material-card section { min-width: 0; }
  .material-card section span { color: #7e73d8; font-size: 9px; font-weight: 900; letter-spacing: .07em; }
  .material-card h3 { overflow: hidden; margin: 3px 0; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
  .material-card p { overflow: hidden; margin: 0; color: #6e788a; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .message-list { overflow: hidden; border: 1px solid rgba(255,255,255,.065); border-radius: 23px; background: rgba(255,255,255,.025); }
  .message-row { width: 100%; min-height: 76px; display: flex; align-items: center; gap: 12px; padding: 13px 14px; border-width: 0 0 1px; text-align: left; background: transparent; }
  .message-avatar { width: 44px; height: 44px; border-radius: 14px; font-size: 12px; }
  .message-row section { min-width: 0; display: grid; flex: 1; gap: 4px; }
  .message-row section strong { font-size: 13px; }
  .message-row section small { overflow: hidden; color: #707a8d; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .message-row time { color: #5e6879; font-size: 9px; }
  .profile-card { display: flex; align-items: center; gap: 16px; padding: 20px; border: 1px solid rgba(255,255,255,.07); border-radius: 24px; background: linear-gradient(145deg,rgba(119,83,224,.14),rgba(255,255,255,.03)); }
  .profile-card > div { width: 68px; height: 68px; display: grid; place-items: center; border-radius: 22px; color: white; background: linear-gradient(145deg,#8459ee,#4b55d1); font-size: 20px; font-weight: 950; }
  .profile-card h2 { margin: 0 0 4px; font-size: 20px; }
  .profile-card p { margin: 0 0 8px; color: #788296; font-size: 11px; }
  .profile-card section span { display: inline-flex; padding: 5px 9px; border-radius: 999px; color: #b7aeff; background: rgba(131,95,237,.12); font-size: 9px; font-weight: 900; }
  .settings-card { overflow: hidden; margin-top: 14px; border: 1px solid rgba(255,255,255,.065); border-radius: 22px; background: rgba(255,255,255,.03); }
  .profile-row { min-height: 61px; display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 0 16px; border-bottom: 1px solid rgba(255,255,255,.055); }
  .profile-row span { color: #737d90; font-size: 12px; }
  .profile-row strong { overflow: hidden; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
  .logout-button { width: 100%; margin-top: 15px; border: 1px solid rgba(255,91,115,.15); color: #ff9bac; background: rgba(255,70,98,.07); }
  .empty-state { display: grid; place-items: center; padding: 34px 18px; border: 1px dashed rgba(255,255,255,.10); border-radius: 22px; text-align: center; background: rgba(255,255,255,.02); }
  .empty-state > div { width: 47px; height: 47px; display: grid; place-items: center; border-radius: 15px; color: #a499ff; background: rgba(133,98,243,.10); }
  .empty-state h3 { margin: 12px 0 5px; font-size: 14px; }
  .empty-state p { margin: 0; color: #6f788b; font-size: 12px; }
  .bottom-nav { position: fixed; z-index: 50; right: 12px; bottom: max(10px,env(safe-area-inset-bottom)); left: 12px; min-height: 70px; display: grid; grid-template-columns: repeat(5,1fr); padding: 6px; border: 1px solid rgba(255,255,255,.09); border-radius: 23px; background: rgba(16,20,32,.92); box-shadow: 0 19px 55px rgba(0,0,0,.43); backdrop-filter: blur(24px); }
  .bottom-nav button { min-width: 0; display: grid; place-items: center; gap: 3px; border: 0; border-radius: 17px; color: #5f687b; background: transparent; }
  .bottom-nav button.active { color: #b2a9ff; background: rgba(128,91,234,.12); }
  .bottom-nav button span { font-size: 20px; line-height: 1; }
  .bottom-nav button small { font-size: 9px; font-weight: 800; }
  @media (min-width:620px) { .bottom-nav { width: min(560px,calc(100% - 24px)); right: auto; left: 50%; transform: translateX(-50%); } .page-content { padding-left: 22px; padding-right: 22px; } }
  @media (max-width:360px) { .auth-card { padding-left: 18px; padding-right: 18px; } .hero-symbol { width: 58px; height: 58px; font-size: 28px; } .bottom-nav { left: 7px; right: 7px; } }
`;
