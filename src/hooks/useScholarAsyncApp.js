import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  ADMIN_EMAIL,
  AVAILABLE_CLASSES,
  INITIAL_AUTH_DATA,
  INITIAL_PROFILE_DRAFT,
  PAGE_META,
} from "../constants/app";
import { useLanguage } from "../contexts/LanguageContext";
import {
  createAnnouncement,
  createAssignments,
  createMaterial,
  deleteAnnouncement,
  deleteAssignment,
  deleteMaterial,
  getAnnouncements,
  getAssignments,
  getMaterials,
} from "../services/classroomService";
import {
  getCurrentSession,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "../services/authService";
import {
  getProfile,
  updateProfile,
  upsertProfile,
} from "../services/profileService";
import { formatClassName, parseCommaList } from "../utils/classes";

const eventFromAssignment = (assignment) => ({
  id: assignment.id,
  title: `[${assignment.subject}] ${assignment.title}`,
  start: assignment.due_date,
  extendedProps: {
    subject: assignment.subject,
    rawTitle: assignment.title,
    className: assignment.class_name,
  },
  color: assignment.subject === "Math" ? "#6366f1" : "#10b981",
});

const initialView = () => {
  const requested = new URLSearchParams(window.location.search).get("view");
  const aliases = { "study-groups": "studyGroups" };
  const view = aliases[requested] || requested;
  return PAGE_META[view] ? view : "calendar";
};

export default function useScholarAsyncApp() {
  const { language, setLanguage, t } = useLanguage();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [events, setEvents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [view, setView] = useState(initialView);
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState(INITIAL_AUTH_DATA);
  const [classSearch, setClassSearch] = useState("");
  const [profileDraft, setProfileDraft] = useState(INITIAL_PROFILE_DRAFT);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newHW, setNewHW] = useState({ title: "", subject: "", className: "" });
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [newMat, setNewMat] = useState({
    title: "",
    link: "",
    subject: "",
    className: "",
  });
  const [newAnn, setNewAnn] = useState({
    title: "",
    content: "",
    className: "",
  });
  const [annSelectedClasses, setAnnSelectedClasses] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const errorTimerRef = useRef(null);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;
  const googleAvatar =
    profile?.avatar_url ||
    session?.user?.user_metadata?.avatar_url ||
    session?.user?.user_metadata?.picture ||
    "";
  const firstName = (
    profile?.full_name ||
    session?.user?.user_metadata?.full_name ||
    "there"
  ).split(" ")[0];

  const showError = useCallback(
    (message) => {
      setErrorMsg(t(message));
      window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = window.setTimeout(() => setErrorMsg(null), 4000);
    },
    [t]
  );

  useEffect(
    () => () => window.clearTimeout(errorTimerRef.current),
    []
  );

  const fetchEvents = useCallback(
    async (currentProfile, userId, userEmail) => {
      if (!currentProfile || currentProfile.role === "SETUP_REQUIRED") return;
      const { data, error } = await getAssignments(
        currentProfile,
        userId,
        userEmail
      );
      if (error) {
        showError("Failed to load assignments. Please refresh.");
        return;
      }
      setEvents((data || []).map(eventFromAssignment));
    },
    [showError]
  );

  const fetchMaterials = useCallback(
    async (currentProfile) => {
      if (!currentProfile || currentProfile.role === "SETUP_REQUIRED") return;
      const { data, error } = await getMaterials(currentProfile);
      if (error) {
        showError("Failed to load materials. Please refresh.");
        return;
      }
      setMaterials(data || []);
    },
    [showError]
  );

  const fetchAnnouncements = useCallback(
    async (currentProfile) => {
      if (!currentProfile || currentProfile.role === "SETUP_REQUIRED") return;
      const { data, error } = await getAnnouncements(currentProfile);
      if (error) {
        showError("Failed to load announcements. Please refresh.");
        return;
      }
      setAnnouncements(data || []);
    },
    [showError]
  );

  const fetchProfile = useCallback(
    async (user) => {
      if (!user) return;

      try {
        const { data, error } = await getProfile(user.id);
        if (error) throw error;

        const metadata = user.user_metadata || {};
        const fallbackName =
          metadata.full_name ||
          metadata.fullName ||
          metadata.name ||
          user.email?.split("@")[0] ||
          "New User";

        let currentProfile;
        if (!data) {
          currentProfile = {
            id: user.id,
            email: user.email,
            full_name: fallbackName,
            role: "SETUP_REQUIRED",
            user_class: null,
            requested_classes: "",
            requested_subjects: "",
            is_approved: user.email === ADMIN_EMAIL,
          };
        } else {
          const studentSetupMissing =
            data.role === "student" &&
            (!data.user_class || data.user_class === "Not Assigned");
          const teacherSetupMissing =
            data.role === "teacher" &&
            (!data.requested_classes || !data.requested_subjects);
          const setupIsIncomplete =
            !data.role ||
            data.role === "SETUP_REQUIRED" ||
            studentSetupMissing ||
            teacherSetupMissing;

          currentProfile = setupIsIncomplete
            ? {
                ...data,
                full_name: data.full_name || fallbackName,
                role: "SETUP_REQUIRED",
                user_class: data.user_class || null,
                requested_classes: data.requested_classes || "",
                requested_subjects: data.requested_subjects || "",
              }
            : data;
        }

        setProfile(currentProfile);
        if (currentProfile.role !== "SETUP_REQUIRED") {
          await Promise.all([
            fetchEvents(currentProfile, user.id, user.email),
            fetchMaterials(currentProfile),
            fetchAnnouncements(currentProfile),
          ]);
        } else {
          setEvents([]);
          setMaterials([]);
          setAnnouncements([]);
        }
      } catch (error) {
        console.error("Profile loading issue:", error);
        showError("Could not load your profile. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    },
    [fetchAnnouncements, fetchEvents, fetchMaterials, showError]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setIsReady(true), 500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return undefined;
    let mounted = true;

    const initialize = async () => {
      try {
        const currentSession = await getCurrentSession();
        if (!mounted) return;
        setSession(currentSession);
        if (currentSession?.user) await fetchProfile(currentSession.user);
        else setLoading(false);
      } catch (error) {
        if (mounted) {
          showError("Could not initialize your session.");
          setLoading(false);
        }
      }
    };
    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        setLoading(true);
        window.setTimeout(() => fetchProfile(currentSession.user), 0);
      } else {
        setProfile(null);
        setEvents([]);
        setMaterials([]);
        setAnnouncements([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, isReady, showError]);

  useEffect(() => {
    if (!profile) return;
    setProfileDraft({
      fullName: profile.full_name || "",
      avatarUrl: profile.avatar_url || "",
      bio: profile.bio || "",
    });
  }, [profile]);

  const handleAuth = async () => {
    const {
      email,
      password,
      fullName,
      role,
      userClass,
      teacherClasses,
      teacherSubjects,
    } = authData;
    const processedClasses = parseCommaList(teacherClasses)
      .map(formatClassName)
      .join(", ");

    const { data, error } =
      authMode === "login"
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, {
            fullName,
            role,
            userClass,
            classes: processedClasses,
            subjects: teacherSubjects,
          });

    if (error) {
      window.alert(error.message);
      return;
    }

    if (authMode === "signup" && data?.user) {
      const { error: profileError } = await upsertProfile({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        user_class: role === "student" ? userClass : null,
        requested_classes: role === "teacher" ? processedClasses : null,
        requested_subjects: role === "teacher" ? teacherSubjects : null,
        is_approved: email === ADMIN_EMAIL,
      });

      if (profileError) showError("Registration failed: " + profileError.message);
      else window.alert("Registration request sent!");
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) showError("Google authentication failed: " + error.message);
  };

  const handlePostGoogleOnboarding = async () => {
    if (!profile || !session?.user) return;
    const { role, userClass, teacherClasses, teacherSubjects } = authData;
    const processedClasses = parseCommaList(teacherClasses)
      .map(formatClassName)
      .join(", ");
    const processedSubjects = parseCommaList(teacherSubjects).join(", ");

    if (role === "student" && !userClass) {
      showError("Please select your class.");
      return;
    }
    if (role === "teacher" && (!processedClasses || !processedSubjects)) {
      showError("Please enter at least one class and one subject.");
      return;
    }

    setLoading(true);
    const { error } = await upsertProfile({
      id: session.user.id,
      email: session.user.email,
      full_name: profile.full_name,
      role,
      user_class: role === "student" ? userClass : null,
      requested_classes: role === "teacher" ? processedClasses : null,
      requested_subjects: role === "teacher" ? processedSubjects : null,
      is_approved: session.user.email === ADMIN_EMAIL,
    });

    if (error) {
      showError("Registration failed: " + error.message);
      setLoading(false);
      return;
    }
    await fetchProfile(session.user);
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id || !profile) return;
    const cleanName = profileDraft.fullName.trim();
    const cleanAvatar = profileDraft.avatarUrl.trim();
    const cleanBio = profileDraft.bio.trim();

    if (!cleanName) {
      showError("Your display name cannot be empty.");
      return;
    }
    if (cleanAvatar && !/^https?:\/\//i.test(cleanAvatar)) {
      showError("Profile picture must be a valid http or https image URL.");
      return;
    }

    setSavingProfile(true);
    const { data, error } = await updateProfile(session.user.id, {
      full_name: cleanName,
      avatar_url: cleanAvatar || null,
      bio: cleanBio || null,
    });
    if (error) showError("Could not save profile: " + error.message);
    else setProfile(data);
    setSavingProfile(false);
  };

  const handlePostHomework = async () => {
    const targetClasses = isAdmin ? selectedClasses : [newHW.className];
    if (
      targetClasses.filter(Boolean).length === 0 ||
      !newHW.subject ||
      !newHW.title
    ) {
      window.alert(
        isAdmin
          ? "Fill all fields and select at least one class!"
          : "Fill all fields!"
      );
      return;
    }

    const inserts = targetClasses.map((className) => ({
      title: newHW.title,
      subject: newHW.subject,
      class_name: className,
      due_date: selectedDate,
      teacher_id: session?.user?.id,
    }));
    const { error } = await createAssignments(inserts);
    if (error) {
      showError("Failed to post homework. Please try again.");
      return;
    }

    setShowAddModal(false);
    setSelectedClasses([]);
    setNewHW({ title: "", subject: "", className: "" });
    await fetchProfile(session?.user);
  };

  const handlePostAnnouncement = async () => {
    if (!newAnn.title || !newAnn.content) {
      window.alert("Fill in the title and content!");
      return;
    }

    const targetClasses = isAdmin ? annSelectedClasses : [newAnn.className];
    if (targetClasses.filter(Boolean).length === 0) {
      window.alert(isAdmin ? "Select at least one class!" : "Select a class!");
      return;
    }

    const { error } = await createAnnouncement(
      targetClasses.map((className) => ({
        title: newAnn.title,
        content: newAnn.content,
        class_name: className,
        teacher_id: session?.user?.id,
      }))
    );
    if (error) {
      showError("Failed to post announcement. Please try again.");
      return;
    }

    setShowAnnouncementModal(false);
    setAnnSelectedClasses([]);
    setNewAnn({ title: "", content: "", className: "" });
    await fetchAnnouncements(profile);
  };

  const handleCreateMaterial = async () => {
    if (
      !newMat.title.trim() ||
      !newMat.subject.trim() ||
      !newMat.link.trim() ||
      !newMat.className
    ) {
      showError("Fill in all material fields.");
      return;
    }

    const { error } = await createMaterial({
      title: newMat.title.trim(),
      subject: newMat.subject.trim(),
      link: newMat.link.trim(),
      class_name: newMat.className,
      teacher_id: session?.user?.id,
    });
    if (error) {
      showError("Failed to upload material: " + error.message);
      return;
    }

    setShowMaterialModal(false);
    setNewMat({ title: "", link: "", subject: "", className: "" });
    await fetchMaterials(profile);
  };

  const removeMaterial = async (id) => {
    const { error } = await deleteMaterial(id);
    if (error) showError("Failed to delete material.");
    else await fetchMaterials(profile);
  };

  const removeAnnouncement = async (id) => {
    const { error } = await deleteAnnouncement(id);
    if (error) showError("Failed to delete announcement.");
    else await fetchAnnouncements(profile);
  };

  const removeAssignment = async (id) => {
    const { error } = await deleteAssignment(id);
    if (error) {
      showError("Failed to delete assignment.");
      return;
    }
    setShowViewModal(false);
    await fetchProfile(session?.user);
  };

  const activePage = useMemo(() => {
    const meta = PAGE_META[view] || PAGE_META.calendar;
    if (view !== "calendar") return meta;
    return {
      ...meta,
      description:
        profile?.role === "student"
          ? `Assignments and deadlines for ${profile?.user_class || "your class"}.`
          : "Plan assignments and keep every class on schedule.",
    };
  }, [profile, view]);

  const filteredAvailableClasses = useMemo(
    () =>
      AVAILABLE_CLASSES.filter((className) =>
        className.toLowerCase().includes(classSearch.trim().toLowerCase())
      ),
    [classSearch]
  );

  return {
    language,
    setLanguage,
    session,
    profile,
    loading,
    isReady,
    events,
    materials,
    announcements,
    view,
    setView,
    authMode,
    setAuthMode,
    authData,
    setAuthData,
    classSearch,
    setClassSearch,
    filteredAvailableClasses,
    profileDraft,
    setProfileDraft,
    savingProfile,
    isAdmin,
    googleAvatar,
    firstName,
    activePage,
    errorMsg,
    setErrorMsg,
    showError,
    fetchProfile,
    handleAuth,
    handleGoogleLogin,
    handlePostGoogleOnboarding,
    handleSaveProfile,
    handlePostHomework,
    handlePostAnnouncement,
    handleCreateMaterial,
    removeMaterial,
    removeAnnouncement,
    removeAssignment,
    showAddModal,
    setShowAddModal,
    showViewModal,
    setShowViewModal,
    showMaterialModal,
    setShowMaterialModal,
    showAnnouncementModal,
    setShowAnnouncementModal,
    selectedDate,
    setSelectedDate,
    selectedEvent,
    setSelectedEvent,
    newHW,
    setNewHW,
    selectedClasses,
    setSelectedClasses,
    toggleClass: (className) =>
      setSelectedClasses((current) =>
        current.includes(className)
          ? current.filter((value) => value !== className)
          : [...current, className]
      ),
    selectAllClasses: () =>
      setSelectedClasses((current) =>
        current.length === AVAILABLE_CLASSES.length ? [] : [...AVAILABLE_CLASSES]
      ),
    newMat,
    setNewMat,
    newAnn,
    setNewAnn,
    annSelectedClasses,
    setAnnSelectedClasses,
    toggleAnnClass: (className) =>
      setAnnSelectedClasses((current) =>
        current.includes(className)
          ? current.filter((value) => value !== className)
          : [...current, className]
      ),
    selectAllAnnClasses: () =>
      setAnnSelectedClasses((current) =>
        current.length === AVAILABLE_CLASSES.length ? [] : [...AVAILABLE_CLASSES]
      ),
  };
}
