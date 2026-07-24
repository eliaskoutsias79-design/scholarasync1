import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { signOut } from "../../services/authService";

const navigationItems = [
  { id: "calendar", icon: "📅", label: "Calendar" },
  { id: "materials", icon: "📚", label: "Materials" },
  { id: "announcements", icon: "📣", label: "Announcements" },
  { id: "messages", icon: "💬", label: "Messages" },
  { id: "studyGroups", icon: "🧠", label: "Study Groups" },
  { id: "grades", icon: "📊", label: "Grades" },
  { id: "profile", icon: "👤", label: "Profile" },
];

const mobilePrimaryIds = new Set([
  "calendar",
  "materials",
  "announcements",
  "messages",
  "studyGroups",
]);

const mobilePrimaryItems = navigationItems.filter((item) =>
  mobilePrimaryIds.has(item.id),
);

const mobileMoreItems = navigationItems.filter(
  (item) => !mobilePrimaryIds.has(item.id),
);

export default function Sidebar({
  view,
  setView,
  profile,
  isAdmin,
  avatarUrl,
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isMoreActive =
    mobileMoreItems.some((item) => item.id === view) ||
    (isAdmin && view === "admin");

  useEffect(() => {
    if (!isMoreOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMoreOpen(false);
    };

    document.body.classList.add("mobile-nav-sheet-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("mobile-nav-sheet-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMoreOpen]);

  const handleNavigation = (nextView) => {
    setView(nextView);
    setIsMoreOpen(false);
  };

  const handleLogout = async () => {
    setIsMoreOpen(false);
    await signOut();
    window.location.reload();
  };

  const mobileSheet = isMoreOpen
    ? createPortal(
        <div
          className="mobile-more-backdrop mobile-only"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsMoreOpen(false);
          }}
        >
          <section
            className="mobile-more-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-more-title"
          >
            <div className="mobile-more-handle" aria-hidden="true" />
            <div className="mobile-more-header">
              <div>
                <small>Navigation</small>
                <h2 id="mobile-more-title">More</h2>
              </div>
              <button
                type="button"
                className="mobile-more-close"
                aria-label="Close more menu"
                onClick={() => setIsMoreOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="mobile-more-grid">
              {mobileMoreItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={view === item.id ? "active" : ""}
                  onClick={() => handleNavigation(item.id)}
                >
                  <span className="mobile-more-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}

              {isAdmin && (
                <button
                  type="button"
                  className={view === "admin" ? "active" : ""}
                  onClick={() => handleNavigation("admin")}
                >
                  <span className="mobile-more-icon">🛡️</span>
                  <span>Admin</span>
                </button>
              )}

              <button
                type="button"
                className="mobile-more-signout"
                onClick={handleLogout}
              >
                <span className="mobile-more-icon">↗</span>
                <span>Sign out</span>
              </button>
            </div>
          </section>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">S</div>
          <div className="brand-copy">
            <div className="text-logo-sidebar">
              Scholar<span>Async</span>
            </div>
            <small>Classroom workspace</small>
          </div>
        </div>

        <nav className="desktop-navigation">
          {navigationItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => setView(item.id)}
            >
              <span className="icon-span">{item.icon}</span>
              <span className="desktop-only">{item.label}</span>
            </button>
          ))}
          {isAdmin && (
            <button
              type="button"
              className={view === "admin" ? "active" : ""}
              onClick={() => setView("admin")}
            >
              <span className="icon-span">🛡️</span>
              <span className="desktop-only">Admin</span>
            </button>
          )}
        </nav>

        <nav className="mobile-navigation mobile-only" aria-label="Mobile">
          {mobilePrimaryItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => handleNavigation(item.id)}
            >
              <span className="icon-span">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            className={isMoreOpen || isMoreActive ? "active" : ""}
            aria-haspopup="dialog"
            aria-expanded={isMoreOpen}
            onClick={() => setIsMoreOpen((open) => !open)}
          >
            <span className="icon-span">•••</span>
            <span>More</span>
          </button>
        </nav>

        <div className="user-tag">
          <div className="sidebar-profile desktop-only">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
              <div className="sidebar-avatar-fallback">
                {(profile?.full_name || "S").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="sidebar-profile-copy">
              <strong>{profile?.full_name || "Faculty"}</strong>
              <span>
                {profile?.role || "member"}
                {profile?.user_class ? ` · ${profile.user_class}` : ""}
              </span>
            </div>
          </div>
          <button type="button" className="logout-lite" onClick={handleLogout}>
            <span>↗</span>
            <span className="desktop-only">Sign out</span>
          </button>
        </div>
      </aside>
      {mobileSheet}
    </>
  );
}
