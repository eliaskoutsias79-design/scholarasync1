import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabaseClient";
import "./styles.css";

// CHANGE THIS to your actual admin email
const ADMIN_EMAIL = "your-admin-email@gmail.com"; 

function App({ session }) {
  // --- STATE ---
  const [view, setView] = useState("calendar");
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [announcement] = useState("Welcome to ScholarAsync! 🚀");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (session?.user?.id) {
      const loadData = async () => {
        setIsSyncing(true);
        await Promise.all([fetchProfile(), fetchEvents()]);
        setIsSyncing(false);
      };
      loadData();
    }
  }, [session]);

  // --- DATABASE FUNCTIONS ---
  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      if (error) throw error;
      if (data) setProfile(data);
    } catch (e) {
      console.error("Profile Error:", e.message);
    }
  }

  async function fetchEvents() {
    try {
      const { data, error } = await supabase.from("homework").select("*");
      
      if (error) throw error;
      if (!data) return; // CRITICAL: Stop if table is empty

      const formatted = data.map((h) => ({
        id: h.id,
        title: `[${h.subject || 'Task'}] ${h.title}`,
        start: h.due_date,
        // Using extendedProps to store all your extra data safely
        extendedProps: {
          description: h.description || "No description provided.",
          subject: h.subject || "General"
        },
        color: h.subject === "Math" ? "#6366f1" : h.subject === "History" ? "#ef4444" : "#10b981",
      }));
      setEvents(formatted);
    } catch (e) {
      console.error("Events Error:", e.message);
    }
  }

  async function saveEvent(newEvent) {
    try {
      const { error } = await supabase.from("homework").insert([newEvent]);
      if (error) throw error;
      fetchEvents(); // Refresh list after saving
    } catch (e) {
      alert("Error saving: " + e.message);
    }
  }

  // --- HANDLERS ---
  const handleDateClick = (arg) => {
    if (session?.user?.email === ADMIN_EMAIL) {
      const title = prompt("Task Title:");
      const subject = prompt("Subject (Math, History, etc.):");
      const description = prompt("Assignment Description:");
      
      if (title && subject) {
        saveEvent({ 
          title, 
          subject, 
          description, 
          due_date: arg.dateStr 
        });
      }
    }
  };

  // --- RENDER ---
  return (
    <div className="dashboard-layout">
      {/* SIDEBAR & MOBILE DOCK */}
      <aside className="sidebar">
        <div className="logo">ScholarAsync</div>

        <nav>
          <button 
            className={view === "calendar" ? "active" : ""} 
            onClick={() => setView("calendar")}
          >
            <span className="icon-span">📅</span>
            <span className="desktop-only">Calendar</span>
          </button>
          
          <button 
            className={view === "list" ? "active" : ""} 
            onClick={() => setView("list")}
          >
            <span className="icon-span">📝</span>
            <span className="desktop-only">All Tasks</span>
          </button>

          {session?.user?.email === ADMIN_EMAIL && (
            <button 
              className={view === "admin" ? "active" : ""} 
              onClick={() => setView("admin")}
            >
              <span className="icon-span">🛡️</span>
              <span className="desktop-only">Admin Console</span>
            </button>
          )}
        </nav>

        {/* MATERIAL USER INFO */}
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

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        <div className="announcement-ticker">
          <span className="ticker-label">LATEST</span>
          <div className="ticker-text">{announcement}</div>
        </div>

        {/* CALENDAR VIEW */}
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

        {/* LIST VIEW */}
        {view === "list" && (
          <div className="task-list animate-in">
             <h2>Upcoming Assignments</h2>
             <div className="task-grid">
               {events.length > 0 ? events.map(event => (
                 <div key={event.id} className="task-item" onClick={() => setSelectedEvent(event)}>
                   <div className="task-info">
                     <span className="task-subject" style={{background: event.color}}>
                        {event.extendedProps.subject}
                     </span>
                     <strong>{event.title}</strong>
                     <p>Due: {event.start}</p>
                   </div>
                   <span className="arrow">➡️</span>
                 </div>
               )) : <p>No tasks found. Relax!</p>}
             </div>
          </div>
        )}

        {/* ASSIGNMENT MODAL (FIXED FOR MOBILE OVERLAP) */}
        {selectedEvent && (
          <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedEvent.title}</h3>
                <button className="close-btn" onClick={() => setSelectedEvent(null)}>×</button>
              </div>
              <div className="modal-body">
                <p className="modal-due">📅 <strong>Due Date:</strong> {selectedEvent.startStr || selectedEvent.start}</p>
                <hr />
                <p className="modal-desc">
                  {selectedEvent.extendedProps?.description || "No specific instructions provided for this assignment."}
                </p>
              </div>
              <button className="prio-btn" onClick={() => setSelectedEvent(null)}>Dismiss</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
