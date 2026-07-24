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
  const [assignmentForm, setAssignmentForm] = useState(EMPTY_ASSIGNMENT);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [saving, setSaving] = useState(false);

  const text =
    language === "el"
      ? {
          deadlines: "Οι προθεσμίες μου",
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
          confirmDelete: "Να διαγραφεί αυτή η προθεσμία;",
        }
      : {
          deadlines: "My deadlines",
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
          confirmDelete: "Delete this deadline?",
        };

  useEffect(() => {
    if (!profile?.id) {
      setAssignments([]);
      setLoadingAssignments(false);
      return;
    }

    let active = true;

    const loadAssignments = async () => {
      setLoadingAssignments(true);
      const { data, error } = await supabase
        .from("personal_assignments")
        .select("*")
        .eq("user_id", profile.id)
        .order("due_date", { ascending: true });

      if (active) {
        if (error) console.error("Could not load assignments:", error);
        setAssignments(data || []);
        setLoadingAssignments(false);
      }
    };

    loadAssignments();

    const channel = supabase
      .channel(`personal-assignments-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "personal_assignments",
          filter: `user_id=eq.${profile.id}`,
        },
        loadAssignments
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const calendarEvents = useMemo(() => {
    const personalEvents = assignments.map((assignment) => ({
      id: `assignment-${assignment.id}`,
      title: `${assignment.status === "completed" ? "✓ " : ""}${
        assignment.title
      }`,
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
      extendedProps: {
        source: "personal_assignment",
        assignment,
      },
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

    if (error) {
      alert(error.message);
      return;
    }

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

    if (error) {
      alert(error.message);
      return;
    }

    closeAssignmentModal();
  };

  const updateField = (field, value) =>
    setAssignmentForm((current) => ({ ...current, [field]: value }));

  return (
    <>
      <div className="calendar-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>
              📅 {text.deadlines}
            </h2>
            {loadingAssignments && (
              <small style={{ color: "var(--text-muted)" }}>
                {language === "el" ? "Φόρτωση..." : "Loading..."}
              </small>
            )}
            {!loadingAssignments && assignments.length === 0 && (
              <small style={{ color: "var(--text-muted)" }}>{text.empty}</small>
            )}
          </div>
          <button
            type="button"
            className="main-btn"
            style={{ width: "auto", padding: "10px 16px" }}
            onClick={() => openNewAssignment()}
          >
            {text.add}
          </button>
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
            if (
              (profile?.role === "teacher" || isAdmin) &&
              profile?.is_approved
            ) {
              setSelectedDate(argument.dateStr);
              setSelectedClasses([]);
              setNewHW({ title: "", subject: "", className: "" });
              setShowAddModal(true);
              return;
            }

            openNewAssignment(argument.dateStr);
          }}
          eventClick={(information) => {
            if (
              information.event.extendedProps.source === "personal_assignment"
            ) {
              openExistingAssignment(
                information.event.extendedProps.assignment
              );
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
            className="modal-content"
            onMouseDown={(event) => event.stopPropagation()}
            style={{ width: "min(520px, calc(100vw - 28px))" }}
          >
            <h3 style={{ marginTop: 0 }}>
              {editingAssignment ? text.edit : text.new}
            </h3>

            <form
              onSubmit={saveAssignment}
              style={{ display: "grid", gap: 12 }}
            >
              <input
                className="main-input"
                placeholder={text.title}
                value={assignmentForm.title}
                onChange={(event) => updateField("title", event.target.value)}
                required
              />
              <input
                className="main-input"
                placeholder={text.subject}
                value={assignmentForm.subject}
                onChange={(event) => updateField("subject", event.target.value)}
              />
              <label style={{ display: "grid", gap: 6 }}>
                <small>{text.date}</small>
                <input
                  className="main-input"
                  type="date"
                  value={assignmentForm.due_date}
                  onChange={(event) =>
                    updateField("due_date", event.target.value)
                  }
                  required
                />
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <label style={{ display: "grid", gap: 6 }}>
                  <small>{text.priority}</small>
                  <select
                    className="main-input"
                    value={assignmentForm.priority}
                    onChange={(event) =>
                      updateField("priority", event.target.value)
                    }
                  >
                    <option value="low">{text.low}</option>
                    <option value="medium">{text.medium}</option>
                    <option value="high">{text.high}</option>
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <small>{text.status}</small>
                  <select
                    className="main-input"
                    value={assignmentForm.status}
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                  >
                    <option value="not_started">{text.notStarted}</option>
                    <option value="in_progress">{text.inProgress}</option>
                    <option value="completed">{text.completed}</option>
                  </select>
                </label>
              </div>

              <textarea
                className="main-input"
                rows="4"
                placeholder={text.notes}
                value={assignmentForm.notes}
                onChange={(event) => updateField("notes", event.target.value)}
              />
              <input
                className="main-input"
                type="url"
                placeholder={text.link}
                value={assignmentForm.external_url}
                onChange={(event) =>
                  updateField("external_url", event.target.value)
                }
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  {editingAssignment && (
                    <button
                      type="button"
                      className="main-btn"
                      onClick={deleteAssignment}
                      disabled={saving}
                      style={{ width: "auto", background: "#dc4c64" }}
                    >
                      {text.remove}
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="main-btn"
                    onClick={closeAssignmentModal}
                    disabled={saving}
                    style={{
                      width: "auto",
                      background: "var(--surface, #eee)",
                      color: "var(--text-main, #222)",
                    }}
                  >
                    {text.cancel}
                  </button>
                  <button
                    type="submit"
                    className="main-btn"
                    disabled={saving}
                    style={{ width: "auto" }}
                  >
                    {saving
                      ? language === "el"
                        ? "Αποθήκευση..."
                        : "Saving..."
                      : text.save}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
