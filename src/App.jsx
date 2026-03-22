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

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newHW, setNewHW] = useState({ title: "", subject: "", type: "Homework" });

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
        const sub = ev.subject.toLowerCase();
        let color = "#64748b"; 
        if (sub.includes("math") || sub.includes("μαθ")) color = "#3b82f6";
        if (sub.includes("hist") || sub.includes("ιστ")) color = "#ef4444";
        if (sub.includes("phys") || sub.includes("φυσ")) color = "#10b981";
        if (sub.includes("anc") || sub.includes("αρχ")) color = "#8b5cf6";

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
      : await supabase.auth.signUp({ email, password });

    if (error) return alert(error.message);
    
    if (authMode === "signup" && data.user) {
        await supabase.from("profiles").update({
            role, 
            user_class: role === "student" ? userClass : null,
            requested_classes: role === "teacher" ? teacherClasses : null,
            requested_subjects: role === "teacher" ? teacherSubjects : null,
            is_approved: email === ADMIN_EMAIL
        }).eq("id", data.user.id);
        alert("Registration request sent!");
    }
  };

  if (loading) return <div className="loader"><h2>Loading ScholarAsync...</h2></div>;

  if (!session) {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f1f5f9'}}>
        <div className="auth-card">
          <h1>ScholarAsync ⚡</h1>
          <p className="subtitle">School Management System</p>
          <input type="email" placeholder="Email" onChange={e => setAuthData({...authData, email: e.target.value})} />
          <input type="password" placeholder="Password" onChange={e => setAuthData({...authData, password: e.target.value})} />
          {authMode === "signup" && (
            <>
              <select onChange={e => setAuthData({...authData, role: e.target.value})}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              {authData.role === "student" && (
                <select onChange={e => setAuthData({...authData, userClass: e.target.value})}>
                  {AVAILABLE_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
            </>
          )}
          <button className="prio-btn" onClick={handleAuth}>{authMode === "login" ? "Enter Portal" : "Register"}</button>
          <p className="logout-lite" style={{textAlign: 'center', cursor: 'pointer'}} onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>
            {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo">ScholarAsync</div>
        <nav>
          <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>📅 Calendar</button>
          {session.user.email === ADMIN_EMAIL && (
            <button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>🛡️ Control Panel</button>
          )}
        </nav>
        <div className="user-tag">
          <small>{profile?.role?.toUpperCase()}</small>
          <p>{profile?.user_class || "Faculty"}</p>
          <button className="logout-lite" onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="announcement-ticker">
          <div className="ticker-label">LATEST</div>
          <div className="ticker-text">
            {announcements.length > 0 
              ? announcements.map(a => `• [${a.subject}] ${a.title} `).join(" ") 
              : "Welcome to ScholarAsync. No new updates."}
          </div>
        </div>

        {view === "calendar" ? (
          <div className="calendar-card">
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
        ) : (
          <AdminPanel />
        )}
      </main>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Post to {selectedDate}</h3>
            <input placeholder="Subject (e.g. Math)" style={{marginBottom: '10px'}} onChange={e => setNewHW({...newHW, subject: e.target.value})} />
            <input placeholder="Assignment Title" style={{marginBottom: '10px'}} onChange={e => setNewHW({...newHW, title: e.target.value})} />
            <div style={{display: 'flex', gap: '10px'}}>
              <button className="prio-btn" style={{flex: 1}} onClick={async () => {
                await supabase.from("assignments").insert([{
                  title: newHW.title, subject: newHW.subject,
                  class_name: profile.user_class || "General", due_date: selectedDate,
                  teacher_id: session.user.id,
                }]);
                setShowAddModal(false);
                fetchEvents(profile, session.user.email);
              }}>Publish</button>
              <button className="sec-btn" style={{flex: 1}} onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{background: '#e0e7ff', color: '#4338ca', display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', marginBottom: '10px'}}>
              {selectedEvent?.subject}
            </div>
            <h2 style={{margin: '0 0 10px 0'}}>{selectedEvent?.title}</h2>
            <p style={{color: '#64748b'}}>📅 Due Date: {selectedEvent?.date}</p>
            <div className="modal-actions" style={{marginTop: '20px'}}>
              {(profile?.role !== "student" || session.user.email === ADMIN_EMAIL) && (
                <button className="prio-btn" style={{background: '#ef4444', width: '100%', marginBottom: '10px'}} onClick={async () => {
                  await supabase.from("assignments").delete().eq("id", selectedEvent.id);
                  setShowViewModal(false);
                  fetchEvents(profile, session.user.email);
                }}>Delete Assignment</button>
              )}
              <button className="sec-btn" style={{width: '100%'}} onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("is_approved", { ascending: true });
    setUsers(data || []);
  };
  useEffect(() => { fetchUsers(); }, []);

  const toggleApproval = async (id, status) => {
    await supabase.from("profiles").update({ is_approved: !status }).eq("id", id);
    fetchUsers();
  };

  const deleteUser = async (id) => {
    if (window.confirm("Delete this user permanently?")) {
      await supabase.from("profiles").delete().eq("id", id);
      fetchUsers();
    }
  };

  return (
    <div className="calendar-card">
      <h2>User Management</h2>
      <div style={{overflowX: 'auto'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
          <thead>
            <tr style={{textAlign: 'left', background: '#f8fafc', color: '#64748b', fontSize: '12px'}}>
              <th style={{padding: '12px'}}>Email</th>
              <th style={{padding: '12px'}}>Role</th>
              <th style={{padding: '12px'}}>Status</th>
              <th style={{padding: '12px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                <td style={{padding: '12px', fontSize: '14px'}}>{u.email}</td>
                <td style={{padding: '12px', fontSize: '14px'}}>{u.role}</td>
                <td style={{padding: '12px'}}>{u.is_approved ? "✅ Approved" : "⏳ Pending"}</td>
                <td style={{padding: '12px'}}>
                  <button className="sec-btn" style={{padding: '5px 10px', fontSize: '12px', marginRight: '5px'}} onClick={() => toggleApproval(u.id, u.is_approved)}>Toggle</button>
                  <button className="prio-btn" style={{padding: '5px 10px', fontSize: '12px', background: '#fee2e2', color: '#dc2626'}} onClick={() => deleteUser(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
