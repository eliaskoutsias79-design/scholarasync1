import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabaseClient";
import "./styles.css";

const ADMIN_EMAIL = "your-admin-email@gmail.com"; // Change to your admin email

function App({ session }) {
  const [view, setView] = useState("calendar");
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [announcement, setAnnouncement] = useState("Welcome to ScholarAsync!");
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchProfile();
    fetchEvents();
  }, []);

  async function fetchProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    setProfile(data);
  }

  async function fetchEvents() {
    const { data } = await supabase.from("homework").select("*");
    const formatted = data.map((h) => ({
      id: h.id,
      title: `[${h.subject}] ${h.title}`,
      start: h.due_date,
      description: h.description,
      subject: h.subject,
      color: h.subject === "Math" ? "#6366f1" : "#ef4444",
    }));
    setEvents(formatted);
  }

  const handleDateClick = (arg) => {
    if (session.user.email === ADMIN_EMAIL) {
      const title = prompt("Task Title:");
      const subject = prompt("Subject (Math, History, etc.):");
      if (title) {
        saveEvent({ title, subject, due_date: arg.dateStr });
      }
    }
  };

  async function saveEvent(event) {
    await supabase.from("homework").insert([event]);
    fetchEvents();
  }

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR / MOBILE DOCK */}
      <aside className="sidebar">
        <div className="logo">ScholarAsync</div>

        <nav>
          <button 
            className={view === "calendar" ? "active" : ""} 
            onClick={() => setView("calendar")}
          >
            <span>📅</span>
            <span className="desktop-only">Calendar</span>
          </button>
          
          <button 
            className={view === "list" ? "active" : ""} 
            onClick={() => setView("list")}
          >
            <span>📝</span>
            <span className="desktop-only">All Tasks</span>
          </button>

          {session.user.email === ADMIN_EMAIL && (
            <button 
              className={view === "admin" ? "active" : ""} 
              onClick={() => setView("admin")}
            >
              <span>🛡️</span>
              <span className="desktop-only">Admin Panel</span>
            </button>
          )}
        </nav>

        {/* MATERIAL INFO & SIGN OUT */}
        <div className="user-tag">
          <small className="desktop-only">{profile?.role?.toUpperCase() || "USER"}</small>
          <p className="desktop-only">{profile?.user_class || "Scholar"}</p>
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

        {view === "list" && (
          <div className="task-list animate-in">
             <h2>Upcoming Tasks</h2>
             {events.map(event => (
               <div key={event.id} className="task-item" onClick={() => setSelectedEvent(event)}>
                 <div>
                   <strong>{event.title}</strong>
                   <p>{event.start}</p>
                 </div>
                 <span>➡️</span>
               </div>
             ))}
          </div>
        )}

        {/* ASSIGNMENT DETAILS MODAL */}
        {selectedEvent && (
          <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>{selectedEvent.title}</h3>
              <p><strong>Due:</strong> {selectedEvent.startStr || selectedEvent.start}</p>
              <hr />
              <p>{selectedEvent.extendedProps?.description || "No additional details provided."}</p>
              <button className="prio-btn" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
