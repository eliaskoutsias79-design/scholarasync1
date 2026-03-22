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

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [view, setView] = useState("calendar"); 
  const [authMode, setAuthMode] = useState("login");

  const [authData, setAuthData] = useState({
    email: "", password: "", role: "student", userClass: "Junior High A1",
    teacherClasses: "", teacherSubjects: "",
  });
  const [tempSettings, setTempSettings] = useState({ classes: "", subjects: "", userClass: "" });

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newHW, setNewHW] = useState({ title: "", subject: "", className: "", type: "Homework" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user);
      else { setProfile(null); setEvents([]); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user) => {
    const { data: profData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (profData) {
      setProfile(profData);
      fetchEvents(profData, user.email);
      fetchTopAnnouncements(profData);
    }
    setLoading(false);
  };

  const fetchTopAnnouncements = async (prof) => {
    // Fetches the 3 most recent posts to show in the "News" ticker
    const { data } = await supabase.from("assignments")
      .select("*")
      .eq("class_name", prof.user_class)
      .order("created_at", { ascending: false })
      .limit(3);
    setAnnouncements(data || []);
  };

  const fetchEvents = async (prof, email) => {
    let query = supabase.from("assignments").select("*");
    if (email !== ADMIN_EMAIL) {
      if (prof.role === "student") query = query.eq("class_name", prof.user_class);
      else query = query.eq("teacher_id", prof.id);
    }

    const { data } = await query;
    if (data) {
      setEvents(data.map(ev => {
        // AUTOMATIC COLOR CODING
        const sub = ev.subject.toLowerCase();
        let color = "#64748b"; // Default Slate
        if (sub.includes("math") || sub.includes("μαθ")) color = "#3b82f6"; // Blue
        if (sub.includes("hist") || sub.includes("ιστ")) color = "#ef4444"; // Red
        if (sub.includes("phys") || sub.includes("φυσ")) color = "#10b981"; // Green
        if (sub.includes("anc") || sub.includes("αρχ")) color = "#8b5cf6"; // Purple

        return {
          id: ev.id,
          title: `[${ev.subject}] ${ev.title}`,
          start: ev.due_date,
          backgroundColor: color,
          borderColor: color,
          extendedProps: { ...ev },
        };
      }));
    }
  };

  const handleAuth = async () => {
    const { email, password, role, userClass, teacherClasses, teacherSubjects } = authData;
    const { data, error } = authMode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email, password,
          options: { data: { role, userClass } },
        });

    if (error) return alert(error.message);
    
    if (authMode === "signup" && data.user) {
        await supabase.from("profiles").update({
            role, 
            user_class: role === "student" ? userClass : null,
            requested_classes: role === "teacher" ? teacherClasses : null,
            requested_subjects: role === "teacher" ? teacherSubjects : null,
            is_approved: email === ADMIN_EMAIL
        }).eq("id", data.user.id);
        alert("Request Sent! Approval Pending.");
    }
  };

  if (loading) return <div className="loader"><h2>Scholars Loading...</h2></div>;

  if (!session) {
    return (
      <div className="auth-card">
        <h1>ScholarAsync ⚡</h1>
        <p className="subtitle">The School OS for the Modern Greek Student</p>
        <div className="auth-inputs">
            <input type="email" placeholder="Email" onChange={e => setAuthData({...authData, email: e.target.value})} />
            <input type="password" placeholder="Password" onChange={e => setAuthData({...authData, password: e.target.value})} />
            {authMode === "signup" && (
                <>
                <select onChange={e => setAuthData({...authData, role: e.target.value})}>
                    <option value="student">I am a Student</option>
                    <option value="teacher">I am a Teacher/Admin</option>
                </select>
                {authData.role === "student" && (
                    <select onChange={e => setAuthData({...authData, userClass: e.target.value})}>
                        {AVAILABLE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                )}
                </>
            )}
            <button className="prio-btn" onClick={handleAuth}>{authMode === "login" ? "Enter Portal" : "Join Your Team"}</button>
            <p className="toggle-link" onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
                {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="logo">ScholarAsync</div>
        <nav>
            <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>📅 Calendar</button>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>📝 All Tasks</button>
            {session.user.email === ADMIN_EMAIL && (
                <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>🛡️ Control Panel</button>
            )}
            <button onClick={() => setShowSettings(true)}>⚙️ Profile</button>
        </nav>
        <div className="user-tag">
            <small>{profile?.role?.toUpperCase()}</small>
            <p>{profile?.user_class || "Faculty"}</p>
            <button className="logout-lite" onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
      </aside>

      <main className="main-content">
        {/* TOP NEWS TICKER */}
        <div className="announcement-ticker">
            <div className="ticker-label">LATEST</div>
            <div className="ticker-text">
                {announcements.length > 0 
                  ? announcements.map(a => `• [${a.subject}] ${a.title} `).join(" ") 
                  : "Welcome to ScholarAsync. No new updates."}
            </div>
        </div>

        {view === "calendar" ? (
          <div className="calendar-card animate-in">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              height="auto"
              dateClick={(arg) => {
                if (profile?.role === "teacher" || session.user.email === ADMIN_EMAIL) {
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
        ) : view === "admin" ? <AdminPanel /> : (
            <div className="task-list">
                <h2>Pending Assignments</h2>
                {events.map(ev => (
                    <div className="task-item" style={{borderLeft: `5px solid ${ev.backgroundColor}`}}>
                        <span>{ev.start}</span>
                        <b>{ev.title}</b>
                    </div>
                ))}
            </div>
        )}
      </main>

      {/* MODALS */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Post to {selectedDate}</h3>
            <div className="modal-grid">
                <input placeholder="Title (e.g. Exercises 1-5)" onChange={e => setNewHW({...newHW, title: e.target.value})} />
                <input placeholder="Subject (e.g. Math)" onChange={e => setNewHW({...newHW, subject: e.target.value})} />
                <select onChange={e => setNewHW({...newHW, type: e.target.value})}>
                    <option value="Homework">🏠 Homework</option>
                    <option value="Test">⚠️ Test/Exam</option>
                    <option value="Material">📖 Class Material</option>
                </select>
            </div>
            <div className="modal-actions">
                <button className="prio-btn" onClick={async () => {
                    await supabase.from("assignments").insert([{
                        title: newHW.title, 
                        subject: newHW.subject,
                        class_name: profile.user_class || "General", 
                        due_date: selectedDate,
                        teacher_id: session.user.id
                    }]);
                    setShowAddModal(false);
                    fetchEvents(profile, session.user.email);
                }}>Publish</button>
                <button className="sec-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="badge">{selectedEvent?.subject}</div>
            <h2>{selectedEvent?.title}</h2>
            <p className="date-label">📅 Due: {selectedEvent?.date}</p>
            <div className="modal-actions">
                {(profile?.role !== "student" || session.user.email === ADMIN_EMAIL) && (
                    <button className="del-btn" onClick={async () => {
                        await supabase.from("assignments").delete().eq("id", selectedEvent.id);
                        setShowViewModal(false);
                        fetchEvents(profile, session.user.email);
                    }}>Delete Post</button>
                )}
                <button onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ... AdminPanel function remains the same ...
