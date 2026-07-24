import Header from "./Header";
import Sidebar from "./Sidebar";
import WorkspacePolish from "./WorkspacePolish";

export default function DashboardLayout({
  children,
  view,
  setView,
  profile,
  isAdmin,
  avatarUrl,
  firstName,
  activePage,
  overlays,
}) {
  return (
    <div className="dashboard-layout">
      <WorkspacePolish />
      <Sidebar
        view={view}
        setView={setView}
        profile={profile}
        isAdmin={isAdmin}
        avatarUrl={avatarUrl}
      />
      <main className="main-content">
        <Header
          activePage={activePage}
          profile={profile}
          isAdmin={isAdmin}
          avatarUrl={avatarUrl}
          firstName={firstName}
        />
        <section className="page-surface">{children}</section>
      </main>
      {overlays}
    </div>
  );
}
