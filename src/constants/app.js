export const ADMIN_EMAIL = "eliaskoutsias79@gmail.com";

export const AVAILABLE_CLASSES = [
  "Junior High A1", "Junior High A2", "Junior High A3", "Junior High A4", "Junior High A5",
  "Junior High B1", "Junior High B2", "Junior High B3", "Junior High B4", "Junior High B5",
  "Junior High C1", "Junior High C2", "Junior High C3", "Junior High C4", "Junior High C5",
  "High School A1", "High School A2", "High School A3", "High School A4", "High School A5",
  "High School B1", "High School B2", "High School B3", "High School B4", "High School B5",
  "High School C1", "High School C2", "High School C3", "High School C4", "High School C5",
];

export const PAGE_META = {
  calendar: {
    eyebrow: "Workspace",
    title: "Calendar",
    icon: "📅",
  },
  materials: {
    eyebrow: "Resources",
    title: "Study Materials",
    description: "Keep notes, links and learning resources organized by class.",
    icon: "📚",
  },
  announcements: {
    eyebrow: "Updates",
    title: "Announcements",
    description: "Share important classroom news without losing it in chat.",
    icon: "📣",
  },
  messages: {
    eyebrow: "Communication",
    title: "Messages",
    description: "Class conversations and direct communication in one place.",
    icon: "💬",
  },
  studyGroups: {
    eyebrow: "Collaboration",
    title: "Study Groups",
    description: "Collaborate with classmates in focused study spaces.",
    icon: "🧠",
  },
  grades: {
    eyebrow: "Progress",
    title: "Academic Records",
    description: "Review results, feedback and student progress.",
    icon: "📊",
  },
  admin: {
    eyebrow: "Administration",
    title: "User Management",
    description: "Review registration requests and control access.",
    icon: "🛡️",
  },
  profile: {
    eyebrow: "Account",
    title: "Profile",
    description: "Personalize how your account appears across ScholarAsync.",
    icon: "👤",
  },
};

export const INITIAL_AUTH_DATA = {
  email: "",
  password: "",
  fullName: "",
  role: "student",
  userClass: "Junior High A1",
  teacherClasses: "",
  teacherSubjects: "",
};

export const INITIAL_PROFILE_DRAFT = {
  fullName: "",
  avatarUrl: "",
  bio: "",
};
