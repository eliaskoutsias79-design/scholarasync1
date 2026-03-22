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
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("calendar"); 
  const [authMode, setAuthMode] = useState("login");
  const [authData, setAuthData] = useState({
    email: "", password: "", role: "student", userClass: "Junior High A1",
    teacherClasses: "", teacherSubjects: "",
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newHW, setNewHW] = useState({ title: "", subject: "", className: "" });

  // --- GATEKEEPER LOGIC ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user);
      else { setProfile(null); setEvents([]); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!error && data) {
      setProfile(data);
      fetchEvents(data);
    }
  };

  const fetchEvents = async (prof) => {
    let query = supabase.from("assignments").select("*");
    if (prof.role === "student") query = query.eq("class_name", prof.user_class);
    else query = query.eq("teacher_id", prof.id);

    const { data } = await query;
    if (data) setEvents(data.map(ev => ({
      id: ev.id, title: `[${ev.subject}] ${ev.title}`, start: ev.due_date,
      extendedProps: { subject: ev.subject, rawTitle: ev.title, className: ev.class_name },
      color: ev.subject === "Math" ? "#6366f1" : "#10b981"
    })));
  };

  const handleAuth = async () => {
    const { email, password, role, userClass, teacherClasses, teacherSubjects } = authData;
    const processedClasses = teacherClasses.split(",").map(c => formatClassName(c)).join(", ");

    const { data, error } = authMode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email, password,
          options: { data: { role, userClass, classes: processedClasses, subjects: teacherSubjects } },
        });

    if (error) alert(error.message);
    else if (authMode === "signup") alert("Registration request sent! Please wait for admin approval.");
  };

  // --- RENDER LOGIN ---
  if (!session) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>🏫 School Portal</h1>
          <input type="email" placeholder="Email" onChange={e => setAuthData({ ...authData, email: e.target.value })} />
          <input type="password" placeholder="Password" onChange={e => setAuthData({ ...authData, password: e.target.value })} />
          {authMode === "signup" && (
            <div className="signup-fields">
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

  // --- RENDER APPROVAL PENDING ---
  if (profile && !profile.is_approved && session.user.email !== ADMIN_EMAIL) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>⏳ Approval Pending</h2>
          <p>Contact your administrator to verify your account.</p>
          <button className="main-btn" onClick={() => supabase.auth.signOut()}>Logout</button>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN DASHBOARD ---
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo">ScholarAsync</div>
        <nav>
          <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>
            <span className="icon-span">📅</span><span className="desktop-only">Calendar</span>
          </button>
          {session.user.email === ADMIN_EMAIL && (
            <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>
              <span className="icon-span">🛡️</span><span className="desktop-only">Admin</span>
            </button>
          )}
        </nav>
        <div className="user-tag">
          <div className="desktop-only">
            <small>{profile?.role?.toUpperCase()}</small>
            <p>{profile?.user_class || "Faculty"}</p>
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
          <AdminPanel fetchProfile={() => fetchProfile(session.user)} />
        ) : (
          <div className="calendar-card">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              dateClick={(arg) => {
                if ((profile?.role === "teacher" || session.user.email === ADMIN_EMAIL) && profile?.is_approved) {
                  setSelectedDate(arg.dateStr);
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
            <select onChange={(e) => setNewHW({ ...newHW, className: e.target.value })}>
              <option value="">-- Class --</option>
              {(profile?.requested_classes || "").split(",").map((c) => (
                <option key={c} value={c.trim()}>{c.trim()}</option>
              ))}
            </select>
            <select onChange={(e) => setNewHW({ ...newHW, subject: e.target.value })}>
              <option value="">-- Subject --</option>
              {(profile?.requested_subjects || "").split(",").map((s) => (
                <option key={s} value={s.trim()}>{s.trim()}</option>
              ))}
            </select>
            <input placeholder="Assignment Title" onChange={(e) => setNewHW({ ...newHW, title: e.target.value })} />
            <button className="main-btn" onClick={async () => {
                if (!newHW.className || !newHW.subject || !newHW.title) return alert("Fill all fields!");
                await supabase.from("assignments").insert([{
                    title: newHW.title, subject: newHW.subject,
                    class_name: newHW.className, due_date: selectedDate,
                    teacher_id: session.user.id,
                }]);
                setShowAddModal(false); fetchProfile(session.user);
            }}>Post</button>
            <button className="secondary-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
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
            {(profile?.role !== "student" || session.user.email === ADMIN_EMAIL) && (
              <button className="del-btn" onClick={async () => {
                  await supabase.from("assignments").delete().eq("id", selectedEvent.id);
                  setShowViewModal(false); fetchProfile(session.user);
              }}>Delete</button>
            )}
            <button className="secondary-btn" onClick={() => setShowViewModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

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
              <strong>{u.email}</strong>
              <p>{u.role} | {u.is_approved ? "Approved ✅" : "Pending ⏳"}</p>
            </div>
            <button className="main-btn" onClick={async () => {
              await supabase.from("profiles").update({ is_approved: !u.is_approved }).eq("id", u.id);
              fetchUsers(); fetchProfile();
            }}>Toggle Approval</button>
          </div>
        ))}
      </div>
    </div>
  );
}
