import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabaseClient";
import "./styles.css";

// CHANGE THIS TO YOUR ACTUAL EMAIL
const ADMIN_EMAIL = "your-email@example.com"; 

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
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("calendar"); // "calendar" or "admin"

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
  const [newHW, setNewHW] = useState({ title: "", subject: "", className: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user);
    });
  }, []);

  const fetchProfile = async (user) => {
    const { data: profData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!error) {
      setProfile(profData);
      setTempSettings({
        classes: profData.requested_classes || "",
        subjects: profData.requested_subjects || "",
        userClass: profData.user_class || "",
      });
      fetchEvents(profData);
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
    })));
  };

  const handleAuth = async (type) => {
    const { email, password, role, userClass, teacherClasses, teacherSubjects } = authData;
    const processedClasses = teacherClasses.split(",").map(c => formatClassName(c)).join(", ");

    const { data, error } = type === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email, password,
          options: { data: { role, userClass, classes: processedClasses, subjects: teacherSubjects } },
        });

    if (error) alert(error.message);
    else if (data.session) {
      setSession(data.session);
      fetchProfile(data.session.user);
    }
  };

  if (!session) {
    return (
      <div className="auth-container">
        <h1>🏫 School Portal</h1>
        <input type="email" placeholder="Email" onChange={e => setAuthData({ ...authData, email: e.target.value })} />
        <input type="password" placeholder="Password" onChange={e => setAuthData({ ...authData, password: e.target.value })} />
        <label className="input-label">I am a:</label>
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
        <button className="main-btn" onClick={() => handleAuth("login")}>Login</button>
        <button className="secondary-btn" onClick={() => handleAuth("signup")}>Sign Up</button>
      </div>
    );
  }

  if (profile && !profile.is_approved && session.user.email !== ADMIN_EMAIL) {
    return (
      <div className="auth-container">
        <div className="waiting-screen">
          <h2>⏳ Approval Pending</h2>
          <p>Your request is being reviewed by the admin.</p>
          <button className="logout-btn" onClick={() => supabase.auth.signOut().then(() => window.location.reload())}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="header">
        <div className="user-info">
          <b>{profile?.role.toUpperCase()}</b>
          <span> | {session.user.email}</span>
        </div>
        <div className="nav-buttons">
          {session.user.email === ADMIN_EMAIL && (
            <button className="admin-toggle-btn" onClick={() => setView(view === "calendar" ? "admin" : "calendar")}>
              {view === "calendar" ? "🛡️ Admin Panel" : "📅 Calendar"}
            </button>
          )}
          <button className="icon-btn" onClick={() => setShowSettings(true)}>⚙️</button>
          <button className="logout-btn" onClick={() => supabase.auth.signOut().then(() => window.location.reload())}>Logout</button>
        </div>
      </div>

      {view === "admin" ? (
        <AdminPanel />
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          dateClick={(arg) => {
            if (profile?.role === "teacher") {
              setSelectedDate(arg.dateStr);
              setShowAddModal(true);
            }
          }}
          eventClick={(info) => {
            setSelectedEvent({
              id: info.event.id,
              title: info.event.extendedProps.rawTitle,
              subject: info.event.extendedProps.subject,
              className: info.event.extendedProps.className,
              date: info.event.startStr,
            });
            setShowViewModal(true);
          }}
        />
      )}

      {/* --- Modals for Settings, Add, View follow the same patterns as before --- */}
      {/* (Shortened for brevity, use your existing Modal JSX here) */}
    </div>
  );
}

// --- NEW ADMIN COMPONENT ---
function AdminPanel() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("is_approved", { ascending: true });
    setUsers(data || []);
  };

  const toggleApproval = async (id, currentStatus) => {
    await supabase.from("profiles").update({ is_approved: !currentStatus }).eq("id", id);
    fetchUsers();
  };

  const deleteUser = async (id) => {
    if (window.confirm("Delete this user's profile?")) {
      await supabase.from("profiles").delete().eq("id", id);
      fetchUsers();
    }
  };

  return (
    <div className="admin-panel">
      <h2>User Management</h2>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Request</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td><span className={`tag ${u.role === 'teacher' ? '' : 'class-tag'}`}>{u.role}</span></td>
              <td>{u.role === 'teacher' ? u.requested_classes : u.user_class}</td>
              <td>{u.is_approved ? "✅ Approved" : "⏳ Pending"}</td>
              <td>
                <button onClick={() => toggleApproval(u.id, u.is_approved)}>
                  {u.is_approved ? "Revoke" : "Approve"}
                </button>
                <button className="del-btn-small" onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
