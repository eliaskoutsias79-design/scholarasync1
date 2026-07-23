import Admin from "./pages/Admin";
import Announcements from "./pages/Announcements";
import Calendar from "./pages/Calendar";
import Grades from "./pages/Grades";
import Materials from "./pages/Materials";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import StudyGroups from "./studygroups/StudyGroups";

export default function AppRoutes({ app }) {
  switch (app.view) {
    case "profile":
      return (
        <Profile
          profile={app.profile}
          session={app.session}
          profileDraft={app.profileDraft}
          setProfileDraft={app.setProfileDraft}
          savingProfile={app.savingProfile}
          onSave={app.handleSaveProfile}
          avatarUrl={app.googleAvatar}
          showError={app.showError}
          language={app.language}
          setLanguage={app.setLanguage}
        />
      );
    case "admin":
      return (
        <Admin
          fetchProfile={() => app.fetchProfile(app.session?.user)}
        />
      );
    case "materials":
      return (
        <Materials
          materials={app.materials}
          profile={app.profile}
          isAdmin={app.isAdmin}
          setShowMaterialModal={app.setShowMaterialModal}
          onDelete={app.removeMaterial}
        />
      );
    case "announcements":
      return (
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
    case "messages":
      return (
        <Messages
          profile={app.profile}
          session={app.session}
          isAdmin={app.isAdmin}
          showError={app.showError}
        />
      );
    case "studyGroups":
      return (
        <StudyGroups session={app.session} showError={app.showError} />
      );
    case "grades":
      return <Grades profile={app.profile} isAdmin={app.isAdmin} />;
    case "calendar":
    default:
      return (
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
  }
}
