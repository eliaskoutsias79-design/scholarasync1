import React, { useState, useEffect, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabaseClient";
import "./styles.css";

const ADMIN_EMAIL = "eliaskoutsias79@gmail.com";

const AVAILABLE_CLASSES = [
  "Junior High A1", "Junior High A2", "Junior High A3", "Junior High A4", "Junior High A5",
  "Junior High B1", "Junior High B2", "Junior High B3", "Junior High B4", "Junior High B5",
  "Junior High C1", "Junior High C2", "Junior High C3", "Junior High C4", "Junior High C5",
  "High School A1", "High School A2", "High School A3", "High School A4", "High School A5",
  "High School B1", "High School B2", "High School B3", "High School B4", "High School B5",
  "High School C1", "High School C2", "High School C3", "High School C4", "High School C5",
];

const formatClassName = (input) => {
  if (!input) return "";
  const map = {
    "JA1": "Junior High A1", "JA2": "Junior High A2", "JA3": "Junior High A3", "JA4": "Junior High A4", "JA5": "Junior High A5",
    "JB1": "Junior High B1", "JB2": "Junior High B2", "JB3": "Junior High B3", "JB4": "Junior High B4", "JB5": "Junior High B5",
    "JC1": "Junior High C1", "JC2": "Junior High C2", "JC3": "Junior High C3", "JC4": "Junior High C4", "JC5": "Junior High C5",
    "HA1": "High School A1", "HA2": "High School A2", "HA3": "High School A3", "HA4": "High School A4", "HA5": "High School A5",
    "HB1": "High School B1", "HB2": "High School B2", "HB3": "High School B3", "HB4": "High School B4", "HB5": "High School B5",
    "HC1": "High School C1", "HC2": "High School C2", "HC3": "High School C3", "HC4": "High School C4", "HC5": "High School C5",
  };
  return map[input.toUpperCase().trim()] || input.trim();
};

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [events, setEvents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [view, setView] = useState("calendar");
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({
    email: "", password: "", fullName: "", role: "student", userClass: "Junior High A1",
    teacherClasses: "", teacherSubjects: "",
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newHW, setNewHW] = useState({ title: "", subject: "", className: "" });
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [newMat, setNewMat] = useState({ title: "", link: "", subject: "", className: "" });
  const [newAnn, setNewAnn] = useState({ title: "", content: "", className: "" });
  const [annSelectedClasses, setAnnSelectedClasses] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session?.user) await fetchProfile(session.user);
      else setLoading(false);
    };
    initAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user);
      else { setProfile(null); setEvents([]); setMaterials([]); setAnnouncements([]); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, [isReady]);

  const fetchProfile = async (user) => {
    if (!user) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    let currentProfile = null;
    if (!error && data) {
      currentProfile = data;
    } else {
      const meta = user.user_metadata;
      currentProfile = {
        id: user.id, email: user.email, full_name: meta?.fullName || "",
        role: meta?.role || "student", user_class: meta?.userClass || "Not Assigned",
        requested_classes: meta?.classes || "", requested_subjects: meta?.subjects || "",
        is_approved: user.email === ADMIN_EMAIL
      };
    }
    setProfile(currentProfile);
    await Promise.all([
      fetchEvents(currentProfile, user.id, user.email),
      fetchMaterials(currentProfile),
      fetchAnnouncements(currentProfile),
    ]);
    setLoading(false);
  };

  const fetchEvents = async (prof, userId, userEmail) => {
    if (!prof) return;
    let query = supabase.from("assignments").select("*");
    if (prof.role === "student") query = query.eq("class_name", prof.user_class);
    else if (userEmail !== ADMIN_EMAIL) query = query.eq("teacher_id", userId);
    const { data, error } = await query;
    if (error) { showError("Failed to load assignments. Please refresh."); return; }
    if (data) {
      setEvents(data.map(ev => ({
        id: ev.id, title: `[${ev.subject}] ${ev.title}`, start: ev.due_date,
        extendedProps: { subject: ev.subject, rawTitle: ev.title, className: ev.class_name },
        color: ev.subject === "Math" ? "#6366f1" : "#10b981"
      })));
    }
  };

  const fetchMaterials = async (prof) => {
    if (!prof) return;
    let query = supabase.from("materials").select("*");
    if (prof.role === "student") query = query.eq("class_name", prof.user_class);
    const { data, error } = await query;
    if (error) { showError("Failed to load materials. Please refresh."); return; }
    if (data) setMaterials(data);
  };

  const fetchAnnouncements = async (prof) => {
    if (!prof) return;
    let query = supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (prof.role === "student") query = query.eq("class_name", prof.user_class);
    const { data, error } = await query;
    if (error) { showError("Failed to load announcements. Please refresh."); return; }
    if (data) setAnnouncements(data);
  };

  const handleAuth = async () => {
    const { email, password, fullName, role, userClass, teacherClasses, teacherSubjects } = authData;
    const processedClasses = teacherClasses ? teacherClasses.split(",").map(c => formatClassName(c)).join(", ") : "";
    const { data, error } = authMode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email, password,
          options: { data: { fullName, role, userClass, classes: processedClasses, subjects: teacherSubjects } },
        });
    if (error) return alert(error.message);
    if (authMode === "signup" && data?.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id, email, full_name: fullName, role,
        user_class: role === "student" ? userClass : null,
        requested_classes: role === "teacher" ? processedClasses : null,
        requested_subjects: role === "teacher" ? teacherSubjects : null,
        is_approved: email === ADMIN_EMAIL
      });
      alert("Registration request sent!");
    }
  };

  const toggleClass = (cls) => setSelectedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]);
  const selectAllClasses = () => setSelectedClasses(selectedClasses.length === AVAILABLE_CLASSES.length ? [] : [...AVAILABLE_CLASSES]);
  const toggleAnnClass = (cls) => setAnnSelectedClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]);
  const selectAllAnnClasses = () => setAnnSelectedClasses(annSelectedClasses.length === AVAILABLE_CLASSES.length ? [] : [...AVAILABLE_CLASSES]);

  const handlePostHomework = async () => {
    if (isAdmin) {
      if (selectedClasses.length === 0 || !newHW.subject || !newHW.title) return alert("Fill all fields and select at least one class!");
      const inserts = selectedClasses.map(cls => ({ title: newHW.title, subject: newHW.subject, class_name: cls, due_date: selectedDate, teacher_id: session?.user?.id }));
      const { error } = await supabase.from("assignments").insert(inserts);
      if (error) showError("Failed to post homework. Please try again.");
      else { setShowAddModal(false); setSelectedClasses([]); setNewHW({ title: "", subject: "", className: "" }); fetchProfile(session?.user); }
    } else {
      if (!newHW.className || !newHW.subject || !newHW.title) return alert("Fill all fields!");
      const { error } = await supabase.from("assignments").insert([{ title: newHW.title, subject: newHW.subject, class_name: newHW.className, due_date: selectedDate, teacher_id: session?.user?.id }]);
      if (error) showError("Failed to post homework. Please try again.");
      else { setShowAddModal(false); fetchProfile(session?.user); }
    }
  };

  const handlePostAnnouncement = async () => {
    if (!newAnn.title || !newAnn.content) return alert("Fill in the title and content!");
    if (isAdmin) {
      if (annSelectedClasses.length === 0) return alert("Select at least one class!");
      const inserts = annSelectedClasses.map(cls => ({ title: newAnn.title, content: newAnn.content, class_name: cls, teacher_id: session?.user?.id }));
      const { error } = await supabase.from("announcements").insert(inserts);
      if (error) showError("Failed to post announcement. Please try again.");
      else { setShowAnnouncementModal(false); setAnnSelectedClasses([]); setNewAnn({ title: "", content: "", className: "" }); fetchAnnouncements(profile); }
    } else {
      if (!newAnn.className) return alert("Select a class!");
      const { error } = await supabase.from("announcements").insert([{ title: newAnn.title, content: newAnn.content, class_name: newAnn.className, teacher_id: session?.user?.id }]);
      if (error) showError("Failed to post announcement. Please try again.");
      else { setShowAnnouncementModal(false); setNewAnn({ title: "", content: "", className: "" }); fetchAnnouncements(profile); }
    }
  };

  // ---------------- RENDERING ----------------

  if (!isReady || loading) {
    return (
      <div className="auth-container">
        <div className="text-logo">Scholar<span>Async</span></div>
        <p style={{ color: 'white', marginTop: '10px', fontSize: '0.8rem', opacity: 0.7 }}>INITIALIZING SECURE SESSION...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="text-logo">Scholar<span>Async</span></div>
            <p className="auth-subtitle">Welcome to your educational portal</p>
          </div>
          <input type="email" placeholder="Email" onChange={e => setAuthData({ ...authData, email: e.target.value })} />
          <input type="password" placeholder="Password" onChange={e => setAuthData({ ...authData, password: e.target.value })} />
          {authMode === "signup" && (
            <div className="signup-fields">
              <input placeholder="Full Name" onChange={e => setAuthData({ ...authData, fullName: e.target.value })} />
              <select onChange={e => setAuthData({ ...authData, role: e.target.value })}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              {authData.role === "student" ? (
                <select onChange={e => setAuthData({ ...authData, userClass: e.target.value })}>
                  {AVAILABLE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <>
                  <input placeholder="Classes (e.g. JA1, HA2)" onChange={e => setAuthData({ ...authData, teacherClasses: e.target.value })} />
                  <input placeholder="Subjects (e.g. Math, History)" onChange={e => setAuthData({ ...authData, teacherSubjects: e.target.value })} />
                </>
              )}
            </div>
          )}
          <button className="main-btn" onClick={handleAuth}>{authMode === "login" ? "Login" : "Request Access"}</button>
          <p className="auth-toggle" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
            {authMode === "login" ? "Don't have an account? Create one" : "Already have an account? Login here"}
          </p>
        </div>
      </div>
    );
  }

  if (profile && !profile.is_approved && session?.user?.email !== ADMIN_EMAIL) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="text-logo" style={{ fontSize: '1.5rem' }}>Scholar<span>Async</span></div>
          <div className="approval-status" style={{ marginTop: '20px' }}>
            <h2>⏳ Approval Pending</h2>
            <p>Contact your administrator to verify your account.</p>
          </div>
          <button className="main-btn" onClick={() => { supabase.auth.signOut(); window.location.reload(); }}>Logout</button>
        </div>
      </div>
    );
  }

 return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="text-logo-sidebar">Scholar<span>Async</span></div>
        </div>
        <nav>
          <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}><span className="icon-span">📅</span><span className="desktop-only">Calendar</span></button>
          <button className={view === "materials" ? "active" : ""} onClick={() => setView("materials")}><span className="icon-span">📚</span><span className="desktop-only">Materials</span></button>
          <button className={view === "announcements" ? "active" : ""} onClick={() => setView("announcements")}><span className="icon-span">📣</span><span className="desktop-only">Announcements</span></button>
          <button className={view === "messages" ? "active" : ""} onClick={() => setView("messages")}><span className="icon-span">💬</span><span className="desktop-only">Messages</span></button>
          <button className={view === "grades" ? "active" : ""} onClick={() => setView("grades")}><span className="icon-span">📊</span><span className="desktop-only">Grades</span></button>
          {isAdmin && <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}><span className="icon-span">🛡️</span><span className="desktop-only">Admin</span></button>}
        </nav>
        <div className="user-tag">
          <div className="desktop-only">
            <small>{profile?.role?.toUpperCase()}</small>
            <p>{profile?.full_name || profile?.user_class || "Faculty"}</p>
          </div>
          <button className="logout-lite" onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}>
            <span className="mobile-only">🚪</span><span className="desktop-only">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {view === "admin" ? (
          <AdminPanel fetchProfile={() => fetchProfile(session?.user)} />
        ) : view === "materials" ? (
          <div className="materials-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>📚 Study Materials</h2>
              {(profile?.role === "teacher" || isAdmin) && (
                <button className="main-btn" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setShowMaterialModal(true)}>+ Add Material</button>
              )}
            </div>
            <div className="materials-grid">
              {materials.length === 0 ? <p>No materials uploaded yet.</p> : materials.map(m => (
                <div key={m.id} className="material-card">
                  <div className="material-info"><strong>{m.title}</strong><p>{m.subject} | {m.class_name}</p></div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a href={m.link} target="_blank" rel="noreferrer" className="main-btn" style={{ width: 'auto', padding: '5px 15px', textDecoration: 'none' }}>Open</a>
                    {(profile?.role !== "student" || isAdmin) && (
                      <button className="del-btn" onClick={async () => {
                        const { error } = await supabase.from("materials").delete().eq("id", m.id);
                        if (error) showError("Failed to delete material.");
                        else fetchMaterials(profile);
                      }}>🗑️</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : view === "announcements" ? (
          <div className="materials-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>📣 Announcements</h2>
              {(profile?.role === "teacher" || isAdmin) && (
                <button className="main-btn" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => { setShowAnnouncementModal(true); setAnnSelectedClasses([]); setNewAnn({ title: "", content: "", className: "" }); }}>+ Post</button>
              )}
            </div>
            <div className="announcements-list">
              {announcements.length === 0 ? <p>No announcements yet.</p> : announcements.map(a => (
                <div key={a.id} className="announcement-card">
                  <div className="announcement-header">
                    <strong>{a.title}</strong>
                    <span className="ann-class-badge">{a.class_name}</span>
                  </div>
                  <p className="announcement-content">{a.content}</p>
                  <div className="announcement-footer">
                    <small>{new Date(a.created_at).toLocaleDateString()}</small>
                    {(profile?.role !== "student" || isAdmin) && (
                      <button className="del-btn" onClick={async () => {
                        const { error } = await supabase.from("announcements").delete().eq("id", a.id);
                        if (error) showError("Failed to delete announcement.");
                        else fetchAnnouncements(profile);
                      }}>🗑️</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : view === "messages" ? (
          <MessagingView profile={profile} session={session} isAdmin={isAdmin} showError={showError} />
        ) : view === "grades" ? (
          <GradesView profile={profile} isAdmin={isAdmin} />
        ) : (
          <div className="calendar-card">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              dateClick={(arg) => {
                if ((profile?.role === "teacher" || isAdmin) && profile?.is_approved) {
                  setSelectedDate(arg.dateStr); setSelectedClasses([]);
                  setNewHW({ title: "", subject: "", className: "" }); setShowAddModal(true);
                }
              }}
              eventClick={(info) => {
                setSelectedEvent({ id: info.event.id, ...info.event.extendedProps, date: info.event.startStr });
                setShowViewModal(true);
              }}
            />
          </div>
        )}
      </main>
      
      {/* Ensure any toast components are inside the main div but after the main content */}
      {errorMsg && <ErrorToast message={errorMsg} onClose={() => setErrorMsg(null)} />}
    </div>
  );
}

      {/* MODALS */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Post Homework: {selectedDate}</h3>
            {isAdmin ? (
              <div className="class-selector">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Select Classes</label>
                  <button className="select-all-btn" onClick={selectAllClasses}>{selectedClasses.length === AVAILABLE_CLASSES.length ? "Deselect All" : "Select All"}</button>
                </div>
                <div className="class-checkbox-grid">
                  {AVAILABLE_CLASSES.map(cls => (
                    <label key={cls} className={`class-checkbox-item ${selectedClasses.includes(cls) ? "checked" : ""}`}>
                      <input type="checkbox" checked={selectedClasses.includes(cls)} onChange={() => toggleClass(cls)} style={{ display: 'none' }} />{cls}
                    </label>
                  ))}
                </div>
                {selectedClasses.length > 0 && <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '8px', fontWeight: 600 }}>{selectedClasses.length} class{selectedClasses.length > 1 ? "es" : ""} selected</p>}
              </div>
            ) : (
              <select onChange={(e) => setNewHW({ ...newHW, className: e.target.value })}>
                <option value="">-- Class --</option>
                {(profile?.requested_classes || profile?.user_class || "").split(",").map((c) => <option key={c} value={c.trim()}>{c.trim()}</option>)}
              </select>
            )}
            <select onChange={(e) => setNewHW({ ...newHW, subject: e.target.value })}>
              <option value="">-- Subject --</option>
              {(profile?.requested_subjects || "General").split(",").map((s) => <option key={s} value={s.trim()}>{s.trim()}</option>)}
            </select>
            <input placeholder="Assignment Title" onChange={(e) => setNewHW({ ...newHW, title: e.target.value })} />
            <button className="main-btn" onClick={handlePostHomework}>Post</button>
            <button className="secondary-btn" onClick={() => { setShowAddModal(false); setSelectedClasses([]); }}>Cancel</button>
          </div>
        </div>
      )}

      {showMaterialModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Upload Material</h3>
            <select onChange={(e) => setNewMat({ ...newMat, className: e.target.value })}>
              <option value="">-- Class --</option>
              {(profile?.requested_classes || profile?.user_class || "").split(",").map((c) => <option key={c} value={c.trim()}>{c.trim()}</option>)}
            </select>
            <input placeholder="Title" onChange={(e) => setNewMat({ ...newMat, title: e.target.value })} />
            <input placeholder="Subject" onChange={(e) => setNewMat({ ...newMat, subject: e.target.value })} />
            <input placeholder="Link (Drive/PDF)" onChange={(e) => setNewMat({ ...newMat, link: e.target.value })} />
            <button className="main-btn" onClick={async () => {
              const { error } = await supabase.from("materials").insert([{ title: newMat.title, subject: newMat.subject, link: newMat.link, class_name: newMat.className, teacher_id: session?.user?.id }]);
              if (error) showError("Failed to upload material.");
              else { setShowMaterialModal(false); fetchMaterials(profile); }
            }}>Upload</button>
            <button className="secondary-btn" onClick={() => setShowMaterialModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showAnnouncementModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>📣 Post Announcement</h3>
            {isAdmin ? (
              <div className="class-selector">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Select Classes</label>
                  <button className="select-all-btn" onClick={selectAllAnnClasses}>{annSelectedClasses.length === AVAILABLE_CLASSES.length ? "Deselect All" : "Select All"}</button>
                </div>
                <div className="class-checkbox-grid">
                  {AVAILABLE_CLASSES.map(cls => (
                    <label key={cls} className={`class-checkbox-item ${annSelectedClasses.includes(cls) ? "checked" : ""}`}>
                      <input type="checkbox" checked={annSelectedClasses.includes(cls)} onChange={() => toggleAnnClass(cls)} style={{ display: 'none' }} />{cls}
                    </label>
                  ))}
                </div>
                {annSelectedClasses.length > 0 && <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '8px', fontWeight: 600 }}>{annSelectedClasses.length} class{annSelectedClasses.length > 1 ? "es" : ""} selected</p>}
              </div>
            ) : (
              <select onChange={(e) => setNewAnn({ ...newAnn, className: e.target.value })}>
                <option value="">-- Class --</option>
                {(profile?.requested_classes || profile?.user_class || "").split(",").map((c) => <option key={c} value={c.trim()}>{c.trim()}</option>)}
              </select>
            )}
            <input placeholder="Title" onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })} />
            <textarea placeholder="Write your announcement here..." rows={4}
              style={{ width: '100%', padding: '14px', marginBottom: '16px', border: '2px solid #f1f5f9', borderRadius: '12px', background: '#f8fafc', fontSize: '1rem', color: 'var(--text-main)', resize: 'vertical' }}
              onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })} />
            <button className="main-btn" onClick={handlePostAnnouncement}>Post</button>
            <button className="secondary-btn" onClick={() => setShowAnnouncementModal(false)}>Cancel</button>
          </div>
        </div>
      )}

{showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedEvent?.rawTitle}</h2>
            <p><strong>Subject:</strong> {selectedEvent?.subject}</p>
            <p><strong>Class:</strong> {selectedEvent?.className}</p>
            <p><strong>Due:</strong> {selectedEvent?.date}</p>
            {(profile?.role !== "student" || isAdmin) && (
              <button className="del-btn" onClick={async () => {
                const { error } = await supabase.from("assignments").delete().eq("id", selectedEvent.id);
                if (error) showError("Failed to delete assignment.");
                else { setShowViewModal(false); fetchProfile(session?.user); }
              }}>Delete</button>
            )}
            <button className="secondary-btn" onClick={() => setShowViewModal(false)}>Close</button>
          </div>
        </div>
      )}

      {errorMsg && <ErrorToast message={errorMsg} onClose={() => setErrorMsg(null)} />}
    </div>
  );
}

// === KEEP YOUR GradesView FUNCTION BELOW THIS LINE ===

function MessagingView({ profile, session, isAdmin, showError }) {
  const [activeTab, setActiveTab] = useState("class");
  const [classMessages, setClassMessages] = useState([]);
  const [directMessages, setDirectMessages] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [newDM, setNewDM] = useState("");
  const bottomRef = useRef(null);
  const dmBottomRef = useRef(null);

  const myClass = profile?.user_class;
  const myClasses = (profile?.requested_classes || "").split(",").map(c => c.trim()).filter(Boolean);
  const [selectedClass, setSelectedClass] = useState(myClass || myClasses[0] || "");

  useEffect(() => {
    if (activeTab === "class" && selectedClass) fetchClassMessages(selectedClass);
  }, [activeTab, selectedClass]);

  useEffect(() => {
    if (activeTab === "direct") fetchStudents();
  }, [activeTab]);

  useEffect(() => {
    if (selectedStudent) fetchDMs(selectedStudent.id);
  }, [selectedStudent]);

  // Real-time class chat - FIXED LOGIC
  useEffect(() => {
    if (!selectedClass) return;
    const channel = supabase
      .channel("class-chat-" + selectedClass)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (payload.new.class_name === selectedClass && payload.new.is_class_chat) {
            setClassMessages(prev => [...prev, payload.new]);
          }
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [selectedClass]);

  // Real-time DMs - FIXED LOGIC
  useEffect(() => {
    if (!selectedStudent) return;
    const channel = supabase
      .channel("dm-logic")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          const isRelevant =
            (msg.sender_id === session.user.id && msg.receiver_id === selectedStudent.id) ||
            (msg.sender_id === selectedStudent.id && msg.receiver_id === session.user.id);
          if (isRelevant && !msg.is_class_chat) {
             setDirectMessages(prev => [...prev, msg]);
          }
        }
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [selectedStudent]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [classMessages]);
  useEffect(() => { dmBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [directMessages]);

  const fetchClassMessages = async (cls) => {
    const { data, error } = await supabase
      .from("messages").select("*, sender:profiles(full_name, role)")
      .eq("class_name", cls).eq("is_class_chat", true).order("created_at");
    if (error) showError("Failed to load messages.");
    else setClassMessages(data || []);
  };

  const fetchStudents = async () => {
    let query = supabase.from("profiles").select("*").eq("role", "student");
    if (!isAdmin && myClasses.length > 0) query = query.in("user_class", myClasses);
    const { data } = await query;
    setStudents(data || []);
  };

 const fetchDMs = async (otherId) => {
    if (!otherId || !session?.user?.id) return;

    // We simplified the select to just '*' to stop the 'Relationship' error
    const { data, error } = await supabase
      .from("messages")
      .select("*") 
      .eq("is_class_chat", false)
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${session.user.id})`)
      .order("created_at");

    if (error) {
      console.error("DM Error:", error.message);
      showError("DM Fetch Failed: " + error.message);
    } else {
      setDirectMessages(data || []);
    }
  };

  const sendClassMessage = async () => {
    if (!newMsg.trim()) return;
    const { error } = await supabase.from("messages").insert([{
      sender_id: session.user.id, 
      class_name: selectedClass,
      content: newMsg.trim(), 
      is_class_chat: true,
    }]);
    if (error) showError("Send failed: " + error.message);
    setNewMsg("");
  };

  const sendDM = async () => {
    if (!newDM.trim() || !selectedStudent) return;
    const { error } = await supabase.from("messages").insert([{
      sender_id: session.user.id, 
      receiver_id: selectedStudent.id,
      content: newDM.trim(), 
      is_class_chat: false,
    }]);
    if (error) showError("Send failed: " + error.message);
    setNewDM("");
  };

  const filteredStudents = students.filter(s =>
    (s.full_name || s.email).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canClassChat = profile?.role === "teacher" || profile?.role === "student" || isAdmin;
  const canDM = profile?.role === "teacher" || isAdmin;

  return (
    <div className="messaging-container">
      <div className="msg-tabs">
        <button className={activeTab === "class" ? "msg-tab active" : "msg-tab"} onClick={() => setActiveTab("class")}>🏫 Class Chat</button>
        {(canDM || profile?.role === "student") && (
          <button className={activeTab === "direct" ? "msg-tab active" : "msg-tab"} onClick={() => setActiveTab("direct")}>✉️ Direct Messages</button>
        )}
      </div>

      {activeTab === "class" && (
        <div className="chat-layout">
          {(profile?.role === "teacher" || isAdmin) && myClasses.length > 1 && (
            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ marginBottom: '16px', padding: '10px', borderRadius: '10px', border: '2px solid #e2e8f0', width: '100%' }}>
              {myClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <div className="chat-messages">
            {classMessages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>No messages yet. Say hello! 👋</p>}
            {classMessages.map(m => (
              <div key={m.id} className={`chat-bubble ${m.sender_id === session.user.id ? "mine" : "theirs"}`}>
                <span className="bubble-name">{m.sender?.full_name || "Unknown"} {m.sender?.role === "teacher" ? "👩‍🏫" : m.sender?.role === "student" ? "🎓" : "🛡️"}</span>
                <div className="bubble-text">{m.content}</div>
                <span className="bubble-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {canClassChat && (
            <div className="chat-input-row">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === "Enter" && sendClassMessage()} />
              <button className="main-btn" style={{ width: 'auto', padding: '12px 20px' }} onClick={sendClassMessage}>Send</button>
            </div>
          )}
        </div>
      )}

      {activeTab === "direct" && (
        <div className="dm-layout">
          {profile?.role === "student" ? (
             <StudentDMView profile={profile} session={session} showError={showError} />
          ) : (
            <div className="dm-split">
              <div className="dm-sidebar">
                <input
                  placeholder="🔍 Search students..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', marginBottom: '12px', fontSize: '0.9rem' }}
                />
                <div className="student-list">
                  {filteredStudents.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No students found.</p>}
                  {filteredStudents.map(s => (
                    <div key={s.id} className={`student-item ${selectedStudent?.id === s.id ? "selected" : ""}`} onClick={() => setSelectedStudent(s)}>
                      <strong>{s.full_name || s.email}</strong>
                      <small>{s.user_class}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dm-chat">
                {!selectedStudent ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    ← Select a student to start chatting
                  </div>
                ) : (
                  <>
                    <div className="dm-header">
                      <strong>{selectedStudent.full_name || selectedStudent.email}</strong>
                      <small>{selectedStudent.user_class}</small>
                    </div>
                    <div className="chat-messages">
                      {directMessages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>No messages yet.</p>}
                      {directMessages.map(m => (
                        <div key={m.id} className={`chat-bubble ${m.sender_id === session.user.id ? "mine" : "theirs"}`}>
                          <div className="bubble-text">{m.content}</div>
                          <span className="bubble-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                      <div ref={dmBottomRef} />
                    </div>
                    <div className="chat-input-row">
                      <input value={newDM} onChange={e => setNewDM(e.target.value)} placeholder={`Message ${selectedStudent.full_name || "student"}...`} onKeyDown={e => e.key === "Enter" && sendDM()} />
                      <button className="main-btn" style={{ width: 'auto', padding: '12px 20px' }} onClick={sendDM}>Send</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentDMView({ profile, session, showError }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConvo, setSelectedConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { if (selectedConvo) fetchMessages(selectedConvo.id); }, [selectedConvo]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Real-time for student DMs & Sidebar Updates
  useEffect(() => {
    const channel = supabase.channel("student-dm-global")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new;
        
        // 1. If it's for the current conversation, show the bubble
        if (selectedConvo) {
          const isRelevant =
            (msg.sender_id === session.user.id && msg.receiver_id === selectedConvo.id) ||
            (msg.sender_id === selectedConvo.id && msg.receiver_id === session.user.id);
          if (isRelevant && !msg.is_class_chat) setMessages(prev => [...prev, msg]);
        }

        // 2. If it's a new teacher messaging, update the list
        if (msg.receiver_id === session.user.id) {
          fetchConversations();
        }
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [selectedConvo]);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from("messages")
      .select("sender_id, receiver_id")
      .eq("is_class_chat", false)
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

    if (!data) return;
    const otherIds = [...new Set(data.map(m => m.sender_id === session.user.id ? m.receiver_id : m.sender_id))];
    if (otherIds.length === 0) return;

    const { data: profiles } = await supabase.from("profiles").select("*").in("id", otherIds);
    setConversations(profiles || []);
  };

  const fetchMessages = async (otherId) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("is_class_chat", false)
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${session.user.id})`)
      .order("created_at");
    if (error) showError("Failed to load messages.");
    else setMessages(data || []);
  };

  const sendMsg = async () => {
    if (!newMsg.trim() || !selectedConvo) return;
    await supabase.from("messages").insert([{ 
      sender_id: session.user.id, 
      receiver_id: selectedConvo.id, 
      content: newMsg.trim(), 
      is_class_chat: false 
    }]);
    setNewMsg("");
  };

  return (
    <div className="dm-split">
      <div className="dm-sidebar">
        <p style={{ fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>YOUR TEACHERS</p>
        {conversations.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No conversations yet.</p>}
        {conversations.map(c => (
          <div key={c.id} className={`student-item ${selectedConvo?.id === c.id ? "selected" : ""}`} onClick={() => setSelectedConvo(c)}>
            <strong>{c.full_name || c.email}</strong>
            <small>{c.role}</small>
          </div>
        ))}
      </div>
      <div className="dm-chat">
        {!selectedConvo ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>← Select a conversation</div>
        ) : (
          <>
            <div className="dm-header"><strong>{selectedConvo.full_name || selectedConvo.email}</strong><small>{selectedConvo.role}</small></div>
            <div className="chat-messages">
              {messages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>No messages yet.</p>}
              {messages.map(m => (
                <div key={m.id} className={`chat-bubble ${m.sender_id === session.user.id ? "mine" : "theirs"}`}>
                  <div className="bubble-text">{m.content}</div>
                  <span className="bubble-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="chat-input-row">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Reply..." onKeyDown={e => e.key === "Enter" && sendMsg()} />
              <button className="main-btn" style={{ width: 'auto', padding: '12px 20px' }} onClick={sendMsg}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ERROR HANDLING
// ============================================================

function ErrorToast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="error-toast">
      <span>⚠️ {message}</span>
      <button onClick={onClose} className="error-toast-close">✕</button>
    </div>
  );
}

// ============================================================
// ADMIN PANEL
// ============================================================

function AdminPanel({ fetchProfile }) {
  const [users, setUsers] = useState([]);
  useEffect(() => { fetchUsers(); }, []);
  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("is_approved", { ascending: true });
    setUsers(data || []);
  };
  return (
    <div className="admin-panel">
      <h2>User Management</h2>
      <div className="task-grid">
        {users.map(u => (
          <div key={u.id} className="task-item">
            <div className="task-info">
              <strong>{u.full_name || u.email}</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</p>
              <p>{u.role} | {u.user_class || "No Class Assigned"}</p>
              <span className={`status-badge ${u.is_approved ? 'status-approved' : 'status-pending'}`}>{u.is_approved ? "Approved ✅" : "Pending ⏳"}</span>
            </div>
            <button className="main-btn" onClick={async () => {
              await supabase.from("profiles").update({ is_approved: !u.is_approved }).eq("id", u.id);
              fetchUsers(); fetchProfile();
            }}>{u.is_approved ? "Revoke Access" : "Approve User"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// GRADES SYSTEM COMPONENT
// ============================================================

function GradesView({ profile, isAdmin }) {
  const [grades, setGrades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Grade Form State
  const [selectedStudent, setSelectedStudent] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchGrades();
    if (profile?.role === 'teacher' || isAdmin) {
      fetchStudents();
    }
  }, [profile]);

  const fetchGrades = async () => {
    let query = supabase.from("grades").select("*, teacher:profiles!teacher_id(full_name)");
    
    // Students only see their own, Teachers see all for their classes
    if (profile?.role === 'student') {
      query = query.eq("student_id", profile.id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (!error) setGrades(data || []);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, user_class").eq("role", "student");
    setStudents(data || []);
  };

  const submitGrade = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !subject || !gradeValue) return alert("Fill in required fields!");

    const student = students.find(s => s.id === selectedStudent);

    const { error } = await supabase.from("grades").insert([{
      student_id: selectedStudent,
      teacher_id: profile.id,
      subject,
      grade_value: gradeValue,
      comment,
      class_name: student?.user_class || "General"
    }]);

    if (!error) {
      setShowModal(false);
      setSubject(""); setGradeValue(""); setComment("");
      fetchGrades();
    } else {
      alert(error.message);
    }
  };

  if (loading) return <div className="p-4">Loading grades...</div>;

  return (
    <div className="materials-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📊 Academic Records</h2>
        {(profile?.role === "teacher" || isAdmin) && (
          <button className="main-btn" style={{ width: 'auto', padding: '10px 20px' }} 
                  onClick={() => setShowModal(true)}>+ Assign Grade</button>
        )}
      </div>

      <div className="task-grid">
        {grades.length === 0 ? <p>No grades recorded yet.</p> : grades.map(g => (
          <div key={g.id} className="task-item">
            <div className="task-info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{g.subject}</strong>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{g.comment || "No teacher comments."}</p>
                </div>
                <span className="status-badge status-approved" style={{ fontSize: '1.2rem', padding: '10px' }}>
                  {g.grade_value}
                </span>
              </div>
              <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                <small style={{ color: 'var(--text-muted)' }}>
                  {profile?.role === 'teacher' ? `Student: ${g.student_id.slice(0,8)}...` : `Teacher: ${g.teacher?.full_name || 'Faculty'}`}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GRADE INPUT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Assign New Grade</h3>
            <form onSubmit={submitGrade} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select className="main-input" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required>
                <option value="">Select Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.user_class})</option>)}
              </select>
              <input className="main-input" placeholder="Subject (e.g. Math)" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              <input className="main-input" placeholder="Grade (e.g. A, 19, 95%)" value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} required />
              <textarea className="main-input" placeholder="Comments (Optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="main-btn">Save Grade</button>
                <button type="button" className="main-btn" style={{ background: '#ccc' }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
