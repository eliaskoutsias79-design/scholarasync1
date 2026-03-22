import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabaseClient";
import "./styles.css";

const ADMIN_EMAIL = "your-admin-email@gmail.com"; 

function App({ session }) {
  const [view, setView] = useState("calendar");
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true); // SAFETY GUARD
  const [announcement] = useState("Welcome to ScholarAsync! 🚀");
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      initializeApp();
    }
  }, [session]);

  async function initializeApp() {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchEvents()]);
    setLoading(false);
  }

  async function fetchProfile() {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      if (data) setProfile(data);
    } catch (e) { console.error("Profile error:", e); }
  }

  async function fetchEvents() {
    try {
      const { data } = await supabase.from("homework").select("*");
      if (!data) return; // CRASH PREVENTION

      const formatted = data.map((h) => ({
        id: h.id,
        title: `[${h.subject}] ${h.title}`,
        start: h.due_date,
        description: h.description,
        subject: h.subject,
        color: h.subject === "Math" ? "#6366f1" : "#ef4444",
        extendedProps: { description: h.description }
      }));
      setEvents(formatted);
    } catch (e) { console.error("Events error:", e); }
  }

  const handleDateClick = (arg) => {
    if (session.user.email === ADMIN_EMAIL) {
      const title = prompt("Task Title:");
      const subject = prompt("Subject (Math, History, etc.):");
      const description = prompt("Description:");
      if (title) saveEvent({ title, subject, description, due_date: arg.dateStr });
    }
  };

  async function saveEvent(event) {
    await supabase.from("homework").insert([event]);
    fetchEvents();
  }

  if (loading) return <div className="loading-screen">✨ Lighting the Fire...</div>;

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR / MOBILE DOCK */}
      <aside className="sidebar">
        <div className="logo">ScholarAsync</div>

        <nav>
          <button className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}>
            <span>📅</span>
            <span className="desktop-only">Calendar</span>
          </button>
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
            <span>📝</span>
            <span className="desktop-only">All Tasks</span>
          </button>
        </nav>

        <div className="user-tag">
          <div className="desktop-only">
            <small>{profile?.role?.toUpperCase() || "STUDENT"}</small>
            <p>{profile?.user_class || "Junior High A1"}</p>
          </div>
          <button className="logout-lite" onClick={() => supabase.auth.signOut()}>
            <span className="mobile-only">🚪</span>
            <span className="desktop-only">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="announcement-ticker">
          <span className="ticker-label">LATEST</span>
          <div className="ticker-text">{announcement}</div>
        </div>

        {view === "calendar" && (
          <div className="calendar-card animate-in">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              dateClick={handleDateClick}
              eventClick={(info) => setSelectedEvent(info.event)}
              height="auto"
            />
          </div>
        )}

        {/* MODAL (ALWAYS ON TOP) */}
        {selectedEvent && (
          <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedEvent.title}</h3>
                <button className="close-x" onClick={() => setSelectedEvent(null)}>×</button>
              </div>
              <p className="due-tag">📅 Due: {selectedEvent.startStr || selectedEvent.start}</p>
              <div className="modal-body">
                {selectedEvent.extendedProps?.description || "No extra details provided."}
              </div>
              <button className="prio-btn" onClick={() => setSelectedEvent(null)}>Got it!</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
