import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import elLocale from "@fullcalendar/core/locales/el";
import { supabase } from "../supabaseClient";
import { translate } from "../contexts/LanguageContext";
import { toSafeHttpUrl } from "../utils/urls";

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

const toLocalDateValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
          upcoming: "Ανοιχτές προθεσμίες",
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
          noUpcoming: "Δεν υπάρχουν ανοιχτές προθεσμίες.",
          loading: "Φόρτωση...",
          dueToday: "Σήμερα",
          overdue: "Εκπρόθεσμη",
          readOnly: "Μόνο ο δημιουργός μπορεί να την επεξεργαστεί.",
          confirmDelete: "Να διαγραφεί αυτή η προθεσμία;",
          reminderAfterDue:
            "Η υπενθύμιση πρέπει να είναι πριν από το τέλος της ημερομηνίας παράδοσης.",
          invalidLink:
            "Ο σύνδεσμος πρέπει να είναι έγκυρη διεύθυνση http ή https.",
        }
      : {
          deadlines: "My deadlines",
          upcoming: "Open deadlines",
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
          noUpcoming: "No open deadlines.",
          loading: "Loading...",
          dueToday: "Today",
          overdue: "Overdue",
          readOnly: "Only the creator can edit this deadline.",
          confirmDelete: "Delete this deadline?",
          reminderAfterDue:
            "The reminder must be before the end of the due date.",
          invalidLink: "The link must be a valid http or https URL.",
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
    return assignments
      .filter((assignment) => assignment.status !== "completed")
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

    if (
      assignmentForm.reminder_at &&
      new Date(assignmentForm.reminder_at) >
        new Date(`${assignmentForm.due_date}T23:59:59.999`)
    ) {
      window.alert(text.reminderAfterDue);
      return;
    }

    const externalUrl = assignmentForm.external_url
      ? toSafeHttpUrl(assignmentForm.external_url)
      : "";
    if (assignmentForm.external_url && !externalUrl) {
      window.alert(text.invalidLink);
      return;
    }

    setSaving(true);
    const reminderAt = assignmentForm.reminder_at
      ? new Date(assignmentForm.reminder_at).toISOString()
      : null;
    const previousReminderAt = editingAssignment?.reminder_at
      ? new Date(editingAssignment.reminder_at).toISOString()
      : null;
    const reminderChanged = reminderAt !== previousReminderAt;
    const payload = {
      user_id: profile.id,
      title: assignmentForm.title.trim(),
      subject: assignmentForm.subject.trim() || null,
      due_date: assignmentForm.due_date,
      priority: assignmentForm.priority,
      status: assignmentForm.status,
      notes: assignmentForm.notes.trim() || null,
      external_url: externalUrl || null,
      reminder_at: reminderAt,
      reminder_sent_at:
        editingAssignment && !reminderChanged
          ? editingAssignment.reminder_sent_at
          : null,
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

  const dueState = (value) => {
    const today = toLocalDateValue();
    if (value < today) return text.overdue;
    if (value === today) return text.dueToday;
    return "";
  };

  const isOwner =
    !editingAssignment || editingAssignment.user_id === profile?.id;

  return (
    <>
      <div className="calendar-card">
        <div className="deadline-toolbar">
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>📅 {text.deadlines}</h2>
            {loadingAssignments && <small style={{ color: "var(--text-muted)" }}>{text.loading}</small>}
            {!loadingAssignments && assignments.length === 0 && <small style={{ color: "var(--text-muted)" }}>{text.empty}</small>}
          </div>
          <button type="button" className="main-btn" style={{ width: "auto", padding: "10px 16px" }} onClick={() => openNewAssignment()}>
            {text.add}
          </button>
        </div>

        <div className="deadline-upcoming-panel">
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
                  className="deadline-upcoming-item"
                >
                  <span>{assignment.priority === "high" ? "🔴" : assignment.priority === "low" ? "🔵" : "🟣"}</span>
                  <span style={{ minWidth: 0 }}>
                    <strong translate="no" style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{assignment.title}</strong>
                    <small style={{ color: "var(--text-muted)" }}>
                      {assignment.subject || text.private}
                      {assignment.group_id ? ` · 👥 ${groupNames[assignment.group_id] || text.shared}` : ""}
                    </small>
                  </span>
                  <span className="deadline-due-copy">
                    <strong>{formatDueDate(assignment.due_date)}</strong>
                    {dueState(assignment.due_date) && (
                      <small
                        className={
                          dueState(assignment.due_date) === text.overdue
                            ? "overdue"
                            : ""
                        }
                      >
                        {dueState(assignment.due_date)}
                      </small>
                    )}
                  </span>
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
          eventDidMount={(information) => {
            information.el.setAttribute("translate", "no");
          }}
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
          <div
            className="modal-content deadline-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deadline-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3 id="deadline-modal-title" style={{ marginTop: 0 }}>
              {editingAssignment ? text.edit : text.new}
            </h3>
            {!isOwner && <p style={{ color: "var(--text-muted)" }}>{text.readOnly}</p>}

            <form onSubmit={saveAssignment} style={{ display: "grid", gap: 12 }}>
              <input className="main-input" placeholder={text.title} value={assignmentForm.title} onChange={(event) => updateField("title", event.target.value)} required disabled={!isOwner} />
              <input className="main-input" placeholder={text.subject} value={assignmentForm.subject} onChange={(event) => updateField("subject", event.target.value)} disabled={!isOwner} />

              <div className="deadline-form-grid">
                <label style={{ display: "grid", gap: 6 }}>
                  <small>{text.date}</small>
                  <input className="main-input" type="date" value={assignmentForm.due_date} onChange={(event) => updateField("due_date", event.target.value)} required disabled={!isOwner} />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <small>{text.reminder}</small>
                  <input
                    className="main-input"
                    type="datetime-local"
                    value={assignmentForm.reminder_at}
                    max={
                      assignmentForm.due_date
                        ? `${assignmentForm.due_date}T23:59`
                        : undefined
                    }
                    onChange={(event) => updateField("reminder_at", event.target.value)}
                    disabled={!isOwner}
                  />
                </label>
              </div>

              <div className="deadline-form-grid">
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

              <div className="deadline-modal-actions">
                {editingAssignment && isOwner && (
                  <div>
                    <button type="button" className="main-btn" onClick={deleteAssignment} disabled={saving} style={{ width: "auto", background: "#dc4c64" }}>{text.remove}</button>
                  </div>
                )}
                <div className="deadline-modal-primary-actions">
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
