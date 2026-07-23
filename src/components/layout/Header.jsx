import NotificationToggle from "../NotificationToggle";

export default function Header({
  activePage,
  profile,
  isAdmin,
  avatarUrl,
  firstName,
}) {
  return (
    <header className="dashboard-topbar">
      <div className="page-heading">
        <span className="page-eyebrow">{activePage.eyebrow}</span>
        <div className="page-title-row">
          <span className="page-title-icon">{activePage.icon}</span>
          <div>
            <h1>{activePage.title}</h1>
            <p>{activePage.description}</p>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        <NotificationToggle userId={profile?.id} />
        <div className="today-pill">
          <span>Today</span>
          <strong>
            {new Date().toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </strong>
        </div>
        <div className="topbar-profile">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span>{(profile?.full_name || "S").charAt(0).toUpperCase()}</span>
          )}
          <div>
            <strong>{firstName}</strong>
            <small>{isAdmin ? "Administrator" : profile?.role}</small>
          </div>
        </div>
      </div>
    </header>
  );
}
