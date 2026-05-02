import React, { useState, useEffect } from "react";
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

  // 1. INITIAL WAIT
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // 2. SESSION HANDLER
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
      else {
        setProfile(null); setEvents([]); setMaterials([]); setAnnouncements([]); setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [isReady]);

  // 3. PROFILE & DATA HANDLER
  const fetchProfile = async (user) => {
    if (!user) return;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    let currentProfile = null;
    if (!error && data) {
      currentProfile = data;
    } else {
      const meta = user.user_metadata;
      currentProfile = {
        id: user.id, email: user.email,
        full_name: meta?.fullName || "",
        role: meta?.role || "student",
        user_class: meta?.userClass || "Not Assigned",
        requested_classes: meta?.classes || "",
        requested_subjects: meta?.subjects || "",
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
    if (prof.role === "student") {
      query = query.eq("class_name", prof.user_class);
    } else if (userEmail !== ADMIN_EMAIL) {
      query = query.eq("teacher_id", userId);
    }
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
        id: data.user.id,
        email,
        full_name: fullName,
        role,
        user_class: role === "student" ? userClass : null,
        requested_classes: role === "teacher" ? processedClasses : null,
        requested_subjects: role === "teacher" ? teacherSubjects : null,
        is_approved: email === ADMIN_EMAIL
      });
      alert("Registration request sent!");
    }
  };

  // ---- MULTI-CLASS HELPERS (admin only) ----
  const toggleClass = (cls) => {
    setSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const selectAllClasses = () => {
    setSelectedClasses(selectedClasses.length === AVAILABLE_CLASSES.length ? [] : [...AVAILABLE_CLASSES]);
  };

  const toggleAnnClass = (cls) => {
    setAnnSelectedClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const selectAllAnnClasses = () => {
    setAnnSelectedClasses(annSelectedClasses.length === AVAILABLE_CLASSES.length ? [] : [...AVAILABLE_CLASSES]);
  };

  const handlePostHomework = async () => {
    if (isAdmin) {
      if (selectedClasses.length === 0 || !newHW.subject || !newHW.title) {
        return alert("Fill all fields and select at least one class!");
      }
      const inserts = selectedClasses.map(cls => ({
        title: newHW.title, subject: newHW.subject,
        class_name: cls, due_date: selectedDate, teacher_id: session?.user?.id,
      }));
      const { error } = await supabase.from("assignments").insert(inserts);
      if (error) showError("Failed to post homework. Please try again.");
      else {
        setShowAddModal(false); setSelectedClasses([]);
        setNewHW({ title: "", subject: "", className: "" });
        fetchProfile(session?.user);
      }
    } else {
      if (!newHW.className || !newHW.subject || !newHW.title) return alert("Fill all fields!");
      const { error } = await supabase.from("assignments").insert([{
        title: newHW.title, subject: newHW.subject,
        class_name: newHW.className, due_date: selectedDate, teacher_id: session?.user?.id,
      }]);
      if (error) showError("Failed to post homework. Please try again.");
      else { setShowAddModal(false); fetchProfile(session?.user); }
    }
  };

  const handlePostAnnouncement = async () => {
    if (!newAnn.title || !newAnn.content) return alert("Fill in the title and content!");

    if (isAdmin) {
      if (annSelectedClasses.length === 0) return alert("Select at least one class!");
      const inserts = annSelectedClasses.map(cls => ({
        title: newAnn.title, content: newAnn.content,
        class_name: cls, teacher_id: session?.user?.id,
      }));
      const { error } = await supabase.from("announcements").insert(inserts);
      if (error) showError("Failed to post announcement. Please try again.");
      else {
        setShowAnnouncementModal(false); setAnnSelectedClasses([]);
        setNewAnn({ title: "", content: "", className: "" });
        fetchAnnouncements(profile);
      }
    } else {
      if (!newAnn.className) return alert("Select a class!");
      const { error } = await supabase.from("announcements").insert([{
        title: newAnn.title, content: newAnn.content,
        class_name: newAnn.className, teacher_id: session?.user?.id,
      }]);
      if (error) showError("Failed to post announcement. Please try again.");
      else {
        setShowAnnouncementModal(false);
        setNewAnn({ title: "", content: "", className: "" });
        fetchAnnouncements(profile);
      }
    }
  };

  // ---------------- RENDERING ----------------

  if (!isReady || loading) {
    return (
      <div className="auth-container">
        <div className="text-logo">Scholar<span>Async</span></div>
        <p style={{ color: 'white', marginTop: '10px', fontSize: '0.8rem', opacity: 0.7 }}>
          INITIALIZING SECURE SESSION...
        </p>
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
          <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>
            <span className="icon-span">📅</span><span className="desktop-only">Calendar</span>
          </button>
          <button className={view === "materials" ? "active" : ""} onClick={() => setView("materials")}>
            <span className="icon-span">📚</span><span className="desktop-only">Materials</span>
          </button>
          <button className={view === "announcements" ? "active" : ""} onClick={() => setView("announcements")}>
            <span className="icon-span">📣</span><span className="desktop-only">Announcements</span>
          </button>
          {isAdmin && (
            <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>
              <span className="icon-span">🛡️</span><span className="desktop-only">Admin</span>
            </button>
          )}
        </nav>

        <div className="user-tag">
          <div className="desktop-only">
            <small>{profile?.role?.toUpperCase()}</small>
            <p>{profile?.full_name || profile?.user_class || "Faculty"}</p>
          </div>
          <button className="logout-lite" onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}>
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
                  <div className="material-info">
                    <strong>{m.title}</strong>
                    <p>{m.subject} | {m.class_name}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <a href={m.link} target="_blank" rel="noreferrer" className="main-btn" style={{ width: 'auto', padding: '5px 15px', textDecoration: 'none' }}>Open</a>
                    {(profile?.role !== "student" || isAdmin) && (
                      <button className="del-btn" onClick={async () => {
                        const { error } = await supabase.from("materials").delete().eq("id", m.id);
                        if (error) showError("Failed to delete material. Please try again.");
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
                <button className="main-btn" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => { setShowAnnouncementModal(true); setAnnSelectedClasses([]); setNewAnn({ title: "", content: "", className: "" }); }}>+ Post Announcement</button>
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

        ) : (
          <div className="calendar-card">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              dateClick={(arg) => {
                if ((profile?.role === "teacher" || isAdmin) && profile?.is_approved) {
                  setSelectedDate(arg.dateStr);
                  setSelectedClasses([]);
                  setNewHW({ title: "", subject: "", className: "" });
                  setShowAddModal(true);
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

      {/* MODALS */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Post Homework: {selectedDate}</h3>
            {isAdmin ? (
              <div className="class-selector">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Select Classes</label>
                  <button className="select-all-btn" onClick={selectAllClasses}>
                    {selectedClasses.length === AVAILABLE_CLASSES.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="class-checkbox-grid">
                  {AVAILABLE_CLASSES.map(cls => (
                    <label key={cls} className={`class-checkbox-item ${selectedClasses.includes(cls) ? "checked" : ""}`}>
                      <input type="checkbox" checked={selectedClasses.includes(cls)} onChange={() => toggleClass(cls)} style={{ display: 'none' }} />
                      {cls}
                    </label>
                  ))}
                </div>
                {selectedClasses.length > 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '8px', fontWeight: 600 }}>
                    {selectedClasses.length} class{selectedClasses.length > 1 ? "es" : ""} selected
                  </p>
                )}
              </div>
            ) : (
              <select onChange={(e) => setNewHW({ ...newHW, className: e.target.value })}>
                <option value="">-- Class --</option>
                {(profile?.requested_classes || profile?.user_class || "").split(",").map((c) => (
                  <option key={c} value={c.trim()}>{c.trim()}</option>
                ))}
              </select>
            )}
            <select onChange={(e) => setNewHW({ ...newHW, subject: e.target.value })}>
              <option value="">-- Subject --</option>
              {(profile?.requested_subjects || "General").split(",").map((s) => (
                <option key={s} value={s.trim()}>{s.trim()}</option>
              ))}
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
              {(profile?.requested_classes || profile?.user_class || "").split(",").map((c) => (
                <option key={c} value={c.trim()}>{c.trim()}</option>
              ))}
            </select>
            <input placeholder="Title" onChange={(e) => setNewMat({ ...newMat, title: e.target.value })} />
            <input placeholder="Subject" onChange={(e) => setNewMat({ ...newMat, subject: e.target.value })} />
            <input placeholder="Link (Drive/PDF)" onChange={(e) => setNewMat({ ...newMat, link: e.target.value })} />
            <button className="main-btn" onClick={async () => {
              const { error } = await supabase.from("materials").insert([{
                title: newMat.title, subject: newMat.subject,
                link: newMat.link, class_name: newMat.className, teacher_id: session?.user?.id
              }]);
              if (error) showError("Failed to upload material. Please try again.");
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
                  <button className="select-all-btn" onClick={selectAllAnnClasses}>
                    {annSelectedClasses.length === AVAILABLE_CLASSES.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <div className="class-checkbox-grid">
                  {AVAILABLE_CLASSES.map(cls => (
                    <label key={cls} className={`class-checkbox-item ${annSelectedClasses.includes(cls) ? "checked" : ""}`}>
                      <input type="checkbox" checked={annSelectedClasses.includes(cls)} onChange={() => toggleAnnClass(cls)} style={{ display: 'none' }} />
                      {cls}
                    </label>
                  ))}
                </div>
                {annSelectedClasses.length > 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '8px', fontWeight: 600 }}>
                    {annSelectedClasses.length} class{annSelectedClasses.length > 1 ? "es" : ""} selected
                  </p>
                )}
              </div>
            ) : (
              <select onChange={(e) => setNewAnn({ ...newAnn, className: e.target.value })}>
                <option value="">-- Class --</option>
                {(profile?.requested_classes || profile?.user_class || "").split(",").map((c) => (
                  <option key={c} value={c.trim()}>{c.trim()}</option>
                ))}
              </select>
            )}
            <input placeholder="Title" onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })} />
            <textarea
              placeholder="Write your announcement here..."
              rows={4}
              style={{ width: '100%', padding: '14px', marginBottom: '16px', border: '2px solid #f1f5f9', borderRadius: '12px', background: '#f8fafc', fontSize: '1rem', color: 'var(--text-main)', resize: 'vertical' }}
              onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
            />
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
                if (error) showError("Failed to delete assignment. Please try again.");
                else { setShowViewModal(false); fetchProfile(session?.user); }
              }}>Delete</button>
            )}
            <button className="secondary-btn" onClick={() => setShowViewModal(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ERROR TOAST */}
      <ErrorToast message={errorMsg} onClose={() => setErrorMsg(null)} />
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
              <span className={`status-badge ${u.is_approved ? 'status-approved' : 'status-pending'}`}>
                {u.is_approved ? "Approved ✅" : "Pending ⏳"}
              </span>
            </div>
            <button className="main-btn" onClick={async () => {
              await supabase.from("profiles").update({ is_approved: !u.is_approved }).eq("id", u.id);
              fetchUsers(); fetchProfile();
            }}>
              {u.is_approved ? "Revoke Access" : "Approve User"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
