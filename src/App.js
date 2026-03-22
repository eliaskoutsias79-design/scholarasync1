import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "./supabaseClient";
import "./styles.css";

// Official Greek School Class List
const AVAILABLE_CLASSES = [
  "Junior High A1",
  "Junior High A2",
  "Junior High A3",
  "Junior High A4",
  "Junior High A5",
  "Junior High B1",
  "Junior High B2",
  "Junior High B3",
  "Junior High B4",
  "Junior High B5",
  "Junior High C1",
  "Junior High C2",
  "Junior High C3",
  "Junior High C4",
  "Junior High C5",
  "High School A1",
  "High School A2",
  "High School A3",
  "High School A4",
  "High School A5",
  "High School B1",
  "High School B2",
  "High School B3",
  "High School B4",
  "High School B5",
  "High School C1",
  "High School C2",
  "High School C3",
  "High School C4",
  "High School C5",
];

export default function App() {
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);

  // Auth & Settings State
  const [authData, setAuthData] = useState({
    email: "",
    password: "",
    role: "student",
    userClass: "Junior High A1",
    teacherClasses: "",
    teacherSubjects: "",
  });
  const [tempSettings, setTempSettings] = useState({
    classes: "",
    subjects: "",
    userClass: "",
  });

  // Modal & Logic State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newHW, setNewHW] = useState({ title: "", subject: "", className: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchEvents(session.user);
        setTempSettings({
          classes: session.user.user_metadata.classes || "",
          subjects: session.user.user_metadata.subjects || "",
          userClass: session.user.user_metadata.userClass || "",
        });
      }
    });
  }, []);

  const fetchEvents = async (user) => {
    let query = supabase.from("assignments").select("*");
    // Filter view for students based on their specific class
    if (user.user_metadata.role === "student") {
      query = query.eq("class_name", user.user_metadata.userClass);
    }
    const { data, error } = await query;
    if (!error) {
      setEvents(
        data.map((ev) => ({
          id: ev.id,
          title: `[${ev.subject}] ${ev.title}`,
          start: ev.due_date,
          extendedProps: {
            subject: ev.subject,
            rawTitle: ev.title,
            className: ev.class_name,
          },
        }))
      );
    }
  };

  const handleUpdateSettings = async () => {
    await supabase.auth.updateUser({
      data: {
        classes: tempSettings.classes,
        subjects: tempSettings.subjects,
        userClass: tempSettings.userClass,
      },
    });
    alert("Settings Saved!");
    window.location.reload();
  };

  const handleAuth = async (type) => {
    const {
      email,
      password,
      role,
      userClass,
      teacherClasses,
      teacherSubjects,
    } = authData;
    const { data, error } =
      type === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                role,
                userClass,
                classes: teacherClasses,
                subjects: teacherSubjects,
              },
            },
          });
    if (error) alert(error.message);
    else {
      setSession(data.session);
      fetchEvents(data.session.user);
    }
  };

  if (!session) {
    return (
      <div className="auth-container">
        <h1>🏫 School Portal</h1>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) =>
            setAuthData({ ...authData, password: e.target.value })
          }
        />

        <label className="input-label">I am a:</label>
        <select
          className="auth-select"
          onChange={(e) => setAuthData({ ...authData, role: e.target.value })}
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>

        {authData.role === "student" ? (
          <>
            <label className="input-label">Select Your Class:</label>
            <select
              className="auth-select"
              onChange={(e) =>
                setAuthData({ ...authData, userClass: e.target.value })
              }
            >
              {AVAILABLE_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <input
              placeholder="Classes you teach (e.g. A1, B2)"
              onChange={(e) =>
                setAuthData({ ...authData, teacherClasses: e.target.value })
              }
            />
            <input
              placeholder="Subjects (e.g. Math, History)"
              onChange={(e) =>
                setAuthData({ ...authData, teacherSubjects: e.target.value })
              }
            />
          </>
        )}
        <button className="main-btn" onClick={() => handleAuth("login")}>
          Login
        </button>
        <button className="secondary-btn" onClick={() => handleAuth("signup")}>
          Create Account
        </button>
      </div>
    );
  }

  const role = session.user.user_metadata.role;

  return (
    <div className="App">
      <div className="header">
        <div className="user-info">
          <b>{role.toUpperCase()}</b>
          <span>
            {role === "student"
              ? ` | ${session.user.user_metadata.userClass}`
              : " | Dashboard"}
          </span>
        </div>
        <div className="nav-buttons">
          <button className="icon-btn" onClick={() => setShowSettings(true)}>
            ⚙️ Settings
          </button>
          <button
            className="logout-btn"
            onClick={() =>
              supabase.auth.signOut().then(() => window.location.reload())
            }
          >
            Logout
          </button>
        </div>
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={(arg) => {
          if (role === "teacher") {
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

      {/* --- SETTINGS MODAL --- */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Update Profile</h3>
            {role === "student" ? (
              <select
                value={tempSettings.userClass}
                onChange={(e) =>
                  setTempSettings({
                    ...tempSettings,
                    userClass: e.target.value,
                  })
                }
              >
                {AVAILABLE_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <label>Classes (separate with commas)</label>
                <input
                  value={tempSettings.classes}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      classes: e.target.value,
                    })
                  }
                />
                <label>Subjects (separate with commas)</label>
                <input
                  value={tempSettings.subjects}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      subjects: e.target.value,
                    })
                  }
                />
              </>
            )}
            <button className="main-btn" onClick={handleUpdateSettings}>
              Save Changes
            </button>
            <button
              className="secondary-btn"
              onClick={() => setShowSettings(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- ADD HOMEWORK MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Post Homework: {selectedDate}</h3>
            <label>Select Class</label>
            <select
              onChange={(e) =>
                setNewHW({ ...newHW, className: e.target.value })
              }
            >
              <option value="">-- Choose --</option>
              {(session.user.user_metadata.classes || "")
                .split(",")
                .map((c) => (
                  <option key={c} value={c.trim()}>
                    {c.trim()}
                  </option>
                ))}
            </select>
            <label>Select Subject</label>
            <select
              onChange={(e) => setNewHW({ ...newHW, subject: e.target.value })}
            >
              <option value="">-- Choose --</option>
              {(session.user.user_metadata.subjects || "")
                .split(",")
                .map((s) => (
                  <option key={s} value={s.trim()}>
                    {s.trim()}
                  </option>
                ))}
            </select>
            <label>Assignment Title</label>
            <input
              placeholder="e.g. Chapter 4 Exercises"
              onChange={(e) => setNewHW({ ...newHW, title: e.target.value })}
            />
            <button
              className="main-btn"
              onClick={async () => {
                if (!newHW.className || !newHW.subject || !newHW.title)
                  return alert("Please fill everything!");
                await supabase.from("assignments").insert([
                  {
                    title: newHW.title,
                    subject: newHW.subject,
                    class_name: newHW.className,
                    due_date: selectedDate,
                    teacher_id: session.user.id,
                  },
                ]);
                setShowAddModal(false);
                fetchEvents(session.user);
              }}
            >
              Post to Calendar
            </button>
            <button
              className="secondary-btn"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* --- VIEW HOMEWORK MODAL --- */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="tag-row">
              <span className="tag">{selectedEvent.subject}</span>
              <span className="tag class-tag">{selectedEvent.className}</span>
            </div>
            <h2>{selectedEvent.title}</h2>
            <p className="due-date">📅 Due: {selectedEvent.date}</p>
            <hr />
            {role === "student" ? (
              <button
                className="req-btn"
                onClick={() => alert("Teacher notified of typo!")}
              >
                Report Typo / Error
              </button>
            ) : (
              <button
                className="del-btn"
                onClick={async () => {
                  await supabase
                    .from("assignments")
                    .delete()
                    .eq("id", selectedEvent.id);
                  setShowViewModal(false);
                  fetchEvents(session.user);
                }}
              >
                Delete Assignment
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
