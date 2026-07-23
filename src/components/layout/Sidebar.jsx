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

export default function Sidebar({
  view,
  setView,
  profile,
  isAdmin,
  avatarUrl,
}) {
  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  return (
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

      <nav>
        {navigationItems.map((item) => (
          <button
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
            className={view === "admin" ? "active" : ""}
            onClick={() => setView("admin")}
          >
            <span className="icon-span">🛡️</span>
            <span className="desktop-only">Admin</span>
          </button>
        )}
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
        <button className="logout-lite" onClick={handleLogout}>
          <span>↗</span><span className="desktop-only">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
