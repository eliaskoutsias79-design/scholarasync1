import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import elLocale from "@fullcalendar/core/locales/el";
import { supabase } from "../supabaseClient";
import { translate } from "../contexts/LanguageContext";

const EMPTY_ASSIGNMENT = {
  title: "",
  subject: "",
  due_date: "",
  priority: "medium",
  status: "not_started",
  notes: "",
  external_url: "",
  reminder_at: "",
  group_id: "",
};

const toLocalInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
};

export default function Calendar({
  language,
  events,
  profile,
  isAdmin,
  setSelectedDate,
  setSelectedClasses,
  setNewHW,
  setShowAddModal,
  setSelectedEvent,
  setShowViewModal,
}) {
  const [assignments, setAssignments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [saving, setSaving] = useState(false);

  const text =
    language === "el"
      ? {
          deadlines: "Οι προθεσμίες μου",
          upcoming: "Επόμενες προθεσμίες",
          add: "+ Νέα προθεσμία",
          edit: "Επεξεργασία προθεσμίας",
          new: "Νέα προθεσμία",
          title: "Τίτλος",
          subject: "Μάθημα",
          date: "Ημερομηνία παράδοσης",
          priority: "Προτεραιότητα",
          status: "Κατάσταση",
          notes: "Σημειώσεις",
          link: "Σύνδεσμος eClass ή αρχείου",
          reminder: "Υπενθύμιση",
          sharing: "Κοινή χρήση",
          private: "Μόνο εγώ",
          shared: "Κοινόχρηστη",
          low: "Χαμηλή",
          medium: "Μεσαία",
          high: "Υψηλή",
          notStarted: "Δεν ξεκίνησε",
          inProgress: "Σε εξέλιξη",
          completed: "Ολοκληρώθηκε",
          save: "Αποθήκευση",
          cancel: "Ακύρωση",
          remove: "Διαγραφή",
          empty: "Δεν υπάρχουν προσωπικές προθεσμίες ακόμη.",
          noUpcoming: "Δεν υπάρχουν επόμενες προθεσμίες.",
          loading: "Φόρτωση...",
          dueToday: "Σήμερα",
          overdue: "Εκπρόθεσμη",
          readOnly: "Μόνο ο δημιουργός μπορεί να την επεξεργαστεί.",
          confirmDelete: "Να διαγραφεί αυτή η προθεσμία;",
        }
      : {
          deadlines: "My deadlines",
          upcoming: "Upcoming deadlines",
          add: "+ New deadline",
          edit: "Edit deadline",
          new: "New deadline",
          title: "Title",
          subject: "Subject",
          date: "Due date",
          priority: "Priority",
          status: "Status",
          notes: "Notes",
          link: "eClass or file link",
          reminder: "Reminder",
          sharing: "Share with",
          private: "Only me",
          shared: "Shared",
          low: "Low",
          medium: "Medium",
          high: "High",
          notStarted: "Not started",
          inProgress: "In progress",
          completed: "Completed",
          save: "Save",
          cancel: "Cancel",
          remove: "Delete",
          empty: "No personal deadlines yet.",
          noUpcoming: "No upcoming deadlines.",
          loading: "Loading...",
          dueToday: "Today",
          overdue: "Overdue",
          readOnly: "Only the creator can edit this deadline.",
          confirmDelete: "Delete this deadline?",
        };

  useEffect(() => {
    if (!profile?.id) {
      setAssignments([]);
      setGroups([]);
      setLoadingAssignments(false);
      return;
    }

    let active = true;
    const loadAssignments = async () => {
      setLoadingAssignments(true);
      const { data, error } = await supabase
        .from("personal_assignments")
        .select("*")
        .order("due_date", { ascending: true });
      if (active) {
        if (error) console.error("Could not load assignments:", error);
        setAssignments(data || []);
        setLoadingAssignments(false);
      }
    };

    const loadGroups = async () => {
      const { data, error } = await supabase
        .from("study_group_members")
        .select("group_id, group:study_groups(id, name)")
        .eq("user_id", profile.id);
      if (active) {
        if (error) console.error("Could not load Study Groups:", error);
        setGroups((data || []).map((row) => row.group).filter(Boolean));
      }
    };

    loadAssignments();
    loadGroups();

    const channel = supabase
      .channel(`assignment-calendar-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "personal_assignments" },
        loadAssignments
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const groupNames = useMemo(
    () => Object.fromEntries(groups.map((group) => [group.id, group.name])),
    [groups]
  );

  const upcomingAssignments = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return assignments
      .filter(
        (assignment) =>
          assignment.status !== "completed" && assignment.due_date >= today
      )
      .slice(0, 8);
  }, [assignments]);

  const calendarEvents = useMemo(() => {
    const personalEvents = assignments.map((assignment) => ({
      id: `assignment-${assignment.id}`,
      title: `${assignment.status === "completed" ? "✓ " : ""}${
        assignment.group_id ? "👥 " : ""
      }${assignment.title}`,
      start: assignment.due_date,
      allDay: true,
      backgroundColor:
        assignment.status === "completed"
          ? "#22a06b"
          : assignment.priority === "high"
          ? "#dc4c64"
          : assignment.priority === "low"
          ? "#4d8fe8"
          : "#8b5cf6",
      borderColor: "transparent",
      extendedProps: { source: "personal_assignment", assignment },
    }));
    return [...(events || []), ...personalEvents];
  }, [events, assignments]);

  const openNewAssignment = (date = "") => {
    setEditingAssignment(null);
    setAssignmentForm({ ...EMPTY_ASSIGNMENT, due_date: date });
    setShowAssignmentModal(true);
  };

  const openExistingAssignment = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      title: assignment.title || "",
      subject: assignment.subject || "",
      due_date: assignment.due_date || "",
      priority: assignment.priority || "medium",
      status: assignment.status || "not_started",
      notes: assignment.notes || "",
      external_url: assignment.external_url || "",
      reminder_at: toLocalInputValue(assignment.reminder_at),
      group_id: assignment.group_id || "",
    });
    setShowAssignmentModal(true);
  };

  const closeAssignmentModal = () => {
    if (saving) return;
    setShowAssignmentModal(false);
    setEditingAssignment(null);
    setAssignmentForm(EMPTY_ASSIGNMENT);
  };

  const saveAssignment = async (event) => {
    event.preventDefault();
    if (!profile?.id || !assignmentForm.title.trim() || !assignmentForm.due_date)
      return;

    setSaving(true);
    const payload = {
      user_id: profile.id,
      title: assignmentForm.title.trim(),
      subject: assignmentForm.subject.trim() || null,
      due_date: assignmentForm.due_date,
      priority: assignmentForm.priority,
      status: assignmentForm.status,
      notes: assignmentForm.notes.trim() || null,
      external_url: assignmentForm.external_url.trim() || null,
      reminder_at: assignmentForm.reminder_at
        ? new Date(assignmentForm.reminder_at).toISOString()
        : null,
      reminder_sent_at: null,
      group_id: assignmentForm.group_id || null,
    };

    const query = editingAssignment
      ? supabase
          .from("personal_assignments")
          .update(payload)
          .eq("id", editingAssignment.id)
          .eq("user_id", profile.id)
      : supabase.from("personal_assignments").insert(payload);
    const { error } = await query;
    setSaving(false);
    if (error) return alert(error.message);
    closeAssignmentModal();
  };

  const deleteAssignment = async () => {
    if (!editingAssignment || !window.confirm(text.confirmDelete)) return;
    setSaving(true);
    const { error } = await supabase
      .from("personal_assignments")
      .delete()
      .eq("id", editingAssignment.id)
      .eq("user_id", profile.id);
    setSaving(false);
    if (error) return alert(error.message);
    closeAssignmentModal();
  };

  const updateField = (field, value) =>
    setAssignmentForm((current) => ({ ...current, [field]: value }));

  const formatDueDate = (value) =>
    new Intl.DateTimeFormat(language === "el" ? "el-GR" : "en-GB", {
      day: "numeric",
      month: "short",
    }).format(new Date(`${value}T12:00:00`));

  const isOwner =
    !editingAssignment || editingAssignment.user_id === profile?.id;

  return (
    <>
      <div className="calendar-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>📅 {text.deadlines}</h2>
            {loadingAssignments && <small style={{ color: "var(--text-muted)" }}>{text.loading}</small>}
            {!loadingAssignments && assignments.length === 0 && <small style={{ color: "var(--text-muted)" }}>{text.empty}</small>}
          </div>
          <button type="button" className="main-btn" style={{ width: "auto", padding: "10px 16px" }} onClick={() => openNewAssignment()}>
            {text.add}
          </button>
        </div>

        <div style={{ marginBottom: 22, padding: 14, borderRadius: 16, background: "var(--surface, rgba(255,255,255,.65))", border: "1px solid var(--border, rgba(128,128,128,.18))" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "1rem" }}>⏳ {text.upcoming}</h3>
          {upcomingAssignments.length === 0 ? (
            <small style={{ color: "var(--text-muted)" }}>{text.noUpcoming}</small>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {upcomingAssignments.map((assignment) => (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() => openExistingAssignment(assignment)}
                  style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 12, border: "1px solid var(--border, rgba(128,128,128,.18))", background: "var(--card-bg, #fff)", color: "inherit", textAlign: "left", cursor: "pointer" }}
                >
                  <span>{assignment.priority === "high" ? "🔴" : assignment.priority === "low" ? "🔵" : "🟣"}</span>
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{assignment.title}</strong>
                    <small style={{ color: "var(--text-muted)" }}>
                      {assignment.subject || (assignment.group_id ? groupNames[assignment.group_id] : text.private)}
                      {assignment.group_id ? ` · 👥 ${groupNames[assignment.group_id] || text.shared}` : ""}
                    </small>
                  </span>
                  <strong style={{ fontSize: ".82rem", whiteSpace: "nowrap" }}>{formatDueDate(assignment.due_date)}</strong>
                </button>
              ))}
            </div>
          )}
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={language === "el" ? elLocale : undefined}
          buttonText={{
            today: translate("Today"),
            month: language === "el" ? "Μήνας" : "Month",
            week: language === "el" ? "Εβδομάδα" : "Week",
            day: language === "el" ? "Ημέρα" : "Day",
          }}
          events={calendarEvents}
          dateClick={(argument) => {
            if ((profile?.role === "teacher" || isAdmin) && profile?.is_approved) {
              setSelectedDate(argument.dateStr);
              setSelectedClasses([]);
              setNewHW({ title: "", subject: "", className: "" });
              setShowAddModal(true);
              return;
            }
            openNewAssignment(argument.dateStr);
          }}
          eventClick={(information) => {
            if (information.event.extendedProps.source === "personal_assignment") {
              openExistingAssignment(information.event.extendedProps.assignment);
              return;
            }
            setSelectedEvent({
              id: information.event.id,
              ...information.event.extendedProps,
              date: information.event.startStr,
            });
            setShowViewModal(true);
          }}
        />
      </div>

      {showAssignmentModal && (
        <div className="modal-overlay" onMouseDown={closeAssignmentModal}>
          <div className="modal-content" onMouseDown={(event) => event.stopPropagation()} style={{ width: "min(540px, calc(100vw - 28px))" }}>
            <h3 style={{ marginTop: 0 }}>{editingAssignment ? text.edit : text.new}</h3>
            {!isOwner && <p style={{ color: "var(--text-muted)" }}>{text.readOnly}</p>}

            <form onSubmit={saveAssignment} style={{ display: "grid", gap: 12 }}>
              <input className="main-input" placeholder={text.title} value={assignmentForm.title} onChange={(event) => updateField("title", event.target.value)} required disabled={!isOwner} />
              <input className="main-input" placeholder={text.subject} value={assignmentForm.subject} onChange={(event) => updateField("subject", event.target.value)} disabled={!isOwner} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <small>{text.date}</small>
                  <input className="main-input" type="date" value={assignmentForm.due_date} onChange={(event) => updateField("due_date", event.target.value)} required disabled={!isOwner} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <small>{text.reminder}</small>
                  <input className="main-input" type="datetime-local" value={assignmentForm.reminder_at} onChange={(event) => updateField("reminder_at", event.target.value)} disabled={!isOwner} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <small>{text.priority}</small>
                  <select className="main-input" value={assignmentForm.priority} onChange={(event) => updateField("priority", event.target.value)} disabled={!isOwner}>
                    <option value="low">{text.low}</option>
                    <option value="medium">{text.medium}</option>
                    <option value="high">{text.high}</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <small>{text.status}</small>
                  <select className="main-input" value={assignmentForm.status} onChange={(event) => updateField("status", event.target.value)} disabled={!isOwner}>
                    <option value="not_started">{text.notStarted}</option>
                    <option value="in_progress">{text.inProgress}</option>
                    <option value="completed">{text.completed}</option>
                  </select>
                </label>
              </div>

              <label style={{ display: "grid", gap: 6 }}>
                <small>{text.sharing}</small>
                <select className="main-input" value={assignmentForm.group_id} onChange={(event) => updateField("group_id", event.target.value)} disabled={!isOwner}>
                  <option value="">{text.private}</option>
                  {groups.map((group) => <option key={group.id} value={group.id}>👥 {group.name}</option>)}
                </select>
              </label>

              <textarea className="main-input" rows="4" placeholder={text.notes} value={assignmentForm.notes} onChange={(event) => updateField("notes", event.target.value)} disabled={!isOwner} />
              <input className="main-input" type="url" placeholder={text.link} value={assignmentForm.external_url} onChange={(event) => updateField("external_url", event.target.value)} disabled={!isOwner} />

              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  {editingAssignment && isOwner && (
                    <button type="button" className="main-btn" onClick={deleteAssignment} disabled={saving} style={{ width: "auto", background: "#dc4c64" }}>{text.remove}</button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" className="main-btn" onClick={closeAssignmentModal} disabled={saving} style={{ width: "auto", background: "var(--surface, #eee)", color: "var(--text-main, #222)" }}>{text.cancel}</button>
                  {isOwner && <button type="submit" className="main-btn" disabled={saving} style={{ width: "auto" }}>{saving ? `${text.save}...` : text.save}</button>}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
