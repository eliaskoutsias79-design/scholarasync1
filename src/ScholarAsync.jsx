import AppRoutes from "./AppRoutes";
import ErrorToast from "./components/ErrorToast";
import DashboardLayout from "./components/layout/DashboardLayout";
import WorkspaceModals from "./components/modals/WorkspaceModals";
import { ADMIN_EMAIL } from "./constants/app";
import useScholarAsyncApp from "./hooks/useScholarAsyncApp";
import ApprovalPending from "./pages/auth/ApprovalPending";
import GoogleOnboarding from "./pages/auth/GoogleOnboarding";
import LoadingScreen from "./pages/auth/LoadingScreen";
import LoginPage from "./pages/auth/LoginPage";

export default function ScholarAsync() {
  const app = useScholarAsyncApp();

  if (!app.isReady || app.loading) {
    return <LoadingScreen />;
  }

  if (!app.session) {
    return (
      <LoginPage
        authMode={app.authMode}
        setAuthMode={app.setAuthMode}
        authData={app.authData}
        setAuthData={app.setAuthData}
        onAuth={app.handleAuth}
        onGoogleLogin={app.handleGoogleLogin}
      />
    );
  }

  if (app.profile?.role === "SETUP_REQUIRED") {
    return (
      <GoogleOnboarding
        profile={app.profile}
        session={app.session}
        googleAvatar={app.googleAvatar}
        firstName={app.firstName}
        authData={app.authData}
        setAuthData={app.setAuthData}
        classSearch={app.classSearch}
        setClassSearch={app.setClassSearch}
        filteredAvailableClasses={app.filteredAvailableClasses}
        onComplete={app.handlePostGoogleOnboarding}
      />
    );
  }

  if (
    app.profile &&
    !app.profile.is_approved &&
    app.session?.user?.email !== ADMIN_EMAIL
  ) {
    return <ApprovalPending />;
  }

  return (
    <DashboardLayout
      view={app.view}
      setView={app.setView}
      profile={app.profile}
      isAdmin={app.isAdmin}
      avatarUrl={app.googleAvatar}
      firstName={app.firstName}
      activePage={app.activePage}
      overlays={
        <>
          <WorkspaceModals app={app} />
          {app.errorMsg && (
            <ErrorToast
              message={app.errorMsg}
              onClose={() => app.setErrorMsg(null)}
            />
          )}
        </>
      }
    >
      <AppRoutes app={app} />
    </DashboardLayout>
  );
}
