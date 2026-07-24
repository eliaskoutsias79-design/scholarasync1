import { lazy, Suspense } from "react";

const Admin = lazy(() => import("./pages/Admin"));
const Announcements = lazy(() => import("./pages/Announcements"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Grades = lazy(() => import("./pages/Grades"));
const Materials = lazy(() => import("./pages/Materials"));
const Messages = lazy(() => import("./pages/Messages"));
const Profile = lazy(() => import("./pages/Profile"));
const StudyGroups = lazy(() => import("./studygroups/StudyGroups"));

export const resolveAccessibleView = (view, isAdmin) =>
  view === "admin" && !isAdmin ? "calendar" : view;

export default function AppRoutes({ app }) {
  const view = resolveAccessibleView(app.view, app.isAdmin);
  let page;

  switch (view) {
    case "profile":
      page = (
        <Profile
          profile={app.profile}
          session={app.session}
          profileDraft={app.profileDraft}
          setProfileDraft={app.setProfileDraft}
          savingProfile={app.savingProfile}
          onSave={app.handleSaveProfile}
          showError={app.showError}
          language={app.language}
          setLanguage={app.setLanguage}
        />
      );
      break;
    case "admin":
      page = (
        <Admin
          fetchProfile={() => app.fetchProfile(app.session?.user)}
          showError={app.showError}
        />
      );
      break;
    case "materials":
      page = (
        <Materials
          materials={app.materials}
          profile={app.profile}
          isAdmin={app.isAdmin}
          setShowMaterialModal={app.setShowMaterialModal}
          onDelete={app.removeMaterial}
        />
      );
      break;
    case "announcements":
      page = (
        <Announcements
          announcements={app.announcements}
          profile={app.profile}
          isAdmin={app.isAdmin}
          setShowAnnouncementModal={app.setShowAnnouncementModal}
          setAnnSelectedClasses={app.setAnnSelectedClasses}
          setNewAnn={app.setNewAnn}
          onDelete={app.removeAnnouncement}
        />
      );
      break;
    case "messages":
      page = (
        <Messages
          profile={app.profile}
          session={app.session}
          isAdmin={app.isAdmin}
          showError={app.showError}
        />
      );
      break;
    case "studyGroups":
      page = (
        <StudyGroups session={app.session} showError={app.showError} />
      );
      break;
    case "grades":
      page = <Grades profile={app.profile} isAdmin={app.isAdmin} />;
      break;
    case "calendar":
    default:
      page = (
        <Calendar
          language={app.language}
          events={app.events}
          profile={app.profile}
          isAdmin={app.isAdmin}
          setSelectedDate={app.setSelectedDate}
          setSelectedClasses={app.setSelectedClasses}
          setNewHW={app.setNewHW}
          setShowAddModal={app.setShowAddModal}
          setSelectedEvent={app.setSelectedEvent}
          setShowViewModal={app.setShowViewModal}
        />
      );
      break;
  }

  return (
    <Suspense
      fallback={
        <div className="route-loading" role="status" aria-live="polite">
          Loading workspace…
        </div>
      }
    >
      {page}
    </Suspense>
  );
}
